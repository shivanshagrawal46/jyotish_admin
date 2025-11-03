const express = require('express');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../../models/User');
const authMiddleware = require('../../middleware/auth');

const router = express.Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_IDS = (process.env.GOOGLE_CLIENT_IDS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN; // if unset, tokens won't expire

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// POST /api/auth/google
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: 'idToken is required' });
    }

    // Verify with Google
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_IDS.length ? GOOGLE_CLIENT_IDS : GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ message: 'Invalid Google token' });
    }

    const {
      sub: googleId,
      email,
      name,
      picture: avatar,
      email_verified: emailVerified
    } = payload;

    if (!emailVerified) {
      return res.status(401).json({ message: 'Email not verified with Google' });
    }

    // Find or create user
    let user = await User.findOne({ $or: [ { googleId }, { email } ] });
    if (!user) {
      user = new User({
        username: email || googleId,
        email: email || null,
        googleId,
        name: name || '',
        avatar: avatar || ''
      });
      await user.save();
    } else {
      // Update user profile details if changed
      const updates = {};
      if (!user.googleId) updates.googleId = googleId;
      if (email && user.email !== email) updates.email = email;
      if (name && user.name !== name) updates.name = name;
      if (avatar && user.avatar !== avatar) updates.avatar = avatar;
      if (Object.keys(updates).length > 0) {
        await User.updateOne({ _id: user._id }, { $set: updates });
        user = await User.findById(user._id);
      }
    }

    // Issue our own JWT
    const tokenPayload = { user: { id: user._id, username: user.username } };
    const signOptions = JWT_EXPIRES_IN ? { expiresIn: JWT_EXPIRES_IN } : undefined;
    const token = jwt.sign(tokenPayload, JWT_SECRET, signOptions);

    return res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email || null,
        name: user.name || '',
        avatar: user.avatar || ''
      }
    });
  } catch (err) {
    return res.status(401).json({ message: 'Google authentication failed', error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json({
      id: user._id,
      username: user.username,
      email: user.email || null,
      name: user.name || '',
      avatar: user.avatar || ''
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch user' });
  }
});

module.exports = router;





