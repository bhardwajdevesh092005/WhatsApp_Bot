export class SocketService {
  constructor(io) {
    this.io = io;
    this.connectedClients = new Map();
    this.rooms = new Set();
    
    console.log('🔌 Socket service initialized');
  }

  // Handle new client connection
  handleConnection(socket) {
    console.log(`👤 New client connected: ${socket.id}`);
    
    // Store client info
    this.connectedClients.set(socket.id, {
      socket: socket,
      connectedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      rooms: new Set()
    });

    // Join default room
    socket.join('dashboard');
    this.addToRoom(socket.id, 'dashboard');

    // Send connection confirmation
    socket.emit('connection', {
      status: 'connected',
      clientId: socket.id,
      timestamp: new Date().toISOString(),
      message: 'Connected to WhatsApp Bot WebSocket server'
    });

    // Setup event handlers for this socket
    this.setupSocketHandlers(socket);

    // Update client activity
    this.updateClientActivity(socket.id);
  }

  // Handle client disconnection
  handleDisconnection(socket) {
    console.log(`👤 Client disconnected: ${socket.id}`);
    
    const client = this.connectedClients.get(socket.id);
    if (client) {
      // Remove from all rooms
      client.rooms.forEach(room => {
        socket.leave(room);
      });
      
      // Remove from connected clients
      this.connectedClients.delete(socket.id);
    }
  }

  // Setup event handlers for individual socket
  setupSocketHandlers(socket) {
    // Join room request
    socket.on('join:room', (data) => {
      const { room } = data;
      if (room && typeof room === 'string') {
        socket.join(room);
        this.addToRoom(socket.id, room);
        
        socket.emit('room:joined', {
          room: room,
          timestamp: new Date().toISOString()
        });
        
        console.log(`👤 Client ${socket.id} joined room: ${room}`);
      }
    });

    // Leave room request
    socket.on('leave:room', (data) => {
      const { room } = data;
      if (room && typeof room === 'string') {
        socket.leave(room);
        this.removeFromRoom(socket.id, room);
        
        socket.emit('room:left', {
          room: room,
          timestamp: new Date().toISOString()
        });
        
        console.log(`👤 Client ${socket.id} left room: ${room}`);
      }
    });

    // Bot status request
    socket.on('bot:status:request', () => {
      this.updateClientActivity(socket.id);
      // This will be handled by the calling service
      socket.emit('bot:status:requested', {
        timestamp: new Date().toISOString()
      });
    });

    // QR code request
    socket.on('bot:qr:request', () => {
      this.updateClientActivity(socket.id);
      socket.emit('bot:qr:requested', {
        timestamp: new Date().toISOString()
      });
    });

    // Analytics request
    socket.on('analytics:request', (data) => {
      this.updateClientActivity(socket.id);
      socket.emit('analytics:requested', {
        params: data,
        timestamp: new Date().toISOString()
      });
    });

    // Generic ping/pong for connection health
    socket.on('ping', () => {
      this.updateClientActivity(socket.id);
      socket.emit('pong', {
        timestamp: new Date().toISOString()
      });
    });

    // Error handling
    socket.on('error', (error) => {
      console.error(`❌ Socket error from ${socket.id}:`, error);
    });
  }

  // Emit event to all connected clients
  emit(event, data) {
    const payload = {
      ...data,
      timestamp: data.timestamp || new Date().toISOString()
    };
    
    this.io.emit(event, payload);
    console.log(`📡 Broadcasted event: ${event} to ${this.connectedClients.size} clients`);
  }

  // Emit event to specific room
  emitToRoom(room, event, data) {
    const payload = {
      ...data,
      timestamp: data.timestamp || new Date().toISOString()
    };
    
    this.io.to(room).emit(event, payload);
    console.log(`📡 Broadcasted event: ${event} to room: ${room}`);
  }

  // Emit event to specific client
  emitToClient(socketId, event, data) {
    const client = this.connectedClients.get(socketId);
    if (client) {
      const payload = {
        ...data,
        timestamp: data.timestamp || new Date().toISOString()
      };
      
      client.socket.emit(event, payload);
      console.log(`📡 Sent event: ${event} to client: ${socketId}`);
    }
  }

  // Add client to room
  addToRoom(socketId, room) {
    const client = this.connectedClients.get(socketId);
    if (client) {
      client.rooms.add(room)    ;
      this.rooms.add(room);
    }
  }

  // Remove client from room
  removeFromRoom(socketId, room) {
    const client = this.connectedClients.get(socketId);
    if (client) {
      client.rooms.delete(room);
    }
  }

  // Update client activity timestamp
  updateClientActivity(socketId) {
    const client = this.connectedClients.get(socketId);
    if (client) {
      client.lastActivity = new Date().toISOString();
    }
  }

  // Get connected clients count
  getConnectedClientsCount() {
    return this.connectedClients.size;
  }

  // Get clients in specific room
  getClientsInRoom(room) {
    const clients = [];
    this.connectedClients.forEach((client, socketId) => {
      if (client.rooms.has(room)) {
        clients.push({
          socketId: socketId,
          connectedAt: client.connectedAt,
          lastActivity: client.lastActivity
        });
      }
    });
    return clients;
  }

  // Get all room names
  getRooms() {
    return Array.from(this.rooms);
  }

  // Get service statistics
  getStats() {
    const now = new Date();
    const activeClients = Array.from(this.connectedClients.values()).filter(client => {
      const lastActivity = new Date(client.lastActivity);
      return (now - lastActivity) < 300000; // Active in last 5 minutes
    });

    return {
      connectedClients: this.connectedClients.size,
      activeClients: activeClients.length,
      totalRooms: this.rooms.size,
      rooms: this.getRooms(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }

  // Broadcast system notification
  broadcastNotification(type, message, data = {}) {
    this.emit('notification', {
      type: type, // 'info', 'success', 'warning', 'error'
      message: message,
      data: data,
      timestamp: new Date().toISOString()
    });
  }

  // Broadcast bot status update
  broadcastBotStatus(status) {
    this.emit('bot:status', {
      ...status,
      timestamp: new Date().toISOString()
    });
  }

  // Broadcast message update
  broadcastMessage(type, messageData) {
    this.emit(`message:${type}`, {
      ...messageData,
      timestamp: messageData.timestamp || new Date().toISOString()
    });
  }

  // Broadcast analytics update
  broadcastAnalytics(analyticsData) {
    this.emit('analytics:update', {
      ...analyticsData,
      timestamp: new Date().toISOString()
    });
  }

  // Clean up inactive connections
  cleanupInactiveConnections() {
    const now = new Date();
    const inactiveThreshold = 3600000; // 1 hour
    
    this.connectedClients.forEach((client, socketId) => {
      const lastActivity = new Date(client.lastActivity);
      if ((now - lastActivity) > inactiveThreshold) {
        console.log(`🧹 Cleaning up inactive connection: ${socketId}`);
        client.socket.disconnect(true);
        this.connectedClients.delete(socketId);
      }
    });
  }

  // Start cleanup interval
  startCleanupInterval() {
    setInterval(() => {
      this.cleanupInactiveConnections();
    }, 600000); // Run every 10 minutes
  }

  // Get connection count
  getConnectionCount() {
    return this.connectedClients.size;
  }

  // Get all rooms
  getRooms() {
    const rooms = [];
    this.io.sockets.adapter.rooms.forEach((sockets, room) => {
      // Skip individual socket rooms
      if (!sockets.has(room)) {
        rooms.push({
          name: room,
          clientCount: sockets.size
        });
      }
    });
    return rooms;
  }

  // Cleanup method
  cleanup() {
    try {
      this.connectedClients.clear();
      console.log('✅ Socket service cleanup completed');
    } catch (error) {
      console.error('❌ Error during socket service cleanup:', error);
    }
  }
}
