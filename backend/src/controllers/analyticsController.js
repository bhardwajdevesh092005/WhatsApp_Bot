// Analytics Controller
// Handles all analytics-related business logic

export class AnalyticsController {
  // GET /api/analytics/overview - Get analytics overview
  static async getOverview(req, res) {
    try {
      const { dataService } = req.app.locals;
      const timeRange = req.query.timeRange || 'week';
      
      const analytics = await dataService.getAnalytics(timeRange);
      
      res.json({
        success: true,
        data: analytics,
        timeRange: timeRange,
        lastUpdated: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error getting analytics overview:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get analytics overview',
        message: error.message
      });
    }
  }

  // GET /api/analytics/message-volume - Get message volume data
  static async getMessageVolume(req, res) {
    try {
      const { dataService } = req.app.locals;
      const timeRange = req.query.timeRange || 'week';
      const groupBy = req.query.groupBy || 'day'; // day, hour, week, month
      
      const analytics = await dataService.getAnalytics(timeRange);
      
      res.json({
        success: true,
        data: {
          messageVolume: analytics.messageVolume,
          groupBy: groupBy,
          timeRange: timeRange
        },
        lastUpdated: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error getting message volume:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get message volume data',
        message: error.message
      });
    }
  }

  // GET /api/analytics/response-times - Get response time analytics
  static async getResponseTimes(req, res) {
    try {
      const { dataService } = req.app.locals;
      const timeRange = req.query.timeRange || 'week';
      
      const analytics = await dataService.getAnalytics(timeRange);
      
      res.json({
        success: true,
        data: {
          responseTimes: analytics.responseTimes,
          timeRange: timeRange
        },
        lastUpdated: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error getting response times:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get response time data',
        message: error.message
      });
    }
  }

