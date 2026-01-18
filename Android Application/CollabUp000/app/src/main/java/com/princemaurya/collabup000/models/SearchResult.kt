package com.princemaurya.collabup000.models

import com.google.firebase.firestore.DocumentSnapshot

data class SearchResult(
    val id: String,
    val title: String,
    val description: String,
    val type: String,
    val data: DocumentSnapshot
) 