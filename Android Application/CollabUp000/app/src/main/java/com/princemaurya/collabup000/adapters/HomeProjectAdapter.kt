package com.princemaurya.collabup000.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.chip.Chip
import com.google.android.material.chip.ChipGroup
import com.princemaurya.collabup000.R
import com.google.firebase.firestore.DocumentSnapshot

class HomeProjectAdapter(
    private var projects: List<DocumentSnapshot>,
    private val onProjectClick: (DocumentSnapshot) -> Unit
) : RecyclerView.Adapter<HomeProjectAdapter.HomeProjectViewHolder>() {

    class HomeProjectViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val title: TextView = itemView.findViewById(R.id.home_project_title)
        val description: TextView = itemView.findViewById(R.id.home_project_description)
        val domainsChipGroup: ChipGroup = itemView.findViewById(R.id.homeProjectDomainsChipGroup)
        val skillsChipGroup: ChipGroup = itemView.findViewById(R.id.homeProjectSkillsChipGroup)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): HomeProjectViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_home_project_card, parent, false)
        return HomeProjectViewHolder(view)
    }

    override fun onBindViewHolder(holder: HomeProjectViewHolder, position: Int) {
        val projectDoc = projects[position]
        val projectData = projectDoc.data
        
        // Set basic info
        holder.title.text = projectData?.get("title") as? String ?: "Project Title"
        holder.description.text = projectData?.get("description") as? String ?: "Project Description"
        
        // Set domain chip (single domain in new structure)
        holder.domainsChipGroup.removeAllViews()
        val domain = projectData?.get("domain") as? String
        if (!domain.isNullOrEmpty()) {
            val chip = Chip(holder.itemView.context)
            chip.text = domain
            chip.isCheckable = false
            chip.textSize = 12f
            chip.chipMinHeight = 24f
            chip.setChipBackgroundColorResource(R.color.chip_indigo)
            chip.setTextColor(holder.itemView.context.getColor(R.color.dark_blue))
            chip.chipCornerRadius = 12f
            chip.chipStrokeWidth = 0f
            holder.domainsChipGroup.addView(chip)
        }
        
        // Set technologies chips (technologies instead of skills in new structure)
        holder.skillsChipGroup.removeAllViews()
        val skillColors = listOf(
            R.color.chip_blue, R.color.chip_purple, R.color.chip_green,
            R.color.chip_orange, R.color.chip_pink, R.color.chip_teal
        )
        val technologies = projectData?.get("technologies") as? List<String> ?: emptyList()
        technologies.take(2).forEachIndexed { index, technology ->
            val chip = Chip(holder.itemView.context)
            chip.text = technology
            chip.isCheckable = false
            chip.textSize = 12f
            chip.chipMinHeight = 24f
            chip.setChipBackgroundColorResource(skillColors[index % skillColors.size])
            chip.setTextColor(holder.itemView.context.getColor(R.color.dark_blue))
            chip.chipCornerRadius = 12f
            chip.chipStrokeWidth = 0f
            holder.skillsChipGroup.addView(chip)
        }
        
        // Set click listener
        holder.itemView.setOnClickListener {
            onProjectClick(projectDoc)
        }
    }

    override fun getItemCount(): Int = projects.size

    fun updateData(newProjects: List<DocumentSnapshot>) {
        projects = newProjects
        notifyDataSetChanged()
    }
} 