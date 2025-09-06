// Bot Controller
// Handles all bot-related business logic

export class BotController {
  // GET /api/bot/status - Get bot connection status
  static async getStatus(req, res) {
    try {
      const { whatsappService } = req.app.locals;
      const status = await whatsappService.getStatus();
      
      res.json({
        success: true,
        data: status,
        lastUpdated: new Date().toISOString()
      });
      
    } catch (error) {
      console.error(' Error getting bot status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get bot status',
        message: error.message
      });
    }
  }

  // POST /api/bot/connect - Connect/initialize WhatsApp bot
  static async connect(req, res) {
    try {
      const { whatsappService, socketService } = req.app.locals;
      
      // Check if already connected
      const currentStatus = await whatsappService.getStatus();
      if (currentStatus.isReady) {
        return res.json({
          success: true,
          message: 'Bot is already connected',
          data: currentStatus
        });
      }
      
      // Initialize WhatsApp client
      const result = await whatsappService.initialize();
      
      res.json({
        success: true,
        message: 'Bot connection initiated',
        data: result,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error(' Error connecting bot:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to connect bot',
        message: error.message
      });
    }
  }

  // POST /api/bot/disconnect - Disconnect WhatsApp bot
  static async disconnect(req, res) {
    try {
      const { whatsappService, socketService } = req.app.locals;
      
      const result = await whatsappService.disconnect();
      
      // Notify all connected clients
      socketService.broadcastToAll('bot_disconnected', {
        timestamp: new Date().toISOString(),
        reason: 'Manual disconnect'
      });
      
      res.json({
        success: true,
        message: 'Bot disconnected successfully',
        data: result,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error(' Error disconnecting bot:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to disconnect bot',
        message: error.message
      });
    }
  }

  // POST /api/bot/restart - Restart WhatsApp bot
  static async restart(req, res) {
    try {
      const { whatsappService, socketService } = req.app.locals;
      
      // Disconnect first
      await whatsappService.disconnect();
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Reconnect
      const result = await whatsappService.initialize();
      
      // Notify all connected clients
      socketService.broadcastToAll('bot_restarted', {
        timestamp: new Date().toISOString()
      });
      
      res.json({
        success: true,
        message: 'Bot restarted successfully',
        data: result,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error(' Error restarting bot:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to restart bot',
        message: error.message
      });
    }
  }

  // GET /api/bot/qr - Get QR code for WhatsApp connection
  static async getQRCode(req, res) {
    try {
      const { whatsappService } = req.app.locals;
      const qrData = await whatsappService.getQRCode();
      
      if (!qrData) {
        return res.status(404).json({
          success: false,
          error: 'QR code not available',
          message: 'QR code is not available. Bot might already be connected or not initialized.'
        });
      }
      
      res.json({
        success: true,
        data: qrData,
        lastUpdated: new Date().toISOString()
      });
      
    } catch (error) {
      console.error(' Error getting QR code:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get QR code',
        message: error.message
      });
    }
  }                                                 

  // GET /api/bot/info - Get WhatsApp client info
  static async getInfo(req, res) {
    try {
      const { whatsappService } = req.app.locals;
      const info = await whatsappService.getClientInfo();
      
      res.json({
        success: true,
        data: info,
        lastUpdated: new Date().toISOString()
      });
      
    } catch (error) {
      console.error(' Error getting client info:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get client info',
        message: error.message
      });
    }
  }

  // GET /api/bot/contacts - Get WhatsApp contacts
  static async getContacts(req, res) {
    try {
      const { whatsappService } = req.app.locals;
      const limit = parseInt(req.query.limit) || 50;
      const search = req.query.search;
      
      const contacts = await whatsappService.getContacts(limit, search);
      
      res.json({
        success: true,
        data: contacts,
        count: contacts.length,
        limit: limit,
        search: search,
        lastUpdated: new Date().toISOString()
      });
      
    } catch (error) {
      console.error(' Error getting contacts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get contacts',
        message: error.message
      });
    }
  }

  // GET /api/bot/chats - Get WhatsApp chats
  static async getChats(req, res) {
    try {
      const { whatsappService } = req.app.locals;
      const limit = parseInt(req.query.limit) || 20;
      
      const chats = await whatsappService.getChats(limit);
      
      res.json({
        success: true,
        data: chats,
        count: chats.length,
        limit: limit,
        lastUpdated: new Date().toISOString()
      });
      
    } catch (error) {
      console.error(' Error getting chats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get chats',
        message: error.message
      });
    }
  }

  // POST /api/bot/logout - Logout from WhatsApp (clears session)
  static async logout(req, res) {
    try {
      const { whatsappService, socketService } = req.app.locals;
      
      const result = await whatsappService.logout();
      
      // Notify all connected clients
      socketService.broadcastToAll('bot_logged_out', {
        timestamp: new Date().toISOString()
      });
      
      res.json({
        success: true,
        message: 'Bot logged out successfully',
        data: result,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error(' Error logging out bot:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to logout bot',
        message: error.message
      });
    }
  }

  // GET /api/bot/health - Health check for bot service
  static async getHealth(req, res) {
    try {
      const { whatsappService } = req.app.locals;
      const status = await whatsappService.getStatus();
      
      const health = {
        service: 'healthy',
        whatsapp: {
          connected: status.isReady,
          status: status.status,
          lastSeen: status.lastSeen
        },
        server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          timestamp: new Date().toISOString()
        }
      };
      
      res.json({
        success: true,
        data: health,
        lastUpdated: new Date().toISOString()
      });
      
    } catch (error) {
      console.error(' Error getting bot health:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get bot health',
        message: error.message
      });
    }
  }

  // POST /api/bot/settings/auto-reply - Update auto-reply settings
  static async updateAutoReplySettings(req, res) {
    try {
      const { whatsappService, dataService } = req.app.locals;
      const { enabled, message, businessHours } = req.body;
      
      const autoReplySettings = {
        enabled: enabled || false,
        message: message || 'Thank you for your message. We will get back to you soon.',
        businessHours: businessHours || {
          enabled: false,
          start: '09:00',
          end: '17:00',
          timezone: 'UTC'
        }
      };
      
      // Update in WhatsApp service
      await whatsappService.updateAutoReplySettings(autoReplySettings);
      
      // Update in data service
      await dataService.updateSettings({ autoReply: autoReplySettings });
      
      res.json({
        success: true,
        message: 'Auto-reply settings updated successfully',
        data: autoReplySettings,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error(' Error updating auto-reply settings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update auto-reply settings',
        message: error.message
      });
    }
  }

  // GET /api/bot/logs - Get bot activity logs
  static async getLogs(req, res) {
    try {
      const { dataService } = req.app.locals;
      const limit = parseInt(req.query.limit) || 100;
      const level = req.query.level; // info, warn, error
      const since = req.query.since; // ISO date string
      
      // For now, we'll return recent messages as logs
      // In a real implementation, you'd have a separate logging system
      const messages = await dataService.getMessages({
        limit: limit,
        dateFrom: since
      });
      
      const logs = messages.messages.map(msg => ({
        id: msg.id,
        timestamp: msg.timestamp,
        level: msg.status === 'failed' ? 'error' : 'info',
        message: `${msg.direction} message ${msg.status}: ${msg.message?.substring(0, 50)}...`,
        details: {
          direction: msg.direction,
          sender: msg.sender,
          recipient: msg.recipient,
          status: msg.status
        }
      }));
      
      res.json({
        success: true,
        data: logs,
        count: logs.length,
        limit: limit,
        filters: { level, since },
        lastUpdated: new Date().toISOString()
      });
      
    } catch (error) {
      console.error(' Error getting bot logs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get bot logs',
        message: error.message
      });
    }
  }

  // POST /api/bot/webhook/test - Test webhook configuration
  static async testWebhook(req, res) {
    try {
      const { dataService } = req.app.locals;
      const { url, event } = req.body;
      
      if (!url) {
        return res.status(400).json({
          success: false,
          error: 'URL is required',
          message: 'Please provide a webhook URL to test'
        });
      }
      
      // Test webhook by sending a test payload
      const testPayload = {
        event: event || 'test',
        timestamp: new Date().toISOString(),
        data: {
          message: 'This is a test webhook from WhatsApp Bot',
          botStatus: 'connected'
        }
      };
      
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'WhatsApp-Bot-Webhook/1.0'
          },
          body: JSON.stringify(testPayload)
        });
        
        const success = response.ok;
        
        res.json({
          success: true,
          data: {
            webhookUrl: url,
            responseStatus: response.status,
            responseText: response.statusText,
            success: success,
            testPayload: testPayload
          },
          message: success ? 'Webhook test successful' : 'Webhook test failed',
          timestamp: new Date().toISOString()
        });
        
      } catch (webhookError) {
        res.json({
          success: true,
          data: {
            webhookUrl: url,
            success: false,
            error: webhookError.message,
            testPayload: testPayload
          },
          message: 'Webhook test failed',
          timestamp: new Date().toISOString()
        });
      }
      
    } catch (error) {
      console.error(' Error testing webhook:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to test webhook',
        message: error.message
      });
    }
  }
}
