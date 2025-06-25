const express = require('express');
const router = express.Router();
const { requestReset, validateToken, resetPassword } = require('../controllers/passwordResetController');
const { validatePassword } = require('../middlewares/authMiddleware');

router.post('/request', requestReset);
router.get('/validate/:token', validateToken);
router.post('/reset/:token', validatePassword, resetPassword);

module.exports = router; 
