const { sequelize } = require('../config/database');
const { User } = require('../models');
require('dotenv').config();

/**
 * Script to create the first admin user
 * Run with: node scripts/seedAdmin.js
 */
async function seedAdmin() {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('Database connection established');

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',  // This will be hashed by the User model hooks
      role: 'admin',
      isApproved: true
    });

    console.log('Admin user created successfully:');
    console.log({
      id: adminUser.id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
      isApproved: adminUser.isApproved
    });

    console.log('\nYou can now log in with:');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    console.log('\nIMPORTANT: Change this password after first login!');

  } catch (error) {
    console.error('Error seeding admin user:', error);
  } finally {
    // Close database connection
    await sequelize.close();
    process.exit(0);
  }
}

// Run the seed function
seedAdmin();