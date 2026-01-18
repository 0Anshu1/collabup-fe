package com.princemaurya.collabup000

import android.content.Intent
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.widget.RadioButton
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.google.android.material.chip.Chip
import com.google.android.material.chip.ChipGroup
import com.google.android.material.textfield.TextInputEditText
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import java.util.*

class AddProjectActivity : AppCompatActivity() {

    private lateinit var projectTitleInput: TextInputEditText
    private lateinit var projectDescriptionInput: TextInputEditText
    private lateinit var projectDomainsInput: TextInputEditText
    private lateinit var skillsInput: TextInputEditText
    private lateinit var projectDurationInput: TextInputEditText
    private lateinit var projectLocationInput: TextInputEditText
    private lateinit var ownerNameInput: TextInputEditText
    private lateinit var domainsChipGroup: ChipGroup
    private lateinit var skillsChipGroup: ChipGroup
    private lateinit var saveProjectButton: com.google.android.material.button.MaterialButton

    private val skillsList = mutableListOf<String>()
    private val domainsList = mutableListOf<String>()

    private lateinit var auth: FirebaseAuth
    private lateinit var firestore: FirebaseFirestore

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_add_project)

        // Set status bar color
        window.statusBarColor = ContextCompat.getColor(this, R.color.dark_blue)

        // Initialize views
        initializeViews()
        setupDomainsInput()
        setupSkillsInput()
        setupSaveButton()

        // Initialize Firebase
        auth = FirebaseAuth.getInstance()
        firestore = FirebaseFirestore.getInstance()
    }

    private fun initializeViews() {
        projectTitleInput = findViewById(R.id.projectTitleInput)
        projectDescriptionInput = findViewById(R.id.projectDescriptionInput)
        projectDomainsInput = findViewById(R.id.projectDomainsInput)
        skillsInput = findViewById(R.id.skillsInput)
        projectDurationInput = findViewById(R.id.projectDurationInput)
        projectLocationInput = findViewById(R.id.projectLocationInput)
        ownerNameInput = findViewById(R.id.ownerNameInput)
        domainsChipGroup = findViewById(R.id.projectDomainsChipGroup)
        skillsChipGroup = findViewById(R.id.skillsChipGroup)
        saveProjectButton = findViewById(R.id.saveProjectButton)
    }

    private fun setupDomainsInput() {
        projectDomainsInput.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) {
                val text = s.toString().trim()
                if (text.isNotEmpty() && text.contains(",")) {
                    val domain = text.substringBefore(",").trim()
                    if (domain.isNotEmpty() && !domainsList.contains(domain)) {
                        addDomainChip(domain)
                        domainsList.add(domain)
                    }
                    projectDomainsInput.setText("")
                }
            }
        })

        // Also handle Enter key
        projectDomainsInput.setOnEditorActionListener { _, _, _ ->
            val text = projectDomainsInput.text.toString().trim()
            if (text.isNotEmpty() && !domainsList.contains(text)) {
                addDomainChip(text)
                domainsList.add(text)
                projectDomainsInput.setText("")
            }
            true
        }
    }

    private fun addDomainChip(domain: String) {
        val chip = Chip(this)
        chip.text = domain
        chip.isCheckable = false
        chip.textSize = 12f
        chip.chipMinHeight = 32f
        chip.setChipBackgroundColorResource(R.color.chip_indigo)
        chip.setTextColor(getColor(R.color.dark_blue))
        chip.chipCornerRadius = 16f
        chip.chipStrokeWidth = 0f
        chip.isCloseIconVisible = true
        chip.setOnCloseIconClickListener {
            domainsChipGroup.removeView(chip)
            domainsList.remove(domain)
        }
        domainsChipGroup.addView(chip)
    }

    private fun setupSkillsInput() {
        skillsInput.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) {
                val text = s.toString().trim()
                if (text.isNotEmpty() && text.contains(",")) {
                    val skill = text.substringBefore(",").trim()
                    if (skill.isNotEmpty() && !skillsList.contains(skill)) {
                        addSkillChip(skill)
                        skillsList.add(skill)
                    }
                    skillsInput.setText("")
                }
            }
        })

        // Also handle Enter key
        skillsInput.setOnEditorActionListener { _, _, _ ->
            val text = skillsInput.text.toString().trim()
            if (text.isNotEmpty() && !skillsList.contains(text)) {
                addSkillChip(text)
                skillsList.add(text)
                skillsInput.setText("")
            }
            true
        }
    }

    private fun addSkillChip(skill: String) {
        val chip = Chip(this)
        chip.text = skill
        chip.isCheckable = false
        chip.textSize = 12f
        chip.chipMinHeight = 32f
        chip.setChipBackgroundColorResource(R.color.chip_blue)
        chip.setTextColor(getColor(R.color.dark_blue))
        chip.chipCornerRadius = 16f
        chip.chipStrokeWidth = 0f
        chip.isCloseIconVisible = true
        chip.setOnCloseIconClickListener {
            skillsChipGroup.removeView(chip)
            skillsList.remove(skill)
        }
        skillsChipGroup.addView(chip)
    }

    private fun setupSaveButton() {
        saveProjectButton.setOnClickListener {
            if (validateInputs()) {
                saveProject()
            }
        }
    }

    private fun validateInputs(): Boolean {
        val title = projectTitleInput.text.toString().trim()
        val description = projectDescriptionInput.text.toString().trim()
        val duration = projectDurationInput.text.toString().trim()
        val location = projectLocationInput.text.toString().trim()
        val ownerName = ownerNameInput.text.toString().trim()

        if (title.isEmpty()) {
            projectTitleInput.error = "Project title is required"
            return false
        }

        if (description.isEmpty()) {
            projectDescriptionInput.error = "Project description is required"
            return false
        }

        if (duration.isEmpty()) {
            projectDurationInput.error = "Project duration is required"
            return false
        }

        if (location.isEmpty()) {
            projectLocationInput.error = "Project location is required"
            return false
        }

        if (ownerName.isEmpty()) {
            ownerNameInput.error = "Owner name is required"
            return false
        }

        if (domainsList.isEmpty()) {
            Toast.makeText(this, "Please add at least one domain", Toast.LENGTH_SHORT).show()
            return false
        }

        if (skillsList.isEmpty()) {
            Toast.makeText(this, "Please add at least one skill", Toast.LENGTH_SHORT).show()
            return false
        }

        return true
    }

    private fun saveProject() {
        val title = projectTitleInput.text.toString().trim()
        val description = projectDescriptionInput.text.toString().trim()
        val duration = projectDurationInput.text.toString().trim()
        val location = projectLocationInput.text.toString().trim()
        val ownerName = ownerNameInput.text.toString().trim()
        val status = getSelectedStatus()
        val type = getSelectedType()
        val level = getSelectedLevel()
        val currentUser = auth.currentUser

        // Create project data for Firestore
        val projectData = hashMapOf<String, Any>(
            "title" to title,
            "description" to description,
            "domain" to (domainsList.firstOrNull() ?: ""),
            "level" to level,
            "technologies" to skillsList.toList(),
            "duration" to duration,
            "location" to location,
            "projectOwnerEmail" to (currentUser?.email ?: ""),
            "ownerId" to (currentUser?.uid ?: ""),
            "ownerEmail" to (currentUser?.email ?: ""),
            "ownerName" to ownerName,
            "creatorId" to (currentUser?.uid ?: ""),
            "coverUrl" to "",
            "status" to status,
            "type" to type,
            "createdAt" to Date(),
            "updatedAt" to Date()
        )

        // Save to Firestore
        firestore.collection("projects")
            .add(projectData)
            .addOnSuccessListener { documentReference ->
                Toast.makeText(this, "Project saved successfully!", Toast.LENGTH_SHORT).show()
                
                // Return to previous activity with result
                val intent = Intent()
                intent.putExtra("project_title", title)
                intent.putExtra("project_description", description)
                intent.putExtra("project_domains", domainsList.toTypedArray())
                intent.putExtra("project_status", status)
                intent.putExtra("project_type", type)
                intent.putExtra("project_skills", skillsList.toTypedArray())
                
                setResult(RESULT_OK, intent)
                finish()
            }
            .addOnFailureListener { exception ->
                Toast.makeText(this, "Failed to save project: ${exception.message}", Toast.LENGTH_SHORT).show()
            }
    }

    private fun getSelectedStatus(): String {
        return when (findViewById<RadioButton>(R.id.statusOpen).isChecked) {
            true -> "open"
            else -> when (findViewById<RadioButton>(R.id.statusInProgress).isChecked) {
                true -> "in_progress"
                else -> "completed"
            }
        }
    }

    private fun getSelectedType(): String {
        return when (findViewById<RadioButton>(R.id.typeFullTime).isChecked) {
            true -> "full-time"
            else -> when (findViewById<RadioButton>(R.id.typePartTime).isChecked) {
                true -> "part-time"
                else -> "internship"
            }
        }
    }

    private fun getSelectedLevel(): String {
        return when (findViewById<RadioButton>(R.id.levelBeginner).isChecked) {
            true -> "Beginner"
            else -> when (findViewById<RadioButton>(R.id.levelIntermediate).isChecked) {
                true -> "Intermediate"
                else -> "Advanced"
            }
        }
    }
} 