package com.princemaurya.collabup000

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import android.util.Log
import android.view.View
import android.widget.ArrayAdapter
import android.widget.AutoCompleteTextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.google.android.material.chip.Chip
import com.google.android.material.chip.ChipGroup
import com.google.android.material.textfield.TextInputEditText
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.storage.FirebaseStorage
import com.google.firebase.storage.StorageReference
import java.util.*
import com.bumptech.glide.Glide
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.tasks.Task
import com.princemaurya.collabup000.services.GoogleDriveService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class User_Profiling_Activity : AppCompatActivity() {
    private lateinit var fullNameInput: TextInputEditText
    private lateinit var instituteInput: TextInputEditText
    private lateinit var skillsInput: AutoCompleteTextView
    private lateinit var skillsChipGroup: ChipGroup
    private lateinit var leetcodeInput: TextInputEditText
    private lateinit var codeforcesInput: TextInputEditText
    private lateinit var linkedinInput: TextInputEditText
    private lateinit var githubInput: TextInputEditText
    private lateinit var resumeFileContainer: View
    private lateinit var resumeFileText: android.widget.TextView
    private lateinit var saveProfileButton: com.google.android.material.button.MaterialButton
    private lateinit var skipButton: android.widget.TextView
    private lateinit var profileImage: de.hdodenhof.circleimageview.CircleImageView
    private lateinit var cameraIcon: android.widget.ImageView
    private lateinit var roleRadioGroup: android.widget.RadioGroup

    private val skills = mutableListOf<String>()
    private var selectedFileUri: Uri? = null
    private var selectedImageUri: Uri? = null
    private var resumeUrl: String? = null
    private var profileImageUrl: String? = null
    private var selectedRole: String = "Student"
    private var isEditingMode: Boolean = false
    private var fromSignup: Boolean = false

    private val firestore = FirebaseFirestore.getInstance()
    private val storage = FirebaseStorage.getInstance()
    private val auth = FirebaseAuth.getInstance()

    private val getContent = registerForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
        uri?.let {
            selectedFileUri = it
            val fileName = getFileName(it)
            resumeFileText.text = fileName ?: "File selected"
        }
    }

    private val getImageContent = registerForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
        uri?.let {
            selectedImageUri = it
            loadImageIntoView(it)
        }
    }

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        if (isGranted) {
            openFilePicker()
        } else {
            Toast.makeText(this, "Permission required to select files", Toast.LENGTH_SHORT).show()
        }
    }

    private val requestImagePermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        if (isGranted) {
            openImagePicker()
        } else {
            Toast.makeText(this, "Permission required to select images", Toast.LENGTH_SHORT).show()
        }
    }

    private val googleSignInLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val task: Task<GoogleSignInAccount> = GoogleSignIn.getSignedInAccountFromIntent(result.data)
        handleGoogleSignInResult(task)
    }

    private val googleDriveUploadLauncher = registerForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let { imageUri ->
            uploadImageToGoogleDrive(imageUri)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_user_profiling)

        // Check if this is editing mode
        isEditingMode = intent.getBooleanExtra("isEditing", false)
        fromSignup = intent.getBooleanExtra("fromSignup", false)

        // Initialize Google Sign-In early to handle any errors
        try {
            GoogleDriveService.initializeGoogleSignIn(this)
        } catch (e: Exception) {
            Log.w("User_Profiling_Activity", "Google Sign-In initialization failed: ${e.message}")
            // This is not critical, the app will still work with fallback options
        }

        initializeViews()
        setupSkillsInput()
        setupFilePicker()
        setupImagePicker()
        setupRoleSelection()
        setupSaveButton()
        setupSkipButton()
        
        if (isEditingMode) {
            loadExistingUserData()
            updateUIForEditing()
        }
        // Hide skip button if from signup
        if (fromSignup) {
            skipButton.visibility = View.GONE
        }
    }

    private fun initializeViews() {
        fullNameInput = findViewById(R.id.fullNameInput)
        instituteInput = findViewById(R.id.instituteInput)
        skillsInput = findViewById(R.id.skillsInput)
        skillsChipGroup = findViewById(R.id.skillsChipGroup)
        leetcodeInput = findViewById(R.id.leetcodeInput)
        codeforcesInput = findViewById(R.id.codeforcesInput)
        linkedinInput = findViewById(R.id.linkedinInput)
        githubInput = findViewById(R.id.githubInput)
        resumeFileContainer = findViewById(R.id.resumeFileContainer)
        resumeFileText = findViewById(R.id.resumeFileText)
        saveProfileButton = findViewById(R.id.saveProfileButton)
        skipButton = findViewById(R.id.skipButton)
        profileImage = findViewById(R.id.profileImage)
        cameraIcon = findViewById(R.id.cameraIcon)
        roleRadioGroup = findViewById(R.id.roleRadioGroup)
    }

    private fun setupSkillsInput() {
        val skillSuggestions = arrayOf(
            "Java", "Kotlin", "Python", "JavaScript", "TypeScript", "React", "Angular", "Vue.js",
            "Node.js", "Express.js", "MongoDB", "PostgreSQL", "MySQL", "Firebase", "AWS", "Docker",
            "Kubernetes", "Git", "GitHub", "Android", "iOS", "Flutter", "React Native", "Machine Learning",
            "Data Science", "Artificial Intelligence", "Blockchain", "Web3", "DevOps", "CI/CD"
        )

        val adapter = ArrayAdapter(this, android.R.layout.simple_dropdown_item_1line, skillSuggestions)
        skillsInput.setAdapter(adapter)

        skillsInput.setOnItemClickListener { _, _, position, _ ->
            val selectedSkill = skillSuggestions[position]
            if (!skills.contains(selectedSkill)) {
                addSkillChip(selectedSkill)
                skillsInput.text.clear()
            }
        }

        // Add custom skill on Enter key
        skillsInput.setOnEditorActionListener { v, actionId, event ->
            val text = skillsInput.text.toString().trim()
            if (text.isNotEmpty() && !skills.contains(text)) {
                addSkillChip(text)
                skillsInput.text.clear()
                return@setOnEditorActionListener true
            }
            false
        }
    }

    private fun addSkillChip(skill: String) {
        skills.add(skill)
        val chip = Chip(this).apply {
            text = skill
            isCloseIconVisible = true
            setOnCloseIconClickListener {
                skillsChipGroup.removeView(this)
                skills.remove(skill)
            }
            chipMinHeight = 40f
            textSize = 12f
        }
        skillsChipGroup.addView(chip)
    }

    private fun setupFilePicker() {
        resumeFileContainer.setOnClickListener {
            checkPermissionAndPickFile()
        }
    }

    private fun setupImagePicker() {
        profileImage.setOnClickListener {
            showImageSelectionDialog()
        }
        cameraIcon.setOnClickListener {
            showImageSelectionDialog()
        }
    }

    private fun showImageSelectionDialog() {
        val options = arrayOf("Process Image", "Select from Gallery", "Enter Image URL")
        
        MaterialAlertDialogBuilder(this)
            .setTitle("Select Profile Image")
            .setItems(options) { _, which ->
                when (which) {
                    0 -> handleGoogleDriveUpload()
                    1 -> checkPermissionAndPickImage()
                    2 -> showImageUrlInputDialog()
                }
            }
            .show()
    }

    private fun showImageUrlInputDialog() {
        val input = android.widget.EditText(this)
        input.hint = "Enter image URL (Google Drive, Photos, etc.)"
        input.setText(profileImageUrl ?: "")
        
        MaterialAlertDialogBuilder(this)
            .setTitle("Enter Image URL")
            .setView(input)
            .setPositiveButton("Set Image") { _, _ ->
                val url = input.text.toString().trim()
                if (url.isNotEmpty()) {
                    setImageFromUrl(url)
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun setImageFromUrl(url: String) {
        // Validate URL format
        if (!android.util.Patterns.WEB_URL.matcher(url).matches()) {
            Toast.makeText(this, "Please enter a valid URL", Toast.LENGTH_SHORT).show()
            return
        }

        // Load image to verify it's accessible and save URL if successful
        Glide.with(this)
            .load(url)
            .placeholder(R.drawable.ic_profile)
            .error(R.drawable.ic_profile)
            .into(profileImage)
        
        // Save the URL since we've validated it
        profileImageUrl = url
        Toast.makeText(this, "Image URL set successfully", Toast.LENGTH_SHORT).show()
    }

    private fun checkPermissionAndPickFile() {
        when {
            ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.READ_EXTERNAL_STORAGE
            ) == PackageManager.PERMISSION_GRANTED -> {
                openFilePicker()
            }
            else -> {
                requestPermissionLauncher.launch(Manifest.permission.READ_EXTERNAL_STORAGE)
            }
        }
    }

    private fun checkPermissionAndPickImage() {
        when {
            ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.READ_EXTERNAL_STORAGE
            ) == PackageManager.PERMISSION_GRANTED -> {
                openImagePicker()
            }
            else -> {
                requestImagePermissionLauncher.launch(Manifest.permission.READ_EXTERNAL_STORAGE)
            }
        }
    }

    private fun openFilePicker() {
        getContent.launch("*/*")
    }

    private fun openImagePicker() {
        getImageContent.launch("image/*")
    }

    private fun getFileName(uri: Uri): String? {
        val cursor = contentResolver.query(uri, null, null, null, null)
        return cursor?.use {
            val nameIndex = it.getColumnIndex(MediaStore.MediaColumns.DISPLAY_NAME)
            it.moveToFirst()
            it.getString(nameIndex)
        }
    }

    private fun loadImageIntoView(uri: Uri) {
        // For local images, show options to handle them
        selectedImageUri = uri
        Glide.with(this)
            .load(uri)
            .placeholder(R.drawable.ic_profile)
            .error(R.drawable.ic_profile)
            .into(profileImage)
        
        // Show dialog to handle local image
        showLocalImageOptionsDialog(uri)
    }

    private fun showLocalImageOptionsDialog(uri: Uri) {
        MaterialAlertDialogBuilder(this)
            .setTitle("Local Image Selected")
            .setMessage("This is a local image. For better compatibility, consider uploading it to Google Drive or Photos and using the URL.")
            .setPositiveButton("Use Local Image") { _, _ ->
                // Store the local URI - this will work for the current session
                selectedImageUri = uri
                Toast.makeText(this, "Local image will be used for this session", Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton("Enter URL Instead") { _, _ ->
                showImageUrlInputDialog()
            }
            .setNeutralButton("Cancel") { _, _ ->
                // Reset the image
                profileImage.setImageResource(R.drawable.ic_profile)
                selectedImageUri = null
            }
            .show()
    }

    private fun setupRoleSelection() {
        roleRadioGroup.setOnCheckedChangeListener { _, checkedId ->
            selectedRole = when (checkedId) {
                R.id.studentRadio -> "Student"
                R.id.mentorRadio -> "Mentor"
                R.id.facultyRadio -> "Faculty"
                R.id.startupRadio -> "Startup"
                else -> "Student"
            }
            
            // Show visual feedback for role selection
            updateRoleSelectionUI()
        }
    }

    private fun updateRoleSelectionUI() {
        // Update save button text based on role
        saveProfileButton.text = if (selectedRole == "Student") "Save Profile" else "Continue"
        
        // Allow editing of all fields regardless of role
        // This enables users to fill in their information even if they select a non-student role
        fullNameInput.isEnabled = true
        instituteInput.isEnabled = true
        skillsInput.isEnabled = true
        leetcodeInput.isEnabled = true
        codeforcesInput.isEnabled = true
        linkedinInput.isEnabled = true
        githubInput.isEnabled = true
        resumeFileContainer.isEnabled = true
    }

    private fun showRoleRestrictionDialog(role: String) {
        val appName = when (role) {
            "Mentor" -> "MentorConnect"
            "Faculty" -> "FacultyHub"
            "Startup" -> "StartupLink"
            else -> "Professional App"
        }
        
        val message = "This app is focused for Students only. Kindly download $appName for $role role."
        
        val builder = MaterialAlertDialogBuilder(this)
            .setTitle("Role Restriction")
            .setMessage(message)
            .setPositiveButton("OK") { _, _ ->
                // Close the app or navigate back
                finish()
            }
            .setCancelable(false)
        
        builder.show()
    }

    private fun setupSaveButton() {
        saveProfileButton.setOnClickListener {
            saveProfile()
        }
    }

    private fun setupSkipButton() {
        skipButton.setOnClickListener {
            if (isEditingMode) {
                // In editing mode, just finish the activity
                finish()
            } else {
                // Allow skipping regardless of role, but show appropriate message
                if (selectedRole != "Student") {
                    showSkipRoleInfoDialog()
                } else {
                    navigateToMain()
                }
            }
        }
    }

    private fun showSkipRoleInfoDialog() {
        val appName = when (selectedRole) {
            "Mentor" -> "MentorConnect"
            "Faculty" -> "FacultyHub"
            "Startup" -> "StartupLink"
            else -> "Professional App"
        }
        
        val message = "This app is focused for Students only. For $selectedRole role, please download $appName from the app store.\n\nYou can still explore the app, but it's optimized for students."
        
        val builder = MaterialAlertDialogBuilder(this)
            .setTitle("Student-Focused App")
            .setMessage(message)
            .setPositiveButton("Continue to App") { _, _ ->
                navigateToMain()
            }
            .setNegativeButton("Go Back") { _, _ ->
                // Do nothing, stay on the profiling screen
            }
            .setCancelable(true)
        
        builder.show()
    }

    private fun saveProfile() {
        val fullName = fullNameInput.text.toString().trim()
        val institute = instituteInput.text.toString().trim()
        val leetcodeUrl = leetcodeInput.text.toString().trim()
        val codeforcesUrl = codeforcesInput.text.toString().trim()
        val linkedinUrl = linkedinInput.text.toString().trim()
        val githubUrl = githubInput.text.toString().trim()

        // Validate required fields
        if (fullName.isEmpty()) {
            fullNameInput.error = "Full name is required"
            return
        }

        if (institute.isEmpty()) {
            instituteInput.error = "Institute name is required"
            return
        }

        saveProfileButton.isEnabled = false
        saveProfileButton.text = "Saving..."

        // Upload files first if selected
        if (selectedFileUri != null || selectedImageUri != null) {
            uploadFilesAndSaveProfile(fullName, institute, leetcodeUrl, codeforcesUrl, linkedinUrl, githubUrl)
        } else {
            saveProfileToFirestore(fullName, institute, leetcodeUrl, codeforcesUrl, linkedinUrl, githubUrl, null, null)
        }
    }

    private fun uploadFilesAndSaveProfile(
        fullName: String,
        institute: String,
        leetcodeUrl: String,
        codeforcesUrl: String,
        linkedinUrl: String,
        githubUrl: String
    ) {
        val currentUser = auth.currentUser
        if (currentUser == null) {
            Toast.makeText(this, "User not authenticated", Toast.LENGTH_SHORT).show()
            return
        }

        var imageUrl = profileImageUrl
        var resumeUrl = this.resumeUrl
        var uploadCount = 0
        val totalUploads = (if (selectedImageUri != null) 1 else 0) + (if (selectedFileUri != null) 1 else 0)

        fun checkAndSave() {
            uploadCount++
            if (uploadCount == totalUploads) {
                saveProfileToFirestore(fullName, institute, leetcodeUrl, codeforcesUrl, linkedinUrl, githubUrl, resumeUrl, imageUrl)
            }
        }

        // Upload resume if selected
        selectedFileUri?.let { uri ->
            val fileName = "resumes/${currentUser.uid}_${System.currentTimeMillis()}"
            val storageRef: StorageReference = storage.reference.child(fileName)

            storageRef.putFile(uri)
                .addOnSuccessListener {
                    storageRef.downloadUrl.addOnSuccessListener { downloadUrl ->
                        resumeUrl = downloadUrl.toString()
                        checkAndSave()
                    }
                }
                .addOnFailureListener { exception ->
                    Toast.makeText(this, "Failed to upload file: ${exception.message}", Toast.LENGTH_SHORT).show()
                    checkAndSave()
                }
        }

        // Upload image if selected
        selectedImageUri?.let { uri ->
            val imageFileName = "profile_images/${currentUser.uid}_${System.currentTimeMillis()}"
            val imageStorageRef: StorageReference = storage.reference.child(imageFileName)
            
            imageStorageRef.putFile(uri)
                .addOnSuccessListener {
                    imageStorageRef.downloadUrl.addOnSuccessListener { downloadUrl ->
                        imageUrl = downloadUrl.toString()
                        checkAndSave()
                    }
                }
                .addOnFailureListener { exception ->
                    Toast.makeText(this, "Failed to upload image: ${exception.message}", Toast.LENGTH_SHORT).show()
                    checkAndSave()
                }
        }

        // If no files to upload, save immediately
        if (totalUploads == 0) {
            saveProfileToFirestore(fullName, institute, leetcodeUrl, codeforcesUrl, linkedinUrl, githubUrl, resumeUrl, imageUrl)
        }
    }

    private fun saveProfileToFirestore(
        fullName: String,
        institute: String,
        leetcodeUrl: String,
        codeforcesUrl: String,
        linkedinUrl: String,
        githubUrl: String,
        resumeUrl: String?,
        profileImageUrl: String?
    ) {
        val currentUser = auth.currentUser
        if (currentUser == null) {
            Toast.makeText(this, "User not authenticated", Toast.LENGTH_SHORT).show()
            return
        }

        // Get current skills from the UI (chips) to ensure we save only what's displayed
        val currentSkills = getCurrentSkillsFromUI()

        // Create base user data
        val userData = hashMapOf<String, Any?>(
            "id" to currentUser.uid,
            "email" to currentUser.email,
            "fullName" to fullName,
            "role" to selectedRole,
            "institute" to institute,
            "skills" to currentSkills,
            "leetcodeUrl" to leetcodeUrl,
            "codeforcesUrl" to codeforcesUrl,
            "linkedinUrl" to linkedinUrl,
            "githubUrl" to githubUrl,
            "profileImageUrl" to profileImageUrl,
            "resumeUrl" to resumeUrl,
            "createdAt" to Date(),
            "updatedAt" to Date()
        )

        // Save to users collection first
        firestore.collection("users")
            .document(currentUser.uid)
            .set(userData)
            .addOnSuccessListener {
                // Now save to role-specific collection based on selected role
                saveToRoleSpecificCollection(currentUser.uid, fullName, institute, currentSkills, profileImageUrl)
            }
            .addOnFailureListener { exception ->
                Toast.makeText(this, "Failed to save profile: ${exception.message}", Toast.LENGTH_SHORT).show()
                saveProfileButton.isEnabled = true
                saveProfileButton.text = if (isEditingMode) "Update Profile" else "Save Profile"
            }
    }

    private fun saveToRoleSpecificCollection(
        userId: String,
        fullName: String,
        institute: String,
        skills: List<String>,
        profileImageUrl: String?
    ) {
        val currentUser = auth.currentUser ?: return

        when (selectedRole) {
            "Student" -> {
                val studentData = hashMapOf<String, Any?>(
                    "id" to userId,
                    "userId" to userId,
                    "name" to fullName,
                    "email" to currentUser.email,
                    "institute" to institute,
                    "skills" to skills,
                    "interests" to skills, // Using skills as interests for now
                    "projects" to emptyList<String>(),
                    "profileImageUrl" to profileImageUrl,
                    "bio" to "",
                    "linkedinUrl" to linkedinInput.text.toString().trim(),
                    "githubUrl" to githubInput.text.toString().trim(),
                    "leetcodeUrl" to leetcodeInput.text.toString().trim(),
                    "codeforcesUrl" to codeforcesInput.text.toString().trim(),
                    "createdAt" to Date(),
                    "updatedAt" to Date()
                )

                firestore.collection("students")
                    .document(userId)
                    .set(studentData)
                    .addOnSuccessListener {
                        onProfileSaved()
                    }
                    .addOnFailureListener { exception ->
                        Toast.makeText(this, "Failed to save student data: ${exception.message}", Toast.LENGTH_SHORT).show()
                        saveProfileButton.isEnabled = true
                        saveProfileButton.text = if (isEditingMode) "Update Profile" else "Save Profile"
                    }
            }
            "Mentor" -> {
                val mentorData = hashMapOf<String, Any?>(
                    "id" to userId,
                    "name" to fullName,
                    "email" to currentUser.email,
                    "expertise" to skills,
                    "bio" to "",
                    "currentCompany" to institute,
                    "designation" to "",
                    "yearsOfExperience" to 0,
                    "linkedInUrl" to linkedinInput.text.toString().trim(),
                    "hourlyRate" to 0,
                    "rating" to 0.0,
                    "totalSessions" to 0,
                    "profileImageUrl" to profileImageUrl,
                    "createdAt" to Date()
                )

                firestore.collection("mentors")
                    .document(userId)
                    .set(mentorData)
                    .addOnSuccessListener {
                        onProfileSaved()
                    }
                    .addOnFailureListener { exception ->
                        Toast.makeText(this, "Failed to save mentor data: ${exception.message}", Toast.LENGTH_SHORT).show()
                        saveProfileButton.isEnabled = true
                        saveProfileButton.text = if (isEditingMode) "Update Profile" else "Save Profile"
                    }
            }
            "Faculty" -> {
                val facultyData = hashMapOf<String, Any?>(
                    "id" to userId,
                    "title" to "",
                    "description" to "",
                    "domain" to "",
                    "level" to "",
                    "skills" to skills,
                    "duration" to "",
                    "location" to "",
                    "facultyId" to userId,
                    "facultyEmail" to currentUser.email,
                    "facultyName" to fullName,
                    "institute" to institute,
                    "researchAreas" to skills,
                    "coverUrl" to (profileImageUrl ?: ""),
                    "createdAt" to Date(),
                    "updatedAt" to Date()
                )

                firestore.collection("faculty")
                    .document(userId)
                    .set(facultyData)
                    .addOnSuccessListener {
                        onProfileSaved()
                    }
                    .addOnFailureListener { exception ->
                        Toast.makeText(this, "Failed to save faculty data: ${exception.message}", Toast.LENGTH_SHORT).show()
                        saveProfileButton.isEnabled = true
                        saveProfileButton.text = if (isEditingMode) "Update Profile" else "Save Profile"
                    }
            }
            "Startup" -> {
                val startupData = hashMapOf<String, Any?>(
                    "id" to userId,
                    "title" to "",
                    "description" to "",
                    "domain" to "",
                    "level" to "",
                    "skills" to skills,
                    "duration" to "",
                    "location" to "",
                    "company" to institute,
                    "founderId" to userId,
                    "founderEmail" to currentUser.email,
                    "founderName" to fullName,
                    "coverUrl" to (profileImageUrl ?: ""),
                    "createdAt" to Date(),
                    "updatedAt" to Date()
                )

                firestore.collection("startups")
                    .document(userId)
                    .set(startupData)
                    .addOnSuccessListener {
                        onProfileSaved()
                    }
                    .addOnFailureListener { exception ->
                        Toast.makeText(this, "Failed to save startup data: ${exception.message}", Toast.LENGTH_SHORT).show()
                        saveProfileButton.isEnabled = true
                        saveProfileButton.text = if (isEditingMode) "Update Profile" else "Save Profile"
                    }
            }
        }
    }

    private fun onProfileSaved() {
        val message = if (isEditingMode) "Profile updated successfully!" else "Profile saved successfully!"
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
        
        // Refresh profile images in MainActivity if it's running
        MainActivity.instance?.refreshProfileImage()
        
        if (isEditingMode) {
            finish() // Return to profile fragment
        } else {
            // Check role and show appropriate message
            if (selectedRole != "Student") {
                showRoleInfoAndNavigate()
            } else {
                navigateToMain()
            }
        }
    }

    private fun showRoleInfoAndNavigate() {
        val appName = when (selectedRole) {
            "Mentor" -> "MentorConnect"
            "Faculty" -> "FacultyHub"
            "Startup" -> "StartupLink"
            else -> "Professional App"
        }
        
        val message = "Profile saved successfully!\n\nThis app is focused for Students only. For $selectedRole role, please download $appName from the app store."
        
        val builder = MaterialAlertDialogBuilder(this)
            .setTitle("Profile Saved")
            .setMessage(message)
            .setPositiveButton("Continue to App") { _, _ ->
                // Navigate to main activity anyway
                navigateToMain()
            }
            .setCancelable(false)
        
        builder.show()
    }

    private fun getCurrentSkillsFromUI(): List<String> {
        val currentSkills = mutableListOf<String>()
        for (i in 0 until skillsChipGroup.childCount) {
            val chip = skillsChipGroup.getChildAt(i) as? com.google.android.material.chip.Chip
            chip?.text?.toString()?.let { skill ->
                currentSkills.add(skill)
            }
        }
        return currentSkills
    }

    private fun navigateToMain() {
        val intent = Intent(this, MainActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }

    private fun updateUIForEditing() {
        // Update UI elements for editing mode
        saveProfileButton.text = "Update Profile"
        skipButton.visibility = View.GONE
        
        // Make role selection read-only in editing mode
        roleRadioGroup.isEnabled = false
    }

    private fun loadExistingUserData() {
        val currentUser = auth.currentUser
        if (currentUser == null) {
            Toast.makeText(this, "User not authenticated", Toast.LENGTH_SHORT).show()
            return
        }

        // First load from users collection
        firestore.collection("users")
            .document(currentUser.uid)
            .get()
            .addOnSuccessListener { userDocument ->
                if (userDocument != null && userDocument.exists()) {
                    populateFieldsWithUserData(userDocument)
                    
                    // Then load role-specific data
                    val role = userDocument.getString("role") ?: "Student"
                    loadRoleSpecificData(currentUser.uid, role)
                }
            }
            .addOnFailureListener { exception ->
                Toast.makeText(this, "Failed to load user data: ${exception.message}", Toast.LENGTH_SHORT).show()
            }
    }

    private fun populateFieldsWithUserData(document: com.google.firebase.firestore.DocumentSnapshot) {
        // Populate basic fields
        fullNameInput.setText(document.getString("fullName") ?: "")
        instituteInput.setText(document.getString("institute") ?: "")
        
        // Populate role
        val role = document.getString("role") ?: "Student"
        selectedRole = role
        when (role) {
            "Student" -> roleRadioGroup.check(R.id.studentRadio)
            "Mentor" -> roleRadioGroup.check(R.id.mentorRadio)
            "Faculty" -> roleRadioGroup.check(R.id.facultyRadio)
            "Startup" -> roleRadioGroup.check(R.id.startupRadio)
        }
        
        // Populate skills
        val existingSkills = document.get("skills") as? List<String> ?: emptyList()
        skills.clear()
        skills.addAll(existingSkills)
        skillsChipGroup.removeAllViews()
        existingSkills.forEach { skill ->
            addSkillChip(skill)
        }
        
        // Populate social links
        leetcodeInput.setText(document.getString("leetcodeUrl") ?: "")
        codeforcesInput.setText(document.getString("codeforcesUrl") ?: "")
        linkedinInput.setText(document.getString("linkedinUrl") ?: "")
        githubInput.setText(document.getString("githubUrl") ?: "")
        
        // Load profile image
        val imageUrl = document.getString("profileImageUrl")
        if (!imageUrl.isNullOrEmpty()) {
            profileImageUrl = imageUrl
            Glide.with(this)
                .load(imageUrl)
                .placeholder(R.drawable.ic_profile)
                .error(R.drawable.ic_profile)
                .into(profileImage)
        }
        
        // Load resume info
        val resumeUrl = document.getString("resumeUrl")
        if (!resumeUrl.isNullOrEmpty()) {
            this.resumeUrl = resumeUrl
            resumeFileText.text = "Resume uploaded"
        }
    }

    private fun loadRoleSpecificData(userId: String, role: String) {
        val collectionName = when (role) {
            "Student" -> "students"
            "Mentor" -> "mentors"
            "Faculty" -> "faculty"
            "Startup" -> "startups"
            else -> return
        }

        firestore.collection(collectionName)
            .document(userId)
            .get()
            .addOnSuccessListener { document ->
                if (document != null && document.exists()) {
                    // Additional role-specific data can be loaded here if needed
                    Log.d("User_Profiling_Activity", "Loaded role-specific data for $role")
                }
            }
            .addOnFailureListener { exception ->
                Log.w("User_Profiling_Activity", "Failed to load role-specific data: ${exception.message}")
            }
    }

    // Google Drive Integration Methods
    private fun handleGoogleDriveUpload() {
        if (!GoogleDriveService.isUserSignedIn()) {
            // Initialize Google Sign-In and request sign-in
            val googleSignInClient = GoogleDriveService.initializeGoogleSignIn(this)
            if (googleSignInClient == null) {
                // Google Sign-In failed to initialize, show fallback options
                showGoogleSignInFallbackDialog()
                return
            }
            val signInIntent = googleSignInClient.signInIntent
            googleSignInLauncher.launch(signInIntent)
        } else {
            // User is already signed in, proceed with image selection
            googleDriveUploadLauncher.launch("image/*")
        }
    }

    private fun showGoogleSignInFallbackDialog() {
        MaterialAlertDialogBuilder(this)
            .setTitle("Google Sign-In Unavailable")
            .setMessage("Google Sign-In is not available on this device. You can still add a profile image by:\n\n• Selecting from Gallery\n• Entering an image URL from Google Drive or Photos")
            .setPositiveButton("Select from Gallery") { _, _ ->
                checkPermissionAndPickImage()
            }
            .setNegativeButton("Enter URL") { _, _ ->
                showImageUrlInputDialog()
            }
            .setNeutralButton("Cancel", null)
            .show()
    }

    private fun handleGoogleSignInResult(completedTask: Task<GoogleSignInAccount>) {
        try {
            val account = completedTask.getResult(ApiException::class.java)
            // Now proceed with image selection
            googleDriveUploadLauncher.launch("image/*")
        } catch (e: ApiException) {
            Log.e("User_Profiling_Activity", "Google Sign-In failed: ${e.message}", e)
            
            // Show error dialog with fallback options
            MaterialAlertDialogBuilder(this)
                .setTitle("Google Sign-In Failed")
                .setMessage("Unable to sign in to Google. This might be due to:\n\n• Google Play Services not available\n• Network connectivity issues\n• Device compatibility\n\nYou can still add a profile image using other methods.")
                .setPositiveButton("Select from Gallery") { _, _ ->
                    checkPermissionAndPickImage()
                }
                .setNegativeButton("Enter URL") { _, _ ->
                    showImageUrlInputDialog()
                }
                .setNeutralButton("Cancel", null)
                .show()
        }
    }

    private fun uploadImageToGoogleDrive(imageUri: Uri) {
        // Show loading dialog
        val loadingDialog = MaterialAlertDialogBuilder(this)
            .setView(R.layout.dialog_loading)
            .setCancelable(false)
            .create()
        loadingDialog.show()

        // Get current user for file naming
        val currentUser = auth.currentUser
        val fileName = currentUser?.email?.replace("@", "_")?.replace(".", "_") ?: "profile_image"

        CoroutineScope(Dispatchers.IO).launch {
            try {
                GoogleDriveService.uploadImageToDrive(
                    context = this@User_Profiling_Activity,
                    imageUri = imageUri,
                    fileName = fileName,
                    onSuccess = { downloadUrl ->
                        runOnUiThread {
                            loadingDialog.dismiss()
                            // Set the image and save the URL
                            profileImageUrl = downloadUrl
                            Glide.with(this@User_Profiling_Activity)
                                .load(downloadUrl)
                                .placeholder(R.drawable.ic_profile)
                                .error(R.drawable.ic_profile)
                                .into(profileImage)
                            Toast.makeText(this@User_Profiling_Activity, "Image uploaded successfully!", Toast.LENGTH_SHORT).show()
                            
                            // Show a dialog explaining the upload process
                            MaterialAlertDialogBuilder(this@User_Profiling_Activity)
                                .setTitle("Image Uploaded Successfully")
                                .setMessage("Your image has been processed and saved to your profile. The image will be displayed immediately.")
                                .setPositiveButton("OK") { _, _ ->
                                    // Refresh profile images in MainActivity if it's running
                                    MainActivity.instance?.refreshProfileImage()
                                }
                                .show()
                        }
                    },
                    onError = { errorMessage ->
                        runOnUiThread {
                            loadingDialog.dismiss()
                            Toast.makeText(this@User_Profiling_Activity, errorMessage, Toast.LENGTH_LONG).show()
                        }
                    }
                )
            } catch (e: Exception) {
                runOnUiThread {
                    loadingDialog.dismiss()
                    Toast.makeText(this@User_Profiling_Activity, "Upload failed: ${e.message}", Toast.LENGTH_LONG).show()
                }
            }
        }
    }
}