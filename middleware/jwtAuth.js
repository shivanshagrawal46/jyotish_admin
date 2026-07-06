const jwt = require('jsonwebtoken');

// JWT auth for the React admin. Accepts either an
// "Authorization: Bearer <token>" header (used by the React app) or the
// legacy "x-auth-token" header, so existing API clients keep working.
module.exports = function (req, res, next) {
  let token = null;

  const authHeader = req.header('authorization') || req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  }

  if (!token) {
    token = req.header('x-auth-token');
  }

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = decoded.user || decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
