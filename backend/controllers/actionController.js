const User = require('../models/userModel');

// Like a user
const likeUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    if (currentUserId === userId) {
      return res.status(400).json({ message: 'Cannot like yourself' });
    }

    const currentUser = await User.findById(currentUserId);
    const likedUser = await User.findById(userId);

    if (!likedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already liked
    if (currentUser.likes.some(id => id.toString() === userId)) {
      return res.status(400).json({ message: 'User already liked' });
    }

    // Add to likes array
    currentUser.likes.push(userId);
    await currentUser.save();

    // Check for mutual like (match)
    const isMatch = likedUser.likes.some(id => id.toString() === currentUserId);

    if (isMatch) {
      // Create match - add to both users' matches arrays
      if (!currentUser.matches.some(id => id.toString() === userId)) {
        currentUser.matches.push(userId);
        await currentUser.save();
      }

      if (!likedUser.matches.some(id => id.toString() === currentUserId)) {
        likedUser.matches.push(currentUserId);
        await likedUser.save();
      }

      return res.json({ match: true, message: 'It\'s a match!' });
    }

    res.json({ match: false });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { likeUser };

