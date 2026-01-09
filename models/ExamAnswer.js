const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ExamAnswer = sequelize.define('ExamAnswer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  examId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Exams',
      key: 'id'
    }
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  answerPdfPath: {
    type: DataTypes.STRING,
    allowNull: false
  },
  answerPdfName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  grade: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },
  comments: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'ExamAnswers'
});

module.exports = ExamAnswer;

