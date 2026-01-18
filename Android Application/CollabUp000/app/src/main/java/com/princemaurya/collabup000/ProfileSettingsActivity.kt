package com.princemaurya.collabup000

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import android.view.View
import android.widget.ArrayAdapter
import android.widget.AutoCompleteTextView
import android.widget.ImageView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.bumptech.glide.Glide
import com.google.android.material.chip.Chip
import com.google.android.material.chip.ChipGroup
import com.google.android.material.textfield.TextInputEditText
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.storage.FirebaseStorage
import com.google.firebase.storage.StorageReference
import de.hdodenhof.circleimageview.CircleImageView
import java.util.*
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.tasks.Task
import com.princemaurya.collabup000.services.GoogleDriveService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import android.util.Log

class ProfileSettingsActivity : AppCompatActivity() {
    private lateinit var backButton: ImageView
    private lateinit var profileImage: CircleImageView
    private lateinit var cameraIcon: ImageView
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
    private lateinit var updateProfileButton: com.google.android.material.button.MaterialButton
    private lateinit var logoutButton: com.google.android.material.button.MaterialButton
    private lateinit var roleDisplayContainer: android.widget.LinearLayout
    private lateinit var roleDisplayText: android.widget.TextView

    private val skills = mutableListOf<String>()
    private var selectedFileUri: Uri? = null
    private var selectedImageUri: Uri? = null
    private var currentResumeUrl: String? = null
    private var currentProfileImageUrl: String? = null
    private var currentRole: String = "Student"

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
        setContentView(R.layout.activity_profile_settings)
        window.statusBarColor = ContextCompat.getColor(this, R.color.dark_blue)

        // Initialize Google Sign-In early to handle any errors
        try {
            GoogleDriveService.initializeGoogleSignIn(this)
        } catch (e: Exception) {
            Log.w("ProfileSettingsActivity", "Google Sign-In initialization failed: ${e.message}")
            // This is not critical, the app will still work with fallback options
        }

