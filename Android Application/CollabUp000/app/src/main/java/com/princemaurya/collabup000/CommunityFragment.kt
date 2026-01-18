package com.princemaurya.collabup000

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import android.widget.EditText
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.viewpager2.widget.ViewPager2
import android.text.Editable
import android.text.TextWatcher
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.princemaurya.collabup000.adapters.StudentAdapter
import com.princemaurya.collabup000.services.RecommendationService
import android.widget.Toast
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.textfield.TextInputEditText
import com.bumptech.glide.Glide
import com.princemaurya.collabup000.services.EmailService
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.*
import java.util.*
import android.widget.LinearLayout
import android.content.Intent
import com.princemaurya.collabup000.models.SearchResult
import com.princemaurya.collabup000.adapters.SearchResultAdapter
import com.princemaurya.collabup000.UpdateCardAdapter
import com.princemaurya.collabup000.BannerCardAdapter
import com.google.android.material.tabs.TabLayout
import com.google.android.material.tabs.TabLayoutMediator

class CommunityFragment : Fragment() {
    private lateinit var achievementsViewPager: ViewPager2
    private lateinit var topStudentsRecycler: RecyclerView
    private lateinit var areaStudentsRecycler: RecyclerView
    private lateinit var searchBar: EditText
    private lateinit var searchResultsSection: LinearLayout
    private lateinit var searchResultsRecycler: RecyclerView
    private lateinit var searchResultsTitle: TextView
    private lateinit var noSearchResults: TextView
    private lateinit var moreStudentsBtn: TextView
    private lateinit var moreAreaPeopleBtn: TextView

    private lateinit var achievementsAdapter: BannerCardAdapter
    private lateinit var topStudentsAdapter: StudentAdapter
    private lateinit var areaStudentsAdapter: StudentAdapter
    private lateinit var searchResultsAdapter: SearchResultAdapter

    private val firestore = FirebaseFirestore.getInstance()
    private val auth = FirebaseAuth.getInstance()
    private val recommendationService = RecommendationService()
    
    private var allStudents = listOf<com.google.firebase.firestore.DocumentSnapshot>()
    private var filteredStudents = listOf<com.google.firebase.firestore.DocumentSnapshot>()
    private var searchJob: Job? = null

    private val achievements = listOf(
        UpdateCard("Won Hackathon 2024", "By Alice Johnson", R.drawable.ic_community),
        UpdateCard("AI Research Paper", "By Bob Smith", R.drawable.ic_mentors),
        UpdateCard("Startup Launch", "By Carol Lee", R.drawable.ic_projects)
    )

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_community, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        searchBar = view.findViewById(R.id.search_bar)
        achievementsViewPager = view.findViewById(R.id.achievements_viewpager)
        topStudentsRecycler = view.findViewById(R.id.top_students_recycler)
        areaStudentsRecycler = view.findViewById(R.id.area_people_recycler)
        searchResultsSection = view.findViewById(R.id.search_results_section)
        searchResultsRecycler = view.findViewById(R.id.search_results_recycler)
        searchResultsTitle = view.findViewById(R.id.search_results_title)
        noSearchResults = view.findViewById(R.id.no_search_results)
        moreStudentsBtn = view.findViewById(R.id.more_students_btn)
        moreAreaPeopleBtn = view.findViewById(R.id.more_area_people_btn)

        // Set up ViewPager2 for achievements carousel
        achievementsAdapter = BannerCardAdapter(achievements)
        achievementsViewPager.adapter = achievementsAdapter
        
        // Set up page indicator for achievements
        val achievementsPageIndicator = view.findViewById<TabLayout>(R.id.achievements_page_indicator)
        TabLayoutMediator(achievementsPageIndicator, achievementsViewPager) { _, _ ->
            // This lambda is called for each tab, but we don't need to do anything
        }.attach()

        // Initialize adapters with empty lists
        topStudentsAdapter = StudentAdapter(
            emptyList(),
            onStudentClick = { studentDoc ->
                // Handle student click - could open student profile
                val studentName = studentDoc.data?.get("name") as? String ?: "Student"
                Toast.makeText(context, "Opening $studentName's profile", Toast.LENGTH_SHORT).show()
            },
            onConnectClick = { studentDoc ->
                // Handle connect button click
                showConnectionDialog(studentDoc)
            }
        )
        topStudentsRecycler.layoutManager = LinearLayoutManager(context, LinearLayoutManager.HORIZONTAL, false)
        topStudentsRecycler.adapter = topStudentsAdapter

