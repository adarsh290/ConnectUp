const User = require('../models/userModel');

// Get current user profile
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('matches', 'name email profileImageURL bio interests branch year');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update current user profile
const updateCurrentUser = async (req, res) => {
  try {
    const { name, branch, year, interests, bio, profileImageURL } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (branch !== undefined) updateData.branch = branch;
    if (year !== undefined) updateData.year = year;
    if (interests !== undefined) updateData.interests = interests;
    if (bio !== undefined) updateData.bio = bio;
    if (profileImageURL !== undefined) updateData.profileImageURL = profileImageURL;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete current user account
const deleteCurrentUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get users for explore page
const getExploreUsers = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    
    // Get all users except current user and already liked/matched users
    const excludeIds = [
      req.user.id,
      ...currentUser.likes.map(id => id.toString()),
      ...currentUser.matches.map(id => id.toString())
    ];

    // Build query with filters
    const query = {
      _id: { $nin: excludeIds }
    };

    // Filter by interests (if provided)
    if (req.query.interests) {
      const interestsArray = Array.isArray(req.query.interests) 
        ? req.query.interests 
        : req.query.interests.split(',');
      query.interests = { $in: interestsArray.map(i => i.trim()) };
    }

    // Filter by branch (if provided)
    if (req.query.branch) {
      query.branch = req.query.branch;
    }

    // Filter by year (if provided)
    if (req.query.year) {
      query.year = parseInt(req.query.year);
    }

    const users = await User.find(query).select('-password -likes -matches');

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCurrentUser,
  updateCurrentUser,
  deleteCurrentUser,
  getExploreUsers
};

