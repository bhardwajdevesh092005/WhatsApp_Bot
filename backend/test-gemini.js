import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testGeminiIntegration() {
  console.log('🧪 Testing Gemini Integration...');
  
  // Check if API key is available
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error('❌ No API key found. Please set GEMINI_API_KEY in your .env file');
    console.log('📖 Follow the instructions in GEMINI_SETUP.md to get your free API key');
    return;
  }
  
  console.log('✅ API key found');
  
  try {
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // Test prompt
    const prompt = 'Hello! This is a test message for the WhatsApp bot. Please respond briefly and friendly.';
    
    console.log('🤖 Sending test prompt to Gemini...');
    console.log('📝 Prompt:', prompt);
    
    // Generate response
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini Response:');
    console.log('💬', text);
    console.log('\n🎉 Gemini integration test successful!');
    
    return {
      success: true,
      response: text,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Gemini integration test failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('API_KEY_INVALID')) {
      console.log('💡 Your API key seems to be invalid. Please check:');
      console.log('   1. Visit https://aistudio.google.com/');
      console.log('   2. Create a new API key');
      console.log('   3. Update your .env file');
    } else if (error.message.includes('PERMISSION_DENIED')) {
      console.log('💡 Permission denied. Please check:');
      console.log('   1. API key has proper permissions');
      console.log('   2. Gemini API is enabled for your project');
    } else if (error.message.includes('QUOTA_EXCEEDED')) {
      console.log('💡 Quota exceeded. Please check:');
      console.log('   1. Your usage limits in Google AI Studio');
      console.log('   2. Try again later if you hit rate limits');
    }
    
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testGeminiIntegration();
}

export { testGeminiIntegration };
