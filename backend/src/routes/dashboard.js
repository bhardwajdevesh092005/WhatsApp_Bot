import express from 'express';

const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const { dataService, whatsappService } = req.app.locals;
    
    // Get basic statistics from data service
    const stats = await dataService.getStats();
    
    // Get bot status from WhatsApp service
    const botStatus = await whatsappService.getStatus();
    
    res.json({
      success: true,
      data: {
        ...stats,
        botStatus: botStatus.status,
        isReady: botStatus.isReady,
        lastUpdated: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard statistics',
      message: error.message
    });
  }
});

// GET /api/dashboard/recent-messages
router.get('/recent-messages', async (req, res) => {
  try {
    const { dataService } = req.app.locals;
    const limit = parseInt(req.query.limit) || 10;
    
    const recentMessages = await dataService.getRecentMessages(limit);
    
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
});

// GET /api/dashboard/overview
router.get('/overview', async (req, res) => {
  try {
    const { dataService, whatsappService, socketService } = req.app.locals;
    
    // Get comprehensive dashboard overview
    const [stats, botStatus, recentMessages, socketStats] = await Promise.all([
      dataService.getStats(),
      whatsappService.getStatus(),
      dataService.getRecentMessages(5),
      Promise.resolve(socketService.getStats())
    ]);
    
    res.json({
      success: true,
      data: {
        statistics: stats,
        botStatus: {
          status: botStatus.status,
          isReady: botStatus.isReady,
          clientInfo: botStatus.clientInfo,
          lastUpdated: botStatus.timestamp
        },
        recentMessages: recentMessages,
        connections: {
          activeClients: socketStats.connectedClients,
          totalRooms: socketStats.totalRooms
        },
        systemInfo: {
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          nodeVersion: process.version,
          platform: process.platform
        },
        lastUpdated: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting dashboard overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard overview',
      message: error.message
    });
  }
});

export default router;
