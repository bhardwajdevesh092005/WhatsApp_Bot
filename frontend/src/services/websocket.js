import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.eventListeners = new Map();
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  connect(url = process.env.REACT_APP_WS_URL || 'http://localhost:3001') {
    try {
      this.socket = io(url, {
        transports: ['websocket', 'polling'],
        upgrade: true,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
      });

      this.setupEventListeners();
      return this.socket;
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      return null;
    }
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connection', { status: 'connected' });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server:', reason);
      this.isConnected = false;
      this.emit('connection', { status: 'disconnected', reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      this.emit('connection', { 
        status: 'error', 
        error: error.message,
        attempts: this.reconnectAttempts 
      });
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected to WebSocket server, attempt:', attemptNumber);
      this.isConnected = true;
      this.emit('connection', { status: 'reconnected', attempts: attemptNumber });
    });

    // WhatsApp Bot specific events
    this.socket.on('message:new', (data) => {
      console.log('New message received:', data);
      this.emit('message:new', data);
    });

    this.socket.on('message:sent', (data) => {
      console.log('Message sent:', data);
      this.emit('message:sent', data);
    });

    this.socket.on('message:failed', (data) => {
      console.log('Message failed:', data);
      this.emit('message:failed', data);
    });

    this.socket.on('bot:status', (data) => {
      console.log('Bot status update:', data);
      this.emit('bot:status', data);
    });

    this.socket.on('bot:qr', (data) => {
      console.log('QR code received:', data);
      this.emit('bot:qr', data);
    });

    this.socket.on('bot:ready', (data) => {
      console.log('Bot ready:', data);
      this.emit('bot:ready', data);
    });

    this.socket.on('analytics:update', (data) => {
      console.log('Analytics update:', data);
      this.emit('analytics:update', data);
    });
  }

  // Subscribe to events
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);

    // Return unsubscribe function
    return () => {
      this.off(event, callback);
    };
  }

  // Unsubscribe from events
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(callback);
    }
  }

  // Emit events to local listeners
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Send data to server
  send(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
      return true;
    } else {
      console.warn('Cannot send data: WebSocket not connected');
      return false;
    }
  }

  // Join a room
  joinRoom(room) {
    return this.send('join:room', { room });
  }

  // Leave a room
  leaveRoom(room) {
    return this.send('leave:room', { room });
  }

  // Request bot status
  requestBotStatus() {
    return this.send('bot:status:request');
  }

  // Request QR code
  requestQRCode() {
    return this.send('bot:qr:request');
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.eventListeners.clear();
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socket: this.socket?.connected || false,
      attempts: this.reconnectAttempts,
    };
  }

  // Reconnect manually
  reconnect() {
    if (this.socket) {
      this.socket.connect();
    }
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

export default webSocketService;
