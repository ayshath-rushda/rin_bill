import mongoose from 'mongoose';
import AppError from '../utils/AppError.js';

const errorHandler = (err, _req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'Internal server error';
  let details;

  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  if (err.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_KEY';
    const field = Object.keys(err.keyPattern)[0];
    message = `${field} already exists`;
  }

  if (err instanceof mongoose.Error.CastError) {
    statusCode = 404;
    code = 'INVALID_ID';
    message = 'Resource not found';
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid or expired token';
  }

  if (!err.isOperational) {
    console.error('Unhandled error:', err);
  }

  res.status(statusCode).json({
    success: false,
    error: { code, message, ...(details && { details }) },
  });
};

export default errorHandler;
