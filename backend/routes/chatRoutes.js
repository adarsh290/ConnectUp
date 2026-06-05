const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getMatches, getChatHistory } = require('../controllers/chatController');

router.get('/matches', authMiddleware, getMatches);
router.get('/history/:userId', authMiddleware, getChatHistory);

module.exports = router;

