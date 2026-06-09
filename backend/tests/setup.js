const mongoose = require('mongoose');
const { connectDatabase, disconnectDatabase } = require('../src/config/database');

const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/paylink_test_db';

beforeAll(async () => {
  await connectDatabase(TEST_DB_URI);
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    // Drop test database cleanly
    try {
      await mongoose.connection.dropDatabase();
    } catch {}
    await disconnectDatabase();
  }
});

async function clearCollections() {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

module.exports = {
  clearCollections
};
