// Settings Controller
// Handles all settings-related business logic

export class SettingsController {
  // GET /api/settings - Get all settings
  static async getAllSettings(req, res) {
    try {
      const { dataService } = req.app.locals;
      const settings = await dataService.getSettings();
      
      res.json({
        success: true,
        data: settings,
        lastUpdated: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error getting settings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get settings',
        message: error.message
      });
    }
  }

  // GET /api/settings/:key - Get specific setting
  static async getSettingByKey(req, res) {
    try {
      const { dataService } = req.app.locals;
      const settingKey = req.params.key;
      
      const settings = await dataService.getSettings();
      
      if (!(settingKey in settings)) {
        return res.status(404).json({
          success: false,
          error: 'Setting not found',
          message: `Setting '${settingKey}' does not exist`
        });
      }
      
      res.json({
        success: true,
        data: {
          key: settingKey,
          value: settings[settingKey]
        },
        lastUpdated: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error getting setting:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get setting',
        message: error.message
      });
    }
  }

  // PUT /api/settings - Update multiple settings
  static async updateMultipleSettings(req, res) {
    try {
      const { dataService, whatsappService } = req.app.locals;
      const newSettings = req.body;
      
      // Validate settings before updating
      const validationResult = SettingsController.validateSettingsData(newSettings);
      if (!validationResult.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid settings',
          message: validationResult.message,
          invalidFields: validationResult.invalidFields
        });
      }
      
      // Update settings
      await dataService.updateSettings(newSettings);
      
      // Apply certain settings immediately to WhatsApp service
      if (newSettings.autoReply !== undefined) {
        await whatsappService.updateAutoReplySettings({
          enabled: newSettings.autoReply.enabled,
          message: newSettings.autoReply.message,
          businessHours: newSettings.autoReply.businessHours
        });
      }
      
      const updatedSettings = await dataService.getSettings();
      
