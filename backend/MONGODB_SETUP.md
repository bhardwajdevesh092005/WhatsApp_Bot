# MongoDB Integration Guide

This document explains how to set up and use MongoDB with your WhatsApp Bot instead of the default file-based storage.

## 🗄️ Overview

The bot now supports both storage methods:
- **File-based storage** (default): Uses JSON files in `/data` folder
- **MongoDB storage** (recommended): Uses MongoDB database for better performance and scalability

## 📋 Prerequisites

### Option 1: Local MongoDB Installation

1. **Install MongoDB Community Edition**:
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install -y mongodb
   
   # macOS with Homebrew
   brew tap mongodb/brew
   brew install mongodb-community
   
   # Windows - Download from https://www.mongodb.com/try/download/community
   ```

2. **Start MongoDB service**:
   ```bash
   # Ubuntu/Debian
   sudo systemctl start mongodb
   sudo systemctl enable mongodb
   
   # macOS
   brew services start mongodb/brew/mongodb-community
   
   # Windows - MongoDB should start automatically
   ```

3. **Verify installation**:
   ```bash
   mongosh --eval "db.version()"
   ```

### Option 2: MongoDB Atlas (Cloud)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Create database user
4. Whitelist your IP address
5. Get connection string

##  Configuration

### 1. Environment Variables

Copy the environment template:
```bash
cp .env.example .env
```

Edit `.env` file and configure MongoDB:

**For Local MongoDB:**
```env
MONGODB_URI=mongodb://localhost:27017/whatsapp_bot
DB_NAME=whatsapp_bot
```

**For MongoDB Atlas:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/whatsapp_bot
DB_NAME=whatsapp_bot
```

**For MongoDB with Authentication:**
```env
MONGODB_URI=mongodb://username:password@localhost:27017/whatsapp_bot
DB_NAME=whatsapp_bot
```

### 2. Install Dependencies

```bash
npm install
```

##  Getting Started

### 1. Start with MongoDB (Recommended)

Simply set the `MONGODB_URI` in your `.env` file and start the server:

```bash
npm start
```

The server will automatically:
- Connect to MongoDB
- Create necessary collections and indexes
- Use MongoDB for all data operations

### 2. Migrate Existing Data

If you have existing JSON data files, migrate them to MongoDB:

```bash
# Full migration (backup + migrate + validate)
npm run migrate:full

# Or step by step:
npm run migrate:backup    # Backup existing JSON files
npm run migrate          # Migrate data to MongoDB
npm run migrate:validate # Validate migration
```

### 3. Fallback to File Storage

If MongoDB connection fails, the server automatically falls back to file-based storage.

## 🔧 Database Schema

### Collections Created:

1. **messages** - All WhatsApp messages
2. **contacts** - Contact information
3. **settings** - Bot settings and configuration
4. **analytics** - Usage analytics and statistics
5. **session_data** - Temporary session data (QR codes, etc.)
6. **chats** - Chat information and metadata

### Indexes

Automatic indexes are created for:
- Message timestamps and participants
- Contact numbers and names
- Settings keys
- Analytics dates and types

## Monitoring

### Health Check

Check MongoDB status:
```bash
curl http://localhost:3001/api/health
```

Response includes database status:
```json
{
  "services": {
    "database": {
      "status": "connected",
      "connected": true,
      "database": "whatsapp_bot",
      "collections": ["messages", "contacts", "settings", "analytics"]
    }
  }
}
```

### Detailed Health Check

```bash
curl http://localhost:3001/api/health/detailed
```

## 🛠️ Management Commands

### Database Operations

```bash
# Backup JSON files
npm run migrate:backup

# Migrate to MongoDB
npm run migrate

# Validate migration
npm run migrate:validate

# Full migration process
npm run migrate:full
```

### MongoDB Shell Commands

Connect to your database:
```bash
# Local MongoDB
mongosh whatsapp_bot

# MongoDB Atlas
mongosh "mongodb+srv://cluster.mongodb.net/whatsapp_bot" --username your-username
```

Common operations:
```javascript
// Show collections
show collections

// Count documents
db.messages.countDocuments()
db.contacts.countDocuments()

// Find recent messages
db.messages.find().sort({timestamp: -1}).limit(10)

// View indexes
db.messages.getIndexes()

// Drop collection (be careful!)
db.messages.drop()
```

## Switching Between Storage Types

### To MongoDB:
1. Set `MONGODB_URI` in `.env`
2. Run migration: `npm run migrate:full`
3. Restart server: `npm start`

### To File Storage:
1. Remove or comment out `MONGODB_URI` in `.env`
2. Restart server: `npm start`

## 🎯 Performance Benefits

**MongoDB advantages:**
- Better performance with large datasets
- Advanced querying capabilities
- Automatic indexing
- Concurrent access support
- Data validation and constraints
- Built-in backup and replication
- Horizontal scaling capabilities

**File storage advantages:**
- No external dependencies
- Simple setup
- Direct file access
- Easy to backup

## 🚨 Troubleshooting

### Connection Issues

**Error: "Failed to connect to MongoDB"**
```bash
# Check if MongoDB is running
sudo systemctl status mongodb

# Check connection string
echo $MONGODB_URI

# Test connection
mongosh "$MONGODB_URI" --eval "db.version()"
```

**Error: "Authentication failed"**
- Verify username/password in connection string
- Check database user permissions
- For Atlas: verify IP whitelist

### Migration Issues

**Error: "ENOENT: no such file or directory"**
- Data directory doesn't exist (normal for new installations)
- Migration will continue without errors

**Error: "Duplicate key error"**
- Data already exists in MongoDB
- Safe to ignore, migration will skip duplicates

### Performance Issues

**Slow queries:**
```javascript
// Check slow operations
db.currentOp({"secs_running": {"$gt": 5}})

// Enable profiling
db.setProfilingLevel(2)

// View slow operations
db.system.profile.find().limit(5).sort({ts: -1}).pretty()
```

## 🔐 Security Best Practices

1. **Use authentication:**
   ```env
   MONGODB_URI=mongodb://username:password@localhost:27017/whatsapp_bot
   ```

2. **Restrict IP access** (MongoDB Atlas)

3. **Use SSL/TLS for remote connections:**
   ```env
   MONGODB_URI=mongodb://username:password@localhost:27017/whatsapp_bot?ssl=true
   ```

4. **Regular backups:**
   ```bash
   mongodump --uri="$MONGODB_URI" --out=backup/$(date +%Y%m%d)
   ```

## 📚 Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)

## 🆘 Support

If you encounter issues:

1. Check the health endpoint: `http://localhost:3001/api/health`
2. Review server logs for error messages
3. Verify MongoDB connection with `mongosh`
4. Run migration validation: `npm run migrate:validate`
