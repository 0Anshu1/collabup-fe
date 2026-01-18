package com.princemaurya.collabup000

import android.content.Context
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.firebase.auth.FirebaseAuth
import com.princemaurya.collabup000.services.RecommendationService
import kotlinx.coroutines.*

class RecommendationWidget(
    private val context: Context,
    private val container: ViewGroup,
    private val title: String = "Recommended for You"
) {
    
    private val recommendationService = RecommendationService()
    private val auth = FirebaseAuth.getInstance()
    private var recommendationJob: Job? = null
    
    private lateinit var titleView: TextView
    private lateinit var recyclerView: RecyclerView
    private lateinit var loadingView: TextView
    private lateinit var errorView: TextView
    
    private val recommendations = mutableListOf<Any>()
    private lateinit var adapter: RecommendationAdapter
    
    init {
        setupViews()
    }
    
    private fun setupViews() {
        val inflater = LayoutInflater.from(context)
        val view = inflater.inflate(R.layout.recommendation_widget, container, false)
        
        titleView = view.findViewById(R.id.recommendation_title)
        recyclerView = view.findViewById(R.id.recommendation_recycler)
        loadingView = view.findViewById(R.id.recommendation_loading)
        errorView = view.findViewById(R.id.recommendation_error)
        
        titleView.text = title
        
        // Setup RecyclerView
        recyclerView.layoutManager = LinearLayoutManager(context, LinearLayoutManager.HORIZONTAL, false)
        adapter = RecommendationAdapter(recommendations) { item ->
            handleRecommendationClick(item)
        }
        recyclerView.adapter = adapter
        
        container.addView(view)
    }
    
    fun loadRecommendations(query: String? = null) {
        recommendationJob?.cancel()
        
        val currentUser = auth.currentUser
        if (currentUser == null) {
            showError("Please log in to see recommendations")
            return
        }
        
        // Show loading
        showLoading()
        
        recommendationJob = CoroutineScope(Dispatchers.Main).launch {
            try {
                val searchQuery = query ?: generateUserQuery(currentUser.uid)
                val recommendations = withContext(Dispatchers.IO) {
                    recommendationService.getRecommendations(searchQuery, 5)
                }
                
                // Convert to displayable items
                val items = mutableListOf<Any>()
                
                recommendations.studentProjects.take(2).forEach { doc ->
                    items.add(RecommendationItem(
                        id = doc.id,
                        title = doc.data?.get("title") as? String ?: "Project",
                        subtitle = doc.data?.get("domain") as? String ?: "",
                        type = "Project",
                        data = doc
                    ))
                }
                
                recommendations.mentorProfiles.take(2).forEach { doc ->
                    items.add(RecommendationItem(
                        id = doc.id,
                        title = doc.data?.get("name") as? String ?: "Mentor",
                        subtitle = doc.data?.get("currentCompany") as? String ?: "",
                        type = "Mentor",
                        data = doc
                    ))
                }
                
                recommendations.startupProjects.take(1).forEach { doc ->
                    items.add(RecommendationItem(
                        id = doc.id,
                        title = doc.data?.get("title") as? String ?: "Startup",
                        subtitle = doc.data?.get("domain") as? String ?: "",
                        type = "Startup",
                        data = doc
                    ))
                }
                
                showRecommendations(items)
                
            } catch (e: Exception) {
                showError("Failed to load recommendations: ${e.message}")
            }
        }
    }
    
    private suspend fun generateUserQuery(userId: String): String {
        // This could be enhanced to analyze user's profile, skills, interests, etc.
        // For now, return a general query
        return "technology programming development"
    }
    
    private fun showLoading() {
        loadingView.visibility = View.VISIBLE
        recyclerView.visibility = View.GONE
        errorView.visibility = View.GONE
    }
    
    private fun showRecommendations(items: List<Any>) {
        recommendations.clear()
        recommendations.addAll(items)
        adapter.notifyDataSetChanged()
        
        loadingView.visibility = View.GONE
        recyclerView.visibility = View.VISIBLE
        errorView.visibility = View.GONE
    }
    
    private fun showError(message: String) {
        errorView.text = message
        errorView.visibility = View.VISIBLE
        loadingView.visibility = View.GONE
        recyclerView.visibility = View.GONE
    }
    
    private fun handleRecommendationClick(item: Any) {
        when (item) {
            is RecommendationItem -> {
                when (item.type) {
                    "Project" -> {
                        // Navigate to project detail
                        val intent = android.content.Intent(context, ProjectDetailActivity::class.java)
                        intent.putExtra("project_id", item.id)
                        context.startActivity(intent)
                    }
                    "Mentor" -> {
                        // Navigate to mentor detail
                        android.widget.Toast.makeText(context, "Mentor detail coming soon", android.widget.Toast.LENGTH_SHORT).show()
                    }
                    "Startup" -> {
                        // Navigate to startup detail
                        android.widget.Toast.makeText(context, "Startup detail coming soon", android.widget.Toast.LENGTH_SHORT).show()
                    }
                }
            }
        }
    }
    
    fun destroy() {
        recommendationJob?.cancel()
    }
    
    data class RecommendationItem(
        val id: String,
        val title: String,
        val subtitle: String,
        val type: String,
        val data: Any
    )
    
    private class RecommendationAdapter(
        private val items: List<Any>,
        private val onItemClick: (Any) -> Unit
    ) : RecyclerView.Adapter<RecommendationAdapter.ViewHolder>() {
        
        class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
            val title: TextView = view.findViewById(R.id.item_title)
            val subtitle: TextView = view.findViewById(R.id.item_subtitle)
            val type: TextView = view.findViewById(R.id.item_type)
        }
        
        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.item_recommendation, parent, false)
            return ViewHolder(view)
        }
        
        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            val item = items[position] as? RecommendationItem ?: return
            
            holder.title.text = item.title
            holder.subtitle.text = item.subtitle
            holder.type.text = item.type
            
            holder.itemView.setOnClickListener {
                onItemClick(item)
            }
        }
        
        override fun getItemCount() = items.size
    }
} 