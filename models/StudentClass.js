const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StudentClass = sequelize.define('StudentClass', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  classId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Classes',
      key: 'id'
    }
  }
}, {
  timestamps: true,
  tableName: 'StudentClasses',
  indexes: [
    {
      unique: true,
      fields: ['studentId', 'classId']
    }
  ]
});

module.exports = StudentClass;
