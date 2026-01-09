const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Grade = require('../models/Grade');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const User = require('../models/User');
const StudentClass = require('../models/StudentClass');

// Middleware to check if user is a teacher
const isTeacher = (req, res, next) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ message: 'Access denied. Teacher role required.' });
  }
  next();
};

// Middleware to check if user is a student
const isStudent = (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Access denied. Student role required.' });
  }
  next();
};

/**
 * @route   POST /api/grades
 * @desc    Assign grades to students (Teacher only)
 * @access  Private
 */
router.post('/', protect, isTeacher, async (req, res) => {
  try {
    const { subjectId, grades } = req.body;

    if (!subjectId || !grades || !Array.isArray(grades)) {
      return res.status(400).json({ message: 'Subject ID and grades array are required' });
    }

    // Check if subject exists and teacher has access
    const subject = await Subject.findByPk(subjectId, {
      include: [
        {
          model: Class,
          as: 'Class',
          attributes: ['teacherId']
        }
      ]
    });

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    if (subject.Class.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Validate grades data
    for (const gradeData of grades) {
      const { studentId, grade, assignment, comments } = gradeData;

      if (!studentId || grade === undefined || grade === null) {
        return res.status(400).json({ message: 'Student ID and grade are required for each entry' });
      }

      if (grade < 0 || grade > 100) {
        return res.status(400).json({ message: 'Grade must be between 0 and 100' });
      }

      // Check if student is enrolled in the class
      const isEnrolled = await StudentClass.findOne({
        where: { studentId, classId: subject.classId }
      });

      if (!isEnrolled) {
        return res.status(400).json({ 
          message: `Student with ID ${studentId} is not enrolled in this class` 
        });
      }
    }

    // Create grades
    const gradeEntries = grades.map(gradeData => ({
      studentId: gradeData.studentId,
      subjectId,
      grade: gradeData.grade,
      assignment: gradeData.assignment || null,
      comments: gradeData.comments || null
    }));

    const createdGrades = await Grade.bulkCreate(gradeEntries, {
      updateOnDuplicate: ['grade', 'assignment', 'comments']
    });

    res.status(201).json({
      message: 'Grades assigned successfully',
      grades: createdGrades
    });
  } catch (error) {
    console.error('Assign grades error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/grades/subject/:subjectId
 * @desc    Get all grades for a specific subject (Teacher only)
 * @access  Private
 */
router.get('/subject/:subjectId', protect, isTeacher, async (req, res) => {
  try {
    const { subjectId } = req.params;

    // Check if subject exists and teacher has access
    const subject = await Subject.findByPk(subjectId, {
      include: [
        {
          model: Class,
          as: 'Class',
          attributes: ['teacherId']
        }
      ]
    });

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    if (subject.Class.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const grades = await Grade.findAll({
      where: { subjectId },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(grades);
  } catch (error) {
    console.error('Get subject grades error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/grades/my-grades
 * @desc    Get all grades for the authenticated student
 * @access  Private
 */
router.get('/my-grades', protect, isStudent, async (req, res) => {
  try {
    const grades = await Grade.findAll({
      where: { studentId: req.user.id },
      include: [
        {
          model: Subject,
          as: 'Subject',
          attributes: ['id', 'name'],
          include: [
            {
              model: Class,
              as: 'Class',
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(grades);
  } catch (error) {
    console.error('Get student grades error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/grades/subject/:subjectId/my-grade
 * @desc    Get student's grade for a specific subject
 * @access  Private
 */
router.get('/subject/:subjectId/my-grade', protect, isStudent, async (req, res) => {
  try {
    const { subjectId } = req.params;

    // Check if student has access to this subject
    const subject = await Subject.findByPk(subjectId, {
      include: [
        {
          model: Class,
          as: 'Class',
          attributes: ['id']
        }
      ]
    });

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    const isEnrolled = await StudentClass.findOne({
      where: { studentId: req.user.id, classId: subject.classId }
    });

    if (!isEnrolled) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const grades = await Grade.findAll({
      where: { 
        studentId: req.user.id,
        subjectId 
      },
      include: [
        {
          model: Subject,
          as: 'Subject',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(grades);
  } catch (error) {
    console.error('Get student subject grade error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/grades/:id
 * @desc    Update a grade (Teacher only)
 * @access  Private
 */
router.put('/:id', protect, isTeacher, async (req, res) => {
  try {
    const { id } = req.params;
    const { grade, assignment, comments } = req.body;

    if (grade === undefined || grade === null) {
      return res.status(400).json({ message: 'Grade is required' });
    }

    if (grade < 0 || grade > 100) {
      return res.status(400).json({ message: 'Grade must be between 0 and 100' });
    }

    const gradeRecord = await Grade.findByPk(id, {
      include: [
        {
          model: Subject,
          as: 'Subject',
          include: [
            {
              model: Class,
              as: 'Class',
              attributes: ['teacherId']
            }
          ]
        }
      ]
    });

    if (!gradeRecord) {
      return res.status(404).json({ message: 'Grade not found' });
    }

    // Check if teacher has access to this grade
    if (gradeRecord.Subject.Class.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await gradeRecord.update({ grade, assignment, comments });

    res.json({
      message: 'Grade updated successfully',
      grade: gradeRecord
    });
  } catch (error) {
    console.error('Update grade error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PATCH /api/grades/:id
 * @desc    Partially update a grade (Teacher only)
 * @access  Private
 */
router.patch('/:id', protect, isTeacher, async (req, res) => {
  try {
    const { id } = req.params;
    const { grade, assignment, comments } = req.body;

    const gradeRecord = await Grade.findByPk(id, {
      include: [
        {
          model: Subject,
          as: 'Subject',
          include: [
            {
              model: Class,
              as: 'Class',
              attributes: ['teacherId']
            }
          ]
        }
      ]
    });

    if (!gradeRecord) {
      return res.status(404).json({ message: 'Grade not found' });
    }

    // Check if teacher has access to this grade
    if (gradeRecord.Subject.Class.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Validate grade if provided
    if (grade !== undefined && grade !== null) {
      if (grade < 0 || grade > 100) {
        return res.status(400).json({ message: 'Grade must be between 0 and 100' });
      }
    }

    // Update only provided fields
    const updateData = {};
    if (grade !== undefined) updateData.grade = grade;
    if (assignment !== undefined) updateData.assignment = assignment;
    if (comments !== undefined) updateData.comments = comments;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'At least one field must be provided for update' });
    }

    await gradeRecord.update(updateData);

    // Reload to get updated data with associations
    await gradeRecord.reload({
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.json({
      message: 'Grade updated successfully',
      grade: gradeRecord
    });
  } catch (error) {
    console.error('Update grade error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/grades/:id
 * @desc    Delete a grade (Teacher only)
 * @access  Private
 */
router.delete('/:id', protect, isTeacher, async (req, res) => {
  try {
    const { id } = req.params;

    const gradeRecord = await Grade.findByPk(id, {
      include: [
        {
          model: Subject,
          as: 'Subject',
          include: [
            {
              model: Class,
              as: 'Class',
              attributes: ['teacherId']
            }
          ]
        }
      ]
    });

    if (!gradeRecord) {
      return res.status(404).json({ message: 'Grade not found' });
    }

    // Check if teacher has access to this grade
    if (gradeRecord.Subject.Class.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await gradeRecord.destroy();

    res.json({ message: 'Grade deleted successfully' });
  } catch (error) {
    console.error('Delete grade error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
