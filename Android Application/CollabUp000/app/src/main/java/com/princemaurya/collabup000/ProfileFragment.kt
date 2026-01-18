package com.princemaurya.collabup000

import android.app.Activity
import android.content.Intent
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.Fragment
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.chip.Chip
import com.google.android.material.chip.ChipGroup
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.bumptech.glide.Glide
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import android.widget.ImageButton
import androidx.cardview.widget.CardView

class ProfileFragment : Fragment() {
    private lateinit var profileImage: ImageView
    private lateinit var profileImageCard: CardView
    private lateinit var nameInput: TextInputEditText
    private lateinit var emailInput: TextInputEditText
    private lateinit var instituteInput: TextInputEditText
    private lateinit var roleDisplay: TextView
    private lateinit var skillsChipGroup: ChipGroup
    private lateinit var leetcodeUrl: TextInputEditText
    private lateinit var codeforcesUrl: TextInputEditText
    private lateinit var linkedinUrl: TextInputEditText
    private lateinit var githubUrl: TextInputEditText
    private lateinit var resumeContainer: View
    private lateinit var resumeFileName: TextView
    private lateinit var editProfileBtn: Button
    private lateinit var changePassword: TextView
    private lateinit var notifications: TextView
    private lateinit var privacy: TextView
    private lateinit var logout: TextView

