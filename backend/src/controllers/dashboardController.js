// Dashboard Controller
// Handles all dashboard-related business logic

export class DashboardController {
  // GET /api/dashboard/stats
  static async getStats(req, res) {
    try {
      const { dataService } = req.app.locals;
      
      const messages = await dataService.getMessages({ limit: 1000 });
      const settings = await dataService.getSettings();
      
      // Calculate basic stats
      const totalMessages = messages.total;
      const sentMessages = messages.messages.filter(m => m.direction === 'outgoing').length;
      const receivedMessages = messages.messages.filter(m => m.direction === 'incoming').length;
      const failedMessages = messages.messages.filter(m => m.status === 'failed').length;
      
      // Calculate today's stats
      const today = new Date().toISOString().split('T')[0];
      const todayMessages = messages.messages.filter(m => 
        m.timestamp.startsWith(today)
      );
      
      const stats = {
        totalMessages,
        sentMessages,
        receivedMessages,
        failedMessages,
        todayMessages: todayMessages.length,
        autoReplyEnabled: settings.autoReply?.enabled || false,
        lastMessageTime: messages.messages.length > 0 
          ? messages.messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0].timestamp
          : null
      };
      
      res.json({
        success: true,
        data: stats,
        lastUpdated: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error getting dashboard stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get dashboard stats',
        message: error.message
      });
    }
  }

  // GET /api/dashboard/recent-messages
  static async getRecentMessages(req, res) {
    try {
      const { dataService } = req.app.locals;
      const limit = parseInt(req.query.limit) || 10;
      
      const messages = await dataService.getMessages({ limit });
      
      // Sort by timestamp descending
      const recentMessages = messages.messages
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
      
      res.json({
        success: true,
        data: recentMessages,
        count: recentMessages.length,
        lastUpdated: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error getting recent messages:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get recent messages',
        message: error.message
      });
    }
  }

  // GET /api/dashboard/overview
  static async getOverview(req, res) {
    try {
      const { dataService, whatsappService } = req.app.locals;
      
      // Get bot status
      const botStatus = await whatsappService.getStatus();
      
      // Get basic analytics
      const analytics = await dataService.getAnalytics('week');
      
      // Get recent activity
      const recentMessages = await dataService.getMessages({ limit: 5 });
      
      // Get settings overview
      const settings = await dataService.getSettings();
      
      const overview = {
        bot: {
          status: botStatus.status,
          isReady: botStatus.isReady,
          lastSeen: botStatus.lastSeen
        },
        analytics: {
          weeklyMessages: analytics.messageVolume,
          responseTimes: analytics.responseTimes
        },
        recentActivity: recentMessages.messages
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 5),
        settings: {
          autoReplyEnabled: settings.autoReply?.enabled || false,
          notificationsEnabled: settings.notifications?.email || false,
          webhooksEnabled: settings.webhooks?.enabled || false
        }
      };
      
      res.json({
        success: true,
        data: overview,
        lastUpdated: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error getting dashboard overview:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get dashboard overview',
        message: error.message
      });
    }
  }

  // GET /api/dashboard/quick-stats
  static async getQuickStats(req, res) {
    try {
      const { dataService, whatsappService } = req.app.locals;
      
      const botStatus = await whatsappService.getStatus();
      const messages = await dataService.getMessages({ limit: 100 });
      
      // Calculate quick stats for cards
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const recent24h = messages.messages.filter(m => 
        new Date(m.timestamp) >= last24h
      );
      
      const recent7d = messages.messages.filter(m => 
        new Date(m.timestamp) >= last7d
      );
      
      const quickStats = {
        botStatus: {
          status: botStatus.status,
          isConnected: botStatus.isReady,
          uptime: botStatus.uptime || 0
        },
        messages24h: {
          total: recent24h.length,
          sent: recent24h.filter(m => m.direction === 'outgoing').length,
          received: recent24h.filter(m => m.direction === 'incoming').length
        },
        messages7d: {
          total: recent7d.length,
          sent: recent7d.filter(m => m.direction === 'outgoing').length,
          received: recent7d.filter(m => m.direction === 'incoming').length
        },
        successRate: {
          sent: recent7d.filter(m => m.direction === 'outgoing').length,
          delivered: recent7d.filter(m => m.direction === 'outgoing' && ['delivered', 'read'].includes(m.status)).length,
          failed: recent7d.filter(m => m.status === 'failed').length
        }
      };
      
      res.json({
        success: true,
        data: quickStats,
        lastUpdated: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error getting quick stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get quick stats',
        message: error.message
      });
    }
  }
}
