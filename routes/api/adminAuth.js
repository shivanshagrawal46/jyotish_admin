const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const jwtAuth = require('../../middleware/jwtAuth');

const router = express.Router();

const TOKEN_TTL = '7d';

// POST /api/admin/login  -> issue a JWT for the React admin
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const payload = { user: { id: user._id.toString(), username: user.username } };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret', {
      expiresIn: TOKEN_TTL,
    });

    res.json({
      token,
      user: { id: user._id.toString(), username: user.username },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/admin/me -> validate the token / return current admin
router.get('/me', jwtAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
