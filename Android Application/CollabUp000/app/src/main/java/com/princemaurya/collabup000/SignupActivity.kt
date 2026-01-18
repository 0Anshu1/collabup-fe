package com.princemaurya.collabup000

import android.content.Intent
import android.os.Bundle
import android.text.InputType
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.ImageView
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.lifecycle.lifecycleScope
import com.princemaurya.collabup000.services.FirebaseAuthService
import com.princemaurya.collabup000.services.GoogleDriveService
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.launch
import android.util.Log

class SignupActivity : AppCompatActivity() {
    private lateinit var authService: FirebaseAuthService
    private lateinit var progressBar: ProgressBar
    private val firestore = FirebaseFirestore.getInstance()
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_signup)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.signupRoot)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        authService = FirebaseAuthService()
        progressBar = findViewById(R.id.signupProgressBar)
        
        var isSignupVisible = false
        val passwordField = findViewById<EditText>(R.id.signupPassword)
        val toggleEye = findViewById<ImageView>(R.id.eyeSignup)
        val signupButton = findViewById<Button>(R.id.signupBtn)
        val loginLink = findViewById<TextView>(R.id.loginLink)
        val continueAsGuest = findViewById<TextView>(R.id.continueAsGuest)

        toggleEye.setOnClickListener {
            isSignupVisible = !isSignupVisible
            if (isSignupVisible) {
                passwordField.inputType = InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD
                toggleEye.setImageResource(R.drawable.ic_visibility_on)
            } else {
                passwordField.inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
                toggleEye.setImageResource(R.drawable.ic_visibility_off)
            }
            passwordField.setSelection(passwordField.text.length)
        }

        // Signup button click
        signupButton.setOnClickListener {
            val name = findViewById<EditText>(R.id.usernameInput).text.toString().trim()
            val email = findViewById<EditText>(R.id.signupEmail).text.toString().trim()
            val password = passwordField.text.toString()
            
            if (validateInputs(name, email, password)) {
                performSignup(name, email, password)
            }
        }

        // Continue as Guest click
        continueAsGuest.setOnClickListener {
            // Save guest login state
            val sharedPreferences = getSharedPreferences("CollabUpPrefs", MODE_PRIVATE)
            sharedPreferences.edit().putBoolean("isLoggedIn", true).apply()
            
            val intent = Intent(this, User_Profiling_Activity::class.java)
            startActivity(intent)
            finish()
        }

        // Login link click
        loginLink.setOnClickListener {
            val intent = Intent(this, LoginActivity::class.java)
            startActivity(intent)
            finish()
        }
    }
    
    private fun validateInputs(name: String, email: String, password: String): Boolean {
        if (name.isEmpty()) {
            findViewById<EditText>(R.id.usernameInput).error = "Name is required"
            return false
        }
        
        if (name.length < 2) {
            findViewById<EditText>(R.id.usernameInput).error = "Name must be at least 2 characters"
            return false
        }
        
        if (email.isEmpty()) {
            findViewById<EditText>(R.id.signupEmail).error = "Email is required"
            return false
        }
        
        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            findViewById<EditText>(R.id.signupEmail).error = "Please enter a valid email"
            return false
        }
        
        if (password.isEmpty()) {
            findViewById<EditText>(R.id.signupPassword).error = "Password is required"
            return false
        }
        
        if (password.length < 6) {
            findViewById<EditText>(R.id.signupPassword).error = "Password must be at least 6 characters"
            return false
        }
        
        return true
    }
    
    private fun performSignup(name: String, email: String, password: String) {
        showLoading(true)
        
        lifecycleScope.launch {
            try {
                val result = authService.signUp(email, password, name)
                result.fold(
                    onSuccess = { user ->
                        // Save user session
                        authService.saveUserSession(this@SignupActivity, user)
                        
                        showLoading(false)
                        Toast.makeText(this@SignupActivity, "Account created successfully!", Toast.LENGTH_SHORT).show()
                        
                        // Ensure user has profileImageUrl key
                        ensureUserHasProfileImageUrl(user.uid)
                        
                        // Check if user profile exists in Firestore
                        checkUserProfileAndNavigate(user.uid)
                    },
                    onFailure = { exception ->
                        showLoading(false)
                        val errorMessage = when (exception.message) {
                            "The email address is already in use by another account." -> "An account with this email already exists"
                            "The email address is badly formatted." -> "Please enter a valid email address"
                            "The given password is invalid. [ Password should be at least 6 characters ]" -> "Password must be at least 6 characters"
                            else -> "Signup failed: ${exception.message}"
                        }
                        Toast.makeText(this@SignupActivity, errorMessage, Toast.LENGTH_LONG).show()
                    }
                )
            } catch (e: Exception) {
                showLoading(false)
                Toast.makeText(this@SignupActivity, "Signup failed: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }
    }
    
    private fun ensureUserHasProfileImageUrl(userId: String) {
        Log.d("SignupActivity", "Ensuring user $userId has profileImageUrl key...")
        
        GoogleDriveService.ensureUserHasProfileImageUrl(userId) { success ->
            if (success) {
                Log.d("SignupActivity", "User $userId profileImageUrl key ensured")
            } else {
                Log.w("SignupActivity", "Failed to ensure profileImageUrl key for user $userId")
            }
        }
    }
    
    private fun checkUserProfileAndNavigate(userId: String) {
        firestore.collection("users")
            .document(userId)
            .get()
            .addOnSuccessListener { document ->
                if (document != null && document.exists()) {
                    // User profile exists, go directly to MainActivity
                    val intent = Intent(this, MainActivity::class.java)
                    startActivity(intent)
                    finish()
                } else {
                    // User profile doesn't exist, go to User_Profiling_Activity
                    val intent = Intent(this, User_Profiling_Activity::class.java)
                    startActivity(intent)
                    finish()
                }
            }
            .addOnFailureListener { exception ->
                // If there's an error checking profile, go to User_Profiling_Activity as fallback
                Toast.makeText(this, "Error checking profile: ${exception.message}", Toast.LENGTH_SHORT).show()
                val intent = Intent(this, User_Profiling_Activity::class.java)
                startActivity(intent)
                finish()
            }
    }
    
    private fun showLoading(show: Boolean) {
        progressBar.visibility = if (show) View.VISIBLE else View.GONE
        findViewById<Button>(R.id.signupBtn).isEnabled = !show
    }
}