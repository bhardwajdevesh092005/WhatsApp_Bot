import express from 'express';
import { SettingsController } from '../controllers/settingsController.js';
import { validateSettings } from '../middleware/validation.js';

const router = express.Router();

// GET /api/settings - Get all settings
router.get('/', SettingsController.getAllSettings);

// GET /api/settings/:key - Get specific setting
router.get('/:key', SettingsController.getSettingByKey);

// PUT /api/settings - Update multiple settings
// router.put('/', validateSettings, SettingsController.updateSettings);

// PUT /api/settings/:key - Update specific setting
router.put('/:key', SettingsController.updateSettingByKey);

// POST /api/settings/reset - Reset settings to defaults
router.post('/reset', SettingsController.resetSettings);

// GET /api/settings/backup - Backup current settings
// router.get('/backup', SettingsController.exportSettings);

// POST /api/settings/restore - Restore settings from backup
router.post('/restore', SettingsController.backupSettings);

// GET /api/settings/schema - Get settings schema for validation
router.get('/schema', SettingsController.getSettingsSchema);

export default router;
