const express = require('express');
const router = express.Router();
const { User, Class, Subject } = require('../models');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

/**
 * @route   GET /api/admin/users
 * @desc    Get all users (students and teachers)
 * @access  Private/Admin
 */
router.get('/users', protect, restrictTo(['admin']), async (req, res) => {
  try {
    // Get all users except admins with their classes and subjects
    const users = await User.findAll({
      where: {
        role: ['student', 'teacher']
      },
      attributes: { exclude: ['password'] },
      include: [
        { model: Class },
        { model: Subject }
      ]
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/admin/approve/:id
 * @desc    Approve teacher registration
 * @access  Private/Admin
 */
router.put('/approve/:id', protect, restrictTo(['admin']), async (req, res) => {
  try {
    const userId = req.params.id;

    // Find the user with associations
    const user = await User.findByPk(userId, { 
      include: [{ model: Class }, { model: Subject }]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is a teacher
    if (user.role !== 'teacher') {
      return res.status(400).json({ message: 'Only teacher accounts can be approved' });
    }

    // Update approval status
    user.isApproved = true;
    await user.save();

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
      classes: user.Classes,
      subjects: user.Subjects,
      message: 'Teacher account approved successfully'
    });
  } catch (error) {
    console.error('Error approving teacher:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/admin/user/:id
 * @desc    Delete a user
 * @access  Private/Admin
 */
router.delete('/user/:id', protect, restrictTo(['admin']), async (req, res) => {
  try {
    const userId = req.params.id;

    // Find the user
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting another admin
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin users' });
    }

    // Delete the user
    await user.destroy();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;