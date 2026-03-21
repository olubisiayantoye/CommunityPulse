/**
 * Auth Routes - CommunityPulse
 * Handles user authentication endpoints
 * 
 * @module routes/auth
 */

import express from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword
} from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange
} from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);

// Protected routes (require authentication)
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, validateProfileUpdate, updateProfile);
router.put('/password', authenticateToken, validatePasswordChange, changePassword);

// Username availability check (public)
router.get('/check-username', async (req, res) => {
  try {
    const { username } = req.query;
    
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Username parameter required' });
    }
    
    const cleanUsername = username.trim();
    if (cleanUsername.length < 3 || cleanUsername.length > 50) {
      return res.json({ taken: false, valid: false });
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      return res.json({ taken: false, valid: false });
    }
    
    const { query } = await import('../config/database.js');
    const result = await query(
      'SELECT id FROM users WHERE username = $1 LIMIT 1',
      [cleanUsername]
    );
    
    res.json({
      taken: result.rows.length > 0,
      valid: true
    });
  } catch (err) {
    console.error('Username check error:', err);
    res.status(500).json({ taken: false, valid: true, error: 'Service unavailable' });
  }
});

export default router;