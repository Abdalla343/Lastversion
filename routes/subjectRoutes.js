const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
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

/**
 * @route   POST /api/subjects
 * @desc    Create a new subject in a class (Teacher only)
 * @access  Private
 */
router.post('/', protect, isTeacher, async (req, res) => {
  try {
    const { name, description, classId } = req.body;

    if (!name || !classId) {
      return res.status(400).json({ message: 'Subject name and class ID are required' });
    }

    // Check if class exists and belongs to the teacher
    const classData = await Class.findByPk(classId);
    if (!classData || classData.teacherId !== req.user.id) {
      return res.status(404).json({ message: 'Class not found or access denied' });
    }

    const newSubject = await Subject.create({
      name,
      description,
      classId
    });

    res.status(201).json({
      message: 'Subject created successfully',
      subject: newSubject
    });
  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/subjects/class/:classId
 * @desc    Get all subjects for a specific class
 * @access  Private
 */
router.get('/class/:classId', protect, async (req, res) => {
  try {
    const { classId } = req.params;

    // Check if class exists
    const classData = await Class.findByPk(classId);
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check if user has access to this class
    const isTeacherOfClass = classData.teacherId === req.user.id;
    const isStudentInClass = req.user.role === 'student' && 
      await StudentClass.findOne({ where: { classId, studentId: req.user.id } });

    if (!isTeacherOfClass && !isStudentInClass) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const subjects = await Subject.findAll({
      where: { classId },
      attributes: ['id', 'name', 'description', 'createdAt']
    });

    res.json(subjects);
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/subjects/:id
 * @desc    Get a specific subject with students
 * @access  Private
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    const subject = await Subject.findByPk(id, {
      include: [
        {
          model: Class,
          as: 'Class',
          attributes: ['id', 'name', 'teacherId']
        }
      ]
    });

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Check if user has access to this subject's class
    const isTeacherOfClass = subject.Class.teacherId === req.user.id;
    const isStudentInClass = req.user.role === 'student' && 
      await StudentClass.findOne({ 
        where: { classId: subject.classId, studentId: req.user.id } 
      });

    if (!isTeacherOfClass && !isStudentInClass) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // If teacher, include all students in the class
    if (isTeacherOfClass) {
      const students = await User.findAll({
        include: [
          {
            model: Class,
            as: 'classes',
            through: { attributes: [] },
            where: { id: subject.classId },
            attributes: []
          }
        ],
        where: { role: 'student' },
        attributes: ['id', 'name', 'email']
      });

      res.json({
        subject: {
          id: subject.id,
          name: subject.name,
          description: subject.description,
          classId: subject.classId,
          className: subject.Class.name
        },
        students
      });
    } else {
      // If student, just return subject info
      res.json({
        subject: {
          id: subject.id,
          name: subject.name,
          description: subject.description,
          classId: subject.classId,
          className: subject.Class.name
        }
      });
    }
  } catch (error) {
    console.error('Get subject error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/subjects/:id
 * @desc    Update a subject (Teacher only)
 * @access  Private
 */
router.put('/:id', protect, isTeacher, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const subject = await Subject.findByPk(id, {
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

    // Check if teacher owns this subject's class
    if (subject.Class.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await subject.update({ name, description });

    res.json({
      message: 'Subject updated successfully',
      subject
    });
  } catch (error) {
    console.error('Update subject error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/subjects/:id
 * @desc    Delete a subject (Teacher only)
 * @access  Private
 */
router.delete('/:id', protect, isTeacher, async (req, res) => {
  try {
    const { id } = req.params;

    const subject = await Subject.findByPk(id, {
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

    // Check if teacher owns this subject's class
    if (subject.Class.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await subject.destroy();

    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
