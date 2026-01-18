package com.princemaurya.collabup000

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import android.widget.EditText
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import androidx.viewpager2.widget.ViewPager2
import android.text.Editable
import android.text.TextWatcher
import com.princemaurya.collabup000.adapters.OpportunityAdapter
import com.princemaurya.collabup000.adapters.ProjectAdapter
import com.princemaurya.collabup000.services.RecommendationService
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.auth.FirebaseAuth
import android.widget.Toast
import kotlinx.coroutines.*
import java.util.*
import android.widget.LinearLayout
import android.widget.TextView
import com.princemaurya.collabup000.models.SearchResult
import com.princemaurya.collabup000.adapters.SearchResultAdapter
import com.princemaurya.collabup000.BannerCardAdapter
import com.google.android.material.tabs.TabLayout
import com.google.android.material.tabs.TabLayoutMediator

class OpportunitiesFragment : Fragment() {
    private lateinit var searchBar: EditText
    private lateinit var featuredOpportunitiesViewPager: ViewPager2
    private lateinit var projectsRecycler: RecyclerView
    private lateinit var hackathonsRecycler: RecyclerView
    private lateinit var searchResultsSection: LinearLayout
    private lateinit var searchResultsRecycler: RecyclerView
    private lateinit var searchResultsTitle: TextView
    private lateinit var noSearchResults: TextView
    private lateinit var moreProjectsBtn: TextView
    private lateinit var moreHackathonsBtn: TextView

    private lateinit var featuredOpportunitiesAdapter: BannerCardAdapter
    private lateinit var projectsAdapter: ProjectAdapter
    private lateinit var hackathonsAdapter: OpportunityAdapter
    private lateinit var searchResultsAdapter: SearchResultAdapter

    private val firestore = FirebaseFirestore.getInstance()
    private val auth = FirebaseAuth.getInstance()
    private val recommendationService = RecommendationService()
    
    // Data lists
    private val allOpportunities = mutableListOf<com.google.firebase.firestore.DocumentSnapshot>()
    private val allProjects = mutableListOf<com.google.firebase.firestore.DocumentSnapshot>()
    private val allHackathons = mutableListOf<com.google.firebase.firestore.DocumentSnapshot>()
    private val filteredOpportunities = mutableListOf<com.google.firebase.firestore.DocumentSnapshot>()
    private val filteredProjects = mutableListOf<com.google.firebase.firestore.DocumentSnapshot>()
    private val filteredHackathons = mutableListOf<com.google.firebase.firestore.DocumentSnapshot>()
    private var searchJob: Job? = null

    private val featuredOpportunities = listOf(
        UpdateCard("AI Innovation Challenge", "Build the next big AI solution", R.drawable.ic_opportunities),
        UpdateCard("Startup Incubator Program", "Launch your startup idea", R.drawable.ic_projects),
        UpdateCard("Research Fellowship", "Join cutting-edge research", R.drawable.ic_mentors)
    )

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_opportunities, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        // Initialize views
        searchBar = view.findViewById(R.id.search_bar)
        featuredOpportunitiesViewPager = view.findViewById(R.id.featured_opportunities_viewpager)
        projectsRecycler = view.findViewById(R.id.projects_recycler)
        hackathonsRecycler = view.findViewById(R.id.hackathons_recycler)
        searchResultsSection = view.findViewById(R.id.search_results_section)
        searchResultsRecycler = view.findViewById(R.id.search_results_recycler)
        searchResultsTitle = view.findViewById(R.id.search_results_title)
        noSearchResults = view.findViewById(R.id.no_search_results)
        moreProjectsBtn = view.findViewById(R.id.more_projects_btn)
        moreHackathonsBtn = view.findViewById(R.id.more_hackathons_btn)

        // Setup banner carousel
        setupBannerCarousel()

