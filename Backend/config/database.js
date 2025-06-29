const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const options = {
      autoIndex: process.env.MONGODB_OPTIONS_AUTO_INDEX === 'true',
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected successfully');
    });

    // Create indexes on startup in development
    if (process.env.NODE_ENV === 'development') {
      logger.info('Creating database indexes...');
      await createIndexes();
    }

  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Create necessary indexes
const createIndexes = async () => {
  try {
    const collections = mongoose.connection.collections;
    
    // Users collection indexes
    if (collections.users) {
      await collections.users.createIndex({ email: 1 }, { unique: true });
      await collections.users.createIndex({ isActive: 1, createdAt: -1 });
    }

    // Contacts collection indexes
    if (collections.contacts) {
      await collections.contacts.createIndex({ email: 1 });
      await collections.contacts.createIndex({ company: 1 });
      await collections.contacts.createIndex({ owner: 1, createdAt: -1 });
      await collections.contacts.createIndex({ 
        firstName: 'text', 
        lastName: 'text', 
        email: 'text' 
      });
    }

    // Companies collection indexes
    if (collections.companies) {
      await collections.companies.createIndex({ owner: 1 });
      await collections.companies.createIndex({ name: 'text', domain: 'text' });
    }

    // Deals collection indexes
    if (collections.deals) {
      await collections.deals.createIndex({ owner: 1, status: 1 });
      await collections.deals.createIndex({ company: 1 });
      await collections.deals.createIndex({ contact: 1 });
      await collections.deals.createIndex({ stage: 1, expectedCloseDate: 1 });
    }

    // Activities collection indexes
    if (collections.activities) {
      await collections.activities.createIndex({ relatedTo: 1, relatedToModel: 1 });
      await collections.activities.createIndex({ owner: 1, createdAt: -1 });
      await collections.activities.createIndex({ type: 1, createdAt: -1 });
    }

    // Tasks collection indexes
    if (collections.tasks) {
      await collections.tasks.createIndex({ assignee: 1, status: 1 });
      await collections.tasks.createIndex({ dueDate: 1 });
      await collections.tasks.createIndex({ priority: 1, status: 1 });
      await collections.tasks.createIndex({ 
        title: 'text', 
        description: 'text' 
      });
    }

    logger.info('Database indexes created successfully');
  } catch (error) {
    logger.error('Error creating indexes:', error);
  }
};

module.exports = connectDB;