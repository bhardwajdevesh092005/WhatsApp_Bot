# Gemini API Setup Instructions

## 🚀 How to Get Your Free Gemini API Key

### Step 1: Visit Google AI Studio
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account

### Step 2: Get API Key
1. Click on "Get API key" in the left sidebar
2. Click on "Create API key in new project" (or select existing project)
3. Copy the generated API key

### Step 3: Configure Your Environment
Add your API key to the `.env` file in the backend directory:

```bash
# Add this to backend/.env
GEMINI_API_KEY=your_api_key_here
GOOGLE_API_KEY=your_api_key_here  # Alternative name
```

### Step 4: Update LLM Settings
The system is already configured to use Gemini by default. You can:

1. **Via Environment Variables**: Set `LLM_ENABLED=true` in `.env`
2. **Via Web Interface**: Go to LLM Settings page and enter your API key
3. **Via API**: POST to `/api/llm/settings` with your configuration

## 🔧 Configuration Options

### Recommended Settings for Gemini:
- **Provider**: `gemini`
- **Model**: `gemini-1.5-flash` (free tier)
- **Max Tokens**: `150` (for concise responses)
- **Temperature**: `0.7` (balanced creativity)
- **Rate Limit**: `60` requests/hour (adjust as needed)

### Available Models:
- `gemini-1.5-flash`: Best for text generation (recommended)
- `gemini-1.5-flash-vision`: For image understanding (requires special setup)

## 🎯 Features

✅ **Free Tier**: Generous free usage limits  
✅ **Fast Responses**: Quick response times  
✅ **Smart Replies**: Context-aware responses  
✅ **Rate Limiting**: Built-in protection  
✅ **Fallback Messages**: Graceful error handling  

## 🔒 Security Notes

1. **Never commit API keys** to version control
2. **Use environment variables** for production
3. **Set appropriate rate limits** to avoid quota exhaustion
4. **Monitor usage** through Google AI Studio dashboard

## 🆘 Troubleshooting

### Common Issues:

1. **"API key not provided"**
   - Check `.env` file has `GEMINI_API_KEY=your_key`
   - Restart the backend server after adding the key

2. **"Request failed"**
   - Verify API key is correct
   - Check internet connection
   - Ensure you haven't exceeded rate limits

3. **"Model not found"**
   - Use `gemini-1.5-flash` for text generation
   - Ensure model name is exactly correct

### Test Your Setup:
1. Start the backend server: `npm run dev`
2. Go to LLM Settings page in the frontend
3. Enter your API key and enable LLM
4. Use the "Test & Debug" tab to send a test message

## 📊 Usage Monitoring

Monitor your usage at [Google AI Studio](https://aistudio.google.com/):
- API key usage statistics
- Request counts and quotas
- Error logs and debugging info

---

🎉 **You're all set!** Your WhatsApp bot can now use Google Gemini for intelligent auto-replies.
