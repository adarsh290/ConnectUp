const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  getCurrentUser,
  updateCurrentUser,
  deleteCurrentUser,
  getExploreUsers
} = require('../controllers/userController');
const { uploadProfilePicture } = require('../controllers/uploadController');

router.get('/me', authMiddleware, getCurrentUser);
router.put('/me', authMiddleware, updateCurrentUser);
router.delete('/me', authMiddleware, deleteCurrentUser);
router.get('/explore', authMiddleware, getExploreUsers);
router.post('/me/upload-profile-picture', authMiddleware, upload.single('profilePicture'), uploadProfilePicture);

module.exports = router;

