import { Message, Contact, Settings, Analytics, SessionData, Chat } from '../models/index.js';
import databaseService from '../config/database.js';
import fs from 'fs/promises';
import path from 'path';

class MongoDataService {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    try {
      // Ensure database connection
      if (!databaseService.isMongoConnected()) {
        await databaseService.connect();
      }
      
      this.initialized = true;
      console.log('MongoDataService initialized successfully');
    } catch (error) {
      console.error(' Error initializing MongoDataService:', error);
      throw error;
    }
  }

  // Message operations
  async saveMessage(messageData) {
    try {
      const message = new Message({
        messageId: messageData.id || messageData.messageId,
        sender: messageData.from || messageData.sender,
        senderName: messageData.fromName || messageData.senderName,
        recipient: messageData.to || messageData.recipient,
        content: messageData.body || messageData.content || messageData.message,
        type: messageData.type || 'text',
        direction: messageData.fromMe ? 'outgoing' : 'incoming',
        status: messageData.status || 'sent',
        timestamp: messageData.timestamp ? new Date(messageData.timestamp * 1000) : new Date(),
        hasMedia: messageData.hasMedia || false,
        mediaPath: messageData.mediaPath,
        mediaType: messageData.mediaType,
        mediaName: messageData.mediaName,
        isGroupMsg: messageData.isGroupMsg || false,
        fromMe: messageData.fromMe || false,
        chat: messageData.chatId || messageData.chat,
        quotedMsg: messageData.quotedMsg,
        metadata: messageData.metadata || {}
      });

      const savedMessage = await message.save();
      console.log(` Message saved: ${savedMessage.messageId}`);
      return savedMessage;
    } catch (error) {
      if (error.code === 11000) {
        // Duplicate key error - message already exists
        console.log(`Message already exists: ${messageData.id || messageData.messageId}`);
        return await Message.findOne({ messageId: messageData.id || messageData.messageId });
      }
      console.error(' Error saving message:', error);
      throw error;
    }
  }

  async loadMessages(limit = 100, offset = 0, filters = {}) {
    try {
      const query = {};
      
      // Apply filters
      if (filters.sender) query.sender = filters.sender;
      if (filters.recipient) query.recipient = filters.recipient;
      if (filters.direction) query.direction = filters.direction;
      if (filters.type) query.type = filters.type;
      if (filters.status) query.status = filters.status;
      if (filters.dateFrom) query.timestamp = { ...query.timestamp, $gte: new Date(filters.dateFrom) };
      if (filters.dateTo) query.timestamp = { ...query.timestamp, $lte: new Date(filters.dateTo) };
      if (filters.chat) query.chat = filters.chat;

      const messages = await Message.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(offset)
        .lean();
        // console.log(messages);
      return messages;
    } catch (error) {
      console.error(' Error loading messages:', error);
      throw error;
    }
  }

  // Alias for compatibility with existing code that expects getMessages
  async getMessages(filters = {}) {
    try {
      const limit = filters.limit || 100;
      const offset = filters.offset || 0;
      
      // Remove limit and offset from filters to pass clean filters to loadMessages
      const { limit: _, offset: __, ...cleanFilters } = filters;
      
      const messages = await this.loadMessages(limit, offset, cleanFilters);
      
      // Transform to match expected format if needed
      const result = messages.map(message => ({
        id: message.messageId,
        messageId: message.messageId,
        sender: message.sender,
        senderName: message.senderName,
        recipient: message.recipient,
        content: message.content,
        type: message.type,
        direction: message.direction,
        status: message.status,
        timestamp: message.timestamp,
        hasMedia: message.hasMedia,
        mediaPath: message.mediaPath,
        mediaType: message.mediaType,
        mediaName: message.mediaName,
        isGroupMsg: message.isGroupMsg,
        fromMe: message.fromMe,
        chat: message.chat,
        quotedMsg: message.quotedMsg,
        metadata: message.metadata,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt
      }));
    //   console.log(`messages: ${result}`)
        return result;
    } catch (error) {
      console.error(' Error getting messages:', error);
      throw error;
    }
  }

  async getMessageById(messageId) {
    try {
      return await Message.findOne({ messageId }).lean();
    } catch (error) {
      console.error(' Error getting message by ID:', error);
      throw error;
    }
  }

  async updateMessageStatus(messageId, status) {
    try {
      const result = await Message.updateOne(
        { messageId },
        { status, updatedAt: new Date() }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error(' Error updating message status:', error);
      throw error;
    }
  }

  async deleteMessage(messageId) {
    try {
      const result = await Message.deleteOne({ messageId });
      return result.deletedCount > 0;
    } catch (error) {
      console.error(' Error deleting message:', error);
      throw error;
    }
  }

  // Additional message-related methods for full compatibility
  async getMessagesByContact(contactId, limit = 100, offset = 0) {
    try {
      const query = {
        $or: [
          { sender: contactId },
          { recipient: contactId }
        ]
      };

      const messages = await Message.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(offset)
        .lean();

      return messages;
    } catch (error) {
      console.error(' Error getting messages by contact:', error);
      throw error;
    }
  }

  async getMessagesByChat(chatId, limit = 100, offset = 0) {
    try {
      const messages = await Message.find({ chat: chatId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(offset)
        .lean();

      return messages;
    } catch (error) {
      console.error(' Error getting messages by chat:', error);
      throw error;
    }
  }

  async getMessageCount(filters = {}) {
    try {
      const query = {};
      
      // Apply same filters as in getMessages
      if (filters.sender) query.sender = filters.sender;
      if (filters.recipient) query.recipient = filters.recipient;
      if (filters.direction) query.direction = filters.direction;
      if (filters.type) query.type = filters.type;
      if (filters.status) query.status = filters.status;
      if (filters.dateFrom) query.timestamp = { ...query.timestamp, $gte: new Date(filters.dateFrom) };
      if (filters.dateTo) query.timestamp = { ...query.timestamp, $lte: new Date(filters.dateTo) };
      if (filters.chat) query.chat = filters.chat;

      return await Message.countDocuments(query);
    } catch (error) {
      console.error(' Error getting message count:', error);
      throw error;
    }
  }

  async searchMessages(searchTerm, limit = 50, offset = 0) {
    try {
      const query = {
        $or: [
          { content: { $regex: searchTerm, $options: 'i' } },
          { senderName: { $regex: searchTerm, $options: 'i' } }
        ]
      };

      const messages = await Message.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(offset)
        .lean();

      return messages;
    } catch (error) {
      console.error(' Error searching messages:', error);
      throw error;
    }
  }

  async saveContact(contactData) {
    try {
      const contact = await Contact.findOneAndUpdate(
        { contactId: contactData.id?.user || contactData.contactId },
        {
          contactId: contactData.id?.user || contactData.contactId,
          name: contactData.name || contactData.verifiedName,
          number: contactData.number || contactData.id?.user,
          pushname: contactData.pushname,
          isUser: contactData.isUser !== false,
          isGroup: contactData.isGroup || false,
          profilePicUrl: contactData.profilePicUrl,
          lastSeen: contactData.lastSeen ? new Date(contactData.lastSeen) : undefined,
          isBlocked: contactData.isBlocked || false,
          tags: contactData.tags || [],
          metadata: contactData.metadata || {}
        },
        { upsert: true, new: true }
      );

      console.log(` Contact saved: ${contact.contactId}`);
      return contact;
    } catch (error) {
      console.error(' Error saving contact:', error);
      throw error;
    }
  }

  async loadContacts(limit = 100, offset = 0) {
    try {
      const contacts = await Contact.find({})
        .sort({ name: 1 })
        .limit(limit)
        .skip(offset)
        .lean();

      return contacts;
    } catch (error) {
      console.error(' Error loading contacts:', error);
      throw error;
    }
  }

  async getContactById(contactId) {
    try {
      return await Contact.findOne({ contactId }).lean();
    } catch (error) {
      console.error(' Error getting contact by ID:', error);
      throw error;
    }
  }

  // Settings operations
  async saveSetting(key, value, category = 'general', description = '') {
    try {
      const setting = await Settings.findOneAndUpdate(
        { key },
        { key, value, category, description },
        { upsert: true, new: true }
      );

      console.log(`  Setting saved: ${key}`);
      return setting;
    } catch (error) {
      console.error(' Error saving setting:', error);
      throw error;
    }
  }

  async loadSettings(category = null) {
    try {
      const query = category ? { category } : {};
      const settings = await Settings.find(query).lean();
      const settingsObj = {};
      settings.forEach(setting => {
        settingsObj[setting.key] = setting.value;
      });

      return settingsObj;
    } catch (error) {
      console.error(' Error loading settings:', error);
      throw error;
    }
  }

  // Alias for loadSettings to maintain compatibility
  async getSettings(category = null) {
    return await this.loadSettings(category);
  }

  // Update settings method
  async updateSettings(newSettings) {
    try {
      const updatePromises = [];
      for (const [key, value] of Object.entries(newSettings)) {
        updatePromises.push(this.saveSetting(key, value));
      }
      await Promise.all(updatePromises);
      
      // Return the updated settings
      return await this.getSettings();
    } catch (error) {
      console.error(' Error updating settings:', error);
      throw error;
    }
  }

  async getSetting(key, defaultValue = null) {
    try {
      const setting = await Settings.findOne({ key }).lean();
      return setting ? setting.value : defaultValue;
    } catch (error) {
      console.error(' Error getting setting:', error);
      return defaultValue;
    }
  }
  async deleteSetting(key) {
    try {
      const result = await Settings.deleteOne({ key });
      return result.deletedCount > 0;
    } catch (error) {
      console.error(' Error deleting setting:', error);
      throw error;
    }
  }
  async saveAnalytics(type, data, date = new Date()) {
    try {
      const analytics = new Analytics({
        date: new Date(date),
        type,
        data,
        count: data.count || 1,
        metadata: data.metadata || {}
      });

      const savedAnalytics = await analytics.save();
      console.log(`Analytics saved: ${type} for ${date.toISOString().split('T')[0]}`);
      return savedAnalytics;
    } catch (error) {
      console.error(' Error saving analytics:', error);
      throw error;
    }
  }
  async loadAnalytics(type = null, dateFrom = null, dateTo = null, limit = 100) {
    try {
      const query = {};
      
      if (type) query.type = type;
      if (dateFrom) query.date = { ...query.date, $gte: new Date(dateFrom) };
      if (dateTo) query.date = { ...query.date, $lte: new Date(dateTo) };

      const analytics = await Analytics.find(query)
        .sort({ date: -1 })
        .limit(limit)
        .lean();

      return analytics;
    } catch (error) {
      console.error(' Error loading analytics:', error);
      throw error;
    }
  }

  async getAnalyticsSummary(dateFrom, dateTo) {
    try {
      const summary = await Analytics.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(dateFrom),
              $lte: new Date(dateTo)
            }
          }
        },
        {
          $group: {
            _id: '$type',
            totalCount: { $sum: '$count' },
            records: { $sum: 1 },
            latestDate: { $max: '$date' }
          }
        }
      ]);

      return summary;
    } catch (error) {
      console.error(' Error getting analytics summary:', error);
      throw error;
    }
  }

  // Alias for compatibility
  async getAnalytics() {
    try {
      const analytics = await Analytics.find().sort({ date: -1 }).limit(1000).lean();
      return {
        autoReplies: analytics.filter(a => a.type === 'auto_reply').map(a => a.data),
        messages: analytics.filter(a => a.type === 'message').map(a => a.data),
        general: analytics.filter(a => !['auto_reply', 'message'].includes(a.type))
      };
    } catch (error) {
      console.error(' Error getting analytics:', error);
      return { autoReplies: [], messages: [], general: [] };
    }
  }

  // Update analytics method for compatibility
  async updateAnalytics(analyticsData) {
    try {
      // Handle different analytics data structures
      if (analyticsData.autoReplies) {
        for (const reply of analyticsData.autoReplies) {
          await this.saveAutoReply(reply);
        }
      }
      if (analyticsData.messages) {
        for (const message of analyticsData.messages) {
          await this.saveAnalytics('message', message);
        }
      }
      return analyticsData;
    } catch (error) {
      console.error(' Error updating analytics:', error);
      throw error;
    }
  }

  // Auto-reply tracking method
  async saveAutoReply(replyData) {
    try {
      const analytics = new Analytics({
        date: new Date(replyData.timestamp || new Date()),
        type: 'auto_reply',
        data: {
          sender: replyData.sender,
          senderName: replyData.senderName,
          message: replyData.message,
          response: replyData.response,
          responseType: replyData.responseType,
          isGroup: replyData.isGroup,
          isWorkingHours: replyData.isWorkingHours,
          timestamp: replyData.timestamp
        },
        count: 1,
        metadata: {
          responseType: replyData.responseType,
          isGroup: replyData.isGroup,
          isWorkingHours: replyData.isWorkingHours
        }
      });

      const savedAnalytics = await analytics.save();
      console.log(`📊 Auto-reply analytics saved for: ${replyData.sender}`);
      return savedAnalytics;
    } catch (error) {
      console.error(' Error saving auto-reply analytics:', error);
      throw error;
    }
  }
  async saveSessionData(key, data, expiresAt = null) {
    try {
      const sessionData = await SessionData.findOneAndUpdate(
        { key },
        { key, data, expiresAt },
        { upsert: true, new: true }
      );

      console.log(`🔑 Session data saved: ${key}`);
      return sessionData;
    } catch (error) {
      console.error(' Error saving session data:', error);
      throw error;
    }
  }

  async loadSessionData(key) {
    try {
      const sessionData = await SessionData.findOne({ key }).lean();
      return sessionData ? sessionData.data : null;
    } catch (error) {
      console.error(' Error loading session data:', error);
      throw error;
    }
  }

  async deleteSessionData(key) {
    try {
      const result = await SessionData.deleteOne({ key });
      return result.deletedCount > 0;
    } catch (error) {
      console.error(' Error deleting session data:', error);
      throw error;
    }
  }

  // Chat operations
  async saveChat(chatData) {
    try {
      const chat = await Chat.findOneAndUpdate(
        { chatId: chatData.id?.user || chatData.chatId },
        {
          chatId: chatData.id?.user || chatData.chatId,
          name: chatData.name,
          isGroup: chatData.isGroup || false,
          participants: chatData.participants || [],
          unreadCount: chatData.unreadCount || 0,
          lastMessage: chatData.lastMessage,
          isPinned: chatData.isPinned || false,
          isMuted: chatData.isMuted || false,
          metadata: chatData.metadata || {}
        },
        { upsert: true, new: true }
      );

      console.log(` Chat saved: ${chat.chatId}`);
      return chat;
    } catch (error) {
      console.error(' Error saving chat:', error);
      throw error;
    }
  }

  async loadChats(limit = 100, offset = 0) {
    try {
      const chats = await Chat.find({})
        .sort({ updatedAt: -1 })
        .limit(limit)
        .skip(offset)
        .lean();

      return chats;
    } catch (error) {
      console.error(' Error loading chats:', error);
      throw error;
    }
  }

  // Migration utilities
  async migrateFromJsonFiles(dataDir = './data') {
    try {
      console.log('Starting migration from JSON files...');

      // Migrate messages
      try {
        const messagesPath = path.join(dataDir, 'messages.json');
        const messagesData = JSON.parse(await fs.readFile(messagesPath, 'utf8'));
        
        if (Array.isArray(messagesData)) {
          for (const message of messagesData) {
            await this.saveMessage(message);
          }
          console.log(`Migrated ${messagesData.length} messages`);
        }
      } catch (error) {
        console.log('No messages.json found or error reading it');
      }

      // Migrate settings
      try {
        const settingsPath = path.join(dataDir, 'settings.json');
        const settingsData = JSON.parse(await fs.readFile(settingsPath, 'utf8'));
        
        for (const [key, value] of Object.entries(settingsData)) {
          await this.saveSetting(key, value);
        }
        console.log(`Migrated ${Object.keys(settingsData).length} settings`);
      } catch (error) {
        console.log('No settings.json found or error reading it');
      }

      // Migrate analytics
      try {
        const analyticsPath = path.join(dataDir, 'analytics.json');
        const analyticsData = JSON.parse(await fs.readFile(analyticsPath, 'utf8'));
        
        if (Array.isArray(analyticsData)) {
          for (const analytics of analyticsData) {
            await this.saveAnalytics(analytics.type, analytics.data, analytics.date);
          }
          console.log(`Migrated ${analyticsData.length} analytics records`);
        }
      } catch (error) {
        console.log('No analytics.json found or error reading it');
      }
      console.log('Migration completed successfully');
    } catch (error) {
      console.error(' Error during migration:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    try {
      const dbHealth = await databaseService.healthCheck();
      const messageCount = await Message.countDocuments();
      const contactCount = await Contact.countDocuments();
      const settingsCount = await Settings.countDocuments();
      const analyticsCount = await Analytics.countDocuments();

      return {
        status: 'healthy',
        database: dbHealth,
        collections: {
          messages: messageCount,
          contacts: contactCount,
          settings: settingsCount,
          analytics: analyticsCount
        },
        initialized: this.initialized
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        initialized: this.initialized
      };
    }
  }

  // Backward compatibility methods
  async saveData(filename, data) {
    // Map old file-based methods to new MongoDB methods
    if (filename.includes('messages')) {
      if (Array.isArray(data)) {
        for (const message of data) {
          await this.saveMessage(message);
        }
      }
    } else if (filename.includes('settings')) {
      for (const [key, value] of Object.entries(data)) {
        await this.saveSetting(key, value);
      }
    } else if (filename.includes('analytics')) {
      if (Array.isArray(data)) {
        for (const analytics of data) {
          await this.saveAnalytics(analytics.type, analytics.data, analytics.date);
        }
      }
    } else {
      // For other data types like QR codes, store as session data
      await this.saveSessionData(filename, data);
    }
  }

  async loadData(filename, defaultData = []) {
    try {
      if (filename.includes('messages')) {
        return await this.loadMessages(1000); // Load more for compatibility
      } else if (filename.includes('settings')) {
        return await this.loadSettings();
      } else if (filename.includes('analytics')) {
        return await this.loadAnalytics();
      }
      return defaultData;
    } catch (error) {
      console.error(` Error loading data for ${filename}:`, error);
      return defaultData;
    }
  }

  // Generic data getter for compatibility
  async getData(key, defaultValue = null) {
    try {
      // First try session data
      const sessionData = await this.loadSessionData(key);
      if (sessionData !== null) {
        return sessionData;
      }
      
      // Fallback to settings
      const setting = await this.getSetting(key, defaultValue);
      return setting;
    } catch (error) {
      console.error(` Error getting data for ${key}:`, error);
      return defaultValue;
    }
  }
}

export default MongoDataService;