        areaStudentsAdapter = StudentAdapter(
            emptyList(),
            onStudentClick = { studentDoc ->
                // Handle student click - could open student profile
                val studentName = studentDoc.data?.get("name") as? String ?: "Student"
                Toast.makeText(context, "Opening $studentName's profile", Toast.LENGTH_SHORT).show()
            },
            onConnectClick = { studentDoc ->
                // Handle connect button click
                showConnectionDialog(studentDoc)
            }
        )
        areaStudentsRecycler.layoutManager = LinearLayoutManager(context, LinearLayoutManager.HORIZONTAL, false)
        areaStudentsRecycler.adapter = areaStudentsAdapter

        // Set up search results RecyclerView
        searchResultsRecycler.layoutManager = LinearLayoutManager(context)
        searchResultsAdapter = SearchResultAdapter(emptyList()) { result ->
            handleSearchResultClick(result)
        }
        searchResultsRecycler.adapter = searchResultsAdapter

        // Set up "More" button click handlers
        moreStudentsBtn.setOnClickListener {
            val intent = Intent(requireContext(), AllStudentsActivity::class.java)
            startActivity(intent)
        }

        moreAreaPeopleBtn.setOnClickListener {
            val intent = Intent(requireContext(), AllStudentsActivity::class.java)
            intent.putExtra("filter_type", "area")
            startActivity(intent)
        }

        // Load students from Firestore
        loadStudentsFromFirestore()

