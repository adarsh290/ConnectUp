const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { likeUser } = require('../controllers/actionController');

router.post('/like/:userId', authMiddleware, likeUser);

module.exports = router;

