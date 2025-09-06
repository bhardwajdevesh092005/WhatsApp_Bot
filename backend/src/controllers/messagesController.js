// Messages Controller
// Handles all message-related business logic

export class MessagesController {
  // GET /api/messages - Get all messages with filtering
  static async getMessages(req, res) {
    try {
      const { dataService } = req.app.locals;
      
      // Extract query parameters
      const filters = {
        status: req.query.status,
        direction: req.query.direction,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
        sender: req.query.sender,
        search: req.query.search,
        page: req.query.page,
        limit: req.query.limit
      };
      
      const result = await dataService.getMessages(filters);
      
      res.json({
        success: true,
        data: result.messages,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          pages: result.pages
        },
        filters: filters,
        lastUpdated: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error getting messages:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get messages',
        message: error.message
      });
    }
  }

  //   Get /api/ - Get all messages
  static async getAllMessages(req, res) {
    try {
      const { dataService } = req.app.locals;
      const messages = await dataService.getMessages();
        
        res.json({
            success: true,
            data: messages.messages,
            total: messages.total,
            lastUpdated: new Date().toISOString()
        });
        
    } catch (error) {
      console.error('❌ Error getting all messages:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get all messages',
        message: error.message
      });
    }
    }

  // GET /api/messages/:id - Get specific message
  static async getMessageById(req, res) {
    try {
      const { dataService } = req.app.locals;
      const messageId = req.params.id;
      
      const messages = await dataService.getMessages();
      const message = messages.messages.find(m => m.id === messageId);
      
      if (!message) {
        return res.status(404).json({
          success: false,
          error: 'Message not found',
          message: `Message with ID ${messageId} does not exist`
        });
      }
      
      res.json({
        success: true,
        data: message,
        lastUpdated: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error getting message:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get message',
        message: error.message
      });
    }
  }

  // POST /api/messages/send - Send a new message
  static async sendMessage(req, res) {
    try {
      const { whatsappService, dataService } = req.app.locals;
      const { recipient, message, messageType } = req.body;
      console.log(req.body);
      // Check if WhatsApp client is ready
      const botStatus = await whatsappService.getStatus();
      if (!botStatus.isReady) {
        return res.status(503).json({
          success: false,
          error: 'WhatsApp bot is not ready',
          message: 'Please wait for the bot to connect to WhatsApp',
          botStatus: botStatus.status
        });
      }
      
      // Prepare message options
      const options = {
        messageType: messageType || 'text'
      };
      
      // Handle file attachment
      if (req.file) {
        options.media = req.file.path;
        options.mediaType = req.file.mimetype;
        options.mediaName = req.file.originalname;
      }
      
      // Send message through WhatsApp service
      const result = await whatsappService.sendMessage(recipient, message, options);
      
      res.json({
        success: true,
        data: result.data,
        messageId: result.messageId,
        message: 'Message sent successfully',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      
      // Handle specific error types
      if (error.message.includes('not ready')) {
        return res.status(503).json({
          success: false,
          error: 'Service unavailable',
          message: error.message
        });
      }
      
      if (error.message.includes('invalid phone')) {
        return res.status(400).json({
          success: false,
          error: 'Invalid phone number',
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to send message',
        message: error.message
      });
    }
  }

  // PUT /api/messages/:id/status - Update message status
  static async updateMessageStatus(req, res) {
    try {
      const { dataService } = req.app.locals;
      const messageId = req.params.id;
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({
          success: false,
          error: 'Status is required',
          message: 'Please provide a status value'
        });
      }
      
      const validStatuses = ['pending', 'sent', 'delivered', 'read', 'failed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status',
          message: `Status must be one of: ${validStatuses.join(', ')}`
        });
      }
      
      await dataService.updateMessageStatus(messageId, status);
      
      res.json({
        success: true,
        message: 'Message status updated successfully',
        data: {
          messageId: messageId,
          status: status,
          updatedAt: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error('❌ Error updating message status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update message status',
        message: error.message
      });
    }
  }

  // DELETE /api/messages/:id - Delete a message (soft delete)
  static async deleteMessage(req, res) {
    try {
      const { dataService } = req.app.locals;
      const messageId = req.params.id;
      
      // For now, we'll mark as deleted rather than actually removing
      await dataService.updateMessageStatus(messageId, 'deleted');
      
      res.json({
        success: true,
        message: 'Message deleted successfully',
        data: {
          messageId: messageId,
          deletedAt: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error('❌ Error deleting message:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete message',
        message: error.message
      });
    }
  }

  // POST /api/messages/bulk-send - Send messages to multiple recipients
  static async bulkSendMessages(req, res) {
    try {
      const { whatsappService } = req.app.locals;
      const { recipients, message, messageType } = req.body;
      
      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Recipients array is required',
          message: 'Please provide an array of recipient phone numbers'
        });
      }
      
      if (recipients.length > 50) {
        return res.status(400).json({
          success: false,
          error: 'Too many recipients',
          message: 'Maximum 50 recipients allowed per bulk send'
        });
      }
      
      // Check if WhatsApp client is ready
      const botStatus = await whatsappService.getStatus();
      if (!botStatus.isReady) {
        return res.status(503).json({
          success: false,
          error: 'WhatsApp bot is not ready',
          message: 'Please wait for the bot to connect to WhatsApp'
        });
      }
      
      const results = [];
      const options = {
        messageType: messageType || 'text'
      };
      
      if (req.file) {
        options.media = req.file.path;
      }
      
      // Send to each recipient
      for (const recipient of recipients) {
        try {
          const result = await whatsappService.sendMessage(recipient, message, options);
          results.push({
            recipient: recipient,
            success: true,
            messageId: result.messageId,
            data: result.data
          });
          
          // Small delay between messages to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          results.push({
            recipient: recipient,
            success: false,
            error: error.message
          });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      
      res.json({
        success: true,
        message: `Bulk send completed: ${successCount} successful, ${failureCount} failed`,
        data: {
          results: results,
          summary: {
            total: recipients.length,
            successful: successCount,
            failed: failureCount
          }
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error in bulk send:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send bulk messages',
        message: error.message
      });
    }
  }

  // GET /api/messages/statistics - Get message statistics
  static async getMessageStatistics(req, res) {
    try {
      const { dataService } = req.app.locals;
      const timeRange = req.query.timeRange || 'week';
      
      const analytics = await dataService.getAnalytics(timeRange);
      
      res.json({
        success: true,
        data: {
          messageVolume: analytics.messageVolume,
          timeRange: timeRange,
          lastUpdated: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error('❌ Error getting message statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get message statistics',
        message: error.message
      });
    }
  }
}
