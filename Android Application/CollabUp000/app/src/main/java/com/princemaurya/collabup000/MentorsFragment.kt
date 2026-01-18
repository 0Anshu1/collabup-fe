package com.princemaurya.collabup000

import android.app.DatePickerDialog
import android.app.TimePickerDialog
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
import com.princemaurya.collabup000.adapters.MentorAdapter
import com.princemaurya.collabup000.services.RecommendationService
import com.princemaurya.collabup000.models.Mentor
import android.widget.Toast
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.textfield.TextInputEditText
import com.bumptech.glide.Glide
import com.princemaurya.collabup000.services.EmailService
import java.text.SimpleDateFormat
import java.util.*
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.*
import android.widget.LinearLayout
import android.widget.TextView
import android.content.Intent
import com.princemaurya.collabup000.models.SearchResult
import com.princemaurya.collabup000.adapters.SearchResultAdapter
import com.princemaurya.collabup000.BannerCardAdapter
import com.google.android.material.tabs.TabLayout
import com.google.android.material.tabs.TabLayoutMediator

class MentorsFragment : Fragment() {
    private lateinit var achievementsViewPager: ViewPager2
    private lateinit var topMentorsRecycler: RecyclerView
    private lateinit var areaMentorsRecycler: RecyclerView
    private lateinit var searchBar: EditText
    private lateinit var searchResultsSection: LinearLayout
    private lateinit var searchResultsRecycler: RecyclerView
    private lateinit var searchResultsTitle: TextView
    private lateinit var noSearchResults: TextView
    private lateinit var moreMentorsBtn: TextView
    private lateinit var moreAreaExpertsBtn: TextView

    private lateinit var achievementsAdapter: BannerCardAdapter
    private lateinit var topMentorsAdapter: MentorAdapter
    private lateinit var areaMentorsAdapter: MentorAdapter
    private lateinit var searchResultsAdapter: SearchResultAdapter

    private val firestore = FirebaseFirestore.getInstance()
    private val auth = FirebaseAuth.getInstance()
    private val recommendationService = RecommendationService()
    
    private var allMentors = listOf<com.google.firebase.firestore.DocumentSnapshot>()
    private var filteredMentors = listOf<com.google.firebase.firestore.DocumentSnapshot>()
    private var searchJob: Job? = null

    private val achievements = listOf(
        UpdateCard("Published ML Book", "By Dr. Smith", R.drawable.ic_mentors),
        UpdateCard("Keynote at TechConf", "By Prof. Lee", R.drawable.ic_community),
        UpdateCard("Patent Granted", "By Dr. Brown", R.drawable.ic_projects)
    )

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_mentors, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        searchBar = view.findViewById(R.id.search_bar)
        achievementsViewPager = view.findViewById(R.id.achievements_viewpager)
        topMentorsRecycler = view.findViewById(R.id.top_mentors_recycler)
        areaMentorsRecycler = view.findViewById(R.id.area_experts_recycler)
        searchResultsSection = view.findViewById(R.id.search_results_section)
        searchResultsRecycler = view.findViewById(R.id.search_results_recycler)
        searchResultsTitle = view.findViewById(R.id.search_results_title)
        noSearchResults = view.findViewById(R.id.no_search_results)
        moreMentorsBtn = view.findViewById(R.id.more_mentors_btn)
        moreAreaExpertsBtn = view.findViewById(R.id.more_area_experts_btn)

        // Set up ViewPager2 for achievements carousel
        val achievementsAdapter = BannerCardAdapter(achievements)
        achievementsViewPager.adapter = achievementsAdapter
        
        // Set up page indicator for achievements
        val achievementsPageIndicator = view.findViewById<TabLayout>(R.id.achievements_page_indicator)
        TabLayoutMediator(achievementsPageIndicator, achievementsViewPager) { _, _ ->
            // This lambda is called for each tab, but we don't need to do anything
        }.attach()

        // Initialize adapters with empty lists
        topMentorsAdapter = MentorAdapter(
            emptyList(),
            onMentorClick = { mentorDoc ->
                // Handle mentor click - could open mentor profile
                val mentorName = mentorDoc.data?.get("name") as? String ?: "Mentor"
                Toast.makeText(context, "Opening $mentorName's profile", Toast.LENGTH_SHORT).show()
            },
            onBookSessionClick = { mentorDoc ->
                // Handle book session button click
                showBookSessionDialog(mentorDoc)
            }
        )
        topMentorsRecycler.layoutManager = LinearLayoutManager(context, LinearLayoutManager.HORIZONTAL, false)
        topMentorsRecycler.adapter = topMentorsAdapter

