const User = require('./User');
const Class = require('./Class');
const Subject = require('./Subject');
const StudentClass = require('./StudentClass');
const Grade = require('./Grade');
const Exam = require('./Exam');
const ExamAnswer = require('./ExamAnswer');

// Define associations
User.hasMany(Class, { foreignKey: 'teacherId', as: 'taughtClasses' });
Class.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });

// Many-to-many relationship between Users (students) and Classes
User.belongsToMany(Class, { 
  through: StudentClass, 
  foreignKey: 'studentId',
  otherKey: 'classId',
  as: 'classes' 
});
Class.belongsToMany(User, { 
  through: StudentClass, 
  foreignKey: 'classId',
  otherKey: 'studentId',
  as: 'students' 
});

// One-to-many relationship between Class and Subject
Class.hasMany(Subject, { foreignKey: 'classId', as: 'subjects' });
Subject.belongsTo(Class, { foreignKey: 'classId', as: 'Class' });

// One-to-many relationship between User (student) and Grade
User.hasMany(Grade, { foreignKey: 'studentId', as: 'grades' });
Grade.belongsTo(User, { foreignKey: 'studentId', as: 'student' });

// One-to-many relationship between Subject and Grade
Subject.hasMany(Grade, { foreignKey: 'subjectId', as: 'grades' });
Grade.belongsTo(Subject, { foreignKey: 'subjectId', as: 'Subject' });

// One-to-many relationship between Subject and Exam
Subject.hasMany(Exam, { foreignKey: 'subjectId', as: 'exams' });
Exam.belongsTo(Subject, { foreignKey: 'subjectId', as: 'Subject' });

// One-to-many relationship between User (teacher) and Exam
User.hasMany(Exam, { foreignKey: 'createdBy', as: 'createdExams' });
Exam.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// One-to-many relationship between Exam and ExamAnswer
Exam.hasMany(ExamAnswer, { foreignKey: 'examId', as: 'answers' });
ExamAnswer.belongsTo(Exam, { foreignKey: 'examId', as: 'Exam' });

// One-to-many relationship between User (student) and ExamAnswer
User.hasMany(ExamAnswer, { foreignKey: 'studentId', as: 'examAnswers' });
ExamAnswer.belongsTo(User, { foreignKey: 'studentId', as: 'student' });

module.exports = {
  User,
  Class,
  Subject,
  StudentClass,
  Grade,
  Exam,
  ExamAnswer
};
