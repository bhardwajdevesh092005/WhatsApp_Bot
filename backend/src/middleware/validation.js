// Validation middleware for API requests

// Validate send message request
export const validateSendMessage = (req, res, next) => {
  const { recipient, message, messageType } = req.body;
  
  // Validate recipient
  if (!recipient || typeof recipient !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid recipient',
      message: 'Recipient phone number is required and must be a string'
    });
  }
  
  // Basic phone number validation
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegex.test(recipient.replace(/\s/g, ''))) {
    return res.status(400).json({
      success: false,
      error: 'Invalid phone number',
      message: 'Please provide a valid phone number'
    });
  }
  
  // Validate message (required for text messages)
  if (messageType !== 'media' && (!message || typeof message !== 'string')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid message',
      message: 'Message content is required and must be a string'
    });
  }
  
  // Validate message length
  if (message && message.length > 4096) {
    return res.status(400).json({
      success: false,
      error: 'Message too long',
      message: 'Message must be less than 4096 characters'
    });
  }
  
  // Validate message type
  const validTypes = ['text', 'media', 'location', 'contact'];
  if (messageType && !validTypes.includes(messageType)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid message type',
      message: `Message type must be one of: ${validTypes.join(', ')}`
    });
  }
  
  next();
};

// Validate settings update request
export const validateSettings = (req, res, next) => {
  const settings = req.body;
  
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({
      success: false,
      error: 'Invalid settings',
      message: 'Settings must be a valid object'
    });
  }
  
  // Validate autoReply settings
  if (settings.autoReply) {
    const { autoReply } = settings;
    
    if (typeof autoReply !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid autoReply settings',
        message: 'autoReply must be an object'
      });
    }
    
    if (autoReply.enabled !== undefined && typeof autoReply.enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Invalid autoReply.enabled',
        message: 'autoReply.enabled must be a boolean'
      });
    }
    
    if (autoReply.message && (typeof autoReply.message !== 'string' || autoReply.message.length > 1000)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid autoReply.message',
        message: 'autoReply.message must be a string with maximum 1000 characters'
      });
    }
    
    if (autoReply.businessHours) {
      const { businessHours } = autoReply;
      
      if (typeof businessHours !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Invalid businessHours',
          message: 'businessHours must be an object'
        });
      }
      
      // Validate time format (HH:MM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      
      if (businessHours.start && !timeRegex.test(businessHours.start)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid start time',
          message: 'businessHours.start must be in HH:MM format'
        });
      }
      
      if (businessHours.end && !timeRegex.test(businessHours.end)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid end time',
          message: 'businessHours.end must be in HH:MM format'
        });
      }
    }
  }
  
  // Validate notifications settings
  if (settings.notifications) {
    const { notifications } = settings;
    
    if (typeof notifications !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid notifications settings',
        message: 'notifications must be an object'
      });
    }
    
    ['email', 'sound', 'desktop'].forEach(field => {
      if (notifications[field] !== undefined && typeof notifications[field] !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: `Invalid notifications.${field}`,
          message: `notifications.${field} must be a boolean`
        });
      }
    });
    
    if (notifications.emailAddress) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(notifications.emailAddress)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email address',
          message: 'notifications.emailAddress must be a valid email'
        });
      }
    }
  }
  
  // Validate webhooks settings
  if (settings.webhooks) {
    const { webhooks } = settings;
    
    if (typeof webhooks !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid webhooks settings',
        message: 'webhooks must be an object'
      });
    }
    
    if (webhooks.enabled !== undefined && typeof webhooks.enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Invalid webhooks.enabled',
        message: 'webhooks.enabled must be a boolean'
      });
    }
    
    if (webhooks.url) {
      try {
        new URL(webhooks.url);
      } catch {
        return res.status(400).json({
          success: false,
          error: 'Invalid webhook URL',
          message: 'webhooks.url must be a valid URL'
        });
      }
    }
    
    if (webhooks.events && !Array.isArray(webhooks.events)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid webhooks.events',
        message: 'webhooks.events must be an array'
      });
    }
  }
  
  // Validate messageSettings
  if (settings.messageSettings) {
    const { messageSettings } = settings;
    
    if (typeof messageSettings !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid messageSettings',
        message: 'messageSettings must be an object'
      });
    }
    
    if (messageSettings.maxFileSize !== undefined) {
      if (typeof messageSettings.maxFileSize !== 'number' || 
          messageSettings.maxFileSize < 1 || 
          messageSettings.maxFileSize > 100) {
        return res.status(400).json({
          success: false,
          error: 'Invalid maxFileSize',
          message: 'maxFileSize must be a number between 1 and 100 (MB)'
        });
      }
    }
    
    if (messageSettings.allowedFileTypes && !Array.isArray(messageSettings.allowedFileTypes)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid allowedFileTypes',
        message: 'allowedFileTypes must be an array'
      });
    }
    
    if (messageSettings.rateLimit) {
      const { rateLimit } = messageSettings;
      
      if (typeof rateLimit !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Invalid rateLimit',
          message: 'rateLimit must be an object'
        });
      }
      
      if (rateLimit.enabled !== undefined && typeof rateLimit.enabled !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'Invalid rateLimit.enabled',
          message: 'rateLimit.enabled must be a boolean'
        });
      }
      
      if (rateLimit.maxPerMinute !== undefined) {
        if (typeof rateLimit.maxPerMinute !== 'number' || 
            rateLimit.maxPerMinute < 1 || 
            rateLimit.maxPerMinute > 1000) {
          return res.status(400).json({
            success: false,
            error: 'Invalid maxPerMinute',
            message: 'maxPerMinute must be a number between 1 and 1000'
          });
        }
      }
    }
  }
  
  // Validate security settings
  if (settings.security) {
    const { security } = settings;
    
    if (typeof security !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid security settings',
        message: 'security must be an object'
      });
    }
    
    if (security.adminPassword && (typeof security.adminPassword !== 'string' || security.adminPassword.length < 8)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid adminPassword',
        message: 'adminPassword must be a string with at least 8 characters'
      });
    }
    
    if (security.sessionTimeout !== undefined) {
      if (typeof security.sessionTimeout !== 'number' || 
          security.sessionTimeout < 5 || 
          security.sessionTimeout > 1440) {
        return res.status(400).json({
          success: false,
          error: 'Invalid sessionTimeout',
          message: 'sessionTimeout must be a number between 5 and 1440 minutes'
        });
      }
    }
    
    if (security.enableLogging !== undefined && typeof security.enableLogging !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Invalid enableLogging',
        message: 'enableLogging must be a boolean'
      });
    }
  }
  
  next();
};

