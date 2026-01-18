package com.princemaurya.collabup000

import android.os.Bundle
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.firebase.firestore.FirebaseFirestore
import com.princemaurya.collabup000.adapters.OpportunityAdapter

class AllHackathonsActivity : AppCompatActivity() {

    private lateinit var titleText: TextView
    private lateinit var hackathonsRecycler: RecyclerView
    private lateinit var hackathonsAdapter: OpportunityAdapter
    private val firestore = FirebaseFirestore.getInstance()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_all_hackathons)

        titleText = findViewById(R.id.title_text)
        hackathonsRecycler = findViewById(R.id.hackathons_recycler)

        // Set up RecyclerView with grid layout
        hackathonsRecycler.layoutManager = GridLayoutManager(this, 2) // 2 columns
        hackathonsAdapter = OpportunityAdapter(emptyList()) { hackathonDoc ->
            // Handle hackathon click
            val title = hackathonDoc.data?.get("title") as? String ?: "Hackathon"
            // You can implement hackathon detail view here
        }
        hackathonsRecycler.adapter = hackathonsAdapter

        titleText.text = "All Hackathons"

        // Load hackathons from Firestore
        loadHackathonsFromFirestore()
    }

    private fun loadHackathonsFromFirestore() {
        firestore.collection("hackathons")
            .get()
            .addOnSuccessListener { documents ->
                val hackathons = documents.toList()
                hackathonsAdapter.updateData(hackathons)
            }
            .addOnFailureListener { exception ->
                // Handle error
            }
    }
} 