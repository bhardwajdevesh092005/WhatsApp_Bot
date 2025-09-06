import express from 'express';
import multer from 'multer';
import { MessagesController } from '../controllers/messagesController.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|mp3|mp4|wav|avi|mov/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// GET /api/messages - Get all messages with pagination
router.get('/', MessagesController.getAllMessages);

// GET /api/messages/:id - Get specific message
router.get('/:id', MessagesController.getMessageById);

// POST /api/messages - Send a new message
router.post('/send', MessagesController.sendMessage);

// POST /api/messages/upload - Send message with file attachment
// router.post('/upload', upload.single('file'), MessagesController.sendMessageWithFile);

// PUT /api/messages/:id - Update message status
// router.put('/:id', MessagesController.updateMessage);

// DELETE /api/messages/:id - Delete a message
router.delete('/:id', MessagesController.deleteMessage);

// GET /api/messages/contact/:contact - Get messages for specific contact
// router.get('/contact/:contact', MessagesController.getMessagesByContact);

// GET /api/messages/search - Search messages
// router.get('/search', MessagesController.searchMessages);

// POST /api/messages/bulk-send - Send bulk messages
router.post('/bulk-send', MessagesController.bulkSendMessages);

// GET /api/messages/export - Export messages
// router.get('/export', MessagesController.exportMessages);

export default router;