        // Setup adapters
        projectsAdapter = ProjectAdapter(emptyList()) { projectDoc ->
            // Handle project click
            val intent = Intent(requireContext(), ProjectDetailActivity::class.java)
            intent.putExtra("project_id", projectDoc.id)
            startActivity(intent)
        }
        hackathonsAdapter = OpportunityAdapter(emptyList()) { hackathonDoc ->
            // Handle hackathon click
            val title = hackathonDoc.data?.get("title") as? String ?: "Hackathon"
            Toast.makeText(context, "Opening $title details", Toast.LENGTH_SHORT).show()
        }
        featuredOpportunitiesAdapter = BannerCardAdapter(featuredOpportunities)
        searchResultsAdapter = SearchResultAdapter(emptyList()) { result ->
            handleSearchResultClick(result)
        }

        // Setup RecyclerViews
        projectsRecycler.layoutManager = LinearLayoutManager(context, LinearLayoutManager.HORIZONTAL, false)
        hackathonsRecycler.layoutManager = LinearLayoutManager(context, LinearLayoutManager.HORIZONTAL, false)
        searchResultsRecycler.layoutManager = LinearLayoutManager(context, LinearLayoutManager.VERTICAL, false)

        projectsRecycler.adapter = projectsAdapter
        hackathonsRecycler.adapter = hackathonsAdapter
        searchResultsRecycler.adapter = searchResultsAdapter

