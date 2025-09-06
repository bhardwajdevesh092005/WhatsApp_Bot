import express from 'express';
import { DashboardController } from '../controllers/dashboardController.js';

const router = express.Router();

// GET /api/dashboard/stats - Get dashboard statistics
router.get('/stats', DashboardController.getStats);

// GET /api/dashboard/recent-messages - Get recent messages
router.get('/recent-messages', DashboardController.getRecentMessages);

// GET /api/dashboard/overview - Get dashboard overview
router.get('/overview', DashboardController.getOverview);

// GET /api/dashboard/quick-stats - Get quick stats for dashboard cards
router.get('/quick-stats', DashboardController.getQuickStats);

export default router;
