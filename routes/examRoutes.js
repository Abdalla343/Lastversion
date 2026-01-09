const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/authMiddleware');
const Exam = require('../models/Exam');
const ExamAnswer = require('../models/ExamAnswer');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const User = require('../models/User');

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

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
const examsDir = path.join(uploadsDir, 'exams');
const answersDir = path.join(uploadsDir, 'answers');

[uploadsDir, examsDir, answersDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for exam PDF uploads (teacher)
const examStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, examsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `exam-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const examUpload = multer({
  storage: examStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Configure multer for answer PDF uploads (student)
const answerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, answersDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `answer-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const answerUpload = multer({
  storage: answerStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

/**
 * @route   POST /api/exams
 * @desc    Upload exam PDF for a subject (Teacher only)
 * @access  Private
 */
router.post('/', protect, isTeacher, examUpload.single('examPdf'), async (req, res) => {
  try {
    const { subjectId, title, description } = req.body;

    if (!subjectId || !title) {
      return res.status(400).json({ message: 'Subject ID and title are required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Exam PDF file is required' });
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
      // Delete uploaded file if subject doesn't exist
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Subject not found' });
    }

    if (subject.Class.teacherId !== req.user.id) {
      // Delete uploaded file if access denied
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ message: 'Access denied' });
    }

    const exam = await Exam.create({
      subjectId: parseInt(subjectId),
      title,
      description: description || null,
      examPdfPath: req.file.path,
      examPdfName: req.file.originalname,
      createdBy: req.user.id
    });

    const examWithRelations = await Exam.findByPk(exam.id, {
      include: [
        {
          model: Subject,
          as: 'Subject',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(201).json({
      message: 'Exam uploaded successfully',
      exam: examWithRelations
    });
  } catch (error) {
    console.error('Upload exam error:', error);
    // Delete uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/exams
 * @desc    Get all exams for the authenticated teacher or student's enrolled classes
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    if (req.user.role === 'teacher') {
      const exams = await Exam.findAll({
        include: [
          {
            model: Subject,
            as: 'Subject',
            include: [
              {
                model: Class,
                as: 'Class',
                attributes: ['id', 'name', 'teacherId'],
                where: { teacherId: req.user.id }
              }
            ]
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'email']
          },
          {
            model: ExamAnswer,
            as: 'answers',
            include: [
              {
                model: User,
                as: 'student',
                attributes: ['id', 'name', 'email']
              }
            ]
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.json(exams);
    } else if (req.user.role === 'student') {
      // Get classes where student is enrolled
      const StudentClass = require('../models/StudentClass');
      const studentClasses = await StudentClass.findAll({
        where: { studentId: req.user.id },
        attributes: ['classId']
      });

      const classIds = studentClasses.map(sc => sc.classId);

      if (classIds.length === 0) {
        return res.json([]);
      }

      // Get exams for subjects in enrolled classes
      const exams = await Exam.findAll({
        include: [
          {
            model: Subject,
            as: 'Subject',
            include: [
              {
                model: Class,
                as: 'Class',
                attributes: ['id', 'name', 'teacherId'],
                where: { id: classIds }
              }
            ]
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'email']
          },
          {
            model: ExamAnswer,
            as: 'answers',
            where: { studentId: req.user.id },
            required: false,
            include: [
              {
                model: User,
                as: 'student',
                attributes: ['id', 'name', 'email']
              }
            ]
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.json(exams);
    } else {
      res.status(403).json({ message: 'Access denied' });
    }
  } catch (error) {
    console.error('Get all exams error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/exams/subject/:subjectId
 * @desc    Get all exams for a subject
 * @access  Private
 */
router.get('/subject/:subjectId', protect, async (req, res) => {
  try {
    const { subjectId } = req.params;

    const exams = await Exam.findAll({
      where: { subjectId: parseInt(subjectId) },
      include: [
        {
          model: Subject,
          as: 'Subject',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: ExamAnswer,
          as: 'answers',
          include: [
            {
              model: User,
              as: 'student',
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(exams);
  } catch (error) {
    console.error('Get exams error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/exams/:id
 * @desc    Get a single exam by ID
 * @access  Private
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    const exam = await Exam.findByPk(parseInt(id), {
      include: [
        {
          model: Subject,
          as: 'Subject',
          include: [
            {
              model: Class,
              as: 'Class',
              attributes: ['id', 'name', 'teacherId']
            }
          ]
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: ExamAnswer,
          as: 'answers',
          include: [
            {
              model: User,
              as: 'student',
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ]
    });

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    res.json(exam);
  } catch (error) {
    console.error('Get exam error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/exams/:id/exam-pdf
 * @desc    Download exam PDF file
 * @access  Private
 */
router.get('/:id/exam-pdf', protect, async (req, res) => {
  try {
    const { id } = req.params;

    const exam = await Exam.findByPk(parseInt(id), {
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

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Check access: teacher who created it, or students enrolled in the class
    if (req.user.role === 'teacher') {
      if (exam.Subject.Class.teacherId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (req.user.role === 'student') {
      // Check if student is enrolled in the class
      const StudentClass = require('../models/StudentClass');
      const isEnrolled = await StudentClass.findOne({
        where: {
          studentId: req.user.id,
          classId: exam.Subject.classId
        }
      });
      if (!isEnrolled) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    if (!fs.existsSync(exam.examPdfPath)) {
      return res.status(404).json({ message: 'Exam PDF file not found' });
    }

    res.download(exam.examPdfPath, exam.examPdfName);
  } catch (error) {
    console.error('Download exam PDF error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/exams/:id/answers
 * @desc    Upload answer PDF for an exam (Student only)
 * @access  Private
 */
router.post('/:id/answers', protect, isStudent, answerUpload.single('answerPdf'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: 'Answer PDF file is required' });
    }

    const exam = await Exam.findByPk(parseInt(id), {
      include: [
        {
          model: Subject,
          as: 'Subject',
          include: [
            {
              model: Class,
              as: 'Class',
              attributes: ['id', 'teacherId']
            }
          ]
        }
      ]
    });

    if (!exam) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Check if student is enrolled in the class
    const StudentClass = require('../models/StudentClass');
    const isEnrolled = await StudentClass.findOne({
      where: {
        studentId: req.user.id,
        classId: exam.Subject.classId
      }
    });

    if (!isEnrolled) {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ message: 'You are not enrolled in this class' });
    }

    // Check if student already submitted an answer
    const existingAnswer = await ExamAnswer.findOne({
      where: {
        examId: parseInt(id),
        studentId: req.user.id
      }
    });

    if (existingAnswer) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'You have already submitted an answer for this exam' });
    }

    const answer = await ExamAnswer.create({
      examId: parseInt(id),
      studentId: req.user.id,
      answerPdfPath: req.file.path,
      answerPdfName: req.file.originalname
    });

    const answerWithRelations = await ExamAnswer.findByPk(answer.id, {
      include: [
        {
          model: Exam,
          as: 'Exam',
          attributes: ['id', 'title']
        },
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(201).json({
      message: 'Answer uploaded successfully',
      answer: answerWithRelations
    });
  } catch (error) {
    console.error('Upload answer error:', error);
    // Delete uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/exams/:id/answers
 * @desc    Get all answers for an exam (Teacher only)
 * @access  Private
 */
router.get('/:id/answers', protect, isTeacher, async (req, res) => {
  try {
    const { id } = req.params;

    const exam = await Exam.findByPk(parseInt(id), {
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

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    if (exam.Subject.Class.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const answers = await ExamAnswer.findAll({
      where: { examId: parseInt(id) },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(answers);
  } catch (error) {
    console.error('Get answers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/exams/:id/answers/:answerId/answer-pdf
 * @desc    Download answer PDF file
 * @access  Private
 */
router.get('/:id/answers/:answerId/answer-pdf', protect, async (req, res) => {
  try {
    const { id, answerId } = req.params;

    const answer = await ExamAnswer.findByPk(parseInt(answerId), {
      include: [
        {
          model: Exam,
          as: 'Exam',
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
        }
      ]
    });

    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    // Check access: teacher who owns the class, or student who submitted it
    if (req.user.role === 'teacher') {
      if (answer.Exam.Subject.Class.teacherId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (req.user.role === 'student') {
      if (answer.studentId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    if (!fs.existsSync(answer.answerPdfPath)) {
      return res.status(404).json({ message: 'Answer PDF file not found' });
    }

    res.download(answer.answerPdfPath, answer.answerPdfName);
  } catch (error) {
    console.error('Download answer PDF error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PATCH /api/exams/:id/answers/:answerId/grade
 * @desc    Grade an exam answer (Teacher only)
 * @access  Private
 */
router.patch('/:id/answers/:answerId/grade', protect, isTeacher, async (req, res) => {
  try {
    const { id, answerId } = req.params;
    const { grade, comments } = req.body;

    if (grade === undefined || grade === null) {
      return res.status(400).json({ message: 'Grade is required' });
    }

    const gradeNum = parseFloat(grade);
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 100) {
      return res.status(400).json({ message: 'Grade must be a number between 0 and 100' });
    }

    const answer = await ExamAnswer.findByPk(parseInt(answerId), {
      include: [
        {
          model: Exam,
          as: 'Exam',
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
        }
      ]
    });

    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    if (answer.Exam.Subject.Class.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await answer.update({
      grade: gradeNum,
      comments: comments || null
    });

    const updatedAnswer = await ExamAnswer.findByPk(answer.id, {
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Exam,
          as: 'Exam',
          attributes: ['id', 'title']
        }
      ]
    });

    res.json({
      message: 'Grade updated successfully',
      answer: updatedAnswer
    });
  } catch (error) {
    console.error('Grade answer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/exams/:id
 * @desc    Delete an exam (Teacher only)
 * @access  Private
 */
router.delete('/:id', protect, isTeacher, async (req, res) => {
  try {
    const { id } = req.params;

    const exam = await Exam.findByPk(parseInt(id), {
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

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    if (exam.Subject.Class.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete all answer files
    const answers = await ExamAnswer.findAll({ where: { examId: parseInt(id) } });
    answers.forEach(answer => {
      if (fs.existsSync(answer.answerPdfPath)) {
        fs.unlinkSync(answer.answerPdfPath);
      }
    });

    // Delete exam PDF file
    if (fs.existsSync(exam.examPdfPath)) {
      fs.unlinkSync(exam.examPdfPath);
    }

    // Delete exam and answers from database
    await ExamAnswer.destroy({ where: { examId: parseInt(id) } });
    await exam.destroy();

    res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Delete exam error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

