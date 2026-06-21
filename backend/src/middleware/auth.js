import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import env from '../config/env.js';
import AppError from '../utils/AppError.js';

const auth = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new AppError('Access denied. No token provided', 401, 'NO_TOKEN');
    }

    const token = header.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError('Token expired', 401, 'TOKEN_EXPIRED');
      }
      throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
    }

    const user = await User.findById(decoded.id).populate('role');
    if (!user) {
      throw new AppError('User not found', 401, 'USER_NOT_FOUND');
    }
    if (!user.isActive) {
      throw new AppError('Account deactivated', 401, 'ACCOUNT_INACTIVE');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export default auth;
