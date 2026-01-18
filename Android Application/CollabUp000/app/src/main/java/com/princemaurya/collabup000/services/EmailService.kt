package com.princemaurya.collabup000.services

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import com.google.firebase.firestore.DocumentSnapshot
import java.text.SimpleDateFormat
import java.util.*
import android.util.Patterns
import com.google.android.material.dialog.MaterialAlertDialogBuilder

class EmailService {
    
    companion object {
        fun sendBookingEmail(
            context: Context,
            mentorDoc: DocumentSnapshot,
            studentName: String,
            studentEmail: String,
            studentSkills: List<String>,
            studentInstitute: String,
            message: String
        ) {
            val mentorData = mentorDoc.data
            val mentorName = mentorData?.get("name") as? String ?: "Mentor"
            val mentorEmail = mentorData?.get("email") as? String ?: ""
            
            val subject = "Session Booking Request - CollabUp"
            val body = buildBookingEmailBody(mentorName, studentName, studentEmail, studentSkills, studentInstitute, message)
            
            sendEmail(context, mentorEmail, subject, body)
        }
        
        fun sendConnectionEmail(
            context: Context,
            targetStudentDoc: DocumentSnapshot,
            senderName: String,
            senderEmail: String,
            senderSkills: List<String>,
            senderInstitute: String,
            message: String
        ) {
            val studentData = targetStudentDoc.data
            val studentName = studentData?.get("name") as? String ?: "Student"
            val studentEmail = studentData?.get("email") as? String ?: ""
            
            val subject = "Connection Request - CollabUp"
            val body = buildConnectionEmailBody(studentName, senderName, senderEmail, senderSkills, senderInstitute, message)
            
            sendEmail(context, studentEmail, subject, body)
        }
        
        private fun sendEmail(context: Context, toEmail: String, subject: String, body: String) {
            try {
                // Validate email address
                if (!isValidEmail(toEmail)) {
                    Toast.makeText(context, "Invalid email address", Toast.LENGTH_SHORT).show()
                    return
                }
                
                // Try multiple email intents to ensure compatibility with Gmail and other apps
                val emailIntents = listOf(
                    // Primary email intent (works with most email apps)
                    Intent(Intent.ACTION_SENDTO).apply {
                        data = Uri.parse("mailto:$toEmail")
                        putExtra(Intent.EXTRA_SUBJECT, subject)
                        putExtra(Intent.EXTRA_TEXT, body)
                    },
                    // Alternative email intent for better Gmail compatibility
                    Intent(Intent.ACTION_SEND).apply {
                        type = "message/rfc822"
                        putExtra(Intent.EXTRA_EMAIL, arrayOf(toEmail))
                        putExtra(Intent.EXTRA_SUBJECT, subject)
                        putExtra(Intent.EXTRA_TEXT, body)
                    }
                )
                
                // Try to find an available email app
                var emailAppFound = false
                for (intent in emailIntents) {
                    if (intent.resolveActivity(context.packageManager) != null) {
                        // Create chooser to let user select their preferred email app (Gmail, Outlook, etc.)
                        val chooser = Intent.createChooser(intent, "Send email using...")
                        context.startActivity(chooser)
                        emailAppFound = true
                        break
                    }
                }
                
                if (!emailAppFound) {
                    // No email app found, show alternative options
                    showNoEmailAppDialog(context, toEmail, subject, body)
                }
            } catch (e: Exception) {
                Toast.makeText(context, "Failed to send email: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
        
        private fun showNoEmailAppDialog(context: Context, toEmail: String, subject: String, body: String) {
            MaterialAlertDialogBuilder(context)
                .setTitle("No Email App Found")
                .setMessage("No email app is installed on your device. You can:")
                .setPositiveButton("Copy Email Content") { _, _ ->
                    copyEmailToClipboard(context, toEmail, subject, body)
                }
                .setNegativeButton("Copy Email Address") { _, _ ->
                    copyEmailAddressToClipboard(context, toEmail)
                }
                .setNeutralButton("Cancel") { _, _ ->
                    // Do nothing
                }
                .show()
        }
        
        private fun copyEmailToClipboard(context: Context, toEmail: String, subject: String, body: String) {
            val clipboardManager = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            val emailContent = """
                To: $toEmail
                Subject: $subject
                
                $body
            """.trimIndent()
            
            val clip = ClipData.newPlainText("Email Content", emailContent)
            clipboardManager.setPrimaryClip(clip)
            
            Toast.makeText(context, "Email content copied to clipboard", Toast.LENGTH_LONG).show()
        }
        
        private fun copyEmailAddressToClipboard(context: Context, email: String) {
            val clipboardManager = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            val clip = ClipData.newPlainText("Email Address", email)
            clipboardManager.setPrimaryClip(clip)
            
            Toast.makeText(context, "Email address copied to clipboard", Toast.LENGTH_LONG).show()
        }
        
        private fun isValidEmail(email: String): Boolean {
            return email.isNotEmpty() && Patterns.EMAIL_ADDRESS.matcher(email).matches()
        }
        
        private fun buildBookingEmailBody(
            mentorName: String,
            studentName: String,
            studentEmail: String,
            studentSkills: List<String>,
            studentInstitute: String,
            message: String
        ): String {
            val currentDate = SimpleDateFormat("MMMM dd, yyyy", Locale.getDefault()).format(Date())
            
            return """
                Dear $mentorName,
                
                You have received a session booking request from a student on CollabUp.
                
                💬 Message:
                "$message"
                
                👤 Student Information:
                - Name: $studentName
                - Email: $studentEmail
                - Institute: $studentInstitute
                - Skills: ${studentSkills.joinToString(", ")}
                
                Please respond to this email to:
                • Confirm the session
                • Suggest an alternative time
                • Request more information
                
                If you need to reschedule, please coordinate directly with the student via email.
                
                Best regards,
                The CollabUp Team
                
                ---
                This email was sent from the CollabUp student collaboration platform on $currentDate.
                For support, please contact our team.
            """.trimIndent()
        }
        
        private fun buildConnectionEmailBody(
            targetStudentName: String,
            senderName: String,
            senderEmail: String,
            senderSkills: List<String>,
            senderInstitute: String,
            message: String
        ): String {
            val currentDate = SimpleDateFormat("MMMM dd, yyyy", Locale.getDefault()).format(Date())
            
            return """
                Dear $targetStudentName,
                
                You have received a connection request from a fellow student on CollabUp!
                
                👤 Student Information:
                - Name: $senderName
                - Email: $senderEmail
                - Institute: $senderInstitute
                - Skills: ${senderSkills.joinToString(", ")}
                
                💬 Message:
                "$message"
                
                You can respond to this email to:
                • Accept the connection request
                • Ask questions about their project or skills
                • Suggest a time to discuss collaboration opportunities
                
                This is a great opportunity to expand your network and find potential collaborators for your projects!
                
                Best regards,
                The CollabUp Team
                
                ---
                This email was sent from the CollabUp student collaboration platform on $currentDate.
                For support, please contact our team.
            """.trimIndent()
        }
    }
} 