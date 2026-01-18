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

class LoginActivity : AppCompatActivity() {
    private lateinit var authService: FirebaseAuthService
    private lateinit var progressBar: ProgressBar
    private val firestore = FirebaseFirestore.getInstance()
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_login)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.loginRoot)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        authService = FirebaseAuthService()
        progressBar = findViewById(R.id.loginProgressBar)
        
        var isVisible = false
        val passwordEditText = findViewById<EditText>(R.id.passwordInput)
        val toggleIcon = findViewById<ImageView>(R.id.eyeToggle)
        val loginButton = findViewById<Button>(R.id.loginButton)
        val signUpLink = findViewById<TextView>(R.id.signUpLink)
        val continueAsGuest = findViewById<TextView>(R.id.continueAsGuest)

        toggleIcon.setOnClickListener {
            isVisible = !isVisible
            if (isVisible) {
                passwordEditText.inputType = InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD
                toggleIcon.setImageResource(R.drawable.ic_visibility_on)
            } else {
                passwordEditText.inputType =
                    InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
                toggleIcon.setImageResource(R.drawable.ic_visibility_off)
            }
            passwordEditText.setSelection(passwordEditText.text.length)
        }

        // Login button click
        loginButton.setOnClickListener {
            val email = findViewById<EditText>(R.id.emailInput).text.toString().trim()
            val password = passwordEditText.text.toString()
            
            if (validateInputs(email, password)) {
                performLogin(email, password)
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

        // Signup link click
        signUpLink.setOnClickListener {
            val intent = Intent(this, SignupActivity::class.java)
            startActivity(intent)
        }
    }
    
    private fun validateInputs(email: String, password: String): Boolean {
        if (email.isEmpty()) {
            findViewById<EditText>(R.id.emailInput).error = "Email is required"
            return false
        }
        
        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            findViewById<EditText>(R.id.emailInput).error = "Please enter a valid email"
            return false
        }
        
        if (password.isEmpty()) {
            findViewById<EditText>(R.id.passwordInput).error = "Password is required"
            return false
        }
        
        if (password.length < 6) {
            findViewById<EditText>(R.id.passwordInput).error = "Password must be at least 6 characters"
            return false
        }
        
        return true
    }
    
    private fun performLogin(email: String, password: String) {
        showLoading(true)
        
        lifecycleScope.launch {
            try {
                val result = authService.signIn(email, password)
                result.fold(
                    onSuccess = { user ->
                        // Save user session
                        authService.saveUserSession(this@LoginActivity, user)
                        
                        showLoading(false)
                        Toast.makeText(this@LoginActivity, "Login successful!", Toast.LENGTH_SHORT).show()
                        
                        // Ensure user has profileImageUrl key
                        ensureUserHasProfileImageUrl(user.uid)
                        
                        // Check if user profile exists in Firestore
                        checkUserProfileAndNavigate(user.uid)
                    },
                    onFailure = { exception ->
                        showLoading(false)
                        val errorMessage = when (exception.message) {
                            "The password is invalid or the user does not have a password." -> "Invalid email or password"
                            "There is no user record corresponding to this identifier." -> "No account found with this email"
                            else -> "Login failed: ${exception.message}"
                        }
                        Toast.makeText(this@LoginActivity, errorMessage, Toast.LENGTH_LONG).show()
                    }
                )
            } catch (e: Exception) {
                showLoading(false)
                Toast.makeText(this@LoginActivity, "Login failed: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }
    }
    
    private fun ensureUserHasProfileImageUrl(userId: String) {
        Log.d("LoginActivity", "Ensuring user $userId has profileImageUrl key...")
        
        GoogleDriveService.ensureUserHasProfileImageUrl(userId) { success ->
            if (success) {
                Log.d("LoginActivity", "User $userId profileImageUrl key ensured")
            } else {
                Log.w("LoginActivity", "Failed to ensure profileImageUrl key for user $userId")
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
        findViewById<Button>(R.id.loginButton).isEnabled = !show
    }
}