        // Setup search functionality
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
                    performIntelligentOpportunitySearch(query)
                }
            }
        })

        // Set up "More" button click handlers
        moreProjectsBtn.setOnClickListener {
            val intent = Intent(requireContext(), AllProjectsActivity::class.java)
            startActivity(intent)
        }

        moreHackathonsBtn.setOnClickListener {
            val intent = Intent(requireContext(), AllHackathonsActivity::class.java)
            startActivity(intent)
        }

        // Load data from Firestore
        loadDataFromFirestore()
    }

    private fun setupBannerCarousel() {
        // Set up ViewPager2 for featured opportunities carousel
        val featuredOpportunitiesAdapter = BannerCardAdapter(featuredOpportunities)
        featuredOpportunitiesViewPager.adapter = featuredOpportunitiesAdapter
        
        // Set up page indicator for featured opportunities
        val featuredOpportunitiesPageIndicator = view?.findViewById<TabLayout>(R.id.featured_opportunities_page_indicator)
        if (featuredOpportunitiesViewPager != null && featuredOpportunitiesPageIndicator != null) {
            TabLayoutMediator(featuredOpportunitiesPageIndicator, featuredOpportunitiesViewPager) { _, _ ->
                // This lambda is called for each tab, but we don't need to do anything
            }.attach()
        }
    }

    private fun loadDataFromFirestore() {
        // Test query to check if hackathons collection exists
        firestore.collection("hackathons")
            .limit(1)
            .get()
            .addOnSuccessListener { documents ->
                android.util.Log.d("OpportunitiesFragment", "Hackathons collection test: Found ${documents.size()} documents")
                if (documents.isEmpty) {
                    android.util.Log.d("OpportunitiesFragment", "Hackathons collection is empty")
                } else {
                    android.util.Log.d("OpportunitiesFragment", "First hackathon document: ${documents.documents.first().data}")
                }
            }
            .addOnFailureListener { exception ->
                android.util.Log.e("OpportunitiesFragment", "Hackathons collection test failed", exception)
            }

        // Load opportunities (for search functionality)
        firestore.collection("opportunities")
            .get()
            .addOnSuccessListener { documents ->
                allOpportunities.clear()
                allOpportunities.addAll(documents.documents)
                filteredOpportunities.clear()
                filteredOpportunities.addAll(allOpportunities)
                
                if (allOpportunities.isEmpty()) {
                    Toast.makeText(context, "No opportunities found yet.", Toast.LENGTH_SHORT).show()
                }
            }
            .addOnFailureListener { exception ->
                Toast.makeText(context, "Failed to load opportunities: ${exception.message}", Toast.LENGTH_SHORT).show()
                if (exception.message?.contains("PERMISSION_DENIED") == true) {
                    Toast.makeText(context, "Firestore permissions not configured. Please check your Firebase console.", Toast.LENGTH_LONG).show()
                }
            }

        // Load projects
        firestore.collection("projects")
            .orderBy("createdAt", com.google.firebase.firestore.Query.Direction.DESCENDING)
            .limit(10)
            .get()
            .addOnSuccessListener { documents ->
                allProjects.clear()
                allProjects.addAll(documents.documents)
                filteredProjects.clear()
                filteredProjects.addAll(allProjects)
                
                // Limit to 4 cards for display
                val limitedProjects = filteredProjects.take(4)
                projectsAdapter.updateData(limitedProjects)
                
                if (allProjects.isEmpty()) {
                    Toast.makeText(context, "No projects found yet.", Toast.LENGTH_SHORT).show()
                }
            }
            .addOnFailureListener { exception ->
                Toast.makeText(context, "Failed to load projects: ${exception.message}", Toast.LENGTH_SHORT).show()
                if (exception.message?.contains("PERMISSION_DENIED") == true) {
                    Toast.makeText(context, "Firestore permissions not configured. Please check your Firebase console.", Toast.LENGTH_LONG).show()
                }
            }

        // Load hackathons
        firestore.collection("hackathons")
            .get()
            .addOnSuccessListener { documents ->
                allHackathons.clear()
                allHackathons.addAll(documents.documents)
                filteredHackathons.clear()
                filteredHackathons.addAll(allHackathons)
                
                // Limit to 4 cards for display
                val limitedHackathons = filteredHackathons.take(4)
                hackathonsAdapter.updateData(limitedHackathons)
                
                if (allHackathons.isEmpty()) {
                    Toast.makeText(context, "No hackathons found yet.", Toast.LENGTH_SHORT).show()
                }
            }
            .addOnFailureListener { exception ->
                Toast.makeText(context, "Failed to load hackathons: ${exception.message}", Toast.LENGTH_SHORT).show()
                if (exception.message?.contains("PERMISSION_DENIED") == true) {
                    Toast.makeText(context, "Firestore permissions not configured. Please check your Firebase console.", Toast.LENGTH_LONG).show()
                }
            }
    }

    private fun filterData(query: String) {
        if (query.isEmpty()) {
            // Show all data
            filteredOpportunities.clear()
            filteredOpportunities.addAll(allOpportunities)
            filteredProjects.clear()
            filteredProjects.addAll(allProjects)
            filteredHackathons.clear()
            filteredHackathons.addAll(allHackathons)
        } else {
            val lowercaseQuery = query.lowercase()
            
            // Filter opportunities
            filteredOpportunities.clear()
            filteredOpportunities.addAll(allOpportunities.filter { opportunityDoc ->
                val opportunityData = opportunityDoc.data
                val title = opportunityData?.get("title") as? String ?: ""
                val description = opportunityData?.get("description") as? String ?: ""
                val domain = opportunityData?.get("domain") as? String ?: ""
                val skills = opportunityData?.get("skills") as? List<String> ?: emptyList()
                
                title.lowercase().contains(lowercaseQuery) ||
                description.lowercase().contains(lowercaseQuery) ||
                domain.lowercase().contains(lowercaseQuery) ||
                skills.any { it.lowercase().contains(lowercaseQuery) }
            })
            
            // Filter projects
            filteredProjects.clear()
            filteredProjects.addAll(allProjects.filter { projectDoc ->
                val projectData = projectDoc.data
                val title = projectData?.get("title") as? String ?: ""
                val description = projectData?.get("description") as? String ?: ""
                val domain = projectData?.get("domain") as? String ?: ""
                val technologies = projectData?.get("technologies") as? List<String> ?: emptyList()
                
                title.lowercase().contains(lowercaseQuery) ||
                description.lowercase().contains(lowercaseQuery) ||
                domain.lowercase().contains(lowercaseQuery) ||
                technologies.any { it.lowercase().contains(lowercaseQuery) }
            })
            
            // Filter hackathons
            filteredHackathons.clear()
            filteredHackathons.addAll(allHackathons.filter { hackathonDoc ->
                val hackathonData = hackathonDoc.data
                val title = hackathonData?.get("title") as? String ?: ""
                val description = hackathonData?.get("description") as? String ?: ""
                val technologies = hackathonData?.get("technologies") as? List<String> ?: emptyList()
                val organizer = hackathonData?.get("organizer") as? String ?: ""
                val location = hackathonData?.get("location") as? String ?: ""
                
                title.lowercase().contains(lowercaseQuery) ||
                description.lowercase().contains(lowercaseQuery) ||
                technologies.any { it.lowercase().contains(lowercaseQuery) } ||
                organizer.lowercase().contains(lowercaseQuery) ||
                location.lowercase().contains(lowercaseQuery)
            })
        }
        
        // Update adapters
        projectsAdapter.updateData(filteredProjects)
        hackathonsAdapter.updateData(filteredHackathons)
    }

    private suspend fun performIntelligentOpportunitySearch(query: String) {
        if (query.length < 2) {
            // Hide search results and show main content
            searchResultsSection.visibility = View.GONE
            return
        }

        try {
            // Show search results section
            searchResultsSection.visibility = View.VISIBLE
            searchResultsTitle.text = "Opportunities matching '$query'"

            // Get intelligent recommendations for opportunities only
            val recommendations = withContext(Dispatchers.IO) {
                recommendationService.getRecommendations(query, 10)
            }

            // Convert recommendations to search results - HACKATHONS AND PROJECTS ONLY
            val searchResults = mutableListOf<SearchResult>()
            
            // Add student projects (research projects)
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
            
            // Add startup projects (research projects)
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

            // Also add traditional opportunity search results (hackathons and projects)
            val traditionalResults = performTraditionalOpportunitySearch(query)
            traditionalResults.forEach { doc ->
                val data = doc.data
                if (data != null) {
                    val title = data["title"] as? String ?: data["name"] as? String ?: "Opportunity"
                    val description = data["description"] as? String ?: data["bio"] as? String ?: ""
                    val type = if (data.containsKey("organizer")) "Hackathon" else "Project"
                    
                    searchResults.add(SearchResult(
                        id = doc.id,
                        title = title,
                        description = description,
                        type = type,
                        data = doc
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
            val traditionalResults = performTraditionalOpportunitySearch(query)
            val searchResults = traditionalResults.map { doc ->
                val data = doc.data
                val title = data?.get("title") as? String ?: data?.get("name") as? String ?: "Opportunity"
                val description = data?.get("description") as? String ?: data?.get("bio") as? String ?: ""
                val type = if (data?.containsKey("organizer") == true) "Hackathon" else "Project"
                
                SearchResult(
                    id = doc.id,
                    title = title,
                    description = description,
                    type = type,
                    data = doc
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

    private fun performTraditionalOpportunitySearch(query: String): List<com.google.firebase.firestore.DocumentSnapshot> {
        val filtered = if (query.isEmpty()) {
            emptyList()
        } else {
            val lowercaseQuery = query.lowercase()
            val allOpportunities = allProjects + allHackathons
            
            allOpportunities.filter { doc ->
                val data = doc.data
                val title = data?.get("title") as? String ?: data?.get("name") as? String ?: ""
                val description = data?.get("description") as? String ?: data?.get("bio") as? String ?: ""
                val skills = data?.get("skills") as? List<String> ?: emptyList()
                val tags = data?.get("tags") as? List<String> ?: emptyList()
                val organizer = data?.get("organizer") as? String ?: ""
                
                title.lowercase().contains(lowercaseQuery) ||
                description.lowercase().contains(lowercaseQuery) ||
                skills.any { it.lowercase().contains(lowercaseQuery) } ||
                tags.any { it.lowercase().contains(lowercaseQuery) } ||
                organizer.lowercase().contains(lowercaseQuery)
            }
        }
        
        return filtered
    }

    private fun handleSearchResultClick(result: SearchResult) {
        when (result.type) {
            "Project" -> {
                val intent = Intent(requireContext(), ProjectDetailActivity::class.java)
                intent.putExtra("project_id", result.id)
                startActivity(intent)
            }
            "Hackathon" -> {
                Toast.makeText(context, "Hackathon detail view coming soon", Toast.LENGTH_SHORT).show()
            }
            "Startup" -> {
                Toast.makeText(context, "Startup detail view coming soon", Toast.LENGTH_SHORT).show()
            }
            "Mentor" -> {
                Toast.makeText(context, "Mentor detail view coming soon", Toast.LENGTH_SHORT).show()
            }
        }
    }
} 