        // Search filter for students with intelligent search
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
                    performIntelligentStudentSearch(query)
                }
            }
        })
    }

    private fun loadStudentsFromFirestore() {
        firestore.collection("students")
            .get()
            .addOnSuccessListener { documents ->
                allStudents = documents.documents
                filteredStudents = documents.documents
                updateStudentLists()
                
                if (allStudents.isEmpty()) {
                    Toast.makeText(context, "No students found yet.", Toast.LENGTH_SHORT).show()
                }
            }
            .addOnFailureListener { exception ->
                Toast.makeText(context, "Failed to load students: ${exception.message}", Toast.LENGTH_SHORT).show()
                // Show specific error message for permissions
                if (exception.message?.contains("PERMISSION_DENIED") == true) {
                    Toast.makeText(context, "Firestore permissions not configured. Please check your Firebase console.", Toast.LENGTH_LONG).show()
                }
            }
    }

    private suspend fun performIntelligentStudentSearch(query: String) {
        if (query.length < 2) {
            // Hide search results and show main content
            searchResultsSection.visibility = View.GONE
            return
        }

        try {
            // Show search results section
            searchResultsSection.visibility = View.VISIBLE
            searchResultsTitle.text = "Students matching '$query'"

            // Get intelligent recommendations for students only
            val recommendations = withContext(Dispatchers.IO) {
                recommendationService.getRecommendations(query, 10)
            }

            // Convert recommendations to search results - STUDENTS ONLY
            val searchResults = mutableListOf<SearchResult>()
            
            // Add student projects from recommendations
            recommendations.studentProjects.forEach { doc ->
                val data = doc.data
                if (data != null) {
                    searchResults.add(SearchResult(
                        id = doc.id,
                        title = data["title"] as? String ?: "Project",
                        description = data["description"] as? String ?: "",
                        type = "Student Project",
                        data = doc
                    ))
                }
            }

            // Also add traditional student search results
            val traditionalResults = performTraditionalStudentSearch(query)
            traditionalResults.forEach { studentDoc ->
                val data = studentDoc.data
                if (data != null) {
                    searchResults.add(SearchResult(
                        id = studentDoc.id,
                        title = data["name"] as? String ?: "Student",
                        description = data["bio"] as? String ?: "",
                        type = "Student",
                        data = studentDoc
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
            val traditionalResults = performTraditionalStudentSearch(query)
            val searchResults = traditionalResults.map { studentDoc ->
                val data = studentDoc.data
                SearchResult(
                    id = studentDoc.id,
                    title = data?.get("name") as? String ?: "Student",
                    description = data?.get("bio") as? String ?: "",
                    type = "Student",
                    data = studentDoc
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

    private fun performTraditionalStudentSearch(query: String): List<com.google.firebase.firestore.DocumentSnapshot> {
        val filtered = if (query.isEmpty()) {
            emptyList()
        } else {
            val lowercaseQuery = query.lowercase()
            allStudents.filter { studentDoc ->
                val studentData = studentDoc.data
                val name = studentData?.get("name") as? String ?: ""
                val skills = studentData?.get("skills") as? List<String> ?: emptyList()
                val interests = studentData?.get("interests") as? List<String> ?: emptyList()
                val institute = studentData?.get("institute") as? String ?: ""
                val bio = studentData?.get("bio") as? String ?: ""
                
                name.lowercase().contains(lowercaseQuery) ||
                skills.any { it.lowercase().contains(lowercaseQuery) } ||
                interests.any { it.lowercase().contains(lowercaseQuery) } ||
                institute.lowercase().contains(lowercaseQuery) ||
                bio.lowercase().contains(lowercaseQuery)
            }
        }
        
        return filtered
    }

    private fun updateStudentLists() {
        // Limit to 4 cards for each section
        val topStudents = filteredStudents.take(4)
        val limitedAreaStudents = filteredStudents.take(4)

        topStudentsAdapter.updateData(topStudents)
        areaStudentsAdapter.updateData(limitedAreaStudents)
    }

    private fun showConnectionDialog(studentDoc: com.google.firebase.firestore.DocumentSnapshot) {
        // Check if user is trying to connect with themselves
        val currentUser = auth.currentUser
        val studentEmail = studentDoc.data?.get("email") as? String
        if (currentUser?.email == studentEmail) {
            Toast.makeText(requireContext(), "You cannot connect with yourself", Toast.LENGTH_SHORT).show()
            return
        }
        
        // Check if student has a valid email
        if (studentEmail.isNullOrEmpty()) {
            Toast.makeText(requireContext(), "This student's email is not available", Toast.LENGTH_SHORT).show()
            return
        }
        
        val dialogView = LayoutInflater.from(requireContext()).inflate(R.layout.dialog_connect_student, null)
        
        // Set student info
        val studentName = dialogView.findViewById<android.widget.TextView>(R.id.studentName)
        val studentUniversity = dialogView.findViewById<android.widget.TextView>(R.id.studentUniversity)
        val studentSkills = dialogView.findViewById<android.widget.TextView>(R.id.studentSkills)
        val studentEmailText = dialogView.findViewById<android.widget.TextView>(R.id.studentEmail)
        val studentProfileImage = dialogView.findViewById<de.hdodenhof.circleimageview.CircleImageView>(R.id.studentProfileImage)
        
        studentName.text = studentDoc.data?.get("name") as? String ?: "Student"
        studentUniversity.text = studentDoc.data?.get("university") as? String ?: "Institute"
        val skills = studentDoc.data?.get("skills") as? List<String> ?: emptyList()
        studentSkills.text = skills.take(3).joinToString(", ")
        studentEmailText.text = studentEmail ?: "Email not available"
        
        // Load student profile image (not available in current structure)
        studentProfileImage.setImageResource(R.drawable.ic_profile)
        
        val messageInput = dialogView.findViewById<TextInputEditText>(R.id.messageInput)
        
        val builder = MaterialAlertDialogBuilder(requireContext())
            .setView(dialogView)
            .setPositiveButton("Send Request") { _, _ ->
                val message = messageInput.text.toString()
                
                if (message.isNotEmpty()) {
                    // Show loading dialog
                    val loadingDialog = MaterialAlertDialogBuilder(requireContext())
                        .setView(R.layout.dialog_loading)
                        .setCancelable(false)
                        .create()
                    loadingDialog.show()
                    
                    // Get current user info from Firestore
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
                                    
                                    // Send connection email
                                    EmailService.sendConnectionEmail(
                                        requireContext(),
                                        studentDoc,
                                        currentUserName,
                                        currentUserEmail,
                                        currentUserSkills,
                                        currentUserInstitute,
                                        message
                                    )
                                    
                                    Toast.makeText(requireContext(), "Connection request sent to ${studentDoc.data?.get("name")}", Toast.LENGTH_SHORT).show()
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

    private fun handleSearchResultClick(result: SearchResult) {
        when (result.type) {
            "Project" -> {
                val intent = Intent(requireContext(), ProjectDetailActivity::class.java)
                intent.putExtra("project_id", result.id)
                startActivity(intent)
            }
            "Mentor" -> {
                Toast.makeText(context, "Mentor detail view coming soon", Toast.LENGTH_SHORT).show()
            }
            "Startup" -> {
                Toast.makeText(context, "Startup detail view coming soon", Toast.LENGTH_SHORT).show()
            }
            "Student" -> {
                Toast.makeText(context, "Student profile view coming soon", Toast.LENGTH_SHORT).show()
            }
        }
    }
} 