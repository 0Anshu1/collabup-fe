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

class OpportunityAdapter(
    private var opportunities: List<DocumentSnapshot>,
    private val onOpportunityClick: (DocumentSnapshot) -> Unit
) : RecyclerView.Adapter<OpportunityAdapter.OpportunityViewHolder>() {

    class OpportunityViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val title: TextView = itemView.findViewById(R.id.opportunity_title)
        val description: TextView = itemView.findViewById(R.id.opportunity_description)
        val domainChipGroup: ChipGroup = itemView.findViewById(R.id.opportunity_domain_chip_group)
        val skillsChipGroup: ChipGroup = itemView.findViewById(R.id.opportunity_skills_chip_group)
        val type: TextView = itemView.findViewById(R.id.opportunity_type)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): OpportunityViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_opportunity_card, parent, false)
        return OpportunityViewHolder(view)
    }

    override fun onBindViewHolder(holder: OpportunityViewHolder, position: Int) {
        val opportunityDoc = opportunities[position]
        val opportunityData = opportunityDoc.data
        
        // Set basic info
        holder.title.text = opportunityData?.get("title") as? String ?: "Opportunity Title"
        holder.description.text = opportunityData?.get("description") as? String ?: "Opportunity Description"
        
        // Set domain - for hackathons, show location or organizer instead
        val domain = opportunityData?.get("domain") as? String
        val location = opportunityData?.get("location") as? String
        val organizer = opportunityData?.get("organizer") as? String
        
        val displayDomain = when {
            !domain.isNullOrEmpty() -> domain
            !location.isNullOrEmpty() -> location
            !organizer.isNullOrEmpty() -> organizer
            else -> "Domain"
        }
        
        // Set domain chip
        holder.domainChipGroup.removeAllViews()
        setDomainChip(holder.domainChipGroup, displayDomain)
        
        // Set type and background based on opportunity type
        val type = opportunityData?.get("type") as? String ?: "Opportunity"
        holder.type.text = type
        when (type.lowercase()) {
            "startup" -> holder.type.setBackgroundResource(R.drawable.bg_startup_card)
            "research" -> holder.type.setBackgroundResource(R.drawable.bg_research_card)
            "hackathon" -> holder.type.setBackgroundResource(R.drawable.bg_hackathon_count)
            "internship" -> holder.type.setBackgroundResource(R.drawable.bg_internship_card)
            else -> holder.type.setBackgroundResource(R.drawable.bg_startup_card)
        }
        
        // Set skills/technologies chips
        val skills = opportunityData?.get("skills") as? List<String> ?: emptyList()
        val technologies = opportunityData?.get("technologies") as? List<String> ?: emptyList()
        val allSkills = if (skills.isNotEmpty()) skills else technologies
        setSkillsChips(holder.skillsChipGroup, allSkills)
        
        // Set click listener
        holder.itemView.setOnClickListener {
            onOpportunityClick(opportunityDoc)
        }
    }

    private fun setSkillsChips(chipGroup: ChipGroup, skills: List<String>) {
        chipGroup.removeAllViews()
        val skillColors = listOf(
            R.color.chip_blue, R.color.chip_purple, R.color.chip_green,
            R.color.chip_orange, R.color.chip_pink, R.color.chip_teal
        )
        skills.take(3).forEachIndexed { index, skill ->
            val chip = Chip(chipGroup.context)
            chip.text = skill
            chip.isCheckable = false
            chip.textSize = 12f
            chip.chipMinHeight = 24f
            chip.setChipBackgroundColorResource(skillColors[index % skillColors.size])
            chip.setTextColor(chipGroup.context.getColor(R.color.dark_blue))
            chip.chipCornerRadius = 12f
            chip.chipStrokeWidth = 0f
            chipGroup.addView(chip)
        }
    }

    private fun setDomainChip(chipGroup: ChipGroup, domain: String) {
        chipGroup.removeAllViews()
        val domainChip = Chip(chipGroup.context)
        domainChip.text = domain
        domainChip.isCheckable = false
        domainChip.textSize = 12f
        domainChip.chipMinHeight = 24f
        domainChip.setChipBackgroundColorResource(R.color.chip_indigo)
        domainChip.setTextColor(chipGroup.context.getColor(R.color.dark_blue))
        domainChip.chipCornerRadius = 12f
        domainChip.chipStrokeWidth = 0f
        chipGroup.addView(domainChip)
    }

    override fun getItemCount(): Int = opportunities.size

    fun updateData(newOpportunities: List<DocumentSnapshot>) {
        opportunities = newOpportunities
        notifyDataSetChanged()
    }
} 