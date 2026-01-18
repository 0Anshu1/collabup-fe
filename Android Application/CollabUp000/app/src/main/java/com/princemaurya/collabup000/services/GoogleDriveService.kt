package com.princemaurya.collabup000.services

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Base64
import android.util.Log
import android.widget.Toast
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.Scope
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import java.io.ByteArrayOutputStream
import java.io.InputStream
import java.util.*

class GoogleDriveService {
    
    companion object {
        private const val TAG = "GoogleDriveService"
        private const val FOLDER_NAME = "CollabUp_Profile_Images"
        
        // Google Sign-In client
        private var googleSignInClient: GoogleSignInClient? = null
        
        // Firebase instances
        private val firestore = FirebaseFirestore.getInstance()
        private val auth = FirebaseAuth.getInstance()
        
        fun initializeGoogleSignIn(context: Context): GoogleSignInClient? {
            return try {
                Log.d(TAG, "Initializing Google Sign-In...")
                
                val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                    .requestEmail()
                    .requestScopes(Scope("https://www.googleapis.com/auth/drive.file"))
                    .build()
                
                googleSignInClient = GoogleSignIn.getClient(context, gso)
                Log.d(TAG, "Google Sign-In initialized successfully")
                googleSignInClient
            } catch (e: Exception) {
                Log.e(TAG, "Failed to initialize Google Sign-In: ${e.message}", e)
                Toast.makeText(context, "Google Sign-In not available", Toast.LENGTH_SHORT).show()
                null
            }
        }
        
        fun getGoogleSignInClient(): GoogleSignInClient? {
            return googleSignInClient
        }
        
        suspend fun uploadImageToDrive(
            context: Context,
            imageUri: Uri,
            fileName: String,
            onSuccess: (String) -> Unit,
            onError: (String) -> Unit
        ) {
            try {
                Log.d(TAG, "Starting image upload process...")
                
                // Convert image to base64 data URL (fallback method)
                val imageDataUrl = convertImageToDataUrl(context, imageUri)
                if (imageDataUrl == null) {
                    onError("Failed to process image")
                    return
                }
                
                // Save the data URL to Firestore
                val currentUser = auth.currentUser
                if (currentUser == null) {
                    onError("User not authenticated")
                    return
                }
                
                saveImageUrlToFirestore(currentUser.uid, imageDataUrl, onSuccess, onError)
                
                Log.d(TAG, "Image processed successfully and saved to Firestore")
                
            } catch (e: Exception) {
                Log.e(TAG, "Error processing image", e)
                onError("Failed to process image: ${e.message}")
            }
        }
        
        private fun convertImageToDataUrl(context: Context, imageUri: Uri): String? {
            return try {
                Log.d(TAG, "Converting image to data URL...")
                
                val inputStream: InputStream? = context.contentResolver.openInputStream(imageUri)
                val bitmap = BitmapFactory.decodeStream(inputStream)
                
                if (bitmap == null) {
                    Log.e(TAG, "Failed to decode bitmap")
                    return null
                }
                
                // Resize bitmap to reduce size (max 512x512)
                val resizedBitmap = resizeBitmap(bitmap, 512, 512)
                
                // Convert to base64
                val byteArrayOutputStream = ByteArrayOutputStream()
                resizedBitmap.compress(Bitmap.CompressFormat.JPEG, 80, byteArrayOutputStream)
                val byteArray = byteArrayOutputStream.toByteArray()
                val base64String = Base64.encodeToString(byteArray, Base64.DEFAULT)
                
                // Create data URL
                val dataUrl = "data:image/jpeg;base64,$base64String"
                Log.d(TAG, "Image converted to data URL successfully")
                dataUrl
                
            } catch (e: Exception) {
                Log.e(TAG, "Error converting image to data URL", e)
                null
            }
        }
        
        private fun resizeBitmap(bitmap: Bitmap, maxWidth: Int, maxHeight: Int): Bitmap {
            val width = bitmap.width
            val height = bitmap.height
            
            if (width <= maxWidth && height <= maxHeight) {
                return bitmap
            }
            
            val ratio = Math.min(
                maxWidth.toFloat() / width,
                maxHeight.toFloat() / height
            )
            
            val newWidth = (width * ratio).toInt()
            val newHeight = (height * ratio).toInt()
            
            return Bitmap.createScaledBitmap(bitmap, newWidth, newHeight, true)
        }
        
        private fun saveImageUrlToFirestore(
            userId: String,
            imageUrl: String,
            onSuccess: (String) -> Unit,
            onError: (String) -> Unit
        ) {
            Log.d(TAG, "Saving image URL to Firestore...")
            
            // First save to users collection
            val userData = hashMapOf(
                "profileImageUrl" to imageUrl,
                "updatedAt" to Date()
            )
            
            firestore.collection("users")
                .document(userId)
                .update(userData as Map<String, Any>)
                .addOnSuccessListener {
                    // Then save to role-specific collection
                    saveToRoleSpecificCollection(userId, imageUrl, onSuccess, onError)
                }
                .addOnFailureListener { exception ->
                    Log.e(TAG, "Failed to save image URL to users collection", exception)
                    onError("Failed to save image URL: ${exception.message}")
                }
        }

        private fun saveToRoleSpecificCollection(
            userId: String,
            imageUrl: String,
            onSuccess: (String) -> Unit,
            onError: (String) -> Unit
        ) {
            // Get user role first
            firestore.collection("users")
                .document(userId)
                .get()
                .addOnSuccessListener { document ->
                    if (document != null && document.exists()) {
                        val role = document.getString("role") ?: "Student"
                        val collectionName = when (role) {
                            "Student" -> "students"
                            "Mentor" -> "mentors"
                            "Faculty" -> "faculty"
                            "Startup" -> "startups"
                            else -> "students"
                        }

                        val fieldName = if (role == "Faculty") "coverUrl" else "profileImageUrl"
                        val roleData = hashMapOf(
                            fieldName to imageUrl,
                            "updatedAt" to Date()
                        )

                        firestore.collection(collectionName)
                            .document(userId)
                            .update(roleData as Map<String, Any>)
                            .addOnSuccessListener {
                                Log.d(TAG, "Image URL saved to $collectionName collection successfully")
                                onSuccess(imageUrl)
                            }
                            .addOnFailureListener { exception ->
                                Log.e(TAG, "Failed to save image URL to $collectionName collection", exception)
                                // Still consider it a success if saved to users collection
                                onSuccess(imageUrl)
                            }
                    } else {
                        Log.w(TAG, "User document not found, saving only to users collection")
                        onSuccess(imageUrl)
                    }
                }
                .addOnFailureListener { exception ->
                    Log.e(TAG, "Failed to get user role", exception)
                    // Still consider it a success if saved to users collection
                    onSuccess(imageUrl)
                }
        }
        
        fun isUserSignedIn(): Boolean {
            return try {
                Log.d(TAG, "Checking if user is signed in...")
                val account = GoogleSignIn.getLastSignedInAccount(googleSignInClient?.applicationContext ?: return false)
                val isSignedIn = account != null
                Log.d(TAG, "User sign-in status: $isSignedIn")
                isSignedIn
            } catch (e: Exception) {
                Log.e(TAG, "Error checking sign-in status: ${e.message}", e)
                false
            }
        }
        
        fun getCurrentAccount(): GoogleSignInAccount? {
            return try {
                Log.d(TAG, "Getting current account...")
                val account = GoogleSignIn.getLastSignedInAccount(googleSignInClient?.applicationContext ?: return null)
                Log.d(TAG, "Current account: ${account?.email ?: "null"}")
                account
            } catch (e: Exception) {
                Log.e(TAG, "Error getting current account: ${e.message}", e)
                null
            }
        }
        
        fun signOut() {
            try {
                Log.d(TAG, "Signing out...")
                googleSignInClient?.signOut()
                Log.d(TAG, "Sign out completed")
            } catch (e: Exception) {
                Log.e(TAG, "Error signing out: ${e.message}", e)
            }
        }
        
        /**
         * Updates all user profiles in Firestore that don't have a profileImageUrl key
         * This ensures all users have a consistent data structure
         */
        fun updateMissingProfileImageUrls(onComplete: (Int) -> Unit) {
            Log.d(TAG, "Starting to update missing profileImageUrl keys...")
            
            val collections = listOf("users", "students", "mentors", "faculty", "startups")
            var totalUpdated = 0
            var completedCollections = 0
            
            fun checkCompletion() {
                if (completedCollections == collections.size) {
                    Log.d(TAG, "Completed updating all collections. Total updated: $totalUpdated")
                    onComplete(totalUpdated)
                }
            }
            
            collections.forEach { collectionName ->
                firestore.collection(collectionName)
                    .get()
                    .addOnSuccessListener { documents ->
                        var updatedCount = 0
                        val batch = firestore.batch()
                        
                        for (document in documents) {
                            val data = document.data
                            if (data != null) {
                                val hasProfileImage = data.containsKey("profileImageUrl") || 
                                                    (collectionName == "faculty" && data.containsKey("coverUrl"))
                                
                                if (!hasProfileImage) {
                                    Log.d(TAG, "Adding profileImageUrl to $collectionName: ${document.id}")
                                    
                                    val fieldName = if (collectionName == "faculty") "coverUrl" else "profileImageUrl"
                                    val userRef = firestore.collection(collectionName).document(document.id)
                                    batch.update(userRef, fieldName, null)
                                    updatedCount++
                                }
                            }
                        }
                        
                        if (updatedCount > 0) {
                            batch.commit()
                                .addOnSuccessListener {
                                    Log.d(TAG, "Successfully updated $updatedCount documents in $collectionName")
                                    totalUpdated += updatedCount
                                    completedCollections++
                                    checkCompletion()
                                }
                                .addOnFailureListener { exception ->
                                    Log.e(TAG, "Failed to update $collectionName", exception)
                                    completedCollections++
                                    checkCompletion()
                                }
                        } else {
                            Log.d(TAG, "No documents need updating in $collectionName")
                            completedCollections++
                            checkCompletion()
                        }
                    }
                    .addOnFailureListener { exception ->
                        Log.e(TAG, "Failed to fetch documents from $collectionName", exception)
                        completedCollections++
                        checkCompletion()
                    }
            }
        }
        
        /**
         * Updates a single user profile to ensure it has a profileImageUrl key
         */
        fun ensureUserHasProfileImageUrl(userId: String, onComplete: (Boolean) -> Unit) {
            Log.d(TAG, "Ensuring user $userId has profileImageUrl key...")
            
            // First check users collection
            firestore.collection("users")
                .document(userId)
                .get()
                .addOnSuccessListener { userDocument ->
                    if (userDocument != null && userDocument.exists()) {
                        val userData = userDocument.data
                        val role = userDocument.getString("role") ?: "Student"
                        
                        var needsUpdate = false
                        if (userData != null && !userData.containsKey("profileImageUrl")) {
                            needsUpdate = true
                        }
                        
                        // Update users collection if needed
                        if (needsUpdate) {
                            firestore.collection("users")
                                .document(userId)
                                .update("profileImageUrl", null)
                                .addOnSuccessListener {
                                    // Now check role-specific collection
                                    ensureRoleSpecificProfileImageUrl(userId, role, onComplete)
                                }
                                .addOnFailureListener { exception ->
                                    Log.e(TAG, "Failed to add profileImageUrl to users collection for user: $userId", exception)
                                    onComplete(false)
                                }
                        } else {
                            // Check role-specific collection
                            ensureRoleSpecificProfileImageUrl(userId, role, onComplete)
                        }
                    } else {
                        Log.w(TAG, "User document not found: $userId")
                        onComplete(false)
                    }
                }
                .addOnFailureListener { exception ->
                    Log.e(TAG, "Failed to fetch user document: $userId", exception)
                    onComplete(false)
                }
        }

        private fun ensureRoleSpecificProfileImageUrl(userId: String, role: String, onComplete: (Boolean) -> Unit) {
            val collectionName = when (role) {
                "Student" -> "students"
                "Mentor" -> "mentors"
                "Faculty" -> "faculty"
                "Startup" -> "startups"
                else -> {
                    Log.d(TAG, "User $userId role-specific profileImageUrl key ensured")
                    onComplete(true)
                    return
                }
            }

            firestore.collection(collectionName)
                .document(userId)
                .get()
                .addOnSuccessListener { document ->
                    if (document != null && document.exists()) {
                        val data = document.data
                        if (data != null) {
                            val fieldName = if (role == "Faculty") "coverUrl" else "profileImageUrl"
                            val hasProfileImage = data.containsKey(fieldName)
                            
                            if (!hasProfileImage) {
                                Log.d(TAG, "Adding $fieldName to $collectionName for user: $userId")
                                
                                firestore.collection(collectionName)
                                    .document(userId)
                                    .update(fieldName, null)
                                    .addOnSuccessListener {
                                        Log.d(TAG, "Successfully added $fieldName to $collectionName for user: $userId")
                                        onComplete(true)
                                    }
                                    .addOnFailureListener { exception ->
                                        Log.e(TAG, "Failed to add $fieldName to $collectionName for user: $userId", exception)
                                        onComplete(false)
                                    }
                            } else {
                                Log.d(TAG, "User $userId already has $fieldName key in $collectionName")
                                onComplete(true)
                            }
                        } else {
                            Log.d(TAG, "User $userId role-specific profileImageUrl key ensured")
                            onComplete(true)
                        }
                    } else {
                        Log.w(TAG, "Role-specific document not found for user: $userId in $collectionName")
                        onComplete(true) // Consider it successful if document doesn't exist yet
                    }
                }
                .addOnFailureListener { exception ->
                    Log.e(TAG, "Failed to fetch role-specific document for user: $userId", exception)
                    onComplete(false)
                }
        }
    }
} 