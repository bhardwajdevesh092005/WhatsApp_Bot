import OpenAI from 'openai';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class LLMService {
  constructor() {
    this.openai = null;
    this.gemini = null;
    this.isInitialized = false;
    this.settings = {
      provider: 'gemini', // 'openai', 'gemini', 'ollama', 'custom'
      model: 'gemini-pro',
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '',
      baseURL: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
      maxTokens: 150,
      temperature: 0.7,
      systemPrompt: 'You are a helpful WhatsApp bot assistant. Respond naturally and helpfully to user messages. Keep responses concise and friendly.',
      enabled: false,
      fallbackMessage: 'I apologize, but I cannot process your message right now. Please try again later.',
      rateLimitPerHour: 60,
      timeout: 10000, // 10 seconds
      customEndpoint: '', // For custom LLM providers
      headers: {} // Custom headers for API calls
    };
    this.requestCount = new Map(); // Track requests per user per hour
  }

  async initialize(settings = {}) {
    try {
      this.settings = { ...this.settings, ...settings };
      
      if (!this.settings.enabled) {
        console.log('🤖 LLM Service: Disabled in settings');
        return false;
      }

      if (this.settings.provider === 'openai') {
        if (!this.settings.apiKey) {
          console.warn('🤖 LLM Service: OpenAI API key not provided');
          return false;
        }
        
        this.openai = new OpenAI({
          apiKey: this.settings.apiKey,
          baseURL: this.settings.baseURL.includes('openai') ? undefined : this.settings.baseURL
        });
        
        // Test the connection
        await this.testConnection();
      } else if (this.settings.provider === 'gemini') {
        if (!this.settings.apiKey) {
          console.warn('🤖 LLM Service: Gemini API key not provided');
          return false;
        }
        
        this.gemini = new GoogleGenerativeAI(this.settings.apiKey);
        
        // Test the connection
        await this.testConnection();
      }
      
      this.isInitialized = true;
      console.log(`🤖 LLM Service initialized with provider: ${this.settings.provider}`);
      return true;
    } catch (error) {
      console.error('🤖 LLM Service initialization failed:', error.message);
      this.isInitialized = false;
      return false;
    }
  }

  async testConnection() {
    try {
      if (this.settings.provider === 'openai' && this.openai) {
        const response = await this.openai.chat.completions.create({
          model: this.settings.model,
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 5
        });
        return !!response.choices[0]?.message?.content;
      } else if (this.settings.provider === 'gemini' && this.gemini) {
        const model = this.gemini.getGenerativeModel({ model: this.settings.model });
        const result = await model.generateContent('Hello');
        const response = await result.response;
        return !!response.text();
      }
      return true;
    } catch (error) {
      console.error('🤖 LLM Connection test failed:', error.message);
      throw new Error(`LLM connection test failed: ${error.message}`);
    }
  }

  async generateResponse(userMessage, context = {}) {
    if (!this.isInitialized || !this.settings.enabled) {
      return null;
    }

    const userId = context.sender || 'unknown';
    
    // Check rate limiting
    if (!this.checkRateLimit(userId)) {
      console.log(`🤖 Rate limit exceeded for user: ${userId}`);
      return 'I apologize, but you have reached the hourly limit for AI responses. Please try again later.';
    }

    try {
      let response;
      
      switch (this.settings.provider) {
        case 'openai':
          response = await this.generateOpenAIResponse(userMessage, context);
          break;
        case 'gemini':
          response = await this.generateGeminiResponse(userMessage, context);
          break;
        case 'ollama':
          response = await this.generateOllamaResponse(userMessage, context);
          break;
        case 'custom':
          response = await this.generateCustomResponse(userMessage, context);
          break;
        default:
          throw new Error(`Unsupported LLM provider: ${this.settings.provider}`);
      }

      // Track successful request
      this.incrementRequestCount(userId);
      
      return response;
    } catch (error) {
      console.error('🤖 Error generating LLM response:', error.message);
      return this.settings.fallbackMessage;
    }
  }

  async generateOpenAIResponse(userMessage, context = {}) {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    const messages = [
      {
        role: 'system',
        content: this.buildSystemPrompt(context)
      },
      {
        role: 'user',
        content: userMessage
      }
    ];

    const response = await Promise.race([
      this.openai.chat.completions.create({
        model: this.settings.model,
        messages: messages,
        max_tokens: this.settings.maxTokens,
        temperature: this.settings.temperature,
        stream: false
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), this.settings.timeout)
      )
    ]);

    return response.choices[0]?.message?.content?.trim() || this.settings.fallbackMessage;
  }

  async generateGeminiResponse(userMessage, context = {}) {
    if (!this.gemini) {
      throw new Error('Gemini client not initialized');
    }

    try {
      const model = this.gemini.getGenerativeModel({ 
        model: this.settings.model || 'gemini-pro',
        generationConfig: {
          maxOutputTokens: this.settings.maxTokens,
          temperature: this.settings.temperature,
        }
      });

      // Build the prompt with system context
      const prompt = `${this.buildSystemPrompt(context)}\n\nUser: ${userMessage}\n\nAssistant:`;

      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), this.settings.timeout)
        )
      ]);

      const response = await result.response;
      return response.text()?.trim() || this.settings.fallbackMessage;
    } catch (error) {
      console.error('🤖 Gemini API Error:', error.message);
      throw error;
    }
  }

  async generateOllamaResponse(userMessage, context = {}) {
    const ollamaURL = this.settings.baseURL || 'http://localhost:11434';
    
    const payload = {
      model: this.settings.model || 'llama2',
      prompt: `${this.buildSystemPrompt(context)}\n\nUser: ${userMessage}\nAssistant:`,
      stream: false,
      options: {
        temperature: this.settings.temperature,
        num_predict: this.settings.maxTokens
      }
    };

    const response = await Promise.race([
      axios.post(`${ollamaURL}/api/generate`, payload, {
        headers: {
          'Content-Type': 'application/json',
          ...this.settings.headers
        }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), this.settings.timeout)
      )
    ]);

    return response.data.response?.trim() || this.settings.fallbackMessage;
  }

  async generateCustomResponse(userMessage, context = {}) {
    if (!this.settings.customEndpoint) {
      throw new Error('Custom endpoint not configured');
    }

    const payload = {
      message: userMessage,
      context: context,
      settings: {
        maxTokens: this.settings.maxTokens,
        temperature: this.settings.temperature,
        systemPrompt: this.buildSystemPrompt(context)
      }
    };

    const response = await Promise.race([
      axios.post(this.settings.customEndpoint, payload, {
        headers: {
          'Content-Type': 'application/json',
          ...this.settings.headers
        }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), this.settings.timeout)
      )
    ]);

    return response.data.response || response.data.message || this.settings.fallbackMessage;
  }

  buildSystemPrompt(context = {}) {
    let prompt = this.settings.systemPrompt;
    
    // Add context information
    if (context.isGroup) {
      prompt += '\n\nNote: This is a group chat conversation.';
    }
    
    if (context.senderName) {
      prompt += `\n\nYou are responding to ${context.senderName}.`;
    }
    
    if (context.businessHours === false) {
      prompt += '\n\nNote: This is outside business hours, so keep responses brief and mention business hours if relevant.';
    }
    
    return prompt;
  }

  checkRateLimit(userId) {
    const currentHour = new Date().getHours();
    const key = `${userId}-${currentHour}`;
    const count = this.requestCount.get(key) || 0;
    
    return count < this.settings.rateLimitPerHour;
  }

  incrementRequestCount(userId) {
    const currentHour = new Date().getHours();
    const key = `${userId}-${currentHour}`;
    const count = this.requestCount.get(key) || 0;
    this.requestCount.set(key, count + 1);
  }

  // Clean up old rate limit data
  cleanupRateLimits() {
    const currentHour = new Date().getHours();
    for (const [key] of this.requestCount) {
      const keyHour = parseInt(key.split('-').pop());
      if (keyHour !== currentHour) {
        this.requestCount.delete(key);
      }
    }
  }

  updateSettings(newSettings) {
    const oldEnabled = this.settings.enabled;
    this.settings = { ...this.settings, ...newSettings };
    
    // Re-initialize if settings changed significantly
    if (newSettings.enabled !== oldEnabled || 
        newSettings.provider || newSettings.apiKey || newSettings.baseURL) {
      return this.initialize(this.settings);
    }
    
    return Promise.resolve(true);
  }

  getSettings() {
    // Return settings without sensitive information
    const { apiKey, headers, ...publicSettings } = this.settings;
    return {
      ...publicSettings,
      hasApiKey: !!apiKey,
      isInitialized: this.isInitialized
    };
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      enabled: this.settings.enabled,
      provider: this.settings.provider,
      model: this.settings.model,
      rateLimitPerHour: this.settings.rateLimitPerHour,
      requestCount: this.requestCount.size
    };
  }

  // Health check for the LLM service
  async getHealth() {
    try {
      if (!this.isInitialized) {
        return { status: 'error', message: 'LLM service not initialized' };
      }
      
      if (!this.settings.enabled) {
        return { status: 'disabled', message: 'LLM service disabled in settings' };
      }
      
      // Test connection based on provider
      await this.testConnection();
      
      return {
        status: 'healthy',
        provider: this.settings.provider,
        model: this.settings.model,
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        provider: this.settings.provider
      };
    }
  }
}
