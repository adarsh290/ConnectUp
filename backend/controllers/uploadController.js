const path = require('path');
const User = require('../models/userModel');

// Upload profile picture
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const userId = req.user.id;
    const filePath = `/uploads/${req.file.filename}`;

    // Update user's profile image URL
    const user = await User.findByIdAndUpdate(
      userId,
      { profileImageURL: filePath },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile picture uploaded successfully',
      profileImageURL: filePath,
      user
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { uploadProfilePicture };

