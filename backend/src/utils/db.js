const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const isTest = process.env.NODE_ENV === 'test';

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: isTest ? process.env.DB_TEST_NAME : process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const selectedDB = isTest ? process.env.DB_TEST_NAME : process.env.DB_NAME;
console.log(`[DB] Connected to database: ${selectedDB} (${isTest ? 'TEST MODE' : 'PROD/DEV'})`);

module.exports = db;
