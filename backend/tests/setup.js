const { resetTestDatabase } = require('./config/database');

// Configuration globale
jest.setTimeout(10000);

// Réinitialisation de la base de données avant tous les tests
beforeAll(async () => {
  await resetTestDatabase();
});
