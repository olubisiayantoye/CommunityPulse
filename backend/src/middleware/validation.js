/**
 * Validation Middleware - CommunityPulse
 * Centralized input validation using express-validator
 * 
 * @module middleware/validation
 */

import { body, param, query, validationResult } from 'express-validator';

// ===== HELPER: Handle validation results =====
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// ===== AUTH VALIDATION =====

/**
 * Validate user registration input
 */
export const validateRegistration = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain number')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain special character'),
  
  handleValidationErrors
];

/**
 * Validate user login input
 */
export const validateLogin = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required'),
  
  body('password')
    .notEmpty().withMessage('Password is required'),
  
  handleValidationErrors
];

/**
 * Validate profile update input
 */
export const validateProfileUpdate = [
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
  
  handleValidationErrors
];

/**
 * Validate password change input
 */
export const validatePasswordChange = [
  body('current_password')
    .notEmpty().withMessage('Current password is required'),
  
  body('new_password')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain number')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain special character'),
  
  handleValidationErrors
];

// ===== FEEDBACK VALIDATION =====

/**
 * Validate feedback submission input
 */
export const validateFeedbackSubmit = [
  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ min: 10, max: 2000 }).withMessage('Message must be 10-2000 characters'),
  
  body('category_id')
    .optional()
    .isUUID().withMessage('Invalid category ID format'),
  
  body('is_anonymous')
    .optional()
    .isBoolean().withMessage('is_anonymous must be a boolean'),
  
  handleValidationErrors
];

/**
 * Validate feedback status update (ADMIN ONLY)
 */
export const validateFeedbackStatus = [
  param('id')
    .isUUID().withMessage('Invalid feedback ID format'),
  
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['pending', 'in_progress', 'resolved', 'dismissed']).withMessage('Invalid status value'),
  
  body('admin_notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Admin notes must be less than 500 characters'),
  
  handleValidationErrors
];

/**
 * Validate feedback export parameters (ADMIN ONLY)
 */
export const validateExportParams = [
  query('format')
    .optional()
    .isIn(['csv', 'json']).withMessage('Format must be csv or json'),
  
  query('sentiment_label')
    .optional()
    .isIn(['Positive', 'Neutral', 'Negative']).withMessage('Invalid sentiment value'),
  
  query('category_id')
    .optional()
    .isUUID().withMessage('Invalid category ID format'),
  
  query('start_date')
    .optional()
    .isISO8601().withMessage('Invalid date format (use ISO 8601)'),
  
  query('end_date')
    .optional()
    .isISO8601().withMessage('Invalid date format (use ISO 8601)'),
  
  handleValidationErrors
];

/**
 * Validate feedback list query parameters
 */
export const validateFeedbackList = [
  query('category_id')
    .optional()
    .isUUID().withMessage('Invalid category ID format'),
  
  query('sentiment_label')
    .optional()
    .isIn(['Positive', 'Neutral', 'Negative']).withMessage('Invalid sentiment value'),
  
  query('status')
    .optional()
    .isIn(['pending', 'in_progress', 'resolved', 'dismissed']).withMessage('Invalid status value'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Search query too long'),
  
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100')
    .toInt(),
  
  query('include_mine')
    .optional()
    .isBoolean().withMessage('include_mine must be a boolean'),
  
  handleValidationErrors
];

// ===== CATEGORY VALIDATION =====

/**
 * Validate category create/update input
 */
export const validateCategory = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Category name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Category name must be 2-50 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Description must be less than 200 characters'),
  
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Color must be a valid hex code (e.g., #3B82F6)'),
  
  body('is_active')
    .optional()
    .isBoolean().withMessage('is_active must be a boolean'),
  
  handleValidationErrors
];

// ===== VOTE VALIDATION =====

/**
 * Validate vote creation input
 */
export const validateVote = [
  body('feedback_id')
    .isUUID().withMessage('Invalid feedback ID format'),
  
  body('vote_type')
    .notEmpty().withMessage('Vote type is required')
    .isIn(['up', 'down']).withMessage('Vote type must be up or down'),
  
  handleValidationErrors
];

// ===== ADMIN USER MANAGEMENT VALIDATION =====

/**
 * Validate user role update (ADMIN ONLY)
 */
export const validateUserRoleUpdate = [
  param('id')
    .isUUID().withMessage('Invalid user ID format'),
  
  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(['member', 'admin']).withMessage('Role must be member or admin'),
  
  handleValidationErrors
];

/**
 * Validate user list query parameters (ADMIN ONLY)
 */
export const validateUserList = [
  query('role')
    .optional()
    .isIn(['member', 'admin']).withMessage('Invalid role value'),
  
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100')
    .toInt(),
  
  handleValidationErrors
];

// ===== ANALYTICS VALIDATION =====

/**
 * Validate analytics query parameters
 */
export const validateAnalyticsParams = [
  query('period')
    .optional()
    .isIn(['24h', '7d', '30d', '90d']).withMessage('Period must be 24h, 7d, 30d, or 90d'),
  
  handleValidationErrors
];

// ===== GENERIC UUID VALIDATION =====

/**
 * Validate UUID parameter (reusable)
 * @param {string} paramName - Name of the URL parameter
 */
export const validateUUID = (paramName) => [
  param(paramName)
    .isUUID().withMessage(`Invalid ${paramName} format`),
  handleValidationErrors
];

// ===== EXPORT ALL VALIDATORS =====
// This ensures all functions are available for import
export default {
  handleValidationErrors,
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
  validateFeedbackSubmit,
  validateFeedbackStatus,
  validateExportParams,
  validateFeedbackList,
  validateCategory,
  validateVote,
  validateUserRoleUpdate,
  validateUserList,
  validateAnalyticsParams,
  validateUUID
};