const User = require('../models/userModel');
const Message = require('../models/messageModel');

// Generate conversationId from two user IDs (sorted)
const generateConversationId = (userId1, userId2) => {
  const ids = [userId1.toString(), userId2.toString()].sort();
  return ids.join('_');
};

// Get matched users
const getMatches = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('matches', 'name email profileImageURL bio interests branch year');

    res.json(user.matches || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get chat history
const getChatHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const conversationId = generateConversationId(currentUserId, userId);

    // Mark messages as read first (where current user is the receiver)
    await Message.updateMany(
      {
        conversationId,
        receiver: currentUserId,
        read: false
      },
      { read: true }
    );

    // Fetch messages once (already updated)
    const messages = await Message.find({ conversationId })
      .populate('sender', 'name profileImageURL')
      .populate('receiver', 'name profileImageURL')
      .sort({ timestamp: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMatches,
  getChatHistory,
  generateConversationId
};

