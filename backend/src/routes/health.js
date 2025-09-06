import express from 'express';
import { HealthController } from '../controllers/healthController.js';

const router = express.Router();

// GET /api/health - Basic health check
router.get('/', HealthController.getHealth);

// GET /api/health/detailed - Detailed system health check
router.get('/detailed', HealthController.getDetailedHealth);

// GET /api/health/whatsapp - WhatsApp service health check
// router.get('/whatsapp', HealthController.whatsappHealthCheck);

// GET /api/health/database - Database health check
// router.get('/database', HealthController.databaseHealthCheck);

// GET /api/health/system - System resource health check
// router.get('/system', HealthController.systemHealthCheck);

export default router;
