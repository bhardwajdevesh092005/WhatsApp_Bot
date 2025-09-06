# 📱 WhatsApp Message & Contact Configuration Guide

## 🔍 How Your WhatsApp Bot Gets Messages

Your WhatsApp bot receives messages automatically once it's connected. Here's how the entire flow works:

### 1. 🔗 **Connection Process**

```bash
# Your QR code is already generated! 
# The bot is waiting for you to scan it with WhatsApp mobile app
```

**Current Status**: You have a QR code generated (timestamp: 2025-09-06T05:46:11.257Z)

### 2. 📨 **Automatic Message Reception**

Once connected, your bot automatically receives ALL messages sent to your WhatsApp number through these event handlers:

```javascript
// In src/services/whatsapp.js
this.client.on('message', async (message) => {
  console.log('📨 Received message:', message.body);
  
  // Automatically processes incoming message
  const messageData = await this.processIncomingMessage(message);
  
  // Saves to database
  await this.dataService.saveMessage(messageData);
  
  // Broadcasts to frontend in real-time
  this.socketService.emit('message:new', messageData);
  
  // Handles auto-reply if enabled
  await this.handleAutoReply(message, messageData);
});
```

### 3. 📞 **Contact Number Configuration**

**No manual contact configuration needed!** The bot automatically:

- **Extracts sender information** from incoming messages
- **Gets contact details** (name, number, profile info)
- **Handles phone number formatting** automatically
- **Stores contact data** for future reference

#### Contact Data Structure:
```javascript
{
  id: "message_unique_id",
  sender: "1234567890@c.us",           // WhatsApp ID format
  senderName: "John Doe",              // Contact name or "Unknown"
  content: "Hello, this is a message", // Message content
  type: "chat",                        // Message type
  timestamp: "2025-09-06T05:46:11.257Z",
  direction: "incoming",               // incoming/outgoing
  status: "received",                  // received/sent/delivered/read
  hasMedia: false,                     // true if contains images/files
  isGroupMsg: false,                   // true if from group chat
  chat: "1234567890@c.us"             // Chat ID
}
```

### 4.  **How to Start Receiving Messages**

#### Step 1: Connect Your Bot
```bash
cd /home/devesh-bhardwaj/Desktop/Assignment/WhatsApp_Bot/backend
npm start
```

#### Step 2: Scan QR Code
You already have a QR code! Either:
- **Option A**: Use the frontend interface
- **Option B**: Get QR via API: `GET http://localhost:3001/api/bot/qr`
- **Option C**: Check the generated QR in your current file

#### Step 3: WhatsApp Mobile App
1. Open WhatsApp on your phone
2. Go to **Settings** → **Linked Devices** 
3. Tap **"Link a Device"**
4. Scan the QR code from your bot

#### Step 4: Start Receiving Messages
Once scanned, your bot will:
- Automatically receive ALL messages sent to your WhatsApp
- Store them in the database
- Show them in real-time on the frontend
- Send auto-replies if configured

### 5. 📱 **Phone Number Formatting**

Your bot automatically handles different phone number formats:

```javascript
// Input formats supported:
"+1234567890"     → "1234567890@c.us"
"1234567890"      → "1234567890@c.us"  
"+91 98765 43210" → "919876543210@c.us"

// The formatPhoneNumber function handles this automatically
formatPhoneNumber(number) {
  let cleaned = number.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  return `${cleaned}@c.us`;
}
```

### 6.  **Sending Messages**

#### Via API:
```bash
# Send text message
curl -X POST http://localhost:3001/api/messages \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "1234567890",
    "message": "Hello from bot!",
    "messageType": "text"
  }'

# Send message with file
curl -X POST http://localhost:3001/api/messages/upload \
  -F "recipient=1234567890" \
  -F "message=Check this image" \
  -F "file=@/path/to/image.jpg"
```

#### Via Frontend:
- Open the web interface
- Use the message composer
- Select contact and send message

### 7. **Auto-Reply Configuration**

Configure automatic responses via settings:

```bash
# Enable auto-reply
curl -X PUT http://localhost:3001/api/settings \
  -H "Content-Type: application/json" \
  -d '{
    "autoReply": {
      "enabled": true,
      "message": "Thanks for messaging! We will reply soon.",
      "businessHours": {
        "enabled": true,
        "start": "09:00",
        "end": "17:00",
        "timezone": "UTC"
      }
    }
  }'
```

### 8. **Message Monitoring**

#### Real-time monitoring via WebSocket:
```javascript
// Frontend automatically receives these events:
socket.on('message:new', (data) => {
  console.log('New message received:', data);
});

socket.on('message:sent', (data) => {
  console.log('Message sent successfully:', data);
});

socket.on('message:status', (data) => {
  console.log('Message status update:', data);
});
```

#### Check via API:
```bash
# Get all messages
curl http://localhost:3001/api/messages

# Get messages from specific contact
curl http://localhost:3001/api/messages/contact/1234567890

# Search messages
curl "http://localhost:3001/api/messages/search?query=hello"
```

### 9. 🔧 **Contact Management**

#### Get Contacts:
```bash
# Get all WhatsApp contacts
curl http://localhost:3001/api/bot/contacts

# Get chat list
curl http://localhost:3001/api/bot/chats
```

#### Contact Filtering:
```javascript
// In settings, you can configure:
{
  "allowedContacts": ["1234567890", "0987654321"], // Only these can message
  "blockedContacts": ["spammer123"],               // Block these numbers
  "autoReply": {
    "enabled": true,
    "onlyForAllowed": true  // Auto-reply only to allowed contacts
  }
}
```

### 10. 🚨 **Important Notes**

1. **WhatsApp Terms**: Ensure compliance with WhatsApp's terms of service
2. **Rate Limiting**: Built-in protection against sending too many messages
3. **Session Management**: Your session is saved locally in `.wwebjs_auth/`
4. **Media Support**: Supports images, documents, audio, video
5. **Group Messages**: Can handle both individual and group chats

### 11. 🎯 **Quick Test**

Once your bot is connected:

1. **Send a message** to your WhatsApp number from another phone
2. **Check the console** - you'll see: `📨 Received message: [your message]`
3. **Check the API** - message will be available at `/api/messages`
4. **Check the frontend** - message appears in real-time

### 12. **Current Status Check**

```bash
# Check if bot is ready to receive messages
curl http://localhost:3001/api/bot/status

# Expected response when ready:
{
  "success": true,
  "data": {
    "status": "connected",
    "isReady": true,
    "clientInfo": {
      "pushname": "Your Bot Name",
      "wid": "your_number@c.us"
    }
  }
}
```

##  **Ready to Go!**

Your bot is configured to automatically:
- **Receive** all incoming messages
- **Extract** contact information
- **Store** message data
- **Provide** real-time updates
- **Handle** different phone number formats
- **Support** media files
- **Send** auto-replies

**Just scan the QR code and start receiving messages immediately!** 📱
