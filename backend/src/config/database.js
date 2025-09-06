import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

class DatabaseService {
  constructor() {
    this.connection = null;
    this.isConnected = false;
  }

  async connect(connectionString = null) {
    try {
      // Use provided connection string or environment variable
      const mongoUri = connectionString || 
                      process.env.MONGODB_URI || 
                      process.env.MONGO_URI || 
                      'mongodb://localhost:27017/whatsapp_bot';

      // Mongoose connection options
      const options = {
        // Buffering settings
        bufferCommands: false,
        // maxBufferTime: 30000,
        
        // Connection pool settings
        maxPoolSize: 10,
        minPoolSize: 5,
        maxIdleTimeMS: 30000,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        
        // Heartbeat settings
        heartbeatFrequencyMS: 10000,
        
        // Retry settings
        retryWrites: true,
        retryReads: true,
        
        // Database name
        dbName: process.env.DB_NAME || 'whatsapp_bot'
      };

      // Connect to MongoDB
      console.log(' Connecting to MongoDB...');
      this.connection = await mongoose.connect(mongoUri, options);
      this.isConnected = true;

      console.log(`MongoDB connected successfully to: ${this.connection.connection.name}`);
      console.log(`Connection state: ${mongoose.connection.readyState}`);

      // Handle connection events
      this.setupEventListeners();

      return this.connection;
    } catch (error) {
      console.error(' MongoDB connection error:', error.message);
      this.isConnected = false;
      throw new Error(`Failed to connect to MongoDB: ${error.message}`);
    }
  }

  setupEventListeners() {
    // Connection events
    mongoose.connection.on('connected', () => {
      console.log(' Mongoose connected to MongoDB');
      this.isConnected = true;
    });

    mongoose.connection.on('error', (error) => {
      console.error(' MongoDB connection error:', error);
      this.isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('📴 Mongoose disconnected from MongoDB');
      this.isConnected = false;
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.connection.close();
        console.log('👋 MongoDB connection closed');
        this.isConnected = false;
        this.connection = null;
      }
    } catch (error) {
      console.error(' Error disconnecting from MongoDB:', error);
    }
  }

  getConnection() {
    return this.connection;
  }

  isMongoConnected() {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected', error: 'Not connected to MongoDB' };
      }

      // Ping the database
      await mongoose.connection.db.admin().ping();
      
      return {
        status: 'connected',
        database: mongoose.connection.name,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        readyState: mongoose.connection.readyState,
        collections: Object.keys(mongoose.connection.collections)
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  async dropDatabase() {
    try {
      if (!this.isConnected) {
        throw new Error('Not connected to MongoDB');
      }
      
      await mongoose.connection.dropDatabase();
      console.log('🗑️  Database dropped successfully');
    } catch (error) {
      console.error(' Error dropping database:', error);
      throw error;
    }
  }

  async createIndexes() {
    try {
      console.log(' Creating database indexes...');
      
      // This will create all indexes defined in the schemas
      await mongoose.connection.syncIndexes();
      
      console.log('Database indexes created successfully');
    } catch (error) {
      console.error(' Error creating indexes:', error);
      throw error;
    }
  }
}

// Create singleton instance
const databaseService = new DatabaseService();

export default databaseService;
