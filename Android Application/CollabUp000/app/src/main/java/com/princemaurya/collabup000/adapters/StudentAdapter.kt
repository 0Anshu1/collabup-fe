package com.princemaurya.collabup000.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.google.android.material.chip.Chip
import com.google.android.material.chip.ChipGroup
import com.google.android.material.button.MaterialButton
import com.princemaurya.collabup000.R
import com.google.firebase.firestore.DocumentSnapshot

class StudentAdapter(
    private var students: List<DocumentSnapshot>,
    private val onStudentClick: (DocumentSnapshot) -> Unit,
    private val onConnectClick: (DocumentSnapshot) -> Unit
) : RecyclerView.Adapter<StudentAdapter.StudentViewHolder>() {

    class StudentViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val profileImage: ImageView = itemView.findViewById(R.id.studentProfileImage)
        val name: TextView = itemView.findViewById(R.id.studentName)
        val university: TextView = itemView.findViewById(R.id.studentUniversity)
        val year: TextView = itemView.findViewById(R.id.studentYear)
        val skillsChipGroup: ChipGroup = itemView.findViewById(R.id.studentSkillsChipGroup)
        val projectTitle: TextView = itemView.findViewById(R.id.studentProjectTitle)
        val projectDescription: TextView = itemView.findViewById(R.id.studentProjectDescription)
        val connectButton: MaterialButton = itemView.findViewById(R.id.connectButton)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): StudentViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_student_card, parent, false)
        return StudentViewHolder(view)
    }

    override fun onBindViewHolder(holder: StudentViewHolder, position: Int) {
        val studentDoc = students[position]
        val studentData = studentDoc.data
        
        // Set basic info
        holder.name.text = studentData?.get("name") as? String ?: "Student Name"
        holder.university.text = studentData?.get("university") as? String ?: "University"
        holder.year.text = studentData?.get("year") as? String ?: "Student"
        
        // Load profile image (not available in current structure)
        holder.profileImage.setImageResource(R.drawable.ic_profile)
        
        // Set skills chips
        holder.skillsChipGroup.removeAllViews()
        val skillColors = listOf(
            R.color.chip_blue, R.color.chip_purple, R.color.chip_green,
            R.color.chip_orange, R.color.chip_pink, R.color.chip_teal
        )
        val skills = studentData?.get("skills") as? List<String> ?: emptyList()
        skills.take(3).forEachIndexed { index, skill ->
            val chip = Chip(holder.itemView.context)
            chip.text = skill
            chip.isCheckable = false
            chip.textSize = 12f
            chip.chipMinHeight = 24f
            chip.setChipBackgroundColorResource(skillColors[index % skillColors.size])
            chip.setTextColor(holder.itemView.context.getColor(R.color.dark_blue))
            chip.chipCornerRadius = 12f
            chip.chipStrokeWidth = 0f
            holder.skillsChipGroup.addView(chip)
        }
        
        // Set project info from embedded project data
        val projectData = studentData?.get("project") as? Map<String, Any>
        if (projectData != null) {
            holder.projectTitle.text = projectData["title"] as? String ?: "Project"
            holder.projectDescription.text = projectData["description"] as? String ?: "Project Description"
        } else {
            holder.projectTitle.text = "No Project"
            holder.projectDescription.text = "Student hasn't added a project yet"
        }
        
        // Set click listener
        holder.itemView.setOnClickListener {
            onStudentClick(studentDoc)
        }
        
        // Set connect button click listener
        holder.connectButton.setOnClickListener {
            onConnectClick(studentDoc)
        }
    }

    override fun getItemCount(): Int = students.size

    fun updateData(newStudents: List<DocumentSnapshot>) {
        students = newStudents
        notifyDataSetChanged()
    }
} 