  // GET /api/analytics/popular-contacts - Get top contacts by message frequency
  static async getPopularContacts(req, res) {
    try {
      const { dataService } = req.app.locals;
      const timeRange = req.query.timeRange || 'week';
      const limit = parseInt(req.query.limit) || 10;
      
      const messages = await dataService.getMessages({
        dateFrom: AnalyticsController.getDateFromTimeRange(timeRange),
        dateTo: new Date().toISOString()
      });
      
      // Count messages by contact
      const contactCounts = {};
      messages.messages.forEach(message => {
        const contact = message.direction === 'outgoing' ? message.recipient : message.sender;
        if (contact) {
          contactCounts[contact] = (contactCounts[contact] || 0) + 1;
        }
      });
      
      // Sort and limit
      const popularContacts = Object.entries(contactCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, limit)
        .map(([contact, count]) => ({
          contact,
          messageCount: count,
          lastMessage: messages.messages
            .filter(m => (m.sender === contact || m.recipient === contact))
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0]?.timestamp
        }));
      
      res.json({
        success: true,
        data: {
          popularContacts,
          timeRange,
          limit
        },
        lastUpdated: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error getting popular contacts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get popular contacts data',
        message: error.message
      });
    }
  }

  // GET /api/analytics/message-types - Get message type distribution
  static async getMessageTypes(req, res) {
    try {
      const { dataService } = req.app.locals;
      const timeRange = req.query.timeRange || 'week';
      
      const messages = await dataService.getMessages({
        dateFrom: AnalyticsController.getDateFromTimeRange(timeRange),
        dateTo: new Date().toISOString()
      });
      
      // Count by message type
      const typeCounts = {};
      messages.messages.forEach(message => {
        const type = message.type || 'text';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });
      
      // Convert to array with percentages
      const total = messages.messages.length;
      const messageTypes = Object.entries(typeCounts).map(([type, count]) => ({
        type,
        count,
        percentage: total > 0 ? ((count / total) * 100).toFixed(1) : 0
      }));
      
      res.json({
        success: true,
        data: {
          messageTypes,
          totalMessages: total,
          timeRange
        },
        lastUpdated: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error getting message types:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get message types data',
        message: error.message
      });
    }
  }

  // GET /api/analytics/activity-patterns - Get activity patterns by hour/day
  static async getActivityPatterns(req, res) {
    try {
      const { dataService } = req.app.locals;
      const timeRange = req.query.timeRange || 'week';
      const pattern = req.query.pattern || 'hourly'; // hourly, daily, weekly
      
      const messages = await dataService.getMessages({
        dateFrom: AnalyticsController.getDateFromTimeRange(timeRange),
        dateTo: new Date().toISOString()
      });
      
      let activityData = {};
      
      if (pattern === 'hourly') {
        // Group by hour (0-23)
        for (let i = 0; i < 24; i++) {
          activityData[i] = 0;
        }
        
        messages.messages.forEach(message => {
          const hour = new Date(message.timestamp).getHours();
          activityData[hour]++;
        });
        
      } else if (pattern === 'daily') {
        // Group by day of week (0-6)
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        days.forEach(day => activityData[day] = 0);
        
        messages.messages.forEach(message => {
          const dayIndex = new Date(message.timestamp).getDay();
          const dayName = days[dayIndex];
          activityData[dayName]++;
        });
        
      } else if (pattern === 'weekly') {
        // Group by week
        messages.messages.forEach(message => {
          const date = new Date(message.timestamp);
          const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
          const weekKey = weekStart.toISOString().split('T')[0];
          activityData[weekKey] = (activityData[weekKey] || 0) + 1;
        });
      }
      
      const activityPatterns = Object.entries(activityData).map(([key, count]) => ({
        label: key,
        count,
        percentage: messages.messages.length > 0 ? ((count / messages.messages.length) * 100).toFixed(1) : 0
      }));
      
      res.json({
        success: true,
        data: {
          activityPatterns,
          pattern,
          timeRange,
          totalMessages: messages.messages.length
        },
        lastUpdated: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error getting activity patterns:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get activity patterns data',
        message: error.message
      });
    }
  }

  // GET /api/analytics/success-rates - Get delivery and response success rates
  static async getSuccessRates(req, res) {
    try {
      const { dataService } = req.app.locals;
      const timeRange = req.query.timeRange || 'week';
      
      const messages = await dataService.getMessages({
        dateFrom: AnalyticsController.getDateFromTimeRange(timeRange),
        dateTo: new Date().toISOString()
      });
      
      // Calculate delivery rates
      const outgoingMessages = messages.messages.filter(m => m.direction === 'outgoing');
      const deliveredMessages = outgoingMessages.filter(m => ['delivered', 'read'].includes(m.status));
      const failedMessages = outgoingMessages.filter(m => m.status === 'failed');
      
      const deliveryRate = outgoingMessages.length > 0 ? 
        ((deliveredMessages.length / outgoingMessages.length) * 100).toFixed(1) : 0;
      
      const failureRate = outgoingMessages.length > 0 ? 
        ((failedMessages.length / outgoingMessages.length) * 100).toFixed(1) : 0;
      
      // Calculate response rates (simple approximation)
      const incomingMessages = messages.messages.filter(m => m.direction === 'incoming');
      const responseRate = outgoingMessages.length > 0 && incomingMessages.length > 0 ? 
        ((incomingMessages.length / outgoingMessages.length) * 100).toFixed(1) : 0;
      
      res.json({
        success: true,
        data: {
          deliveryRate: parseFloat(deliveryRate),
          failureRate: parseFloat(failureRate),
          responseRate: parseFloat(responseRate),
          metrics: {
            totalOutgoing: outgoingMessages.length,
            totalIncoming: incomingMessages.length,
            delivered: deliveredMessages.length,
            failed: failedMessages.length
          },
          timeRange
        },
        lastUpdated: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error getting success rates:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get success rates data',
        message: error.message
      });
    }
  }

  // GET /api/analytics/export - Export analytics data
  static async exportAnalytics(req, res) {
    try {
      const { dataService } = req.app.locals;
      const timeRange = req.query.timeRange || 'week';
      const format = req.query.format || 'json'; // json, csv
      
      const analytics = await dataService.getAnalytics(timeRange);
      const messages = await dataService.getMessages({
        dateFrom: AnalyticsController.getDateFromTimeRange(timeRange),
        dateTo: new Date().toISOString()
      });
      
      const exportData = {
        analytics,
        messages: messages.messages,
        exportInfo: {
          timeRange,
          generatedAt: new Date().toISOString(),
          totalMessages: messages.total
        }
      };
      
      if (format === 'csv') {
        // Convert to CSV format (simplified)
        const csvRows = [
          'Timestamp,Direction,Sender,Recipient,Message,Status,Type',
          ...messages.messages.map(m => 
            `${m.timestamp},${m.direction},${m.sender || ''},${m.recipient || ''},${(m.message || '').replace(/"/g, '""')},${m.status},${m.type || 'text'}`
          )
        ];
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="whatsapp-analytics-${timeRange}-${Date.now()}.csv"`);
        res.send(csvRows.join('\n'));
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="whatsapp-analytics-${timeRange}-${Date.now()}.json"`);
        res.json(exportData);
      }
      
    } catch (error) {
      console.error('❌ Error exporting analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to export analytics data',
        message: error.message
      });
    }
  }

  // Helper method to get date from time range
  static getDateFromTimeRange(timeRange) {
    const now = new Date();
    const date = new Date(now);
    
    switch (timeRange) {
      case 'hour':
        date.setHours(date.getHours() - 1);
        break;
      case 'day':
        date.setDate(date.getDate() - 1);
        break;
      case 'week':
        date.setDate(date.getDate() - 7);
        break;
      case 'month':
        date.setMonth(date.getMonth() - 1);
        break;
      case 'year':
        date.setFullYear(date.getFullYear() - 1);
        break;
      default:
        date.setDate(date.getDate() - 7); // Default to week
    }
    
    return date.toISOString();
  }
}
