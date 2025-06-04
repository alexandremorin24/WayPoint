const express = require('express');
const router = express.Router();
const { registerUser, loginUser, verifyEmail } = require('../controllers/authController');
const jwt = require('jsonwebtoken');
const db = require('../utils/db');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/verify-email', verifyEmail);

module.exports = router;
