package com.princemaurya.collabup000

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.viewpager2.widget.ViewPager2
import com.google.android.material.button.MaterialButton
import androidx.recyclerview.widget.RecyclerView
import androidx.recyclerview.widget.GridLayoutManager
import com.princemaurya.collabup000.adapters.HomeProjectAdapter
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.auth.FirebaseAuth
import android.widget.Toast
import java.util.Date
import android.widget.EditText
import android.text.Editable
import android.text.TextWatcher
import android.widget.LinearLayout
import android.widget.TextView
import com.princemaurya.collabup000.services.RecommendationService
import com.princemaurya.collabup000.models.SearchResult
import com.princemaurya.collabup000.adapters.SearchResultAdapter
import kotlinx.coroutines.*
import kotlinx.coroutines.tasks.await
import com.google.android.material.tabs.TabLayout
import com.google.android.material.tabs.TabLayoutMediator

class HomeFragment : Fragment() {
    
    private val projectsList = mutableListOf<com.google.firebase.firestore.DocumentSnapshot>()
    private lateinit var projectAdapter: HomeProjectAdapter
    private lateinit var searchResultsAdapter: SearchResultAdapter
    private lateinit var searchBar: EditText
    private lateinit var searchResultsSection: LinearLayout
    private lateinit var searchResultsRecycler: RecyclerView
    private lateinit var searchResultsTitle: TextView
    private lateinit var noSearchResults: TextView
    private val firestore = FirebaseFirestore.getInstance()
    private val auth = FirebaseAuth.getInstance()
    private val recommendationService = RecommendationService()
    private var searchJob: Job? = null
    private var autoScrollJob: Job? = null
    
