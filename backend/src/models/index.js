import mongoose from 'mongoose';

// Message Schema
const messageSchema = new mongoose.Schema({
  messageId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  sender: {
    type: String,
    required: false,
    index: true
  },
  senderName: {
    type: String,
    required: false
  },
  recipient: {
    type: String,
    required: false,
    index: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'audio', 'video', 'document', 'sticker', 'location', 'contact'],
    default: 'text'
  },
  direction: {
    type: String,
    enum: ['incoming', 'outgoing'],
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
    default: 'pending',
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  hasMedia: {
    type: Boolean,
    default: false
  },
  mediaPath: {
    type: String,
    required: false
  },
  mediaType: {
    type: String,
    required: false
  },
  mediaName: {
    type: String,
    required: false
  },
  isGroupMsg: {
    type: Boolean,
    default: false
  },
  fromMe: {
    type: Boolean,
    default: false
  },
  chat: {
    type: String,
    required: false,
    index: true
  },
  quotedMsg: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'messages'
});

// Contact Schema
const contactSchema = new mongoose.Schema({
  contactId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: false
  },
  number: {
    type: String,
    required: true,
    index: true
  },
  pushname: {
    type: String,
    required: false
  },
  isUser: {
    type: Boolean,
    default: true
  },
  isGroup: {
    type: Boolean,
    default: false
  },
  profilePicUrl: {
    type: String,
    required: false
  },
  lastSeen: {
    type: Date,
    required: false
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'contacts'
});

// Settings Schema
const settingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  category: {
    type: String,
    required: false,
    default: 'general'
  },
  description: {
    type: String,
    required: false
  }
}, {
  timestamps: true,
  collection: 'settings'
});

// Analytics Schema
const analyticsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['daily', 'hourly', 'contact', 'message_type', 'error'],
    required: true,
    index: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  count: {
    type: Number,
    default: 1
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'analytics'
});

// Session Data Schema (for QR codes, client info, etc.)
const sessionDataSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  expiresAt: {
    type: Date,
    required: false,
    index: true
  }
}, {
  timestamps: true,
  collection: 'session_data'
});

// Chat Schema
const chatSchema = new mongoose.Schema({
  chatId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: false
  },
  isGroup: {
    type: Boolean,
    default: false
  },
  participants: [{
    id: String,
    name: String,
    isAdmin: Boolean
  }],
  unreadCount: {
    type: Number,
    default: 0
  },
  lastMessage: {
    content: String,
    timestamp: Date,
    from: String,
    messageId: String
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isMuted: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'chats'
});

// Create indexes for better performance
messageSchema.index({ timestamp: -1 });
messageSchema.index({ sender: 1, timestamp: -1 });
messageSchema.index({ recipient: 1, timestamp: -1 });
messageSchema.index({ direction: 1, timestamp: -1 });
messageSchema.index({ status: 1, timestamp: -1 });

contactSchema.index({ number: 1 });
contactSchema.index({ name: 1 });

analyticsSchema.index({ date: -1, type: 1 });

sessionDataSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Export models
export const Message = mongoose.model('Message', messageSchema);
export const Contact = mongoose.model('Contact', contactSchema);
export const Settings = mongoose.model('Settings', settingsSchema);
export const Analytics = mongoose.model('Analytics', analyticsSchema);
export const SessionData = mongoose.model('SessionData', sessionDataSchema);
export const Chat = mongoose.model('Chat', chatSchema);
