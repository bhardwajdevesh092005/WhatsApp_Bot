#!/usr/bin/env node

/**
 * Data Migration Script
 * Migrates data from JSON files to MongoDB
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import databaseService from '../src/config/database.js';
import MongoDataService from '../src/services/mongoDataService.js';
import fs from 'fs/promises';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MigrationRunner {
  constructor() {
    this.dataService = new MongoDataService();
    this.dataDir = path.join(__dirname, '../data');
  }

  async run() {
    try {
      console.log('🚀 Starting data migration from JSON to MongoDB...\n');

      // Connect to MongoDB
      console.log('📡 Connecting to MongoDB...');
      await databaseService.connect();
      
      // Initialize data service
      await this.dataService.initialize();
      
      console.log('✅ Database connection established\n');

      // Check if data directory exists
      try {
        await fs.access(this.dataDir);
        console.log(`📁 Found data directory: ${this.dataDir}`);
      } catch (error) {
        console.log(`⚠️  Data directory not found: ${this.dataDir}`);
        console.log('Creating empty data directory...');
        await fs.mkdir(this.dataDir, { recursive: true });
      }

      // Run migration
      await this.dataService.migrateFromJsonFiles(this.dataDir);

      // Show migration summary
      await this.showMigrationSummary();

      console.log('\n✅ Migration completed successfully!');
      
    } catch (error) {
      console.error('\n❌ Migration failed:', error);
      throw error;
    } finally {
      await databaseService.disconnect();
    }
  }

  async showMigrationSummary() {
    try {
      console.log('\n📊 Migration Summary:');
      console.log('==================');
      
      const health = await this.dataService.healthCheck();
      
      if (health.collections) {
        console.log(`📧 Messages: ${health.collections.messages}`);
        console.log(`👥 Contacts: ${health.collections.contacts}`);
        console.log(`⚙️  Settings: ${health.collections.settings}`);
        console.log(`📈 Analytics: ${health.collections.analytics}`);
      }
      
      console.log(`\n🗄️  Database: ${health.database?.database || 'Unknown'}`);
      console.log(`📡 Status: ${health.status}`);
      
    } catch (error) {
      console.error('❌ Error getting migration summary:', error);
    }
  }

  async backup() {
    try {
      console.log('💾 Creating backup of existing JSON files...');
      
      const backupDir = path.join(this.dataDir, 'backup_' + Date.now());
      await fs.mkdir(backupDir, { recursive: true });
      
      const files = ['messages.json', 'settings.json', 'analytics.json'];
      
      for (const file of files) {
        const sourcePath = path.join(this.dataDir, file);
        const backupPath = path.join(backupDir, file);
        
        try {
          await fs.copyFile(sourcePath, backupPath);
          console.log(`✅ Backed up: ${file}`);
        } catch (error) {
          console.log(`⚠️  Could not backup ${file}: ${error.message}`);
        }
      }
      
      console.log(`📦 Backup created at: ${backupDir}\n`);
      
    } catch (error) {
      console.error('❌ Backup failed:', error);
      throw error;
    }
  }

  async validateMigration() {
    try {
      console.log('🔍 Validating migration...');
      
      // Check if data exists in MongoDB
      const messages = await this.dataService.loadMessages(10);
      const settings = await this.dataService.loadSettings();
      const analytics = await this.dataService.loadAnalytics(null, null, null, 10);
      
      console.log(`📧 Sample messages in MongoDB: ${messages.length}`);
      console.log(`⚙️  Settings in MongoDB: ${Object.keys(settings).length}`);
      console.log(`📈 Sample analytics in MongoDB: ${analytics.length}`);
      
      if (messages.length > 0 || Object.keys(settings).length > 0 || analytics.length > 0) {
        console.log('✅ Migration validation passed - data found in MongoDB');
      } else {
        console.log('⚠️  Migration validation warning - no data found in MongoDB');
      }
      
    } catch (error) {
      console.error('❌ Migration validation failed:', error);
      throw error;
    }
  }
}

// CLI interface
const main = async () => {
  const args = process.argv.slice(2);
  const command = args[0] || 'migrate';
  
  const migrationRunner = new MigrationRunner();
  
  try {
    switch (command) {
      case 'migrate':
        await migrationRunner.run();
        break;
        
      case 'backup':
        await migrationRunner.backup();
        break;
        
      case 'validate':
        console.log('🔍 Validating existing migration...');
        await databaseService.connect();
        await migrationRunner.dataService.initialize();
        await migrationRunner.validateMigration();
        await databaseService.disconnect();
        break;
        
      case 'full':
        await migrationRunner.backup();
        await migrationRunner.run();
        await migrationRunner.validateMigration();
        break;
        
      default:
        console.log('Usage: node scripts/migrate.js [command]');
        console.log('Commands:');
        console.log('  migrate  - Migrate data from JSON to MongoDB (default)');
        console.log('  backup   - Create backup of JSON files');
        console.log('  validate - Validate existing migration');
        console.log('  full     - Backup + Migrate + Validate');
        process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 Migration script failed:', error.message);
    process.exit(1);
  }
};

// Handle process signals
process.on('SIGINT', async () => {
  console.log('\n⚠️  Migration interrupted');
  await databaseService.disconnect();
  process.exit(1);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️  Migration terminated');
  await databaseService.disconnect();
  process.exit(1);
});

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
