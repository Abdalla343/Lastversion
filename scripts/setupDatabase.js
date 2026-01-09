require('dotenv').config();

const mysql = require('mysql2/promise');
const { sequelize } = require('../config/database');

// Ensure associations are registered before syncing
require('../models');

async function createDatabaseIfMissing() {
  const { DB_HOST, DB_USER, DB_PASS, DB_NAME } = process.env;

  if (!DB_HOST || !DB_USER || !DB_NAME) {
    throw new Error(
      'Missing DB_HOST, DB_USER, or DB_NAME in environment variables.'
    );
  }

  const connection = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS || ''
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
  await connection.end();
  console.log(`Database "${DB_NAME}" is ready.`);
}

async function syncModels() {
  await sequelize.authenticate();
  console.log('Database connection established.');
  await sequelize.sync({ alter: true });
  console.log('All models synced successfully.');
}

async function setupDatabase() {
  try {
    await createDatabaseIfMissing();
    await syncModels();
    console.log('Database setup completed.');
  } catch (error) {
    console.error('Failed to set up database:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

setupDatabase();


