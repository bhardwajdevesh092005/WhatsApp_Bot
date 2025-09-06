import express from 'express';
import { LLMController } from '../controllers/llmController.js';

const router = express.Router();

// GET /api/llm/settings - Get LLM settings
router.get('/settings', LLMController.getSettings);

// PUT /api/llm/settings - Update LLM settings
router.put('/settings', LLMController.updateSettings);

// GET /api/llm/status - Get LLM service status
router.get('/status', LLMController.getStatus);

// POST /api/llm/test - Test LLM response
router.post('/test', LLMController.testResponse);

// GET /api/llm/providers - Get available LLM providers
router.get('/providers', LLMController.getProviders);

// POST /api/llm/reset - Reset LLM settings to defaults
router.post('/reset', LLMController.resetSettings);

// GET /api/llm/analytics - Get LLM usage analytics
router.get('/analytics', LLMController.getAnalytics);

export default router;
