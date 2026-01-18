package com.princemaurya.collabup000.models

import java.util.Date

// Base User Model
data class User(
    val id: String = "",
    val email: String = "",
    val fullName: String = "",
    val role: String = "Student", // Student, Mentor, Faculty, Startup
    val institute: String = "",
    val skills: List<String> = emptyList(),
    val leetcodeUrl: String = "",
    val codeforcesUrl: String = "",
    val linkedinUrl: String = "",
    val githubUrl: String = "",
    val profileImageUrl: String? = null,
    val resumeUrl: String? = null,
    val createdAt: Date = Date(),
    val updatedAt: Date = Date()
)

// Project Model (for Students)
data class Project(
    val id: String = "",
    val title: String = "",
    val description: String = "",
    val domain: String = "",
    val level: String = "", // Beginner, Intermediate, Advanced
    val technologies: List<String> = emptyList(),
    val duration: String = "",
    val location: String = "",
    val projectOwnerEmail: String = "",
    val ownerId: String = "",
    val ownerEmail: String = "",
    val ownerName: String = "",
    val coverUrl: String = "",
    val createdAt: Date = Date(),
    val updatedAt: Date = Date()
)

// Startup Model
data class Startup(
    val id: String = "",
    val title: String = "",
    val description: String = "",
    val domain: String = "",
    val level: String = "",
    val skills: List<String> = emptyList(),
    val duration: String = "",
    val location: String = "",
    val company: String = "",
    val founderId: String = "",
    val founderEmail: String = "",
    val founderName: String = "",
    val coverUrl: String = "",
    val createdAt: Date = Date(),
    val updatedAt: Date = Date()
)

// Mentor Model
data class Mentor(
    val id: String = "",
    val name: String = "",
    val email: String = "",
    val expertise: List<String> = emptyList(),
    val bio: String = "",
    val currentCompany: String = "",
    val designation: String = "",
    val yearsOfExperience: Int = 0,
    val linkedInUrl: String = "",
    val hourlyRate: Int = 0,
    val rating: Double = 0.0,
    val totalSessions: Int = 0,
    val profileImageUrl: String? = null,
    val createdAt: Date = Date()
)

// Hackathon Model
data class Hackathon(
    val id: String = "",
    val title: String = "",
    val description: String = "",
    val organizer: String = "",
    val startDate: Date = Date(),
    val endDate: Date = Date(),
    val location: String = "",
    val prizePool: Int = 0,
    val maxTeamSize: Int = 0,
    val technologies: List<String> = emptyList(),
    val registrationDeadline: Date = Date(),
    val status: String = "upcoming", // upcoming, ongoing, completed
    val coverUrl: String = "",
    val createdAt: Date = Date()
)

// Faculty/Research Project Model
data class Faculty(
    val id: String = "",
    val title: String = "",
    val description: String = "",
    val domain: String = "",
    val level: String = "",
    val skills: List<String> = emptyList(),
    val duration: String = "",
    val location: String = "",
    val facultyId: String = "",
    val facultyEmail: String = "",
    val facultyName: String = "",
    val institute: String = "",
    val researchAreas: List<String> = emptyList(),
    val coverUrl: String = "",
    val createdAt: Date = Date(),
    val updatedAt: Date = Date()
)

// Student Model (for student-specific data)
data class Student(
    val id: String = "",
    val userId: String = "",
    val name: String = "",
    val email: String = "",
    val institute: String = "",
    val skills: List<String> = emptyList(),
    val interests: List<String> = emptyList(),
    val projects: List<String> = emptyList(), // Project IDs
    val profileImageUrl: String? = null,
    val bio: String = "",
    val linkedinUrl: String = "",
    val githubUrl: String = "",
    val leetcodeUrl: String = "",
    val codeforcesUrl: String = "",
    val createdAt: Date = Date(),
    val updatedAt: Date = Date()
) 