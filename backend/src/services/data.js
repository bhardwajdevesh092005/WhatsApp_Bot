import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DataService {
  constructor() {
    this.dataPath = process.env.DATA_PATH || path.join(__dirname, '../../data');
    this.messages = [];
    this.settings = this.getDefaultSettings();
    this.analytics = {
      dailyStats: new Map(),
      hourlyDistribution: new Array(24).fill(0),
      contactStats: new Map(),
      errorLog: []
    };
    
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('Initializing data service...');
      
      // Ensure data directory exists
      await this.ensureDirectoryExists(this.dataPath);
      
      // Load existing data
      await this.loadMessages();
      await this.loadSettings();
      await this.loadAnalytics();
      
      this.isInitialized = true;
      console.log('Data service initialized successfully');
      
      // Start periodic data persistence
      this.startPeriodicSave();
      
    } catch (error) {
      console.error(' Failed to initialize data service:', error);
      throw error;
    }
  }

  async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch (error) {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  // Message Management
  async saveMessage(messageData) {
    try {
      // Add unique ID if not present
      if (!messageData.id) {
        messageData.id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      
      // Add or update message
      const existingIndex = this.messages.findIndex(m => m.id === messageData.id);
      if (existingIndex !== -1) {
        this.messages[existingIndex] = { ...this.messages[existingIndex], ...messageData };
      } else {
        this.messages.push(messageData);
      }
      
      // Update analytics
      this.updateAnalytics(messageData);
      
      // Persist data
      await this.persistMessages();
      
      console.log(` Saved message: ${messageData.id}`);
      
    } catch (error) {
      console.error(' Error saving message:', error);
      throw error;
    }
  }

  async updateMessageStatus(messageId, status) {
    try {
      const messageIndex = this.messages.findIndex(m => m.id === messageId);
      if (messageIndex !== -1) {
        this.messages[messageIndex].status = status;
        this.messages[messageIndex].statusUpdatedAt = new Date().toISOString();
        
        await this.persistMessages();
        console.log(` Updated message ${messageId} status to: ${status}`);
      }
    } catch (error) {
      console.error(' Error updating message status:', error);
      throw error;
    }
  }

  async getMessages(filters = {}) {
    let filteredMessages = [...this.messages];
    
    // Apply filters
    if (filters.status) {
      filteredMessages = filteredMessages.filter(m => m.status === filters.status);
    }
    
    if (filters.direction) {
      filteredMessages = filteredMessages.filter(m => m.direction === filters.direction);
    }
    
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filteredMessages = filteredMessages.filter(m => new Date(m.timestamp) >= fromDate);
    }
    
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      filteredMessages = filteredMessages.filter(m => new Date(m.timestamp) <= toDate);
    }
    
    if (filters.sender) {
      filteredMessages = filteredMessages.filter(m => 
        m.sender?.includes(filters.sender) || m.recipient?.includes(filters.sender)
      );
    }
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredMessages = filteredMessages.filter(m => 
        m.content?.toLowerCase().includes(searchTerm) ||
        m.sender?.toLowerCase().includes(searchTerm) ||
        m.recipient?.toLowerCase().includes(searchTerm)
      );
    }
    
    // Sort by timestamp (newest first)
    filteredMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Apply pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 50;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedMessages = filteredMessages.slice(startIndex, endIndex);
    
    return {
      messages: paginatedMessages,
      total: filteredMessages.length,
      page: page,
      limit: limit,
      pages: Math.ceil(filteredMessages.length / limit)
    };
  }

  async getRecentMessages(limit = 10) {
    const recentMessages = this.messages
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
    
    return recentMessages;
  }

  // Settings Management
  getDefaultSettings() {
    return {
      botName: 'WhatsApp Bot',
      autoReply: true,
      autoReplyMessage: 'Thanks for your message! We will get back to you soon.',
      afterHoursMessage: 'Thank you for your message. We are currently outside business hours. We will respond as soon as possible during our working hours.',
      webhookUrl: '',
      maxRetries: 3,
      retryDelay: 5000,
      enableLogging: true,
      logLevel: 'info',
      allowedContacts: [],
      blockedContacts: [],
      workingHours: {
        enabled: false,
        start: '09:00',
        end: '17:00',
        timezone: 'UTC'
      },
      notifications: {
        email: false,
        webhook: false,
        emailAddress: ''
      },
      llm: {
        enabled: true,
        autoReply: true,
        provider: 'gemini',
        model: 'gemini-1.5-flash',
        // apiKey: '',
        // baseURL: 'https://api.openai.com/v1',
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
      }
    };
  }

  async getSettings() {
    return { ...this.settings };
  }

  async updateSettings(newSettings) {
    try {
      this.settings = { ...this.settings, ...newSettings };
      await this.persistSettings();
      console.log(' Settings updated successfully');
      return this.settings;
    } catch (error) {
      console.error(' Error updating settings:', error);
      throw error;
    }
  }

  // Analytics
  updateAnalytics(messageData) {
    const messageDate = new Date(messageData.timestamp);
    const dateKey = messageDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const hour = messageDate.getHours();
    
    // Update daily stats
    if (!this.analytics.dailyStats.has(dateKey)) {
      this.analytics.dailyStats.set(dateKey, {
        date: dateKey,
        total: 0,
        sent: 0,
        received: 0,
        failed: 0
      });
    }
    
    const dayStats = this.analytics.dailyStats.get(dateKey);
    dayStats.total++;
    
    if (messageData.direction === 'outgoing') {
      if (messageData.status === 'failed') {
        dayStats.failed++;
      } else {
        dayStats.sent++;
      }
    } else {
      dayStats.received++;
    }
    
    // Update hourly distribution
    this.analytics.hourlyDistribution[hour]++;
    
    // Update contact stats
    const contact = messageData.sender || messageData.recipient;
    if (contact) {
      if (!this.analytics.contactStats.has(contact)) {
        this.analytics.contactStats.set(contact, {
          phone: contact,
          messageCount: 0,
          lastActive: messageData.timestamp,
          firstContact: messageData.timestamp
        });
      }
      
      const contactStats = this.analytics.contactStats.get(contact);
      contactStats.messageCount++;
      contactStats.lastActive = messageData.timestamp;
    }
    
    // Log errors
    if (messageData.status === 'failed' && messageData.error) {
      this.analytics.errorLog.push({
        timestamp: messageData.timestamp,
        error: messageData.error,
        messageId: messageData.id,
        contact: contact
      });
      
      // Keep only last 1000 errors
      if (this.analytics.errorLog.length > 1000) {
        this.analytics.errorLog = this.analytics.errorLog.slice(-1000);
      }
    }
  }

  async getAnalytics(timeRange = 'week') {
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case 'day':
        startDate = new Date(now - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
    }
    
    // Filter messages by time range
    const filteredMessages = this.messages.filter(m => 
      new Date(m.timestamp) >= startDate
    );
    
    // Calculate metrics
    const totalMessages = filteredMessages.length;
    const sentMessages = filteredMessages.filter(m => 
      m.direction === 'outgoing' && m.status !== 'failed'
    ).length;
    const receivedMessages = filteredMessages.filter(m => 
      m.direction === 'incoming'
    ).length;
    const failedMessages = filteredMessages.filter(m => 
      m.status === 'failed'
    ).length;
    
    // Calculate trend (compare with previous period)
    const previousPeriodStart = new Date(startDate - (now - startDate));
    const previousMessages = this.messages.filter(m => 
      new Date(m.timestamp) >= previousPeriodStart && new Date(m.timestamp) < startDate
    );
    const trend = previousMessages.length > 0 
      ? Math.round(((totalMessages - previousMessages.length) / previousMessages.length) * 100)
      : 0;
    
    // Top contacts
    const topContacts = Array.from(this.analytics.contactStats.values())
      .sort((a, b) => b.messageCount - a.messageCount)
      .slice(0, 10);
    
    // Hourly distribution
    const hourlyDistribution = this.analytics.hourlyDistribution.map((count, hour) => ({
      hour,
      count
    }));
    
    // Error analysis
    const errorAnalysis = this.analyzeErrors();
    
    return {
      messageVolume: {
        total: totalMessages,
        sent: sentMessages,
        received: receivedMessages,
        failed: failedMessages,
        trend: trend
      },
      responseTime: this.calculateResponseTimes(filteredMessages),
      topContacts: topContacts,
      hourlyDistribution: hourlyDistribution,
      dailyStats: this.getDailyStats(startDate),
      errorAnalysis: errorAnalysis
    };
  }

  calculateResponseTimes(messages) {
    const responseTimes = [];
    
    // Group messages by contact
    const contactMessages = new Map();
    messages.forEach(msg => {
      const contact = msg.sender || msg.recipient;
      if (!contactMessages.has(contact)) {
        contactMessages.set(contact, []);
      }
      contactMessages.get(contact).push(msg);
    });
    
    // Calculate response times
    contactMessages.forEach(msgs => {
      msgs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      for (let i = 1; i < msgs.length; i++) {
        const current = msgs[i];
        const previous = msgs[i - 1];
        
        // If current is outgoing and previous is incoming, calculate response time
        if (current.direction === 'outgoing' && previous.direction === 'incoming') {
          const responseTime = new Date(current.timestamp) - new Date(previous.timestamp);
          responseTimes.push(responseTime / 1000); // Convert to seconds
        }
      }
    });
    
    if (responseTimes.length === 0) {
      return { average: 0, fastest: 0, slowest: 0 };
    }
    
    const average = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const fastest = Math.min(...responseTimes);
    const slowest = Math.max(...responseTimes);
    
    return {
      average: Math.round(average),
      fastest: Math.round(fastest),
      slowest: Math.round(slowest)
    };
  }

  getDailyStats(startDate) {
    const dailyStats = [];
    const endDate = new Date();
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      const stats = this.analytics.dailyStats.get(dateKey) || {
        date: dateKey,
        total: 0,
        sent: 0,
        received: 0,
        failed: 0
      };
      dailyStats.push(stats);
    }
    
    return dailyStats;
  }

  analyzeErrors() {
    const errorCounts = new Map();
    
    this.analytics.errorLog.forEach(error => {
      const errorType = this.categorizeError(error.error);
      if (!errorCounts.has(errorType)) {
        errorCounts.set(errorType, {
          type: errorType,
          count: 0,
          lastOccurrence: error.timestamp,
          resolved: false
        });
      }
      
      const errorStat = errorCounts.get(errorType);
      errorStat.count++;
      if (error.timestamp > errorStat.lastOccurrence) {
        errorStat.lastOccurrence = error.timestamp;
      }
    });
    
    return Array.from(errorCounts.values());
  }

  categorizeError(errorMessage) {
    const message = errorMessage.toLowerCase();
    
    if (message.includes('network') || message.includes('connection')) {
      return 'Network Error';
    } else if (message.includes('auth') || message.includes('authentication')) {
      return 'Authentication Error';
    } else if (message.includes('rate') || message.includes('limit')) {
      return 'Rate Limit';
    } else if (message.includes('media') || message.includes('file')) {
      return 'Media Error';
    } else if (message.includes('invalid') || message.includes('format')) {
      return 'Invalid Format';
    } else {
      return 'Unknown Error';
    }
  }

  // Statistics
  async getStats() {
    const totalMessages = this.messages.length;
    const sentMessages = this.messages.filter(m => 
      m.direction === 'outgoing' && m.status !== 'failed'
    ).length;
    const receivedMessages = this.messages.filter(m => 
      m.direction === 'incoming'
    ).length;
    const failedMessages = this.messages.filter(m => 
      m.status === 'failed'
    ).length;
    
    return {
      totalMessages,
      sentMessages,
      receivedMessages,
      failedMessages,
      uniqueContacts: this.analytics.contactStats.size,
      dataInitialized: this.isInitialized
    };
  }

  // Data Persistence
  async persistMessages() {
    if (process.env.ENABLE_DATA_PERSISTENCE === 'true') {
      try {
        const filePath = path.join(this.dataPath, 'messages.json');
        await fs.writeFile(filePath, JSON.stringify(this.messages, null, 2));
      } catch (error) {
        console.error(' Error persisting messages:', error);
      }
    }
  }

  async persistSettings() {
    if (process.env.ENABLE_DATA_PERSISTENCE === 'true') {
      try {
        const filePath = path.join(this.dataPath, 'settings.json');
        await fs.writeFile(filePath, JSON.stringify(this.settings, null, 2));
      } catch (error) {
        console.error(' Error persisting settings:', error);
      }
    }
  }

  async persistAnalytics() {
    if (process.env.ENABLE_DATA_PERSISTENCE === 'true') {
      try {
        const analyticsData = {
          dailyStats: Array.from(this.analytics.dailyStats.entries()),
          hourlyDistribution: this.analytics.hourlyDistribution,
          contactStats: Array.from(this.analytics.contactStats.entries()),
          errorLog: this.analytics.errorLog.slice(-1000) // Keep only last 1000 errors
        };
        
        const filePath = path.join(this.dataPath, 'analytics.json');
        await fs.writeFile(filePath, JSON.stringify(analyticsData, null, 2));
      } catch (error) {
        console.error(' Error persisting analytics:', error);
      }
    }
  }

  async loadMessages() {
    try {
      const filePath = path.join(this.dataPath, 'messages.json');
      const data = await fs.readFile(filePath, 'utf8');
      this.messages = JSON.parse(data);
      console.log(`📚 Loaded ${this.messages.length} messages from storage`);
    } catch (error) {
      console.log('📚 No existing messages found, starting fresh');
    }
  }

  async loadSettings() {
    try {
      const filePath = path.join(this.dataPath, 'settings.json');
      const data = await fs.readFile(filePath, 'utf8');
      this.settings = { ...this.getDefaultSettings(), ...JSON.parse(data) };
      console.log(' Loaded settings from storage');
    } catch (error) {
      console.log(' No existing settings found, using defaults');
    }
  }

  async loadAnalytics() {
    try {
      const filePath = path.join(this.dataPath, 'analytics.json');
      const data = await fs.readFile(filePath, 'utf8');
      const analyticsData = JSON.parse(data);
      
      this.analytics.dailyStats = new Map(analyticsData.dailyStats || []);
      this.analytics.hourlyDistribution = analyticsData.hourlyDistribution || new Array(24).fill(0);
      this.analytics.contactStats = new Map(analyticsData.contactStats || []);
      this.analytics.errorLog = analyticsData.errorLog || [];
      
      console.log('Loaded analytics from storage');
    } catch (error) {
      console.log('No existing analytics found, starting fresh');
    }
  }

  // Save data periodically
  startPeriodicSave() {
    setInterval(async () => {
      try {
        await this.persistMessages();
        await this.persistSettings();
        await this.persistAnalytics();
        console.log(' Periodic data save completed');
      } catch (error) {
        console.error(' Error in periodic save:', error);
      }
    }, 5 * 60 * 1000); // Save every 5 minutes
  }

  // Utility methods
  async saveData(key, data) {
    try {
      const filePath = path.join(this.dataPath, `${key}.json`);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(` Error saving ${key}:`, error);
    }
  }

  async loadData(key) {
    try {
      const filePath = path.join(this.dataPath, `${key}.json`);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  // Health check method
  async getHealth() {
    return {
      status: 'healthy',
      messagesCount: this.messages.length,
      settingsLoaded: Object.keys(this.settings).length > 0,
      dataFiles: {
        messages: this.messagesFile,
        settings: this.settingsFile,
        analytics: path.join(this.dataPath, 'analytics.json')
      },
      lastUpdated: new Date().toISOString()
    };
  }

  async cleanup() {
    try {
      await this.persistMessages();
      await this.persistSettings();
      await this.persistAnalytics();
      console.log(' Data service cleanup completed');
    } catch (error) {
      console.error(' Error during data service cleanup:', error);
    }
  }
}
