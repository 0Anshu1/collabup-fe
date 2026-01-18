package com.princemaurya.collabup000

import android.content.Intent
import android.os.Bundle
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.navigation.fragment.NavHostFragment
import androidx.navigation.ui.setupWithNavController
import com.google.android.material.bottomnavigation.BottomNavigationView
import com.google.android.material.floatingactionbutton.FloatingActionButton
import com.princemaurya.collabup000.services.FirebaseAuthService
import com.princemaurya.collabup000.services.GoogleDriveService
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.bumptech.glide.Glide
import android.widget.ImageView
import android.util.Log
import android.view.View
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.cardview.widget.CardView
import com.google.android.material.dialog.MaterialAlertDialogBuilder

class MainActivity : AppCompatActivity() {
    private lateinit var authService: FirebaseAuthService
    private lateinit var profileImage: ImageView
    private lateinit var chatbotFab: FloatingActionButton
    private val firestore = FirebaseFirestore.getInstance()
    private val auth = FirebaseAuth.getInstance()
    
    // Profile menu overlay components
    private lateinit var profileMenuOverlay: View
    private lateinit var menuContainer: CardView
    private lateinit var closeMenuButton: ImageView
    private lateinit var menuProfileImage: ImageView
    private lateinit var menuUserName: TextView
    private lateinit var menuUserEmail: TextView
    
    companion object {
        @JvmStatic
        var instance: MainActivity? = null
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Set status bar color to light blue
        window.statusBarColor = getColor(R.color.light_blue)
        
        setContentView(R.layout.activity_main)
        
        // Remove edge-to-edge to ensure proper status bar display
        // enableEdgeToEdge()
        // ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
        //     val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
        //     v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
        //     insets
        // }

        instance = this
        authService = FirebaseAuthService()
        
        // Initialize views
        profileImage = findViewById(R.id.profile_image)
        chatbotFab = findViewById(R.id.chatbotFab)
        
        // Initialize profile menu overlay
        setupProfileMenuOverlay()
        
        // Update missing profile image URLs for all users
        updateMissingProfileImageUrls()
        
        // Check if user is authenticated
        // Temporarily disabled for testing without Firebase setup
        /*
        if (!authService.isUserLoggedIn() && !authService.isSessionValid(this)) {
            // User is not authenticated, redirect to login
            val intent = Intent(this, LoginActivity::class.java)
            startActivity(intent)
            finish()
            return
        }
        */

        // Set up Navigation Component
        val navHostFragment = supportFragmentManager
            .findFragmentById(R.id.nav_host_fragment) as NavHostFragment
        val navController = navHostFragment.navController
        
        // Set up Bottom Navigation with Navigation Component
        val bottomNav = findViewById<BottomNavigationView>(R.id.bottom_navigation)
        bottomNav.setupWithNavController(navController)
        
        // Set up chatbot FAB
        setupChatbotFab()
        
        // Load user profile image
        loadUserProfileImage()
    }
    
    private fun setupProfileMenuOverlay() {
        // Inflate the overlay layout
        val overlayView = layoutInflater.inflate(R.layout.overlay_profile_menu, null)
        profileMenuOverlay = overlayView.findViewById(R.id.overlay_background)
        menuContainer = overlayView.findViewById(R.id.menu_container)
        closeMenuButton = overlayView.findViewById(R.id.close_menu_button)
        menuProfileImage = overlayView.findViewById(R.id.menu_profile_image)
        menuUserName = overlayView.findViewById(R.id.menu_user_name)
        menuUserEmail = overlayView.findViewById(R.id.menu_user_email)
        
        // Add overlay to the main layout
        val mainLayout = findViewById<androidx.constraintlayout.widget.ConstraintLayout>(R.id.main)
        mainLayout.addView(overlayView)
        
        // Initially hide the overlay
        overlayView.visibility = View.GONE
        
        // Set up click listeners
        setupProfileMenuClickListeners(overlayView)
        
        // Set up profile image click to show menu
        profileImage.setOnClickListener {
            showProfileMenu()
        }
    }
    
