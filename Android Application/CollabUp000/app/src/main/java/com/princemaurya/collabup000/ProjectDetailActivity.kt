package com.princemaurya.collabup000

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import android.widget.TextView
import android.widget.ImageView
import android.widget.Button
import com.google.android.material.chip.Chip
import com.google.android.material.chip.ChipGroup
import com.google.firebase.firestore.FirebaseFirestore
import com.princemaurya.collabup000.models.Project
import android.widget.Toast
import com.bumptech.glide.Glide
import com.princemaurya.collabup000.R

class ProjectDetailActivity : AppCompatActivity() {
    
    private lateinit var projectTitle: TextView
    private lateinit var projectDescription: TextView
    private lateinit var projectDomain: TextView
    private lateinit var projectLevel: TextView
    private lateinit var projectDuration: TextView
    private lateinit var projectLocation: TextView
    private lateinit var ownerName: TextView
    private lateinit var ownerEmail: TextView
    private lateinit var technologiesChipGroup: ChipGroup
    private lateinit var projectImage: ImageView
    private lateinit var applyButton: Button
    
    private val firestore = FirebaseFirestore.getInstance()
    private var projectId: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_project_detail)
        
        // Initialize views
        initializeViews()
        
        // Get project ID from intent
        projectId = intent.getStringExtra("project_id")
        if (projectId != null) {
            loadProjectDetails(projectId!!)
        } else {
            Toast.makeText(this, "Project ID not found", Toast.LENGTH_SHORT).show()
            finish()
        }
    }

    private fun initializeViews() {
        projectTitle = findViewById(R.id.project_title)
        projectDescription = findViewById(R.id.project_description)
        projectDomain = findViewById(R.id.project_domain)
        projectLevel = findViewById(R.id.project_level)
        projectDuration = findViewById(R.id.project_duration)
        projectLocation = findViewById(R.id.project_location)
        ownerName = findViewById(R.id.owner_name)
        ownerEmail = findViewById(R.id.owner_email)
        technologiesChipGroup = findViewById(R.id.technologies_chip_group)
        projectImage = findViewById(R.id.project_image)
        applyButton = findViewById(R.id.apply_button)
        
        // Set up apply button
        applyButton.setOnClickListener {
            // TODO: Implement apply functionality
            Toast.makeText(this, "Apply functionality coming soon", Toast.LENGTH_SHORT).show()
        }
    }

    private fun loadProjectDetails(projectId: String) {
        firestore.collection("projects")
            .document(projectId)
            .get()
            .addOnSuccessListener { document ->
                if (document != null && document.exists()) {
                    val project = document.toObject(Project::class.java)
                    if (project != null) {
                        // Create a new project instance with the document ID
                        val projectWithId = project.copy(id = document.id)
                        displayProjectDetails(projectWithId)
                    } else {
                        Toast.makeText(this, "Failed to parse project data", Toast.LENGTH_SHORT).show()
                        finish()
                    }
                } else {
                    Toast.makeText(this, "Project not found", Toast.LENGTH_SHORT).show()
                    finish()
                }
            }
            .addOnFailureListener { exception ->
                Toast.makeText(this, "Failed to load project: ${exception.message}", Toast.LENGTH_SHORT).show()
                finish()
            }
    }

    private fun displayProjectDetails(project: Project) {
        // Set basic project info
        projectTitle.text = project.title
        projectDescription.text = project.description
        projectDomain.text = project.domain
        projectLevel.text = project.level
        projectDuration.text = project.duration
        projectLocation.text = project.location
        
        // Set owner info
        ownerName.text = project.ownerName
        ownerEmail.text = project.ownerEmail
        
        // Load project image
        if (!project.coverUrl.isNullOrEmpty()) {
            Glide.with(this)
                .load(project.coverUrl)
                .placeholder(R.drawable.bg_project_card_gradient)
                .error(R.drawable.bg_project_card_gradient)
                .into(projectImage)
        } else {
            projectImage.setImageResource(R.drawable.bg_project_card_gradient)
        }
        
        // Set technologies chips
        technologiesChipGroup.removeAllViews()
        val skillColors = listOf(
            R.color.chip_blue, R.color.chip_purple, R.color.chip_green,
            R.color.chip_orange, R.color.chip_pink, R.color.chip_teal
        )
        project.technologies.forEachIndexed { index, technology ->
            val chip = Chip(this)
            chip.text = technology
            chip.isCheckable = false
            chip.textSize = 14f
            chip.chipMinHeight = 32f
            chip.setChipBackgroundColorResource(skillColors[index % skillColors.size])
            chip.setTextColor(getColor(R.color.dark_blue))
            chip.chipCornerRadius = 16f
            chip.chipStrokeWidth = 0f
            technologiesChipGroup.addView(chip)
        }
    }
} 