    private val firestore = FirebaseFirestore.getInstance()
    private val auth = FirebaseAuth.getInstance()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_profile, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        initializeViews(view)
        loadUserProfile()
        setupClickListeners()
    }

    private fun initializeViews(view: View) {
        profileImage = view.findViewById(R.id.profile_image)
        profileImageCard = view.findViewById(R.id.profile_image_card)
        nameInput = view.findViewById(R.id.profile_name)
        emailInput = view.findViewById(R.id.profile_email)
        instituteInput = view.findViewById(R.id.institute_name)
        roleDisplay = view.findViewById(R.id.role_display)
        skillsChipGroup = view.findViewById(R.id.skills_chip_group)
        leetcodeUrl = view.findViewById(R.id.leetcode_url)
        codeforcesUrl = view.findViewById(R.id.codeforces_url)
        linkedinUrl = view.findViewById(R.id.linkedin_url)
        githubUrl = view.findViewById(R.id.github_url)
        resumeContainer = view.findViewById(R.id.resume_container)
        resumeFileName = view.findViewById(R.id.resume_file_name)
        editProfileBtn = view.findViewById(R.id.edit_profile_btn)
        changePassword = view.findViewById(R.id.change_password)
        notifications = view.findViewById(R.id.notifications)
        privacy = view.findViewById(R.id.privacy)
        logout = view.findViewById(R.id.logout)
    }

    private fun loadUserProfile() {
        val currentUser = auth.currentUser
        if (currentUser == null) {
            Toast.makeText(requireContext(), "User not authenticated", Toast.LENGTH_SHORT).show()
            return
        }

        firestore.collection("users")
            .document(currentUser.uid)
            .get()
            .addOnSuccessListener { document ->
                if (document != null && document.exists()) {
                    displayUserProfile(document)
                } else {
                    // User profile doesn't exist, show default values
                    displayDefaultProfile()
                }
            }
            .addOnFailureListener { exception ->
                Toast.makeText(requireContext(), "Failed to load profile: ${exception.message}", Toast.LENGTH_SHORT).show()
                displayDefaultProfile()
            }
    }

    private fun displayUserProfile(document: com.google.firebase.firestore.DocumentSnapshot) {
        // Display role
        val role = document.getString("role") ?: "Student"
        roleDisplay.text = role

        // Display basic info
        nameInput.setText(document.getString("fullName") ?: "")
        emailInput.setText(document.getString("email") ?: "")
        instituteInput.setText(document.getString("institute") ?: "")

        // Display skills
        val skills = document.get("skills") as? List<String> ?: emptyList()
        displaySkills(skills)

        // Display social links
        leetcodeUrl.setText(document.getString("leetcodeUrl") ?: "")
        codeforcesUrl.setText(document.getString("codeforcesUrl") ?: "")
        linkedinUrl.setText(document.getString("linkedinUrl") ?: "")
        githubUrl.setText(document.getString("githubUrl") ?: "")

        // Display profile image
        val profileImageUrl = document.getString("profileImageUrl")
        if (!profileImageUrl.isNullOrEmpty()) {
            Glide.with(this)
                .load(profileImageUrl)
                .placeholder(R.drawable.ic_profile)
                .error(R.drawable.ic_profile)
                .timeout(10000) // 10 second timeout
                .into(profileImage)
        }

        // Display resume if available
        val resumeUrl = document.getString("resumeUrl")
        if (!resumeUrl.isNullOrEmpty()) {
            resumeContainer.visibility = View.VISIBLE
            resumeFileName.text = "Resume.pdf" // You can extract actual filename if needed
        } else {
            resumeContainer.visibility = View.GONE
        }
    }

    private fun displayDefaultProfile() {
        roleDisplay.text = "Student"
        nameInput.setText("")
        emailInput.setText(auth.currentUser?.email ?: "")
        instituteInput.setText("")
        skillsChipGroup.removeAllViews()
        leetcodeUrl.setText("")
        codeforcesUrl.setText("")
        linkedinUrl.setText("")
        githubUrl.setText("")
        resumeContainer.visibility = View.GONE
    }

    private fun displaySkills(skills: List<String>) {
        skillsChipGroup.removeAllViews()
        skills.forEach { skill ->
            val chip = Chip(requireContext()).apply {
                text = skill
                isCloseIconVisible = false // Read-only in profile view
                chipMinHeight = 40f
                textSize = 12f
            }
            skillsChipGroup.addView(chip)
        }
    }

    private fun setupClickListeners() {
        // Profile image click for enlargement (using CardView for better touch area)
        profileImageCard.setOnClickListener {
            showEnlargedImage()
        }

        // Edit profile button
        editProfileBtn.setOnClickListener {
            // Navigate to user profiling activity for editing
            val intent = Intent(requireContext(), User_Profiling_Activity::class.java)
            intent.putExtra("isEditing", true)
            startActivity(intent)
        }

        // Resume container click
        resumeContainer.setOnClickListener {
            // Open resume URL in browser
            val currentUser = auth.currentUser
            if (currentUser != null) {
                firestore.collection("users")
                    .document(currentUser.uid)
                    .get()
                    .addOnSuccessListener { document ->
                        val resumeUrl = document.getString("resumeUrl")
                        if (!resumeUrl.isNullOrEmpty()) {
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(resumeUrl))
                            startActivity(intent)
                        }
                    }
            }
        }

        // Settings actions
        changePassword.setOnClickListener {
            Toast.makeText(requireContext(), "Change Password clicked", Toast.LENGTH_SHORT).show()
            // TODO: Launch change password flow
        }
        
        notifications.setOnClickListener {
            Toast.makeText(requireContext(), "Notifications settings clicked", Toast.LENGTH_SHORT).show()
            // TODO: Open notifications settings
        }
        
        privacy.setOnClickListener {
            Toast.makeText(requireContext(), "Privacy settings clicked", Toast.LENGTH_SHORT).show()
            // TODO: Open privacy settings
        }
        
        logout.setOnClickListener {
            showLogoutDialog()
        }
    }

    private fun showLogoutDialog() {
        MaterialAlertDialogBuilder(requireContext())
            .setTitle("Logout")
            .setMessage("Are you sure you want to logout?")
            .setPositiveButton("Logout") { _, _ ->
                performLogout()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun performLogout() {
        auth.signOut()
        val intent = Intent(requireContext(), LoginActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        requireActivity().finish()
    }

    override fun onResume() {
        super.onResume()
        // Refresh profile image when returning to this fragment
        loadUserProfile()
    }

    private fun showEnlargedImage() {
        val currentUser = auth.currentUser
        if (currentUser == null) return

        // Get the current profile image URL
        firestore.collection("users")
            .document(currentUser.uid)
            .get()
            .addOnSuccessListener { document ->
                val profileImageUrl = document.getString("profileImageUrl")
                showEnlargedImageDialog(profileImageUrl)
            }
            .addOnFailureListener {
                showEnlargedImageDialog(null)
            }
    }

    private fun showEnlargedImageDialog(imageUrl: String?) {
        val dialog = MaterialAlertDialogBuilder(requireContext())
            .setView(R.layout.dialog_enlarged_image)
            .setCancelable(true)
            .create()
        
        // Make dialog full screen
        dialog.window?.apply {
            setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
            setBackgroundDrawableResource(android.R.color.transparent)
            statusBarColor = android.graphics.Color.TRANSPARENT
            decorView.systemUiVisibility = (View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY)
        }
        
        dialog.show()
        
        // Set up the dialog views
        val enlargedImageView = dialog.findViewById<ImageView>(R.id.enlarged_image)
        val closeButton = dialog.findViewById<ImageButton>(R.id.close_button)
        val dialogView = dialog.findViewById<View>(R.id.dialog_enlarged_image_root)
        
        // Load the image with circular crop
        if (!imageUrl.isNullOrEmpty()) {
            Glide.with(this)
                .load(imageUrl)
                .placeholder(R.drawable.ic_profile)
                .error(R.drawable.ic_profile)
                .transform(com.bumptech.glide.load.resource.bitmap.CenterCrop())
                .into(enlargedImageView!!)
        } else {
            enlargedImageView?.setImageResource(R.drawable.ic_profile)
        }
        
        // Set up close button
        closeButton?.setOnClickListener {
            dialog.dismiss()
        }
        
        // Dismiss on background tap
        dialogView?.setOnClickListener {
            dialog.dismiss()
        }
    }
} 