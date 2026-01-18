package com.princemaurya.collabup000

import android.os.Bundle
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.firebase.firestore.FirebaseFirestore
import com.princemaurya.collabup000.adapters.MentorAdapter

class AllMentorsActivity : AppCompatActivity() {

    private lateinit var titleText: TextView
    private lateinit var mentorsRecycler: RecyclerView
    private lateinit var mentorsAdapter: MentorAdapter
    private val firestore = FirebaseFirestore.getInstance()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_all_mentors)

        titleText = findViewById(R.id.title_text)
        mentorsRecycler = findViewById(R.id.mentors_recycler)

        // Set up RecyclerView with grid layout
        mentorsRecycler.layoutManager = GridLayoutManager(this, 2) // 2 columns
        mentorsAdapter = MentorAdapter(
            emptyList(),
            onMentorClick = { mentorDoc ->
                // Handle mentor click
                showMentorDetails(mentorDoc)
            },
            onBookSessionClick = { mentorDoc ->
                // Handle book session click
                // You can implement this based on your requirements
            }
        )
        mentorsRecycler.adapter = mentorsAdapter

        // Get filter type from intent
        val filterType = intent.getStringExtra("filter_type")
        
        when (filterType) {
            "area" -> {
                titleText.text = "All Mentors in Your Area"
            }
            "zone" -> {
                titleText.text = "All Mentors in Your Zone"
            }
            else -> {
                titleText.text = "All Mentors"
            }
        }

        // Load mentors from Firestore
        loadMentorsFromFirestore(filterType)
    }

    private fun loadMentorsFromFirestore(filterType: String?) {
        firestore.collection("mentors")
            .get()
            .addOnSuccessListener { documents ->
                val mentors = documents.toList()
                
                // Apply filter if needed
                val filteredMentors = when (filterType) {
                    "area" -> mentors.filter { mentorDoc ->
                        // Filter by area logic (you can customize this)
                        val mentorData = mentorDoc.data
                        val location = mentorData["location"] as? String ?: ""
                        location.contains("Area", ignoreCase = true)
                    }
                    "zone" -> mentors.filter { mentorDoc ->
                        // Filter by zone logic (you can customize this)
                        val mentorData = mentorDoc.data
                        val location = mentorData["location"] as? String ?: ""
                        location.contains("Zone", ignoreCase = true)
                    }
                    else -> mentors
                }

                mentorsAdapter.updateData(filteredMentors)
            }
            .addOnFailureListener { exception ->
                // Handle error
            }
    }

    private fun showMentorDetails(mentorDoc: com.google.firebase.firestore.DocumentSnapshot) {
        val mentorName = mentorDoc.data?.get("name") as? String ?: "Mentor"
        // Show mentor details dialog or navigate to profile
        // You can implement this based on your requirements
    }
} 