const { Sequelize } = require('sequelize');
const fs = require('fs');
require('dotenv').config();
const path = require('path');

// Create a Sequelize instance with database connection parameters from environment variables
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    dialectOptions: {
     ssl: {
        ca: fs.readFileSync(path.join(__dirname, 'isrgrootx1.pem')),
        require: true,
        rejectUnauthorized: true
      }
    },
    logging: false, // Set to console.log to see SQL queries in console
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);
 // Test the database connection
  const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    return true;
  } catch(error){
    console.error('Unable to connect to the database:', error);
    throw error; // Propagate the error for better handling
  }
 };

module.exports = { sequelize, testConnection };

