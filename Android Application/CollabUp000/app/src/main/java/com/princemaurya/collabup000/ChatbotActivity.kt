package com.princemaurya.collabup000

import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.ImageButton
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.card.MaterialCardView
import com.princemaurya.collabup000.services.ChatbotService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.*

class ChatbotActivity : AppCompatActivity() {
    
    private lateinit var recyclerView: RecyclerView
    private lateinit var messageInput: EditText
    private lateinit var sendButton: ImageButton
    private lateinit var backButton: ImageButton
    private lateinit var progressBar: ProgressBar
    private lateinit var titleText: TextView
    
    private lateinit var chatAdapter: ChatAdapter
    private val chatMessages = mutableListOf<ChatMessage>()
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_chatbot)
        
        initializeViews()
        setupRecyclerView()
        setupListeners()
        sendWelcomeMessage()
    }
    
    private fun initializeViews() {
        recyclerView = findViewById(R.id.chatRecyclerView)
        messageInput = findViewById(R.id.messageInput)
        sendButton = findViewById(R.id.sendButton)
        backButton = findViewById(R.id.backButton)
        progressBar = findViewById(R.id.progressBar)
        titleText = findViewById(R.id.titleText)
        
        // Set up title
        titleText.text = "CollabUp Assistant"
    }
    
    private fun setupRecyclerView() {
        chatAdapter = ChatAdapter(chatMessages)
        recyclerView.apply {
            layoutManager = LinearLayoutManager(this@ChatbotActivity)
            adapter = chatAdapter
        }
    }
    
    private fun setupListeners() {
        backButton.setOnClickListener {
            finish()
        }
        
        sendButton.setOnClickListener {
            val message = messageInput.text.toString().trim()
            if (message.isNotEmpty()) {
                sendMessage(message)
                messageInput.text.clear()
            }
        }
        
        messageInput.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) {
                sendButton.isEnabled = !s.isNullOrEmpty()
            }
        })
        
        // Enable/disable send button initially
        sendButton.isEnabled = false
    }
    
    private fun sendWelcomeMessage() {
        showTypingIndicator(true)
        
        CoroutineScope(Dispatchers.Main).launch {
            try {
                val result = ChatbotService.sendWelcomeMessage()
                result.fold(
                    onSuccess = { response ->
                        addBotMessage(response)
                    },
                    onFailure = { exception ->
                        addBotMessage("Sorry, I'm having trouble connecting right now. Please try again later.")
                    }
                )
            } catch (e: Exception) {
                addBotMessage("Sorry, I'm having trouble connecting right now. Please try again later.")
            } finally {
                showTypingIndicator(false)
            }
        }
    }
    
    private fun sendMessage(message: String) {
        // Add user message
        addUserMessage(message)
        
        // Show typing indicator
        showTypingIndicator(true)
        
        CoroutineScope(Dispatchers.Main).launch {
            try {
                val result = ChatbotService.sendMessage(message)
                result.fold(
                    onSuccess = { response ->
                        addBotMessage(response)
                    },
                    onFailure = { exception ->
                        addBotMessage("Sorry, I couldn't process your message. Please try again.")
                    }
                )
            } catch (e: Exception) {
                addBotMessage("Sorry, I'm having trouble connecting right now. Please try again later.")
            } finally {
                showTypingIndicator(false)
            }
        }
    }
    
    private fun addUserMessage(message: String) {
        val chatMessage = ChatMessage(
            message = message,
            isUser = true,
            timestamp = System.currentTimeMillis()
        )
        chatMessages.add(chatMessage)
        chatAdapter.notifyItemInserted(chatMessages.size - 1)
        recyclerView.scrollToPosition(chatMessages.size - 1)
    }
    
    private fun addBotMessage(message: String) {
        val chatMessage = ChatMessage(
            message = message,
            isUser = false,
            timestamp = System.currentTimeMillis()
        )
        chatMessages.add(chatMessage)
        chatAdapter.notifyItemInserted(chatMessages.size - 1)
        recyclerView.scrollToPosition(chatMessages.size - 1)
    }
    
    private fun showTypingIndicator(show: Boolean) {
        progressBar.visibility = if (show) View.VISIBLE else View.GONE
        sendButton.isEnabled = !show && !messageInput.text.isNullOrEmpty()
    }
    
    data class ChatMessage(
        val message: String,
        val isUser: Boolean,
        val timestamp: Long
    )
    
    inner class ChatAdapter(private val messages: List<ChatMessage>) : 
        RecyclerView.Adapter<ChatAdapter.MessageViewHolder>() {
        
        inner class MessageViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
            private val messageCard: MaterialCardView = itemView.findViewById(R.id.messageCard)
            private val messageText: TextView = itemView.findViewById(R.id.messageText)
            private val timestampText: TextView = itemView.findViewById(R.id.timestampText)
            
            fun bind(message: ChatMessage) {
                messageText.text = message.message
                
                val timeFormat = SimpleDateFormat("HH:mm", Locale.getDefault())
                timestampText.text = timeFormat.format(Date(message.timestamp))
                
                if (message.isUser) {
                    // User message styling - right aligned
                    messageCard.setCardBackgroundColor(ContextCompat.getColor(this@ChatbotActivity, R.color.dark_blue))
                    messageText.setTextColor(ContextCompat.getColor(this@ChatbotActivity, R.color.white))
                    timestampText.setTextColor(ContextCompat.getColor(this@ChatbotActivity, R.color.white))
                    messageCard.radius = 20f
                    
                    // Set margins for user message (right side)
                    val layoutParams = messageCard.layoutParams as LinearLayout.LayoutParams
                    layoutParams.gravity = android.view.Gravity.END
                    layoutParams.marginStart = 64
                    layoutParams.marginEnd = 8
                    messageCard.layoutParams = layoutParams
                } else {
                    // Bot message styling - left aligned
                    messageCard.setCardBackgroundColor(ContextCompat.getColor(this@ChatbotActivity, R.color.light_gray))
                    messageText.setTextColor(ContextCompat.getColor(this@ChatbotActivity, R.color.black))
                    timestampText.setTextColor(ContextCompat.getColor(this@ChatbotActivity, R.color.gray))
                    messageCard.radius = 20f
                    
                    // Set margins for bot message (left side)
                    val layoutParams = messageCard.layoutParams as LinearLayout.LayoutParams
                    layoutParams.gravity = android.view.Gravity.START
                    layoutParams.marginStart = 8
                    layoutParams.marginEnd = 64
                    messageCard.layoutParams = layoutParams
                }
            }
        }
        
        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): MessageViewHolder {
            val view = layoutInflater.inflate(R.layout.item_chat_message, parent, false)
            return MessageViewHolder(view)
        }
        
        override fun onBindViewHolder(holder: MessageViewHolder, position: Int) {
            holder.bind(messages[position])
        }
        
        override fun getItemCount(): Int = messages.size
    }
} 