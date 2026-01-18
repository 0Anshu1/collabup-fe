package com.princemaurya.collabup000

import android.content.Intent
import android.os.Bundle
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.firebase.firestore.FirebaseFirestore
import com.princemaurya.collabup000.adapters.ProjectAdapter

class AllProjectsActivity : AppCompatActivity() {

    private lateinit var titleText: TextView
    private lateinit var projectsRecycler: RecyclerView
    private lateinit var projectsAdapter: ProjectAdapter
    private val firestore = FirebaseFirestore.getInstance()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_all_projects)

        titleText = findViewById(R.id.title_text)
        projectsRecycler = findViewById(R.id.projects_recycler)

        // Set up RecyclerView with grid layout
        projectsRecycler.layoutManager = GridLayoutManager(this, 2) // 2 columns
        projectsAdapter = ProjectAdapter(emptyList()) { projectDoc ->
            // Handle project click
            val intent = Intent(this, ProjectDetailActivity::class.java)
            intent.putExtra("project_id", projectDoc.id)
            startActivity(intent)
        }
        projectsRecycler.adapter = projectsAdapter

        titleText.text = "All Projects"

        // Load projects from Firestore
        loadProjectsFromFirestore()
    }

    private fun loadProjectsFromFirestore() {
        firestore.collection("projects")
            .orderBy("createdAt", com.google.firebase.firestore.Query.Direction.DESCENDING)
            .get()
            .addOnSuccessListener { documents ->
                val projects = documents.toList()
                projectsAdapter.updateData(projects)
            }
            .addOnFailureListener { exception ->
                // Handle error
            }
    }
} 