package com.princemaurya.collabup000

import android.os.Bundle
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.firebase.firestore.FirebaseFirestore
import com.princemaurya.collabup000.adapters.StudentAdapter

class AllStudentsActivity : AppCompatActivity() {

    private lateinit var titleText: TextView
    private lateinit var studentsRecycler: RecyclerView
    private lateinit var studentsAdapter: StudentAdapter
    private val firestore = FirebaseFirestore.getInstance()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_all_students)

        titleText = findViewById(R.id.title_text)
        studentsRecycler = findViewById(R.id.students_recycler)

        // Set up RecyclerView with grid layout
        studentsRecycler.layoutManager = GridLayoutManager(this, 2) // 2 columns
        studentsAdapter = StudentAdapter(
            emptyList(),
            onStudentClick = { studentDoc ->
                // Handle student click
                showStudentDetails(studentDoc)
            },
            onConnectClick = { studentDoc ->
                // Handle connect click
                // You can implement this based on your requirements
            }
        )
        studentsRecycler.adapter = studentsAdapter

        // Get filter type from intent
        val filterType = intent.getStringExtra("filter_type")
        
        when (filterType) {
            "area" -> {
                titleText.text = "All Students in Your Area"
            }
            "zone" -> {
                titleText.text = "All Students in Your Zone"
            }
            else -> {
                titleText.text = "All Students"
            }
        }

        // Load students from Firestore
        loadStudentsFromFirestore(filterType)
    }

    private fun loadStudentsFromFirestore(filterType: String?) {
        firestore.collection("students")
            .get()
            .addOnSuccessListener { documents ->
                val students = documents.toList()
                
                // Apply filter if needed
                val filteredStudents = when (filterType) {
                    "area" -> students.filter { studentDoc ->
                        // Filter by area logic (you can customize this)
                        val studentData = studentDoc.data
                        val location = studentData["location"] as? String ?: ""
                        location.contains("Area", ignoreCase = true)
                    }
                    "zone" -> students.filter { studentDoc ->
                        // Filter by zone logic (you can customize this)
                        val studentData = studentDoc.data
                        val location = studentData["location"] as? String ?: ""
                        location.contains("Zone", ignoreCase = true)
                    }
                    else -> students
                }

                studentsAdapter.updateData(filteredStudents)
            }
            .addOnFailureListener { exception ->
                // Handle error
            }
    }

    private fun showStudentDetails(studentDoc: com.google.firebase.firestore.DocumentSnapshot) {
        val studentName = studentDoc.data?.get("name") as? String ?: "Student"
        // Show student details dialog or navigate to profile
        // You can implement this based on your requirements
    }
} 