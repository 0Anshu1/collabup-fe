package com.princemaurya.collabup000.services

import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL

class ChatbotService {
    
    companion object {
        private const val TAG = "ChatbotService"
        private const val BASE_URL = "https://3t3bpy.buildship.run/chatbot-9b77d1e54578"
        
        /**
         * Sends a message to the chatbot API and returns the response
         */
        suspend fun sendMessage(message: String): Result<String> {
            return try {
                withContext(Dispatchers.IO) {
                    Log.d(TAG, "Sending message to chatbot: $message")
                    
                    val url = URL("$BASE_URL?query=${java.net.URLEncoder.encode(message, "UTF-8")}")
                    val connection = url.openConnection() as HttpURLConnection
                    
                    connection.apply {
                        requestMethod = "GET"
                        setRequestProperty("Content-Type", "application/json")
                        setRequestProperty("Accept", "application/json")
                        connectTimeout = 10000 // 10 seconds
                        readTimeout = 10000 // 10 seconds
                    }
                    
                    val responseCode = connection.responseCode
                    Log.d(TAG, "Response code: $responseCode")
                    
                    if (responseCode == HttpURLConnection.HTTP_OK) {
                        val reader = BufferedReader(InputStreamReader(connection.inputStream))
                        val response = StringBuilder()
                        var line: String?
                        
                        while (reader.readLine().also { line = it } != null) {
                            response.append(line)
                        }
                        reader.close()
                        
                        val responseText = response.toString()
                        Log.d(TAG, "Chatbot response: $responseText")
                        
                        // Try to parse JSON response
                        try {
                            val jsonResponse = JSONObject(responseText)
                            val result = jsonResponse.optString("response", responseText)
                            Result.success(result)
                        } catch (e: Exception) {
                            Log.w(TAG, "Failed to parse JSON, using raw response", e)
                            Result.success(responseText)
                        }
                    } else {
                        val errorStream = connection.errorStream
                        val errorReader = BufferedReader(InputStreamReader(errorStream))
                        val errorResponse = StringBuilder()
                        var line: String?
                        
                        while (errorReader.readLine().also { line = it } != null) {
                            errorResponse.append(line)
                        }
                        errorReader.close()
                        
                        Log.e(TAG, "API error: $responseCode - ${errorResponse}")
                        Result.failure(Exception("API error: $responseCode"))
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error sending message to chatbot", e)
                Result.failure(e)
            }
        }
        
        /**
         * Sends a welcome message to initialize the chatbot
         */
        suspend fun sendWelcomeMessage(): Result<String> {
            return sendMessage("Hello! I'm a student looking for help with my projects and career guidance.")
        }
    }
} 