        areaMentorsAdapter = MentorAdapter(
            emptyList(),
            onMentorClick = { mentorDoc ->
                // Handle mentor click - could open mentor profile
                val mentorName = mentorDoc.data?.get("name") as? String ?: "Mentor"
                Toast.makeText(context, "Opening $mentorName's profile", Toast.LENGTH_SHORT).show()
            },
            onBookSessionClick = { mentorDoc ->
                // Handle book session button click
                showBookSessionDialog(mentorDoc)
            }
        )
        areaMentorsRecycler.layoutManager = LinearLayoutManager(context, LinearLayoutManager.HORIZONTAL, false)
        areaMentorsRecycler.adapter = areaMentorsAdapter

        // Set up search results RecyclerView
        searchResultsRecycler.layoutManager = LinearLayoutManager(context)
        searchResultsAdapter = SearchResultAdapter(emptyList()) { result ->
            handleSearchResultClick(result)
        }
        searchResultsRecycler.adapter = searchResultsAdapter

        // Set up "More" button click handlers
        moreMentorsBtn.setOnClickListener {
            val intent = Intent(requireContext(), AllMentorsActivity::class.java)
            startActivity(intent)
        }

        moreAreaExpertsBtn.setOnClickListener {
            val intent = Intent(requireContext(), AllMentorsActivity::class.java)
            intent.putExtra("filter_type", "area")
            startActivity(intent)
        }

        // Load mentors from Firestore
        loadMentorsFromFirestore()

