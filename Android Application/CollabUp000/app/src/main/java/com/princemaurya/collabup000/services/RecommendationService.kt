package com.princemaurya.collabup000.services

import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.DocumentSnapshot
import kotlinx.coroutines.tasks.await

data class RecommendationResult(
    val studentProjects: List<DocumentSnapshot>,
    val startupProjects: List<DocumentSnapshot>,
    val mentorProfiles: List<DocumentSnapshot>,
    val researchProjects: List<DocumentSnapshot>
)

class RecommendationService {
    private val firestore = FirebaseFirestore.getInstance()
    
    suspend fun getRecommendations(query: String, topN: Int = 5): RecommendationResult {
        println("🔍 Processing query: '$query'")
        
        try {
            // Fetch data from collections
            val projectsDocs = firestore.collection("projects").get().await().documents
            val startupsDocs = firestore.collection("startups").get().await().documents
            val mentorsDocs = firestore.collection("mentors").get().await().documents
            val facultyDocs = firestore.collection("faculty").get().await().documents
            
            // Filter and score documents based on query
            val studentProjects = filterAndScoreDocuments(projectsDocs, query, "projects").take(topN)
            val startupProjects = filterAndScoreDocuments(startupsDocs, query, "startups").take(topN)
            val mentorProfiles = filterAndScoreDocuments(mentorsDocs, query, "mentors").take(topN)
            val researchProjects = filterAndScoreDocuments(facultyDocs, query, "faculty").take(topN)
            
            return RecommendationResult(
                studentProjects = studentProjects.map { it.first },
                startupProjects = startupProjects.map { it.first },
                mentorProfiles = mentorProfiles.map { it.first },
                researchProjects = researchProjects.map { it.first }
            )
            
        } catch (e: Exception) {
            println("❌ Error fetching recommendations: ${e.message}")
            throw e
        }
    }
    
    private fun filterAndScoreDocuments(
        documents: List<DocumentSnapshot>,
        query: String,
        collectionType: String
    ): List<Pair<DocumentSnapshot, Double>> {
        val queryLower = query.lowercase()
        val scoredDocs = mutableListOf<Pair<DocumentSnapshot, Double>>()
        
        for (doc in documents) {
            val data = doc.data ?: continue
            val score = calculateScore(data, queryLower, collectionType)
            if (score > 0.1) {
                scoredDocs.add(Pair(doc, score))
            }
        }
        
        return scoredDocs.sortedByDescending { it.second }
    }
    
    private fun calculateScore(data: Map<String, Any?>, query: String, collectionType: String): Double {
        var score = 0.0
        
        when (collectionType) {
            "projects" -> {
                val title = data["title"] as? String ?: ""
                val description = data["description"] as? String ?: ""
                val domain = data["domain"] as? String ?: ""
                val technologies = (data["technologies"] as? List<String>) ?: emptyList()
                
                score += calculateTextSimilarity(title, query) * 3.0
                score += calculateTextSimilarity(description, query) * 1.5
                score += calculateTextSimilarity(domain, query) * 2.5
                
                for (tech in technologies) {
                    score += calculateTextSimilarity(tech, query) * 2.0
                }
            }
            
            "mentors" -> {
                val name = data["name"] as? String ?: ""
                val bio = data["bio"] as? String ?: ""
                val expertise = (data["expertise"] as? List<String>) ?: emptyList()
                val currentCompany = data["currentCompany"] as? String ?: ""
                
                score += calculateTextSimilarity(name, query) * 2.0
                score += calculateTextSimilarity(bio, query) * 1.5
                score += calculateTextSimilarity(currentCompany, query) * 2.0
                
                for (exp in expertise) {
                    score += calculateTextSimilarity(exp, query) * 3.0
                }
            }
            
            "startups" -> {
                val title = data["title"] as? String ?: ""
                val description = data["description"] as? String ?: ""
                val domain = data["domain"] as? String ?: ""
                val location = data["location"] as? String ?: ""
                
                score += calculateTextSimilarity(title, query) * 3.0
                score += calculateTextSimilarity(description, query) * 1.5
                score += calculateTextSimilarity(domain, query) * 2.5
                score += calculateTextSimilarity(location, query) * 1.5
            }
            
            "faculty" -> {
                val name = data["name"] as? String ?: ""
                val bio = data["bio"] as? String ?: ""
                val researchAreas = (data["researchAreas"] as? List<String>) ?: emptyList()
                val institute = data["institute"] as? String ?: ""
                
                score += calculateTextSimilarity(name, query) * 2.0
                score += calculateTextSimilarity(bio, query) * 1.5
                score += calculateTextSimilarity(institute, query) * 1.5
                
                for (area in researchAreas) {
                    score += calculateTextSimilarity(area, query) * 3.0
                }
            }
        }
        
        return score
    }
    
    private fun calculateTextSimilarity(text1: String, text2: String): Double {
        if (text1.isEmpty() || text2.isEmpty()) return 0.0
        
        val text1Lower = text1.lowercase()
        val text2Lower = text2.lowercase()
        
        // Exact match
        if (text1Lower == text2Lower) return 1.0
        
        // Contains match
        if (text1Lower.contains(text2Lower) || text2Lower.contains(text1Lower)) return 0.8
        
        // Word-level matching
        val words1 = text1Lower.split(" ").toSet()
        val words2 = text2Lower.split(" ").toSet()
        
        if (words1.isNotEmpty() && words2.isNotEmpty()) {
            val intersection = words1.intersect(words2)
            val union = words1.union(words2)
            if (union.isNotEmpty()) {
                return intersection.size.toDouble() / union.size * 0.6
            }
        }
        
        return 0.0
    }
} 