    private fun setupProfileMenuClickListeners(overlayView: View) {
        // Close menu button
        closeMenuButton.setOnClickListener {
            hideProfileMenu()
        }
        
        // Overlay background click to close
        profileMenuOverlay.setOnClickListener {
            hideProfileMenu()
        }
        
        // Update Profile
        overlayView.findViewById<LinearLayout>(R.id.menu_update_profile).setOnClickListener {
            hideProfileMenu()
            val intent = Intent(this, ProfileSettingsActivity::class.java)
            startActivity(intent)
        }
        
        // Change Password
        overlayView.findViewById<LinearLayout>(R.id.menu_change_password).setOnClickListener {
            hideProfileMenu()
            showChangePasswordDialog()
        }
        
        // Privacy Settings
        overlayView.findViewById<LinearLayout>(R.id.menu_privacy_settings).setOnClickListener {
            hideProfileMenu()
            showPrivacySettingsDialog()
        }
        
        // About App
        overlayView.findViewById<LinearLayout>(R.id.menu_about_app).setOnClickListener {
            hideProfileMenu()
            showAboutAppDialog()
        }
        
        // Feedback
        overlayView.findViewById<LinearLayout>(R.id.menu_feedback).setOnClickListener {
            hideProfileMenu()
            sendFeedbackEmail()
        }
        
        // Logout
        overlayView.findViewById<LinearLayout>(R.id.menu_logout).setOnClickListener {
            hideProfileMenu()
            showLogoutDialog()
        }
    }
    
    private fun showProfileMenu() {
        // Update menu with current user info
        updateMenuUserInfo()
        
        // Show the overlay with animation
        profileMenuOverlay.visibility = View.VISIBLE
        profileMenuOverlay.alpha = 0f
        profileMenuOverlay.animate().alpha(1f).setDuration(200).start()
        
        menuContainer.alpha = 0f
        menuContainer.translationY = -100f
        menuContainer.animate()
            .alpha(1f)
            .translationY(0f)
            .setDuration(300)
            .start()
    }
    
    private fun hideProfileMenu() {
        // Hide the overlay with animation
        profileMenuOverlay.animate().alpha(0f).setDuration(200).withEndAction {
            profileMenuOverlay.visibility = View.GONE
        }.start()
        
        menuContainer.animate()
            .alpha(0f)
            .translationY(-100f)
            .setDuration(300)
            .start()
    }
    
    private fun updateMenuUserInfo() {
        val currentUser = auth.currentUser
        if (currentUser != null) {
            // Load user info from Firestore
            firestore.collection("users")
                .document(currentUser.uid)
                .get()
                .addOnSuccessListener { document ->
                    if (document != null && document.exists()) {
                        val name = document.getString("name") ?: "User"
                        val email = currentUser.email ?: "user@email.com"
                        
                        menuUserName.text = name
                        menuUserEmail.text = email
                        
                        // Load profile image in menu
                        val profileImageUrl = document.getString("profileImageUrl")
                        if (!profileImageUrl.isNullOrEmpty()) {
                            Glide.with(this)
                                .load(profileImageUrl)
                                .placeholder(R.drawable.ic_profile)
                                .error(R.drawable.ic_profile)
                                .circleCrop()
                                .into(menuProfileImage)
                        } else {
                            menuProfileImage.setImageResource(R.drawable.ic_profile)
                        }
                    } else {
                        menuUserName.text = currentUser.displayName ?: "User"
                        menuUserEmail.text = currentUser.email ?: "user@email.com"
                        menuProfileImage.setImageResource(R.drawable.ic_profile)
                    }
                }
                .addOnFailureListener {
                    menuUserName.text = currentUser.displayName ?: "User"
                    menuUserEmail.text = currentUser.email ?: "user@email.com"
                    menuProfileImage.setImageResource(R.drawable.ic_profile)
                }
        } else {
            menuUserName.text = "Guest User"
            menuUserEmail.text = "Please login"
            menuProfileImage.setImageResource(R.drawable.ic_profile)
        }
    }
    
    private fun showChangePasswordDialog() {
        MaterialAlertDialogBuilder(this)
            .setTitle("Change Password")
            .setMessage("This feature will be available soon. For now, you can reset your password through the login screen.")
            .setPositiveButton("OK") { dialog, _ ->
                dialog.dismiss()
            }
            .show()
    }
    
    private fun showPrivacySettingsDialog() {
        MaterialAlertDialogBuilder(this)
            .setTitle("Privacy Settings")
            .setMessage("Privacy settings will be available in the next update. You can control who can see your profile and projects.")
            .setPositiveButton("OK") { dialog, _ ->
                dialog.dismiss()
            }
            .show()
    }
    
    private fun showAboutAppDialog() {
        MaterialAlertDialogBuilder(this)
            .setTitle("About CollabUp")
            .setMessage("CollabUp is a platform that connects students, mentors, and startups for collaborative projects and opportunities.\n\nVersion: 1.0.0\n\nDeveloped with ❤️ for the developer community.")
            .setPositiveButton("OK") { dialog, _ ->
                dialog.dismiss()
            }
            .show()
    }
    