    companion object {
        private const val ADD_PROJECT_REQUEST = 1001
    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_home, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Initialize search components
        searchBar = view.findViewById(R.id.search_bar)
        searchResultsSection = view.findViewById(R.id.search_results_section)
        searchResultsRecycler = view.findViewById(R.id.search_results_recycler)
        searchResultsTitle = view.findViewById(R.id.search_results_title)
        noSearchResults = view.findViewById(R.id.no_search_results)

        // Set up search results RecyclerView
        searchResultsRecycler.layoutManager = LinearLayoutManager(context)
        searchResultsAdapter = SearchResultAdapter(emptyList()) { result ->
            handleSearchResultClick(result)
        }
        searchResultsRecycler.adapter = searchResultsAdapter

        // Set up ViewPager2 for banner cards (one at a time)
        val updateCards = listOf(
            UpdateCard(
                title = "🚀 National Hackathon 2024",
                description = "Showcase your skills and win exciting prizes up to $10,000! Limited spots available.",
                imageRes = R.drawable.ic_community
            ),
            UpdateCard(
                title = "💼 TechCorp Internship",
                description = "Paid internship opportunity at leading tech company. Open to all branches!",
                imageRes = R.drawable.ic_opportunities
            ),
            UpdateCard(
                title = "🔬 AI Research Project",
                description = "Collaborate with Prof. Sharma on cutting-edge AI research. Limited seats!",
                imageRes = R.drawable.ic_mentors
            ),
            UpdateCard(
                title = "💡 CollabUp Startup Team",
                description = "Join our startup team and build the next big thing! Equity + salary.",
                imageRes = R.drawable.ic_projects
            )
        )
        
        // Set up ViewPager2 for banner cards
        val viewPager = view.findViewById<ViewPager2>(R.id.updates_viewpager)
        val bannerAdapter = BannerCardAdapter(updateCards)
        viewPager.adapter = bannerAdapter
        
        // Set up page indicator
        val tabLayout = view.findViewById<TabLayout>(R.id.page_indicator)
        TabLayoutMediator(tabLayout, viewPager) { _, _ ->
            // This lambda is called for each tab, but we don't need to do anything
            // The tab background is handled by the tab_selector drawable
        }.attach()
        
        // Optional: Auto-scroll the banner cards
        startAutoScroll(viewPager, updateCards.size)

        // Set up RecyclerView for projects
        val recyclerView = view.findViewById<RecyclerView>(R.id.projects_recycler)
        recyclerView.layoutManager = GridLayoutManager(context, 2)
        projectAdapter = HomeProjectAdapter(projectsList) { projectDoc ->
            val intent = Intent(requireContext(), ProjectDetailActivity::class.java)
            intent.putExtra("project_id", projectDoc.id)
            startActivity(intent)
        }
        recyclerView.adapter = projectAdapter

        // Add Project button
        val addProjectBtn = view.findViewById<MaterialButton>(R.id.btn_add_project)
        
        // Check if user is logged in
        val currentUser = auth.currentUser
        if (currentUser == null) {
            addProjectBtn.text = "Login to Add Project"
            addProjectBtn.setOnClickListener {
                val intent = Intent(requireContext(), LoginActivity::class.java)
                startActivity(intent)
            }
        } else {
            addProjectBtn.text = "Add Project"
            addProjectBtn.setOnClickListener {
                val intent = Intent(requireContext(), AddProjectActivity::class.java)
                startActivityForResult(intent, ADD_PROJECT_REQUEST)
            }
        }

        // Search filter for projects with intelligent search
        searchBar.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) {
                val query = s.toString()
                // Cancel previous search job
                searchJob?.cancel()
                // Start new search with delay
                searchJob = CoroutineScope(Dispatchers.Main).launch {
                    delay(500) // 500ms delay for debouncing
                    performIntelligentProjectSearch(query)
                }
            }
        })

        // Load projects from Firestore
        loadProjectsFromFirestore()
    }

    private fun loadProjectsFromFirestore() {
        val currentUser = auth.currentUser
        
        if (currentUser == null) {
            // If user is not logged in, show empty state
            projectsList.clear()
            projectAdapter.updateData(projectsList)
            Toast.makeText(context, "Please log in to view your projects", Toast.LENGTH_SHORT).show()
            return
        }

        // Load only the user's own projects for the main grid
        firestore.collection("projects")
            .whereEqualTo("creatorId", currentUser.uid)
            .get()
            .addOnSuccessListener { documents ->
                projectsList.clear()
                projectsList.addAll(documents.documents)
                
                // Sort by createdAt in memory (newest first)
                projectsList.sortByDescending { doc ->
                    val createdAt = doc.data?.get("createdAt") as? Date
                    createdAt ?: Date(0)
                }
                
                projectAdapter.updateData(projectsList)
                
                if (projectsList.isEmpty()) {
                    Toast.makeText(context, "You haven't created any projects yet. Add your first project!", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(context, "Loaded ${projectsList.size} of your projects", Toast.LENGTH_SHORT).show()
                }
            }
            .addOnFailureListener { exception ->
                Toast.makeText(context, "Failed to load your projects: ${exception.message}", Toast.LENGTH_SHORT).show()
                // Show specific error message for permissions
                if (exception.message?.contains("PERMISSION_DENIED") == true) {
                    Toast.makeText(context, "Firestore permissions not configured. Please check your Firebase console.", Toast.LENGTH_LONG).show()
                }
            }
    }

    private suspend fun performIntelligentProjectSearch(query: String) {
        if (query.length < 2) {
            // Hide search results and show main content
            searchResultsSection.visibility = View.GONE
            return
        }

        try {
            // Show search results section
            searchResultsSection.visibility = View.VISIBLE
            searchResultsTitle.text = "All projects matching '$query'"

            // Get intelligent recommendations for projects only
            val recommendations = withContext(Dispatchers.IO) {
                recommendationService.getRecommendations(query, 10)
            }

            // Convert recommendations to search results - PROJECTS ONLY
            val searchResults = mutableListOf<SearchResult>()
            
            // Add student projects
            recommendations.studentProjects.forEach { doc ->
                val data = doc.data
                if (data != null) {
                    searchResults.add(SearchResult(
                        id = doc.id,
                        title = data["title"] as? String ?: "Project",
                        description = data["description"] as? String ?: "",
                        type = "Project",
                        data = doc
                    ))
                }
            }
            
            // Add startup projects
            recommendations.startupProjects.forEach { doc ->
                val data = doc.data
                if (data != null) {
                    searchResults.add(SearchResult(
                        id = doc.id,
                        title = data["title"] as? String ?: "Project",
                        description = data["description"] as? String ?: "",
                        type = "Project",
                        data = doc
                    ))
                }
            }

            // Also add traditional project search results from all projects
            val traditionalResults = performTraditionalProjectSearch(query)
            traditionalResults.forEach { projectDoc ->
                val data = projectDoc.data
                if (data != null) {
                    searchResults.add(SearchResult(
                        id = projectDoc.id,
                        title = data["title"] as? String ?: "Project",
                        description = data["description"] as? String ?: "",
                        type = "Project",
                        data = projectDoc
                    ))
                }
            }

            // Remove duplicates based on ID
            val uniqueResults = searchResults.distinctBy { it.id }

            // Update search results
            if (uniqueResults.isNotEmpty()) {
                searchResultsAdapter.updateData(uniqueResults)
                noSearchResults.visibility = View.GONE
            } else {
                noSearchResults.visibility = View.VISIBLE
            }

        } catch (e: Exception) {
            // Fallback to traditional search
            val traditionalResults = performTraditionalProjectSearch(query)
            val searchResults = traditionalResults.map { projectDoc ->
                val data = projectDoc.data
                SearchResult(
                    id = projectDoc.id,
                    title = data?.get("title") as? String ?: "Project",
                    description = data?.get("description") as? String ?: "",
                    type = "Project",
                    data = projectDoc
                )
            }
            
            if (searchResults.isNotEmpty()) {
                searchResultsAdapter.updateData(searchResults)
                noSearchResults.visibility = View.GONE
            } else {
                noSearchResults.visibility = View.VISIBLE
            }
        }
    }

    private suspend fun performTraditionalProjectSearch(query: String): List<com.google.firebase.firestore.DocumentSnapshot> {
        if (query.isEmpty()) {
            return emptyList()
        }
        
        val lowercaseQuery = query.lowercase()
        
        // First, search through the loaded projects list
        val localResults = projectsList.filter { projectDoc ->
            val projectData = projectDoc.data
            val title = projectData?.get("title") as? String ?: ""
            val description = projectData?.get("description") as? String ?: ""
            val domain = projectData?.get("domain") as? String ?: ""
            val technologies = projectData?.get("technologies") as? List<String> ?: emptyList()
            
            title.lowercase().contains(lowercaseQuery) ||
            description.lowercase().contains(lowercaseQuery) ||
            domain.lowercase().contains(lowercaseQuery) ||
            technologies.any { it.lowercase().contains(lowercaseQuery) }
        }
        
        // Also search directly from Firestore for more comprehensive results
        return try {
            val firestoreResults = withContext(Dispatchers.IO) {
                firestore.collection("projects")
                    .get()
                    .await()
                    .documents
                    .filter { projectDoc ->
                        val projectData = projectDoc.data
                        val title = projectData?.get("title") as? String ?: ""
                        val description = projectData?.get("description") as? String ?: ""
                        val domain = projectData?.get("domain") as? String ?: ""
                        val technologies = projectData?.get("technologies") as? List<String> ?: emptyList()
                        
                        title.lowercase().contains(lowercaseQuery) ||
                        description.lowercase().contains(lowercaseQuery) ||
                        domain.lowercase().contains(lowercaseQuery) ||
                        technologies.any { it.lowercase().contains(lowercaseQuery) }
                    }
            }
            
            // Combine and remove duplicates
            val allResults = (localResults + firestoreResults).distinctBy { it.id }
            allResults
        } catch (e: Exception) {
            // Fallback to local results only
            localResults
        }
    }

    private fun handleSearchResultClick(result: SearchResult) {
        when (result.type) {
            "Project" -> {
                val intent = Intent(requireContext(), ProjectDetailActivity::class.java)
                intent.putExtra("project_id", result.id)
                startActivity(intent)
            }
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        
        if (requestCode == ADD_PROJECT_REQUEST && resultCode == Activity.RESULT_OK) {
            // Refresh the projects list
            loadProjectsFromFirestore()
        }
    }
    
    private fun startAutoScroll(viewPager: ViewPager2, itemCount: Int) {
        autoScrollJob?.cancel()
        autoScrollJob = CoroutineScope(Dispatchers.Main).launch {
            while (true) {
                delay(4000) // Auto-scroll every 4 seconds
                val currentItem = viewPager.currentItem
                val nextItem = (currentItem + 1) % itemCount
                viewPager.setCurrentItem(nextItem, true)
            }
        }
    }
    
    override fun onDestroyView() {
        super.onDestroyView()
        // Cancel auto-scroll job when fragment is destroyed
        autoScrollJob?.cancel()
        searchJob?.cancel()
    }
} 