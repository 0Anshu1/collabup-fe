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

class MentorAdapter(
    private var mentors: List<DocumentSnapshot>,
    private val onMentorClick: (DocumentSnapshot) -> Unit,
    private val onBookSessionClick: (DocumentSnapshot) -> Unit
) : RecyclerView.Adapter<MentorAdapter.MentorViewHolder>() {

    class MentorViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val profileImage: ImageView = itemView.findViewById(R.id.mentorProfileImage)
        val name: TextView = itemView.findViewById(R.id.mentorName)
        val company: TextView = itemView.findViewById(R.id.mentorCompany)
        val experience: TextView = itemView.findViewById(R.id.mentorExperience)
        val domainsChipGroup: ChipGroup = itemView.findViewById(R.id.mentorDomainsChipGroup)
        val bookSessionButton: MaterialButton = itemView.findViewById(R.id.bookSessionButton)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): MentorViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_mentor_card, parent, false)
        return MentorViewHolder(view)
    }

    override fun onBindViewHolder(holder: MentorViewHolder, position: Int) {
        val mentorDoc = mentors[position]
        val mentorData = mentorDoc.data
        
        // Set basic info
        holder.name.text = mentorData?.get("name") as? String ?: "Mentor Name"
        holder.company.text = mentorData?.get("company") as? String ?: "Company"
        holder.experience.text = mentorData?.get("experience") as? String ?: "Experience"
        
        // Load profile image (not available in current structure)
        holder.profileImage.setImageResource(R.drawable.ic_profile)
        
        // Set domains chips - try different field names
        holder.domainsChipGroup.removeAllViews()
        val domainColors = listOf(
            R.color.chip_indigo, R.color.chip_amber, R.color.chip_teal,
            R.color.chip_purple, R.color.chip_green, R.color.chip_orange
        )
        val domains = (mentorData?.get("domains") as? List<String> 
            ?: mentorData?.get("expertise") as? List<String> 
            ?: mentorData?.get("researchAreas") as? List<String> 
            ?: emptyList())
        domains.take(4).forEachIndexed { index, domain ->
            val chip = Chip(holder.itemView.context)
            chip.text = domain
            chip.isCheckable = false
            chip.textSize = 12f
            chip.chipMinHeight = 24f
            chip.setChipBackgroundColorResource(domainColors[index % domainColors.size])
            chip.setTextColor(holder.itemView.context.getColor(R.color.dark_blue))
            chip.chipCornerRadius = 12f
            chip.chipStrokeWidth = 0f
            holder.domainsChipGroup.addView(chip)
        }
        
        // Set click listener
        holder.itemView.setOnClickListener {
            onMentorClick(mentorDoc)
        }
        
        // Set book session button click listener
        holder.bookSessionButton.setOnClickListener {
            onBookSessionClick(mentorDoc)
        }
    }

    override fun getItemCount(): Int = mentors.size

    fun updateData(newMentors: List<DocumentSnapshot>) {
        mentors = newMentors
        notifyDataSetChanged()
    }
} 