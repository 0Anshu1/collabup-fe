package com.princemaurya.collabup000

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import android.widget.EditText
import android.text.Editable
import android.text.TextWatcher
import com.princemaurya.collabup000.adapters.ProjectAdapter
import com.princemaurya.collabup000.services.RecommendationService
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.auth.FirebaseAuth
import android.widget.Toast
import com.google.android.material.button.MaterialButton
import kotlinx.coroutines.*
import java.util.*

class ProjectsFragment : Fragment() {
    
    private val projectsList = mutableListOf<com.google.firebase.firestore.DocumentSnapshot>()
    private val filteredProjectsList = mutableListOf<com.google.firebase.firestore.DocumentSnapshot>()
    private lateinit var projectAdapter: ProjectAdapter
    private val firestore = FirebaseFirestore.getInstance()
    private val auth = FirebaseAuth.getInstance()
    private val recommendationService = RecommendationService()
    private lateinit var searchBar: EditText
    private var searchJob: Job? = null

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_projects, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Initialize views
        searchBar = view.findViewById(R.id.search_bar)
        val recyclerView = view.findViewById<RecyclerView>(R.id.projects_recycler)
        val addProjectBtn = view.findViewById<MaterialButton>(R.id.btn_add_project)

        // Set up RecyclerView
        recyclerView.layoutManager = LinearLayoutManager(context)
        projectAdapter = ProjectAdapter(filteredProjectsList) { projectDoc ->
            val intent = Intent(requireContext(), ProjectDetailActivity::class.java)
            intent.putExtra("project_id", projectDoc.id)
            startActivity(intent)
        }
        recyclerView.adapter = projectAdapter

        // Set up intelligent search functionality with debouncing
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

        // Set up add project button
        addProjectBtn.setOnClickListener {
            val intent = Intent(requireContext(), AddProjectActivity::class.java)
            startActivity(intent)
        }

        // Load projects from Firestore
        loadProjectsFromFirestore()
    }

    private suspend fun performIntelligentProjectSearch(query: String) {
        if (query.length < 2) {
            // Show all projects if query is too short
            filteredProjectsList.clear()
            filteredProjectsList.addAll(projectsList)
            projectAdapter.updateData(filteredProjectsList)
            return
        }

        try {
            // Get intelligent recommendations for projects
            val recommendations = withContext(Dispatchers.IO) {
                recommendationService.getRecommendations(query, 20)
            }

            // Filter to show only projects from recommendations
            filteredProjectsList.clear()
            
            // Add recommended student projects
            recommendations.studentProjects.forEach { doc ->
                if (projectsList.any { it.id == doc.id }) {
                    filteredProjectsList.add(doc)
                }
            }
            
            // Add recommended startup projects (if they exist in projects collection)
            recommendations.startupProjects.forEach { doc ->
                if (projectsList.any { it.id == doc.id }) {
                    filteredProjectsList.add(doc)
                }
            }

            // If no intelligent results, fall back to traditional search
            if (filteredProjectsList.isEmpty()) {
                performTraditionalProjectSearch(query)
            } else {
                projectAdapter.updateData(filteredProjectsList)
            }

        } catch (e: Exception) {
            // Fallback to traditional search if recommendation service fails
            performTraditionalProjectSearch(query)
        }
    }

    private fun performTraditionalProjectSearch(query: String) {
        filteredProjectsList.clear()
        if (query.isEmpty()) {
            filteredProjectsList.addAll(projectsList)
        } else {
            val lowercaseQuery = query.lowercase()
            for (projectDoc in projectsList) {
                val projectData = projectDoc.data
                val title = projectData?.get("title") as? String ?: ""
                val description = projectData?.get("description") as? String ?: ""
                val domain = projectData?.get("domain") as? String ?: ""
                val technologies = projectData?.get("technologies") as? List<String> ?: emptyList()
                
                if (title.lowercase().contains(lowercaseQuery) ||
                    description.lowercase().contains(lowercaseQuery) ||
                    domain.lowercase().contains(lowercaseQuery) ||
                    technologies.any { it.lowercase().contains(lowercaseQuery) }) {
                    filteredProjectsList.add(projectDoc)
                }
            }
        }
        projectAdapter.updateData(filteredProjectsList)
    }

    private fun loadProjectsFromFirestore() {
        firestore.collection("projects")
            .orderBy("createdAt", com.google.firebase.firestore.Query.Direction.DESCENDING)
            .get()
            .addOnSuccessListener { documents ->
                projectsList.clear()
                projectsList.addAll(documents.documents)
                filteredProjectsList.clear()
                filteredProjectsList.addAll(projectsList)
                projectAdapter.updateData(filteredProjectsList)
                
                if (projectsList.isEmpty()) {
                    Toast.makeText(context, "No projects found. Be the first to add one!", Toast.LENGTH_SHORT).show()
                }
            }
            .addOnFailureListener { exception ->
                Toast.makeText(context, "Failed to load projects: ${exception.message}", Toast.LENGTH_SHORT).show()
                // Show specific error message for permissions
                if (exception.message?.contains("PERMISSION_DENIED") == true) {
                    Toast.makeText(context, "Firestore permissions not configured. Please check your Firebase console.", Toast.LENGTH_LONG).show()
                }
            }
    }
} 