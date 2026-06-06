const mongoose = require('mongoose');
const config = require('./env');
const logger = require('../utils/logger');

let isConnected = false;

async function connectDatabase(customUri = null) {
  const uri = customUri || config.mongoUri;

  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true
    });

    isConnected = true;
    logger.info(`MongoDB connected successfully to ${uri.replace(/\/\/.*@/, '//<redacted>@')}`);

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB runtime error', err);
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      logger.warn('MongoDB disconnected');
    });

    return mongoose.connection;
  } catch (error) {
    logger.error('MongoDB connection failed', error);
    throw error;
  }
}

async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected cleanly');
  }
}

module.exports = {
  connectDatabase,
  disconnectDatabase
};
