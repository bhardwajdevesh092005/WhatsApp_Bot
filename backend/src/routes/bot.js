import express from 'express';
import { BotController } from '../controllers/botController.js';

const router = express.Router();

// GET /api/bot/status - Get bot connection status
router.get('/status', BotController.getStatus);

// POST /api/bot/connect - Initialize/Connect WhatsApp bot
router.post('/connect', BotController.connect);

// POST /api/bot/disconnect - Disconnect WhatsApp bot
router.post('/disconnect', BotController.disconnect);

// POST /api/bot/restart - Restart WhatsApp bot
router.post('/restart', BotController.restart);

// GET /api/bot/qr - Get QR code for WhatsApp authentication
router.get('/qr', BotController.getQRCode);

// POST /api/bot/send-message - Send a message via WhatsApp
// router.post('/send-message', BotController.sendMessage);

// GET /api/bot/contacts - Get WhatsApp contacts
router.get('/contacts', BotController.getContacts);

// GET /api/bot/chats - Get WhatsApp chats
router.get('/chats', BotController.getChats);

// POST /api/bot/logout - Logout from WhatsApp
router.post('/logout', BotController.logout);

export default router;