      res.json({
        success: true,
        data: updatedSettings,
        message: 'Settings updated successfully',
        lastUpdated: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error updating settings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update settings',
        message: error.message
      });
    }
  }

  // PUT /api/settings/:key - Update specific setting
  static async updateSettingByKey(req, res) {
    try {
      const { dataService, whatsappService } = req.app.locals;
      const settingKey = req.params.key;
      const { value } = req.body;
      
      if (value === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Value is required',
          message: 'Please provide a value for the setting'
        });
      }
      
      // Validate specific setting
      const validationResult = SettingsController.validateSpecificSetting(settingKey, value);
      if (!validationResult.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid setting value',
          message: validationResult.message
        });
      }
      
      await dataService.updateSettings({ [settingKey]: value });
      
      // Apply setting immediately if needed
      if (settingKey === 'autoReply') {
        await whatsappService.updateAutoReplySettings(value);
      }
      
      const updatedSettings = await dataService.getSettings();
      
      res.json({
        success: true,
        data: {
          key: settingKey,
          value: updatedSettings[settingKey]
        },
        message: `Setting '${settingKey}' updated successfully`,
        lastUpdated: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error updating setting:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update setting',
        message: error.message
      });
    }
  }

  // POST /api/settings/reset - Reset settings to defaults
  static async resetSettings(req, res) {
    try {
      const { dataService } = req.app.locals;
      const { keys } = req.body;
      
      if (keys && Array.isArray(keys)) {
        // Reset specific settings
        await dataService.resetSettings(keys);
      } else {
        // Reset all settings
        await dataService.resetSettings();
      }
      
      const resetSettings = await dataService.getSettings();
      
      res.json({
        success: true,
        data: resetSettings,
        message: keys ? `Settings ${keys.join(', ')} reset to defaults` : 'All settings reset to defaults',
        lastUpdated: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error resetting settings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reset settings',
        message: error.message
      });
    }
  }

  // GET /api/settings/backup - Backup current settings
  static async backupSettings(req, res) {
    try {
      const { dataService } = req.app.locals;
      const settings = await dataService.getSettings();
      
      const backup = {
        settings,
        backupInfo: {
          createdAt: new Date().toISOString(),
          version: '1.0.0'
        }
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="whatsapp-bot-settings-backup-${Date.now()}.json"`);
      res.json(backup);
      
    } catch (error) {
      console.error('❌ Error creating settings backup:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create settings backup',
        message: error.message
      });
    }
  }

  // POST /api/settings/restore - Restore settings from backup
  static async restoreSettings(req, res) {
    try {
      const { dataService } = req.app.locals;
      const { settings, overwriteExisting = false } = req.body;
      
      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Invalid backup data',
          message: 'Please provide valid settings data'
        });
      }
      
      // Validate backup settings
      const validationResult = SettingsController.validateSettingsData(settings);
      if (!validationResult.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid backup settings',
          message: validationResult.message,
          invalidFields: validationResult.invalidFields
        });
      }
      
      if (overwriteExisting) {
        // Replace all settings
        await dataService.updateSettings(settings, true);
      } else {
        // Merge with existing settings
        const currentSettings = await dataService.getSettings();
        const mergedSettings = { ...currentSettings, ...settings };
        await dataService.updateSettings(mergedSettings, true);
      }
      
      const restoredSettings = await dataService.getSettings();
      
      res.json({
        success: true,
        data: restoredSettings,
        message: 'Settings restored successfully',
        lastUpdated: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error restoring settings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to restore settings',
        message: error.message
      });
    }
  }

  // GET /api/settings/schema - Get settings schema for validation
  static getSettingsSchema(req, res) {
    try {
      const schema = {
        autoReply: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            message: { type: 'string', maxLength: 1000 },
            businessHours: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean' },
                start: { type: 'string', pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$' },
                end: { type: 'string', pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$' },
                timezone: { type: 'string' }
              }
            }
          }
        },
        notifications: {
          type: 'object',
          properties: {
            email: { type: 'boolean' },
            sound: { type: 'boolean' },
            desktop: { type: 'boolean' },
            emailAddress: { type: 'string', format: 'email' }
          }
        },
        webhooks: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            url: { type: 'string', format: 'uri' },
            events: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['message_received', 'message_sent', 'message_delivered', 'bot_connected', 'bot_disconnected']
              }
            }
          }
        },
        messageSettings: {
          type: 'object',
          properties: {
            maxFileSize: { type: 'number', minimum: 1, maximum: 100 },
            allowedFileTypes: {
              type: 'array',
              items: { type: 'string' }
            },
            rateLimit: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean' },
                maxPerMinute: { type: 'number', minimum: 1, maximum: 1000 }
              }
            }
          }
        },
        security: {
          type: 'object',
          properties: {
            adminPassword: { type: 'string', minLength: 8 },
            sessionTimeout: { type: 'number', minimum: 5, maximum: 1440 },
            enableLogging: { type: 'boolean' }
          }
        }
      };
      
      res.json({
        success: true,
        data: schema,
        lastUpdated: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error getting settings schema:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get settings schema',
        message: error.message
      });
    }
  }

  // Helper method to validate settings data
  static validateSettingsData(settings) {
    const errors = [];
    
    // Validate autoReply
    if (settings.autoReply) {
      if (typeof settings.autoReply !== 'object') {
        errors.push('autoReply must be an object');
      } else {
        if (settings.autoReply.message && settings.autoReply.message.length > 1000) {
          errors.push('autoReply.message must be less than 1000 characters');
        }
        if (settings.autoReply.businessHours) {
          const { start, end } = settings.autoReply.businessHours;
          if (start && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(start)) {
            errors.push('autoReply.businessHours.start must be in HH:MM format');
          }
          if (end && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(end)) {
            errors.push('autoReply.businessHours.end must be in HH:MM format');
          }
        }
      }
    }
    
    // Validate notifications
    if (settings.notifications) {
      if (settings.notifications.emailAddress) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(settings.notifications.emailAddress)) {
          errors.push('notifications.emailAddress must be a valid email');
        }
      }
    }
    
    // Validate webhooks
    if (settings.webhooks) {
      if (settings.webhooks.url) {
        try {
          new URL(settings.webhooks.url);
        } catch {
          errors.push('webhooks.url must be a valid URL');
        }
      }
    }
    
    // Validate messageSettings
    if (settings.messageSettings) {
      if (settings.messageSettings.maxFileSize && (settings.messageSettings.maxFileSize < 1 || settings.messageSettings.maxFileSize > 100)) {
        errors.push('messageSettings.maxFileSize must be between 1 and 100 MB');
      }
    }
    
    // Validate security
    if (settings.security) {
      if (settings.security.adminPassword && settings.security.adminPassword.length < 8) {
        errors.push('security.adminPassword must be at least 8 characters');
      }
      if (settings.security.sessionTimeout && (settings.security.sessionTimeout < 5 || settings.security.sessionTimeout > 1440)) {
        errors.push('security.sessionTimeout must be between 5 and 1440 minutes');
      }
    }
    
    return {
      isValid: errors.length === 0,
      message: errors.join('; '),
      invalidFields: errors
    };
  }

  // Helper method to validate specific setting
  static validateSpecificSetting(key, value) {
    // Simple validation for individual settings
    if (key === 'autoReply' && typeof value !== 'object') {
      return { isValid: false, message: 'autoReply must be an object' };
    }
    
    if (key === 'notifications' && typeof value !== 'object') {
      return { isValid: false, message: 'notifications must be an object' };
    }
    
    if (key === 'webhooks' && typeof value !== 'object') {
      return { isValid: false, message: 'webhooks must be an object' };
    }
    
    // Add more specific validations as needed
    
    return { isValid: true };
  }
}
