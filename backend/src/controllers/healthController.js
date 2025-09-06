// Health Controller
// Handles all health check related business logic

export class HealthController {
  // GET /api/health - Health check endpoint
  static async getHealth(req, res) {
    try {
      const { whatsappService, socketService, dataService, databaseService } = req.app.locals;
      
      // Check service health
      const whatsappStatus = whatsappService ? await whatsappService.getStatus() : { status: 'Not initialized' };
      const socketConnections = socketService ? socketService.getConnectionCount() : 0;
      const dataServiceHealth = dataService ? await dataService.healthCheck?.() || await dataService.getHealth?.() : { status: 'Not initialized' };
      const databaseHealth = databaseService ? await databaseService.healthCheck() : { status: 'Not connected' };
      
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        services: {
          whatsapp: {
            status: whatsappStatus.status,
            ready: whatsappStatus.isReady,
            lastSeen: whatsappStatus.lastSeen
          },
          socket: {
            status: 'running',
            connections: socketConnections
          },
          data: {
            status: dataServiceHealth.status,
            messagesCount: dataServiceHealth.collections?.messages || dataServiceHealth.messagesCount || 0,
            settingsLoaded: dataServiceHealth.settingsLoaded || Object.keys(dataServiceHealth.collections || {}).length > 0,
            storageType: dataService?.constructor?.name === 'MongoDataService' ? 'MongoDB' : 'File-based'
          },
          database: {
            status: databaseHealth.status,
            connected: databaseHealth.status === 'connected',
            database: databaseHealth.database || 'N/A',
            collections: databaseHealth.collections || []
          }
        },
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch
        }
      };
      
      res.json({
        success: true,
        data: health,
        lastUpdated: new Date().toISOString()
      });
      
    } catch (error) {
      console.error(' Error in health check:', error);
      res.status(500).json({
        success: false,
        status: 'unhealthy',
        error: 'Health check failed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // GET /api/health/ping - Simple ping endpoint
  static ping(req, res) {
    res.json({
      success: true,
      message: 'pong',
      timestamp: new Date().toISOString()
    });
  }

  // GET /api/health/detailed - Detailed health information
  static async getDetailedHealth(req, res) {
    try {
      const { whatsappService, socketService, dataService, databaseService } = req.app.locals;
      
      const detailed = {
        server: {
          status: 'running',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
          pid: process.pid,
          platform: process.platform,
          nodeVersion: process.version,
          arch: process.arch
        },
        whatsapp: whatsappService ? {
          status: await whatsappService.getStatus(),
          qrAvailable: await whatsappService.getQRCode() !== null,
          clientInfo: await whatsappService.getClientInfo().catch(() => null)
        } : { status: 'Not initialized' },
        socket: socketService ? {
          connections: socketService.getConnectionCount(),
          rooms: socketService.getRooms ? socketService.getRooms() : []
        } : { status: 'Not initialized' },
        data: dataService ? {
          health: await dataService.healthCheck?.() || await dataService.getHealth?.(),
          storageType: dataService.constructor.name,
          settings: await dataService.loadSettings?.() || await dataService.getSettings?.(),
          recentMessages: await dataService.loadMessages?.(5) || await dataService.getMessages?.({ limit: 5 })
        } : { status: 'Not initialized' },
        database: databaseService ? {
          health: await databaseService.healthCheck(),
          connected: databaseService.isMongoConnected(),
          connection: databaseService.getConnection() ? 'Active' : 'Inactive'
        } : { status: 'Not configured' },
        timestamp: new Date().toISOString()
      };
      
      res.json({
        success: true,
        data: detailed,
        lastUpdated: new Date().toISOString()
      });
      
    } catch (error) {
      console.error(' Error in detailed health check:', error);
      res.status(500).json({
        success: false,
        error: 'Detailed health check failed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}
