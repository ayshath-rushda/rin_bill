import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Role from '../models/Role.js';
import env from '../config/env.js';
import { generateTokens, generateAccessToken } from '../utils/generateTokens.js';
import AppError from '../utils/AppError.js';

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  avatar: user.avatar,
  role: user.role,
  isActive: user.isActive,
  isVerified: user.isVerified,
  createdAt: user.createdAt,
});

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      throw new AppError('Email already registered', 409, 'DUPLICATE_EMAIL');
    }

    const customerRole = await Role.findOne({ name: 'customer' });
    if (!customerRole) {
      throw new AppError('Default role not found. Run seed first.', 500, 'ROLE_NOT_FOUND');
    }

    const user = await User.create({ name, email, password, role: customerRole._id });
    const tokens = generateTokens(user._id);

    user.refreshToken = await bcrypt.hash(tokens.refreshToken, 10);
    await user.save();

    const populated = await User.findById(user._id).populate('role');

    res.status(201).json({
      success: true,
      data: { user: sanitizeUser(populated), ...tokens },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password').populate('role');
    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw new AppError('Account has been deactivated', 401, 'ACCOUNT_INACTIVE');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const tokens = generateTokens(user._id);

    user.refreshToken = await bcrypt.hash(tokens.refreshToken, 10);
    await user.save();

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: { user: sanitizeUser(user), ...tokens },
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) {
      throw new AppError('Refresh token required', 401, 'NO_REFRESH_TOKEN');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
    } catch {
      throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    const user = await User.findById(decoded.id).select('+refreshToken').populate('role');
    if (!user || !user.refreshToken) {
      throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    const isValid = await bcrypt.compare(token, user.refreshToken);
    if (!isValid) {
      throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    const tokens = generateTokens(user._id);

    user.refreshToken = await bcrypt.hash(tokens.refreshToken, 10);
    await user.save();

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: { user: sanitizeUser(user), accessToken: tokens.accessToken },
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({
        success: true,
        data: { message: 'If the email exists, an OTP has been sent' },
      });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    user.resetPasswordOTP = hashedOtp;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    console.log(`[DEV] OTP for ${email}: ${otp}`);

    res.json({
      success: true,
      data: { message: 'If the email exists, an OTP has been sent' },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email }).select('+resetPasswordOTP +resetPasswordExpires');
    if (!user || !user.resetPasswordOTP || !user.resetPasswordExpires) {
      throw new AppError('Invalid or expired OTP', 400, 'INVALID_OTP');
    }

    if (user.resetPasswordExpires < new Date()) {
      throw new AppError('OTP has expired', 400, 'OTP_EXPIRED');
    }

    const isValid = await bcrypt.compare(otp, user.resetPasswordOTP);
    if (!isValid) {
      throw new AppError('Invalid OTP', 400, 'INVALID_OTP');
    }

    user.isVerified = true;
    await user.save();

    res.json({
      success: true,
      data: { message: 'OTP verified successfully' },
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, password } = req.body;

    const user = await User.findOne({ email }).select(
      '+resetPasswordOTP +resetPasswordExpires +password'
    );
    if (!user || !user.resetPasswordOTP || !user.resetPasswordExpires) {
      throw new AppError('Invalid or expired OTP', 400, 'INVALID_OTP');
    }

    if (user.resetPasswordExpires < new Date()) {
      throw new AppError('OTP has expired', 400, 'OTP_EXPIRED');
    }

    const isValid = await bcrypt.compare(otp, user.resetPasswordOTP);
    if (!isValid) {
      throw new AppError('Invalid OTP', 400, 'INVALID_OTP');
    }

    user.password = password;
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      success: true,
      data: { message: 'Password reset successfully' },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res) => {
  const user = await User.findById(req.user._id).populate('role');
  res.json({ success: true, data: sanitizeUser(user) });
};

export const updateMe = async (req, res, next) => {
  try {
    const { name, phone, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    const populated = await User.findById(user._id).populate('role');
    res.json({ success: true, data: sanitizeUser(populated) });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      throw new AppError('Current password is incorrect', 400, 'WRONG_PASSWORD');
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, data: { message: 'Password changed successfully' } });
  } catch (error) {
    next(error);
  }
};