// Validate pagination parameters
export const validatePagination = (req, res, next) => {
  const { page, limit } = req.query;
  
  if (page !== undefined) {
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid page parameter',
        message: 'Page must be a positive integer'
      });
    }
    req.query.page = pageNum;
  }
  
  if (limit !== undefined) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Invalid limit parameter',
        message: 'Limit must be an integer between 1 and 1000'
      });
    }
    req.query.limit = limitNum;
  }
  
  next();
};

// Validate date range parameters
export const validateDateRange = (req, res, next) => {
  const { dateFrom, dateTo } = req.query;
  
  if (dateFrom) {
    const fromDate = new Date(dateFrom);
    if (isNaN(fromDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid dateFrom parameter',
        message: 'dateFrom must be a valid ISO date string'
      });
    }
  }
  
  if (dateTo) {
    const toDate = new Date(dateTo);
    if (isNaN(toDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid dateTo parameter',
        message: 'dateTo must be a valid ISO date string'
      });
    }
  }
  
  if (dateFrom && dateTo) {
    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);
    
    if (fromDate >= toDate) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date range',
        message: 'dateFrom must be before dateTo'
      });
    }
  }
  
  next();
};

// Rate limiting middleware
export const rateLimit = (maxRequests = 100, windowMs = 60000) => {
  const clients = new Map();
  
  return (req, res, next) => {
    const clientId = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!clients.has(clientId)) {
      clients.set(clientId, {
        requests: 1,
        windowStart: now
      });
      return next();
    }
    
    const client = clients.get(clientId);
    
    // Reset window if expired
    if (now - client.windowStart > windowMs) {
      client.requests = 1;
      client.windowStart = now;
      return next();
    }
    
    // Check if limit exceeded
    if (client.requests >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: `Too many requests. Maximum ${maxRequests} requests per ${windowMs/1000} seconds.`,
        retryAfter: Math.ceil((client.windowStart + windowMs - now) / 1000)
      });
    }
    
    client.requests++;
    next();
  };
};

// Error handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);
  
  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: 'File too large',
      message: `File size exceeds maximum allowed size of ${err.limit / (1024 * 1024)}MB`
    });
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      error: 'Unexpected file',
      message: 'Unexpected file field in upload'
    });
  }
  
  if (err.message && err.message.includes('File type') && err.message.includes('not allowed')) {
    return res.status(400).json({
      success: false,
      error: 'File type not allowed',
      message: err.message
    });
  }
  
  // Default error response
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
};

// Request logging middleware
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
};
