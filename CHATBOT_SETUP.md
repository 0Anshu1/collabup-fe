# Chatbot API Integration Setup

This guide explains how to configure the chatbot to use your REST API instead of the local knowledge base.

## 🚀 Quick Setup

### 1. Update API Configuration

Edit `src/config/chatbotConfig.ts` and replace the placeholder URL with your actual API endpoint:

```typescript
export const CHATBOT_CONFIG = {
  // Replace with your actual API endpoint
  baseURL: process.env.REACT_APP_CHATBOT_API_URL || 'https://your-chatbot-api.com/api',
  endpoint: '/chat',
  // ... rest of config
};
```

### 2. Environment Variables (Optional)

Create a `.env` file in the root directory:

```env
# Chatbot API Configuration
REACT_APP_CHATBOT_API_URL=https://your-chatbot-api.com/api

# Optional: API Key for authentication
REACT_APP_CHATBOT_API_KEY=your-api-key-here
```

### 3. API Authentication (If Required)

If your API requires authentication, uncomment and configure the headers in `chatbotConfig.ts`:

```typescript
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${process.env.REACT_APP_CHATBOT_API_KEY}`,
  // or
  'X-API-Key': process.env.REACT_APP_CHATBOT_API_KEY,
},
```

## 📡 API Requirements

Your chatbot API should:

### Request Format
```json
{
  "message": "User's question here",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Response Format
Your API should return JSON with one of these structures:

```json
{
  "response": "Bot's answer here"
}
```

OR

```json
{
  "message": "Bot's answer here"
}
```

OR

```json
{
  "answer": "Bot's answer here"
}
```

OR

```json
{
  "text": "Bot's answer here"
}
```

## 🔧 Customization

### Adding Custom Parameters

If your API expects additional parameters, modify the `getChatbotPayload` function:

```typescript
export const getChatbotPayload = (message: string, additionalData?: any) => {
  return {
    message,
    timestamp: new Date().toISOString(),
    userId: additionalData?.userId,
    sessionId: additionalData?.sessionId,
    platform: 'web',
    version: '1.0.0',
    // Add your custom parameters here
    ...additionalData,
  };
};
```

### Error Handling

The chatbot includes comprehensive error handling:

- **Network Errors**: Connection issues
- **Server Errors**: API returns error status
- **Timeout Errors**: Request takes too long
- **Fallback Responses**: When API is unavailable

### Retry Logic

The chatbot automatically retries failed requests:
- **Retries**: 2 attempts
- **Delay**: 1 second between retries
- **Timeout**: 10 seconds per request

## 🧪 Testing

### Test Your API

1. Start your development server: `npm run dev`
2. Open the chatbot
3. Send a test message
4. Check the browser console for any errors

### Debug Mode

Enable debug logging by checking the browser console for:
- API request/response details
- Error messages
- Retry attempts

## 🔒 Security Considerations

1. **HTTPS Only**: Use HTTPS for production APIs
2. **API Keys**: Store API keys in environment variables
3. **Rate Limiting**: Implement rate limiting on your API
4. **Input Validation**: Validate user input on your API
5. **CORS**: Configure CORS properly for web requests

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure your API allows requests from your domain
2. **Authentication Errors**: Check API key configuration
3. **Timeout Errors**: Increase timeout in config if needed
4. **Network Errors**: Verify API endpoint is accessible

### Fallback Mode

If the API is unavailable, the chatbot will:
1. Show fallback responses for common questions
2. Display appropriate error messages
3. Continue to function with basic responses

## 📝 Example API Implementation

Here's a simple example of what your API endpoint might look like:

```javascript
// Express.js example
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    // Process the message with your chatbot logic
    const response = await processMessage(message);
    
    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

## 🎯 Next Steps

1. Replace the placeholder API URL with your actual endpoint
2. Test the integration
3. Customize error messages and fallback responses as needed
4. Add any required authentication
5. Deploy and monitor the chatbot performance

The chatbot will now fetch responses from your API while maintaining the same user interface and experience! 