        initializeViews()
        setupSkillsInput()
        setupFilePicker()
        setupImagePicker()
        setupButtons()
        loadUserProfile()
    }

    private fun initializeViews() {
        backButton = findViewById(R.id.backButton)
        profileImage = findViewById(R.id.profileImage)
        cameraIcon = findViewById(R.id.cameraIcon)
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
        updateProfileButton = findViewById(R.id.updateProfileButton)
        logoutButton = findViewById(R.id.logoutButton)
        roleDisplayContainer = findViewById(R.id.roleDisplayContainer)
        roleDisplayText = findViewById(R.id.roleDisplayText)
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
        input.setText(currentProfileImageUrl ?: "")
        
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
        currentProfileImageUrl = url
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

    private fun loadImageIntoView(uri: Uri) {
        Glide.with(this)
            .load(uri)
            .placeholder(R.drawable.ic_profile)
            .error(R.drawable.ic_profile)
            .into(profileImage)
    }

    private fun getFileName(uri: Uri): String? {
        val cursor = contentResolver.query(uri, null, null, null, null)
        return cursor?.use {
            val nameIndex = it.getColumnIndex(MediaStore.MediaColumns.DISPLAY_NAME)
            it.moveToFirst()
            it.getString(nameIndex)
        }
    }

    private fun setupButtons() {
        backButton.setOnClickListener {
            // Allow back navigation regardless of role, but show appropriate message
            if (currentRole != "Student") {
                showBackRoleInfoDialog()
            } else {
                finish()
            }
        }

        updateProfileButton.setOnClickListener {
            updateProfile()
        }

        logoutButton.setOnClickListener {
            logout()
        }
    }

    private fun showBackRoleInfoDialog() {
        val appName = when (currentRole) {
            "Mentor" -> "MentorConnect"
            "Faculty" -> "FacultyHub"
            "Startup" -> "StartupLink"
            else -> "Professional App"
        }
        
        val message = "This app is focused for Students only. For $currentRole role, please download $appName from the app store.\n\nYou can continue using this app, but it's optimized for students."
        
        val builder = MaterialAlertDialogBuilder(this)
            .setTitle("Student-Focused App")
            .setMessage(message)
            .setPositiveButton("Continue Using") { _, _ ->
                finish()
            }
            .setNegativeButton("Stay Here") { _, _ ->
                // Do nothing, stay on the settings screen
            }
            .setCancelable(true)
        
        builder.show()
    }

    private fun loadUserProfile() {
        val currentUser = auth.currentUser
        if (currentUser == null) {
            Toast.makeText(this, "User not authenticated", Toast.LENGTH_SHORT).show()
            return
        }

        firestore.collection("users")
            .document(currentUser.uid)
            .get()
            .addOnSuccessListener { document ->
                if (document != null && document.exists()) {
                    // Load profile data
                    fullNameInput.setText(document.getString("fullName") ?: "")
                    instituteInput.setText(document.getString("institute") ?: "")
                    leetcodeInput.setText(document.getString("leetcodeUrl") ?: "")
                    codeforcesInput.setText(document.getString("codeforcesUrl") ?: "")
                    linkedinInput.setText(document.getString("linkedinUrl") ?: "")
                    githubInput.setText(document.getString("githubUrl") ?: "")
                    
                    // Load skills
                    val skillsList = document.get("skills") as? List<String> ?: emptyList()
                    skills.clear()
                    skills.addAll(skillsList)
                    skillsChipGroup.removeAllViews()
                    skills.forEach { skill ->
                        addSkillChip(skill)
                    }

                    // Load profile image
                    currentProfileImageUrl = document.getString("profileImageUrl")
                    if (currentProfileImageUrl != null) {
                        Glide.with(this)
                            .load(currentProfileImageUrl)
                            .placeholder(R.drawable.ic_profile)
                            .error(R.drawable.ic_profile)
                            .into(profileImage)
                    }

                    // Load resume info
                    currentResumeUrl = document.getString("resumeUrl")
                    if (currentResumeUrl != null) {
                        resumeFileText.text = "Resume uploaded"
                    }

                    // Load role
                    currentRole = document.getString("role") ?: "Student"
                    roleDisplayText.text = "Role: $currentRole"
                    
                    // Don't show role restriction automatically - let users explore the app
                    // if (currentRole != "Student") {
                    //     showRoleRestrictionDialog(currentRole)
                    // }
                }
            }
            .addOnFailureListener { exception ->
                Toast.makeText(this, "Failed to load profile: ${exception.message}", Toast.LENGTH_SHORT).show()
            }
    }

    private fun updateProfile() {
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

        updateProfileButton.isEnabled = false
        updateProfileButton.text = "Updating..."

        // Upload files first if selected
        if (selectedImageUri != null || selectedFileUri != null) {
            uploadFilesAndUpdateProfile(fullName, institute, leetcodeUrl, codeforcesUrl, linkedinUrl, githubUrl)
        } else {
            updateProfileInFirestore(fullName, institute, leetcodeUrl, codeforcesUrl, linkedinUrl, githubUrl, currentProfileImageUrl, currentResumeUrl)
        }
    }

    private fun uploadFilesAndUpdateProfile(
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

        var imageUrl = currentProfileImageUrl
        var resumeUrl = currentResumeUrl
        var uploadCount = 0
        val totalUploads = (if (selectedImageUri != null) 1 else 0) + (if (selectedFileUri != null) 1 else 0)

        fun checkAndUpdate() {
            uploadCount++
            if (uploadCount == totalUploads) {
                updateProfileInFirestore(fullName, institute, leetcodeUrl, codeforcesUrl, linkedinUrl, githubUrl, imageUrl, resumeUrl)
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
                        checkAndUpdate()
                    }
                }
                .addOnFailureListener { exception ->
                    Toast.makeText(this, "Failed to upload image: ${exception.message}", Toast.LENGTH_SHORT).show()
                    checkAndUpdate()
                }
        }

        // Upload resume if selected
        selectedFileUri?.let { uri ->
            val resumeFileName = "resumes/${currentUser.uid}_${System.currentTimeMillis()}"
            val resumeStorageRef: StorageReference = storage.reference.child(resumeFileName)
            
            resumeStorageRef.putFile(uri)
                .addOnSuccessListener {
                    resumeStorageRef.downloadUrl.addOnSuccessListener { downloadUrl ->
                        resumeUrl = downloadUrl.toString()
                        checkAndUpdate()
                    }
                }
                .addOnFailureListener { exception ->
                    Toast.makeText(this, "Failed to upload resume: ${exception.message}", Toast.LENGTH_SHORT).show()
                    checkAndUpdate()
                }
        }

        // If no files to upload, update immediately
        if (totalUploads == 0) {
            updateProfileInFirestore(fullName, institute, leetcodeUrl, codeforcesUrl, linkedinUrl, githubUrl, imageUrl, resumeUrl)
        }
    }

    private fun updateProfileInFirestore(
        fullName: String,
        institute: String,
        leetcodeUrl: String,
        codeforcesUrl: String,
        linkedinUrl: String,
        githubUrl: String,
        profileImageUrl: String?,
        resumeUrl: String?
    ) {
        val currentUser = auth.currentUser
        if (currentUser == null) {
            Toast.makeText(this, "User not authenticated", Toast.LENGTH_SHORT).show()
            return
        }

        // Get current skills from the UI (chips) to ensure we save only what's displayed
        val currentSkills = getCurrentSkillsFromUI()

        val userProfile = hashMapOf(
            "email" to currentUser.email,
            "role" to currentRole,
            "fullName" to fullName,
            "institute" to institute,
            "skills" to currentSkills,
            "leetcodeUrl" to leetcodeUrl,
            "codeforcesUrl" to codeforcesUrl,
            "linkedinUrl" to linkedinUrl,
            "githubUrl" to githubUrl,
            "profileImageUrl" to profileImageUrl,
            "resumeUrl" to resumeUrl,
            "updatedAt" to Date()
        )

        firestore.collection("users")
            .document(currentUser.uid)
            .update(userProfile as Map<String, Any>)
            .addOnSuccessListener {
                Toast.makeText(this, "Profile updated successfully!", Toast.LENGTH_SHORT).show()
                
                // Refresh profile images in MainActivity if it's running
                MainActivity.instance?.refreshProfileImage()
                
                // Show role info if not student
                if (currentRole != "Student") {
                    showUpdateRoleInfoDialog()
                }
                
                updateProfileButton.isEnabled = true
                updateProfileButton.text = "Update Profile"
            }
            .addOnFailureListener { exception ->
                Toast.makeText(this, "Failed to update profile: ${exception.message}", Toast.LENGTH_SHORT).show()
                updateProfileButton.isEnabled = true
                updateProfileButton.text = "Update Profile"
            }
    }

    private fun showUpdateRoleInfoDialog() {
        val appName = when (currentRole) {
            "Mentor" -> "MentorConnect"
            "Faculty" -> "FacultyHub"
            "Startup" -> "StartupLink"
            else -> "Professional App"
        }
        
        val message = "Profile updated successfully!\n\nThis app is focused for Students only. For $currentRole role, please download $appName from the app store for a better experience."
        
        val builder = MaterialAlertDialogBuilder(this)
            .setTitle("Profile Updated")
            .setMessage(message)
            .setPositiveButton("OK") { _, _ ->
                // Dialog dismissed, user can continue using the app
            }
            .setCancelable(true)
        
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

    private fun logout() {
        auth.signOut()
        val sharedPreferences = getSharedPreferences("CollabUpPrefs", MODE_PRIVATE)
        sharedPreferences.edit().putBoolean("isLoggedIn", false).apply()
        
        Toast.makeText(this, "Logged out successfully", Toast.LENGTH_SHORT).show()
        
        val intent = Intent(this, LoginActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }

    private fun showRoleRestrictionDialog(role: String) {
        val appName = when (role) {
            "Mentor" -> "MentorConnect"
            "Faculty" -> "FacultyHub"
            "Startup" -> "StartupLink"
            else -> "Professional App"
        }
        
        val message = "This app is focused for Students only. For $role role, please download $appName from the app store for a better experience.\n\nYou can still explore this app, but it's optimized for students."
        
        val builder = MaterialAlertDialogBuilder(this)
            .setTitle("Student-Focused App")
            .setMessage(message)
            .setPositiveButton("Continue Using") { _, _ ->
                // Allow user to continue using the app
            }
            .setNegativeButton("Go Back") { _, _ ->
                finish()
            }
            .setCancelable(true)
        
        builder.show()
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
            Log.e("ProfileSettingsActivity", "Google Sign-In failed: ${e.message}", e)
            
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
                    context = this@ProfileSettingsActivity,
                    imageUri = imageUri,
                    fileName = fileName,
                    onSuccess = { downloadUrl ->
                        runOnUiThread {
                            loadingDialog.dismiss()
                            // Set the image and save the URL
                            currentProfileImageUrl = downloadUrl
                            Glide.with(this@ProfileSettingsActivity)
                                .load(downloadUrl)
                                .placeholder(R.drawable.ic_profile)
                                .error(R.drawable.ic_profile)
                                .into(profileImage)
                            Toast.makeText(this@ProfileSettingsActivity, "Image uploaded successfully!", Toast.LENGTH_SHORT).show()
                            
                            // Show a dialog explaining the upload process
                            MaterialAlertDialogBuilder(this@ProfileSettingsActivity)
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
                            Toast.makeText(this@ProfileSettingsActivity, errorMessage, Toast.LENGTH_LONG).show()
                        }
                    }
                )
            } catch (e: Exception) {
                runOnUiThread {
                    loadingDialog.dismiss()
                    Toast.makeText(this@ProfileSettingsActivity, "Upload failed: ${e.message}", Toast.LENGTH_LONG).show()
                }
            }
        }
    }
} 