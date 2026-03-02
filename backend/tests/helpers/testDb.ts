import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongod: MongoMemoryServer;

/**
 * Starts an in-memory MongoDB server and connects Mongoose.
 * Call this in beforeAll() of integration/E2E tests.
 */
export async function setupTestDb(): Promise<void> {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
}

/**
 * Disconnects Mongoose and stops the in-memory server.
 * Call this in afterAll().
 */
export async function teardownTestDb(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongod) {
    await mongod.stop();
  }
}

/**
 * Clears all collections in the test database.
 * Call this in beforeEach() to isolate test cases.
 */
export async function clearTestDb(): Promise<void> {
  const collections = mongoose.connection.collections;
  const clearPromises = Object.values(collections).map((collection) =>
    collection.deleteMany({})
  );
  await Promise.all(clearPromises);
}

/**
 * Helper to close only the mongoose connection without stopping the server.
 * Useful for testing connection failure scenarios.
 */
export async function disconnectTestDb(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

/**
 * Helper to reconnect to the test database.
 * Useful after testing connection failure scenarios.
 */
export async function reconnectTestDb(): Promise<void> {
  if (mongod && mongoose.connection.readyState === 0) {
    const uri = mongod.getUri();
    await mongoose.connect(uri);
  }
}