    private fun sendFeedbackEmail() {
        try {
            val intent = Intent(Intent.ACTION_SEND).apply {
                type = "message/rfc822"
                putExtra(Intent.EXTRA_EMAIL, arrayOf("collabup4@gmail.com"))
                putExtra(Intent.EXTRA_SUBJECT, "CollabUp App Feedback")
                putExtra(Intent.EXTRA_TEXT, "Hi CollabUp Team,\n\nI would like to provide feedback about the app:\n\n")
            }
            
            if (intent.resolveActivity(packageManager) != null) {
                startActivity(Intent.createChooser(intent, "Send Feedback via Email"))
            } else {
                Toast.makeText(this, "No email app found on your device", Toast.LENGTH_SHORT).show()
            }
        } catch (e: Exception) {
            Toast.makeText(this, "Error opening email app: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }
    
    private fun showLogoutDialog() {
        MaterialAlertDialogBuilder(this)
            .setTitle("Logout")
            .setMessage("Are you sure you want to logout?")
            .setPositiveButton("Logout") { dialog, _ ->
                logout()
                dialog.dismiss()
            }
            .setNegativeButton("Cancel") { dialog, _ ->
                dialog.dismiss()
            }
            .show()
    }
    
    private fun logout() {
        auth.signOut()
        Toast.makeText(this, "Logged out successfully", Toast.LENGTH_SHORT).show()
        
        // Navigate to login screen
        val intent = Intent(this, LoginActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }
    
    private fun setupChatbotFab() {
        chatbotFab.setOnClickListener {
            val intent = Intent(this, ChatbotActivity::class.java)
            startActivity(intent)
        }
    }
    
    private fun updateMissingProfileImageUrls() {
        Log.d("MainActivity", "Checking for missing profileImageUrl keys...")
        
        GoogleDriveService.updateMissingProfileImageUrls { updatedCount ->
            if (updatedCount > 0) {
                Log.d("MainActivity", "Updated $updatedCount user profiles with missing profileImageUrl keys")
            } else {
                Log.d("MainActivity", "All user profiles already have profileImageUrl keys")
            }
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        instance = null
    }
    
    private fun loadUserProfileImage() {
        val currentUser = auth.currentUser
        if (currentUser == null) {
            // Set default profile image
            profileImage.setImageResource(R.drawable.ic_profile)
            return
        }

        // First try to load from users collection
        firestore.collection("users")
            .document(currentUser.uid)
            .get()
            .addOnSuccessListener { document ->
                if (document != null && document.exists()) {
                    val profileImageUrl = document.getString("profileImageUrl")
                    if (!profileImageUrl.isNullOrEmpty()) {
                        // Load profile image using Glide
                        Glide.with(this)
                            .load(profileImageUrl)
                            .placeholder(R.drawable.ic_profile)
                            .error(R.drawable.ic_profile)
                            .timeout(10000) // 10 second timeout
                            .circleCrop()
                            .into(profileImage)
                    } else {
                        // Try to load from role-specific collection
                        val role = document.getString("role") ?: "Student"
                        loadProfileImageFromRoleCollection(currentUser.uid, role)
                    }
                } else {
                    // Set default profile image
                    profileImage.setImageResource(R.drawable.ic_profile)
                }
            }
            .addOnFailureListener { exception ->
                // Set default profile image on error
                profileImage.setImageResource(R.drawable.ic_profile)
            }
    }

    private fun loadProfileImageFromRoleCollection(userId: String, role: String) {
        val collectionName = when (role) {
            "Student" -> "students"
            "Mentor" -> "mentors"
            "Faculty" -> "faculty"
            "Startup" -> "startups"
            else -> {
                profileImage.setImageResource(R.drawable.ic_profile)
                return
            }
        }

        firestore.collection(collectionName)
            .document(userId)
            .get()
            .addOnSuccessListener { document ->
                if (document != null && document.exists()) {
                    val profileImageUrl = document.getString("profileImageUrl") ?: document.getString("coverUrl")
                    if (!profileImageUrl.isNullOrEmpty()) {
                        // Load profile image using Glide
                        Glide.with(this)
                            .load(profileImageUrl)
                            .placeholder(R.drawable.ic_profile)
                            .error(R.drawable.ic_profile)
                            .timeout(10000) // 10 second timeout
                            .circleCrop()
                            .into(profileImage)
                    } else {
                        // Set default profile image
                        profileImage.setImageResource(R.drawable.ic_profile)
                    }
                } else {
                    // Set default profile image
                    profileImage.setImageResource(R.drawable.ic_profile)
                }
            }
            .addOnFailureListener { exception ->
                // Set default profile image on error
                profileImage.setImageResource(R.drawable.ic_profile)
            }
    }
    
    // Method to refresh profile image (can be called from other activities/fragments)
    fun refreshProfileImage() {
        loadUserProfileImage()
    }
    
    override fun onResume() {
        super.onResume()
        // Refresh profile image when returning to main activity
        loadUserProfileImage()
    }
}