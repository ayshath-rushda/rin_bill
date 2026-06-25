import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import env from '../config/env.js';

const optionalAuth = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return next();
    }
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.id).populate('role');
    if (user && user.isActive) {
      req.user = user;
    }
  } catch {
    // Ignore invalid/expired tokens — treat as unauthenticated
  }
  next();
};

export default optionalAuth;
