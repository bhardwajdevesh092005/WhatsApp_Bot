import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;
import qrcode from 'qrcode';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class WhatsAppService {
  constructor(socketService, dataService) {
    this.client = null;
    this.socketService = socketService;
    this.dataService = dataService;
    this.isReady = false;
    this.qrCode = null;
    this.clientInfo = null;
    this.status = 'disconnected';
    this.retryCount = 0;
    this.maxRetries = 3;
    
    // Initialize client
    this.initializeClient();
  }

  initializeClient() {
    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: process.env.WHATSAPP_SESSION_NAME || 'whatsapp-bot-session'
      }),
      puppeteer: {
        headless: process.env.WHATSAPP_HEADLESS === 'true',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      }
    });

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // QR Code generation
    this.client.on('qr', async (qr) => {
      console.log('📱 QR Code received, scan with WhatsApp mobile app');
      try {
        this.qrCode = await qrcode.toDataURL(qr);
        this.status = 'qr_code';
        
        // Emit QR code to connected clients
        this.socketService.emit('bot:qr', {
          qrCode: this.qrCode,
          status: this.status,
          message: 'Scan QR code with WhatsApp mobile app'
        });
        
        // Save QR code for API access
        await this.dataService.saveData('qr_code', {
          qrCode: this.qrCode,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('❌ Error generating QR code:', error);
      }
    });

    // Client ready
    this.client.on('ready', async () => {
      console.log('✅ WhatsApp Client is ready!');
      
      this.isReady = true;
      this.status = 'connected';
      this.retryCount = 0;
      this.qrCode = null;
      
      // Get client info
      this.clientInfo = {
        pushname: this.client.info.pushname,
        wid: this.client.info.wid._serialized,
        platform: this.client.info.platform,
        connectedAt: new Date().toISOString()
      };
      
      // Emit ready status
      this.socketService.emit('bot:ready', {
        status: this.status,
        clientInfo: this.clientInfo,
        message: 'WhatsApp bot is ready to receive and send messages'
      });
      
      // Update status
      this.emitStatusUpdate();
      
      // Save client info
      await this.dataService.saveData('client_info', this.clientInfo);
    });

    // Authentication success
    this.client.on('authenticated', (session) => {
      console.log('🔐 WhatsApp authenticated successfully');
      this.status = 'authenticated';
      this.emitStatusUpdate();
    });

    // Authentication failure
    this.client.on('auth_failure', (msg) => {
      console.error('❌ WhatsApp authentication failed:', msg);
      this.status = 'auth_failed';
      this.emitStatusUpdate();
      
      // Clear saved session and retry
      this.handleAuthFailure();
    });

    // Disconnected
    this.client.on('disconnected', (reason) => {
      console.log('🔌 WhatsApp Client disconnected:', reason);
      this.isReady = false;
      this.status = 'disconnected';
      this.clientInfo = null;
      this.emitStatusUpdate();
      
      // Attempt reconnection
      this.handleDisconnection();
    });

    // Incoming messages
    this.client.on('message', async (message) => {
      try {
        console.log('📨 Received message:', message.body);
        
        // Process incoming message
        const messageData = await this.processIncomingMessage(message);
        
        // Save to data service
        await this.dataService.saveMessage(messageData);
        
        // Emit to connected clients
        this.socketService.emit('message:new', messageData);
        
        // Handle auto-reply if enabled
        await this.handleAutoReply(message, messageData);
        
      } catch (error) {
        console.error('❌ Error processing incoming message:', error);
      }
    });

    // Message acknowledgment (delivery status)
    this.client.on('message_ack', async (message, ack) => {
      try {
        const status = this.getMessageStatus(ack);
        console.log(`📝 Message ${message.id._serialized} status: ${status}`);
        
        // Update message status in data service
        await this.dataService.updateMessageStatus(message.id._serialized, status);
        
        // Emit status update
        this.socketService.emit('message:status', {
          messageId: message.id._serialized,
          status: status,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('❌ Error updating message status:', error);
      }
    });
  }

  async initialize() {
    try {
      console.log('🔄 Initializing WhatsApp client...');
      await this.client.initialize();
    } catch (error) {
      console.error('❌ Failed to initialize WhatsApp client:', error);
      throw error;
    }
  }

  async sendMessage(to, message, options = {}) {
    if (!this.isReady) {
      throw new Error('WhatsApp client is not ready');
    }

    try {
      console.log(`📤 Sending message to ${to}: ${message}`);
      
      // Format phone number
      const formattedNumber = this.formatPhoneNumber(to);
      
      let sentMessage;
      
      // Handle different message types
      if (options.media) {
        const media = MessageMedia.fromFilePath(options.media);
        sentMessage = await this.client.sendMessage(formattedNumber, media, {
          caption: message || ''
        });
      } else {
        sentMessage = await this.client.sendMessage(formattedNumber, message);
      }
      
      // Process sent message
      const messageData = await this.processSentMessage(sentMessage, to, message, options);
      
      // Save to data service
      await this.dataService.saveMessage(messageData);
      
      // Emit to connected clients
      this.socketService.emit('message:sent', messageData);
      
      return {
        success: true,
        messageId: sentMessage.id._serialized,
        data: messageData
      };
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      
      // Create failed message record
      const failedMessageData = {
        id: `failed_${Date.now()}`,
        recipient: to,
        content: message,
        type: options.media ? 'media' : 'text',
        status: 'failed',
        direction: 'outgoing',
        timestamp: new Date().toISOString(),
        error: error.message
      };
      
      // Save failed message
      await this.dataService.saveMessage(failedMessageData);
      
      // Emit failure event
      this.socketService.emit('message:failed', failedMessageData);
      
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  async processIncomingMessage(message) {
    const contact = await message.getContact();
    
    return {
      id: message.id._serialized,
      sender: contact.number,
      senderName: contact.pushname || contact.name || 'Unknown',
      content: message.body,
      type: message.type,
      timestamp: new Date(message.timestamp * 1000).toISOString(),
      direction: 'incoming',
      status: 'received',
      hasMedia: message.hasMedia,
      isGroupMsg: message.isGroupMsg,
      fromMe: message.fromMe,
      chat: message.from
    };
  }

  async processSentMessage(message, to, content, options = {}) {
    return {
      id: message.id._serialized,
      recipient: to,
      content: content,
      type: options.media ? 'media' : 'text',
      timestamp: new Date().toISOString(),
      direction: 'outgoing',
      status: 'sent',
      hasMedia: Boolean(options.media),
      mediaPath: options.media || null,
      fromMe: true
    };
  }

  async handleAutoReply(message, messageData) {
    const settings = await this.dataService.getSettings();
    
    if (!settings.autoReply || message.fromMe) {
      return;
    }
    
    // Check working hours
    if (settings.workingHours?.enabled && !this.isWithinWorkingHours(settings.workingHours)) {
      return;
    }
    
    // Check if contact is allowed
    if (settings.allowedContacts?.length > 0 && !settings.allowedContacts.includes(messageData.sender)) {
      return;
    }
    
    // Check if contact is blocked
    if (settings.blockedContacts?.includes(messageData.sender)) {
      return;
    }
    
    try {
      await this.sendMessage(
        messageData.sender,
        settings.autoReplyMessage || 'Thanks for your message! We will get back to you soon.'
      );
    } catch (error) {
      console.error('❌ Error sending auto-reply:', error);
    }
  }

  isWithinWorkingHours(workingHours) {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;
    
    const [startHour, startMinute] = workingHours.start.split(':').map(Number);
    const [endHour, endMinute] = workingHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;
    
    return currentTime >= startTime && currentTime <= endTime;
  }

  getMessageStatus(ack) {
    switch (ack) {
      case 0: return 'pending';
      case 1: return 'sent';
      case 2: return 'received';
      case 3: return 'read';
      case -1: return 'failed';
      default: return 'unknown';
    }
  }

  formatPhoneNumber(number) {
    // Remove all non-digit characters except +
    let cleaned = number.replace(/[^\d+]/g, '');
    
    // Remove + from the beginning
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    }
    
    // Add @c.us suffix for WhatsApp
    return `${cleaned}@c.us`;
  }

  emitStatusUpdate() {
    this.socketService.emit('bot:status', {
      status: this.status,
      isReady: this.isReady,
      clientInfo: this.clientInfo,
      timestamp: new Date().toISOString()
    });
  }

  async handleAuthFailure() {
    this.retryCount++;
    
    if (this.retryCount < this.maxRetries) {
      console.log(`🔄 Retrying authentication (${this.retryCount}/${this.maxRetries})...`);
      
      setTimeout(() => {
        this.client.destroy();
        this.initializeClient();
        this.client.initialize();
      }, 5000);
    } else {
      console.error('❌ Max authentication retries reached');
      this.status = 'auth_failed_max_retries';
      this.emitStatusUpdate();
    }
  }

  async handleDisconnection() {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      console.log(`🔄 Attempting to reconnect (${this.retryCount}/${this.maxRetries})...`);
      
      setTimeout(async () => {
        try {
          await this.client.initialize();
        } catch (error) {
          console.error('❌ Reconnection failed:', error);
          this.handleDisconnection();
        }
      }, 10000);
    }
  }

  async getStatus() {
    return {
      status: this.status,
      isReady: this.isReady,
      clientInfo: this.clientInfo,
      qrCode: this.qrCode,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries,
      timestamp: new Date().toISOString()
    };
  }

  async reconnect() {
    console.log('🔄 Manual reconnection requested...');
    this.retryCount = 0;
    
    try {
      if (this.client) {
        await this.client.destroy();
      }
      
      this.initializeClient();
      await this.client.initialize();
      
      return { success: true, message: 'Reconnection initiated' };
    } catch (error) {
      console.error('❌ Manual reconnection failed:', error);
      throw new Error(`Reconnection failed: ${error.message}`);
    }
  }

  async disconnect() {
    console.log('🔌 Manual disconnection requested...');
    
    try {
      if (this.client) {
        await this.client.destroy();
      }
      
      this.isReady = false;
      this.status = 'disconnected';
      this.clientInfo = null;
      this.qrCode = null;
      
      this.emitStatusUpdate();
      
      return { success: true, message: 'Disconnected successfully' };
    } catch (error) {
      console.error('❌ Disconnection failed:', error);
      throw new Error(`Disconnection failed: ${error.message}`);
    }
  }

  async getQRCode() {
    try {
      // Return the current QR code if available
      if (this.qrCode && this.status === 'qr_code') {
        return this.qrCode;
      }
      
      // Try to get QR code from data service
      try {
        const qrData = await this.dataService.getData('qr_code');
        if (qrData && qrData.qrCode) {
            console.log('qrData', qrData.qrCode.data);
          return qrData.qrCode.data;
        }
      } catch (error) {
        console.log('ℹ️ No QR code found in data service');
      }
      
      // No QR code available
      return null;
    } catch (error) {
      console.error('❌ Error getting QR code:', error);
      return null;
    }
  }

  async getContacts() {
    try {
      if (!this.isReady) {
        throw new Error('WhatsApp client is not ready');
      }
      
      const contacts = await this.client.getContacts();
      return contacts.map(contact => ({
        id: contact.id._serialized,
        name: contact.name || contact.pushname || 'Unknown',
        number: contact.number,
        isUser: contact.isUser,
        isGroup: contact.isGroup,
        profilePicUrl: contact.profilePicUrl
      }));
    } catch (error) {
      console.error('❌ Error getting contacts:', error);
      throw new Error(`Failed to get contacts: ${error.message}`);
    }
  }

  async getChats() {
    try {
      if (!this.isReady) {
        throw new Error('WhatsApp client is not ready');
      }
      
      const chats = await this.client.getChats();
      return chats.map(chat => ({
        id: chat.id._serialized,
        name: chat.name,
        isGroup: chat.isGroup,
        unreadCount: chat.unreadCount,
        lastMessage: chat.lastMessage ? {
          body: chat.lastMessage.body,
          timestamp: chat.lastMessage.timestamp,
          from: chat.lastMessage.from
        } : null
      }));
    } catch (error) {
      console.error('❌ Error getting chats:', error);
      throw new Error(`Failed to get chats: ${error.message}`);
    }
  }

  async logout() {
    try {
      console.log('🔐 Logging out from WhatsApp...');
      
      if (this.client) {
        await this.client.logout();
        await this.client.destroy();
      }
      
      this.isReady = false;
      this.status = 'logged_out';
      this.clientInfo = null;
      this.qrCode = null;
      
      this.emitStatusUpdate();
      
      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      console.error('❌ Logout failed:', error);
      throw new Error(`Logout failed: ${error.message}`);
    }
  }

  async restart() {
    try {
      console.log('🔄 Restarting WhatsApp service...');
      
      // Disconnect first
      await this.disconnect();
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Reinitialize
      this.initializeClient();
      await this.client.initialize();
      
      return { success: true, message: 'Restart initiated' };
    } catch (error) {
      console.error('❌ Restart failed:', error);
      throw new Error(`Restart failed: ${error.message}`);
    }
  }

  async cleanup() {
    console.log('🧹 Cleaning up WhatsApp service...');
    
    try {
      if (this.client) {
        await this.client.destroy();
      }                                                                                            
    } catch (error) {
      console.error('❌ Error during WhatsApp service cleanup:', error);
                                                                                                                                                                                                                        }
  }
}
