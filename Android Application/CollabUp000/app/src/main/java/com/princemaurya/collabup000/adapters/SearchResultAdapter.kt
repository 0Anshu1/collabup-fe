package com.princemaurya.collabup000.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.chip.Chip
import com.princemaurya.collabup000.R
import com.princemaurya.collabup000.models.SearchResult

class SearchResultAdapter(
    private var results: List<SearchResult>,
    private val onResultClick: (SearchResult) -> Unit
) : RecyclerView.Adapter<SearchResultAdapter.SearchResultViewHolder>() {

    class SearchResultViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val title: TextView = itemView.findViewById(R.id.search_result_title)
        val description: TextView = itemView.findViewById(R.id.search_result_description)
        val type: TextView = itemView.findViewById(R.id.search_result_type)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): SearchResultViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_search_result, parent, false)
        return SearchResultViewHolder(view)
    }

    override fun onBindViewHolder(holder: SearchResultViewHolder, position: Int) {
        val result = results[position]
        
        // Set basic info
        holder.title.text = result.title
        holder.description.text = result.description
        holder.type.text = result.type
        
        // Set type-specific styling
        when (result.type) {
            "Project" -> {
                holder.type.setBackgroundResource(R.drawable.bg_project_card_gradient)
                holder.type.setTextColor(holder.itemView.context.getColor(R.color.white))
            }
            "Mentor" -> {
                holder.type.setBackgroundResource(R.drawable.bg_mentor_card_gradient)
                holder.type.setTextColor(holder.itemView.context.getColor(R.color.white))
            }
            "Student" -> {
                holder.type.setBackgroundResource(R.drawable.bg_student_card_gradient)
                holder.type.setTextColor(holder.itemView.context.getColor(R.color.white))
            }
            "Faculty" -> {
                holder.type.setBackgroundResource(R.drawable.bg_research_card)
                holder.type.setTextColor(holder.itemView.context.getColor(R.color.white))
            }
            "Startup" -> {
                holder.type.setBackgroundResource(R.drawable.bg_startup_card)
                holder.type.setTextColor(holder.itemView.context.getColor(R.color.white))
            }
            "Hackathon" -> {
                holder.type.setBackgroundResource(R.drawable.bg_hackathon_count)
                holder.type.setTextColor(holder.itemView.context.getColor(R.color.white))
            }
        }
        
        // Set click listener
        holder.itemView.setOnClickListener {
            onResultClick(result)
        }
    }

    override fun getItemCount(): Int = results.size

    fun updateData(newResults: List<SearchResult>) {
        results = newResults
        notifyDataSetChanged()
    }
} 