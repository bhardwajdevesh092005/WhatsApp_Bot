import express from 'express';
import { AnalyticsController } from '../controllers/analyticsController.js';

const router = express.Router();

// GET /api/analytics/overview - Get analytics overview
router.get('/overview', AnalyticsController.getOverview);

// GET /api/analytics/message-volume - Get message volume data
router.get('/message-volume', AnalyticsController.getMessageVolume);

// GET /api/analytics/response-times - Get response time analytics
router.get('/response-times', AnalyticsController.getResponseTimes);

// GET /api/analytics/popular-contacts - Get top contacts by message frequency
router.get('/popular-contacts', AnalyticsController.getPopularContacts);

// GET /api/analytics/message-types - Get message type distribution
router.get('/message-types', AnalyticsController.getMessageTypes);

// GET /api/analytics/activity-patterns - Get activity patterns by hour/day
router.get('/activity-patterns', AnalyticsController.getActivityPatterns);

// GET /api/analytics/success-rates - Get delivery and response success rates
router.get('/success-rates', AnalyticsController.getSuccessRates);

// GET /api/analytics/export - Export analytics data
router.get('/export', AnalyticsController.exportAnalytics);

export default router;