        // Search filter for mentors with intelligent search
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
                    performIntelligentMentorSearch(query)
                }
            }
        })
    }

    private fun loadMentorsFromFirestore() {
        firestore.collection("mentors")
            .get()
            .addOnSuccessListener { documents ->
                allMentors = documents.documents
                filteredMentors = documents.documents
                
                // Update both top mentors and area mentors
                updateMentorLists()
                
                if (allMentors.isEmpty()) {
                    Toast.makeText(context, "No mentors found yet.", Toast.LENGTH_SHORT).show()
                }
            }
            .addOnFailureListener { exception ->
                Toast.makeText(context, "Failed to load mentors: ${exception.message}", Toast.LENGTH_SHORT).show()
                // Show specific error message for permissions
                if (exception.message?.contains("PERMISSION_DENIED") == true) {
                    Toast.makeText(context, "Firestore permissions not configured. Please check your Firebase console.", Toast.LENGTH_LONG).show()
                }
            }
    }

    private fun updateMentorLists() {
        // Limit to 4 cards for each section
        val topMentors = filteredMentors.take(4)
        val limitedAreaMentors = filteredMentors.take(4)
        
        topMentorsAdapter.updateData(topMentors)
        areaMentorsAdapter.updateData(limitedAreaMentors)
    }

    private fun updateTopMentorsCarousel() {
        val topMentors = allMentors.take(4)
        
        topMentorsAdapter.updateData(topMentors)
    }

    private suspend fun performIntelligentMentorSearch(query: String) {
        if (query.length < 2) {
            // Hide search results and show main content
            searchResultsSection.visibility = View.GONE
            return
        }

        try {
            // Show search results section
            searchResultsSection.visibility = View.VISIBLE
            searchResultsTitle.text = "Mentors matching '$query'"

            // Get intelligent recommendations for mentors only
            val recommendations = withContext(Dispatchers.IO) {
                recommendationService.getRecommendations(query, 10)
            }

            // Convert recommendations to search results - MENTORS ONLY
            val searchResults = mutableListOf<SearchResult>()
            
            // Add mentor profiles only
            recommendations.mentorProfiles.forEach { doc ->
                val data = doc.data
                if (data != null) {
                    searchResults.add(SearchResult(
                        id = doc.id,
                        title = data["name"] as? String ?: "Mentor",
                        description = data["bio"] as? String ?: "",
                        type = "Mentor",
                        data = doc
                    ))
                }
            }

            // Also add traditional mentor search results
            val traditionalResults = performTraditionalMentorSearch(query)
            traditionalResults.forEach { mentorDoc ->
                val data = mentorDoc.data
                if (data != null) {
                    searchResults.add(SearchResult(
                        id = mentorDoc.id,
                        title = data["name"] as? String ?: "Mentor",
                        description = data["bio"] as? String ?: "",
                        type = "Mentor",
                        data = mentorDoc
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
            val traditionalResults = performTraditionalMentorSearch(query)
            val searchResults = traditionalResults.map { mentorDoc ->
                val data = mentorDoc.data
                SearchResult(
                    id = mentorDoc.id,
                    title = data?.get("name") as? String ?: "Mentor",
                    description = data?.get("bio") as? String ?: "",
                    type = "Mentor",
                    data = mentorDoc
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

    private fun performTraditionalMentorSearch(query: String): List<com.google.firebase.firestore.DocumentSnapshot> {
        val filtered = if (query.isEmpty()) {
            emptyList()
        } else {
            val lowercaseQuery = query.lowercase()
            allMentors.filter { mentorDoc ->
                val mentorData = mentorDoc.data
                val name = mentorData?.get("name") as? String ?: ""
                val expertise = mentorData?.get("expertise") as? List<String> ?: emptyList()
                val skills = mentorData?.get("skills") as? List<String> ?: emptyList()
                val bio = mentorData?.get("bio") as? String ?: ""
                val company = mentorData?.get("company") as? String ?: ""
                
                name.lowercase().contains(lowercaseQuery) ||
                expertise.any { it.lowercase().contains(lowercaseQuery) } ||
                skills.any { it.lowercase().contains(lowercaseQuery) } ||
                bio.lowercase().contains(lowercaseQuery) ||
                company.lowercase().contains(lowercaseQuery)
            }
        }
        
        return filtered
    }

    private fun handleSearchResultClick(result: SearchResult) {
        when (result.type) {
            "Mentor" -> {
                showMentorDetails(result.data)
            }
            "Project" -> {
                val intent = Intent(requireContext(), ProjectDetailActivity::class.java)
                intent.putExtra("project_id", result.id)
                startActivity(intent)
            }
            "Startup" -> {
                Toast.makeText(context, "Startup detail view coming soon", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun showMentorDetails(mentorDoc: com.google.firebase.firestore.DocumentSnapshot) {
        val mentorName = mentorDoc.data?.get("name") as? String ?: "Mentor"
        Toast.makeText(context, "Opening $mentorName's profile", Toast.LENGTH_SHORT).show()
    }

    private fun showBookSessionDialog(mentorDoc: com.google.firebase.firestore.DocumentSnapshot) {
        val mentorData = mentorDoc.data
        val mentorName = mentorData?.get("name") as? String ?: "Mentor"
        val mentorEmail = mentorData?.get("email") as? String
        
        if (mentorEmail.isNullOrEmpty()) {
            Toast.makeText(requireContext(), "This mentor's email is not available", Toast.LENGTH_SHORT).show()
            return
        }
        
        val dialogView = LayoutInflater.from(requireContext()).inflate(R.layout.dialog_book_session, null)
        
        // Set mentor info
        val mentorNameText = dialogView.findViewById<android.widget.TextView>(R.id.mentorName)
        val mentorCompany = dialogView.findViewById<android.widget.TextView>(R.id.mentorCompany)
        val mentorEmailText = dialogView.findViewById<android.widget.TextView>(R.id.mentorEmail)
        
        mentorNameText.text = mentorName
        mentorCompany.text = mentorData?.get("company") as? String ?: "Company"
        mentorEmailText.text = mentorEmail
        
        val messageInput = dialogView.findViewById<TextInputEditText>(R.id.noteInput)
        
        val builder = MaterialAlertDialogBuilder(requireContext())
            .setView(dialogView)
            .setPositiveButton("Book Session") { _, _ ->
                val message = messageInput.text.toString()
                
                if (message.isNotEmpty()) {
                    // Show loading dialog
                    val loadingDialog = MaterialAlertDialogBuilder(requireContext())
                        .setView(R.layout.dialog_loading)
                        .setCancelable(false)
                        .create()
                    loadingDialog.show()
                    
                    // Get current user info from Firestore
                    val currentUser = FirebaseAuth.getInstance().currentUser
                    if (currentUser != null) {
                        firestore.collection("users")
                            .document(currentUser.uid)
                            .get()
                            .addOnSuccessListener { document ->
                                loadingDialog.dismiss()
                                if (document != null && document.exists()) {
                                    val currentUserName = document.getString("fullName") ?: "Unknown User"
                                    val currentUserEmail = document.getString("email") ?: currentUser.email ?: "unknown@example.com"
                                    val currentUserSkills = (document.get("skills") as? List<String>) ?: emptyList()
                                    val currentUserInstitute = document.getString("institute") ?: "Unknown Institute"
                                    
                                    // Send booking email
                                    EmailService.sendBookingEmail(
                                        requireContext(),
                                        mentorDoc,
                                        currentUserName,
                                        currentUserEmail,
                                        currentUserSkills,
                                        currentUserInstitute,
                                        message
                                    )
                                    
                                    Toast.makeText(requireContext(), "Session booking request sent to $mentorName", Toast.LENGTH_SHORT).show()
                                } else {
                                    Toast.makeText(requireContext(), "User profile not found", Toast.LENGTH_SHORT).show()
                                }
                            }
                            .addOnFailureListener { exception ->
                                loadingDialog.dismiss()
                                Toast.makeText(requireContext(), "Failed to get user profile: ${exception.message}", Toast.LENGTH_SHORT).show()
                            }
                    } else {
                        loadingDialog.dismiss()
                        Toast.makeText(requireContext(), "User not logged in", Toast.LENGTH_SHORT).show()
                    }
                } else {
                    Toast.makeText(requireContext(), "Please write a message", Toast.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton("Cancel", null)
        
        builder.show()
    }
} 