const { resetTestDatabase, closeConnection } = require('./config/database');

// Global timeout
jest.setTimeout(10000);

// Reset database before all tests
beforeAll(async () => {
  await resetTestDatabase();
});

// Close connection after all tests
afterAll(async () => {
  await closeConnection();
});
