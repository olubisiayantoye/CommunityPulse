/**
 * Feedback Routes - CommunityPulse
 * Handles feedback submission, retrieval, and voting
 * 
 * @module routes/feedback
 */

import express from 'express';
import {
  getCategories,
  submitFeedback,
  getFeedback,
  getFeedbackById,
  updateFeedback,
  exportFeedback,
  deleteFeedback
} from '../controllers/feedback.controller.js';
import {
  createVote,
  deleteVote,
  getUserVote
} from '../controllers/vote.controller.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import {
  validateFeedbackSubmit,
  validateFeedbackList,
  validateVote
} from '../middleware/validation.js';

// ✅ Create Router instance (this is what gets exported)
const router = express.Router();

// ===== PUBLIC ROUTES =====

/**
 * GET /api/feedback/categories
 * Get all active categories (no auth required)
 */
router.get('/categories', getCategories);

router.get('/exportFeedback', exportFeedback);

// ===== PROTECTED ROUTES (require authentication) =====
router.use(authenticateToken);

// ===== FEEDBACK CRUD =====

/**
 * GET /api/feedback
 * List feedback with filters and pagination
 * @query {string} category_id - Filter by category
 * @query {string} sentiment_label - Filter by sentiment
 * @query {string} status - Filter by status (admin only)
 * @query {string} search - Search in message text
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Results per page (default: 20)
 * @query {boolean} include_mine - Only show user's own feedback
 */
router.get('/', validateFeedbackList, getFeedback);

/**
 * GET /api/feedback/:id
 * Get single feedback item by ID
 */
router.get('/:id', getFeedbackById);

/**
 * POST /api/feedback
 * Submit new feedback with AI sentiment analysis
 */
router.post('/', validateFeedbackSubmit, submitFeedback);

/**
 * PUT /api/feedback/:id
 * Update feedback (owners can edit pending items, admins can edit any)
 */
router.put('/:id', validateFeedbackSubmit, updateFeedback);

/**
 * DELETE /api/feedback/:id
 * Soft delete feedback (set status to 'dismissed')
 */
router.delete('/:id', deleteFeedback);

// ===== VOTING =====

/**
 * POST /api/feedback/vote
 * Create a new vote (up/down) on feedback
 */
router.post('/vote', validateVote, createVote);

/**
 * GET /api/feedback/vote/:feedback_id
 * Get the current user's vote on a specific feedback
 */
router.get('/vote/:feedback_id', getUserVote);

/**
 * DELETE /api/feedback/vote/:feedback_id
 * Remove the current user's vote from feedback
 */
router.delete('/vote/:feedback_id', deleteVote);

// ===== 404 HANDLER FOR THIS ROUTER =====
router.use((req, res) => {
  res.status(404).json({ error: 'Feedback route not found' });
});

// ✅ Export the Router instance (NOT an object)
export default router;