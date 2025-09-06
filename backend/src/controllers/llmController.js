export class LLMController {
  // GET /api/llm/settings - Get LLM settings
  static async getSettings(req, res) {
    try {
      const { whatsappService } = req.app.locals;
      
      const settings = whatsappService.getLLMSettings();
      
      res.json({
        success: true,
        data: settings,
        lastUpdated: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error getting LLM settings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get LLM settings',
        message: error.message
      });
    }
  }

  // PUT /api/llm/settings - Update LLM settings
  static async updateSettings(req, res) {
    try {
      const { whatsappService, dataService } = req.app.locals;
      const newSettings = req.body;
      
      // Validate required fields for enabled LLM
      if (newSettings.enabled) {
        if ((newSettings.provider === 'openai' && !newSettings.apiKey) ||
            (newSettings.provider === 'gemini' && !newSettings.apiKey)) {
          return res.status(400).json({
            success: false,
            error: `API key is required when LLM is enabled with ${newSettings.provider} provider`
          });
        }
      }
      
      // Update LLM service settings
      await whatsappService.updateLLMSettings(newSettings);
      
      // Update stored settings
      const currentSettings = await dataService.getSettings();
      const updatedSettings = await dataService.updateSettings({
        ...currentSettings,
        llm: { ...currentSettings.llm, ...newSettings }
      });
      
      res.json({
        success: true,
        data: updatedSettings.llm,
        message: 'LLM settings updated successfully',
        lastUpdated: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error updating LLM settings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update LLM settings',
        message: error.message
      });
    }
  }

  // GET /api/llm/status - Get LLM service status
  static async getStatus(req, res) {
    try {
      const { whatsappService } = req.app.locals;
      
      const status = whatsappService.getLLMStatus();
      const health = await whatsappService.getLLMHealth();
      
      res.json({
        success: true,
        data: {
          ...status,
          health: health
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error("Error getting LLM status:', error");
      res.status(500).json({
        success: false,
        error: 'Failed to get LLM status',
        message: error.message
      });
    }
  }

  // POST /api/llm/test - Test LLM response
  static async testResponse(req, res) {
    try {
      const { whatsappService } = req.app.locals;
      const { message, context = {} } = req.body;
      
      if (!message) {
        return res.status(400).json({
          success: false,
          error: 'Message is required for testing'
        });
      }
      
      const result = await whatsappService.testLLMResponse(message, context);
      
      res.json({
        success: result.success,
        data: result.success ? {
          message: message,
          response: result.response,
          context: context,
          timestamp: result.timestamp
        } : null,
        error: result.success ? null : result.error,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('💥 Error testing LLM response:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to test LLM response',
        message: error.message
      });
    }
  }

  // GET /api/llm/providers - Get available LLM providers
  static async getProviders(req, res) {
    try {
      const providers = [
        {
          id: 'gemini',
          name: 'Google Gemini',
          description: 'Google Gemini AI models (Free with API key)',
          models: ['gemini-pro', 'gemini-pro-vision'],
          requiresApiKey: true,
          baseURL: 'https://generativelanguage.googleapis.com/v1beta',
          documentation: 'https://ai.google.dev/docs'
        },
        {
          id: 'openai',
          name: 'OpenAI',
          description: 'OpenAI GPT models (GPT-3.5, GPT-4)',
          models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo-preview'],
          requiresApiKey: true,
          baseURL: 'https://api.openai.com/v1',
          documentation: 'https://platform.openai.com/docs'
        },
        {
          id: 'ollama',
          name: 'Ollama',
          description: 'Local LLM hosting with Ollama',
          models: ['llama2', 'codellama', 'mistral', 'neural-chat'],
          requiresApiKey: false,
          baseURL: 'http://localhost:11434',
          documentation: 'https://github.com/ollama/ollama'
        },
        {
          id: 'custom',
          name: 'Custom Provider',
          description: 'Custom LLM API endpoint',
          models: ['custom-model'],
          requiresApiKey: false,
          baseURL: '',
          documentation: 'Configure your custom endpoint'
        }
      ];
      
      res.json({
        success: true,
        data: providers,
        total: providers.length,
        lastUpdated: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('💥 Error getting LLM providers:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get LLM providers',
        message: error.message
      });
    }
  }

  // POST /api/llm/reset - Reset LLM settings to defaults
  static async resetSettings(req, res) {
    try {
      const { whatsappService, dataService } = req.app.locals;
      
      const defaultLLMSettings = {
        enabled: true,
        autoReply: true,
        provider: 'gemini',
        model: 'gemini-pro',
        apiKey: '',
        baseURL: 'https://generativelanguage.googleapis.com/v1beta',
        customEndpoint: '',
        maxTokens: 150,
        temperature: 0.7,
        systemPrompt: 'You are a helpful WhatsApp bot assistant. Respond naturally and helpfully to user messages. Keep responses concise and friendly.',
        fallbackMessage: 'I apologize, but I cannot process your message right now. Please try again later.',
        rateLimitPerHour: 60,
        timeout: 10000,
        headers: {},
        onlyDuringBusinessHours: false,
        smartResponseMode: true,
        contextAware: true
      };
      
      // Update LLM service
      await whatsappService.updateLLMSettings(defaultLLMSettings);
      
      // Update stored settings
      const currentSettings = await dataService.getSettings();
      const updatedSettings = await dataService.updateSettings({
        ...currentSettings,
        llm: defaultLLMSettings
      });
      
      res.json({
        success: true,
        data: updatedSettings.llm,
        message: 'LLM settings reset to defaults',
        lastUpdated: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('💥 Error resetting LLM settings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reset LLM settings',
        message: error.message
      });
    }
  }

  // GET /api/llm/analytics - Get LLM usage analytics
  static async getAnalytics(req, res) {
    try {
      const { dataService } = req.app.locals;
      const { days = 30 } = req.query;
      
      const analytics = await dataService.getAnalytics();
      const autoReplies = analytics.autoReplies || [];
      
      // Filter LLM auto-replies
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
      
      const llmReplies = autoReplies.filter(reply => 
        reply.responseType === 'llm' && 
        new Date(reply.timestamp) > cutoffDate
      );
      
      const stats = {
        totalLLMReplies: llmReplies.length,
        averagePerDay: Math.round((llmReplies.length / days) * 100) / 100,
        uniqueUsers: new Set(llmReplies.map(r => r.sender)).size,
        responseTypes: {
          llm: llmReplies.length,
          fallback: autoReplies.filter(r => r.responseType === 'default').length
        },
        dailyBreakdown: {},
        periodStart: cutoffDate.toISOString(),
        periodEnd: new Date().toISOString()
      };
      
      // Calculate daily breakdown
      llmReplies.forEach(reply => {
        const date = reply.timestamp.split('T')[0];
        stats.dailyBreakdown[date] = (stats.dailyBreakdown[date] || 0) + 1;
      });
      
      res.json({
        success: true,
        data: stats,
        period: `${days} days`,
        lastUpdated: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('💥 Error getting LLM analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get LLM analytics',
        message: error.message
      });
    }
  }
}
