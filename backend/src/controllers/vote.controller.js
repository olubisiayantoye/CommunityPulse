/**
 * Vote Controller - CommunityPulse
 * Handles feedback voting functionality
 * 
 * @module controllers/vote
 */

import { query } from '../config/database.js';

// ===== CREATE VOTE =====

/**
 * Create a new vote on feedback
 */
export const createVote = async (req, res) => {
  try {
    const { feedback_id, vote_type } = req.body;

    if (!['up', 'down'].includes(vote_type)) {
      return res.status(400).json({ error: 'Invalid vote type' });
    }

    // Check if feedback exists and not own
    const feedbackCheck = await query(
      'SELECT user_id FROM feedback WHERE id = $1',
      [feedback_id]
    );
    if (feedbackCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    if (feedbackCheck.rows[0].user_id === req.user.id) {
      return res.status(400).json({ error: 'Cannot vote on your own feedback' });
    }

    // Check if already voted
    const existing = await query(
      'SELECT id FROM feedback_votes WHERE feedback_id = $1 AND user_id = $2',
      [feedback_id, req.user.id]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Already voted on this feedback' });
    }

    // Record vote
    await query(
      'INSERT INTO feedback_votes (feedback_id, user_id, vote_type) VALUES ($1, $2, $3)',
      [feedback_id, req.user.id, vote_type]
    );

    // Update upvotes count
    const change = vote_type === 'up' ? 1 : -1;
    await query(
      'UPDATE feedback SET upvotes = COALESCE(upvotes, 0) + $1 WHERE id = $2',
      [change, feedback_id]
    );

    // Return updated count
    const updated = await query(
      'SELECT upvotes FROM feedback WHERE id = $1',
      [feedback_id]
    );

    res.json({ success: true, upvotes: updated.rows[0].upvotes });
  } catch (err) {
    console.error('Create vote error:', err);
    res.status(500).json({ error: 'Failed to record vote' });
  }
};

// ===== DELETE VOTE =====

/**
 * Remove a user's vote from feedback
 */
export const deleteVote = async (req, res) => {
  try {
    const { feedback_id } = req.params;

    // Check if vote exists
    const existing = await query(
      'SELECT id, vote_type FROM feedback_votes WHERE feedback_id = $1 AND user_id = $2',
      [feedback_id, req.user.id]
    );
    
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Vote not found' });
    }

    // Delete vote
    await query(
      'DELETE FROM feedback_votes WHERE feedback_id = $1 AND user_id = $2',
      [feedback_id, req.user.id]
    );

    // Update upvotes count (reverse the change)
    const change = existing.rows[0].vote_type === 'up' ? -1 : 1;
    await query(
      'UPDATE feedback SET upvotes = COALESCE(upvotes, 0) + $1 WHERE id = $2',
      [change, feedback_id]
    );

    // Return updated count
    const updated = await query(
      'SELECT upvotes FROM feedback WHERE id = $1',
      [feedback_id]
    );

    res.json({ success: true, upvotes: updated.rows[0].upvotes });
  } catch (err) {
    console.error('Delete vote error:', err);
    res.status(500).json({ error: 'Failed to remove vote' });
  }
};

// ===== GET USER VOTE =====

/**
 * Get the current user's vote on a specific feedback
 */
export const getUserVote = async (req, res) => {
  try {
    const { feedback_id } = req.params;
    
    const result = await query(
      'SELECT vote_type FROM feedback_votes WHERE feedback_id = $1 AND user_id = $2',
      [feedback_id, req.user.id]
    );
    
    res.json({ vote: result.rows[0]?.vote_type || null });
  } catch (err) {
    console.error('Fetch vote error:', err);
    res.status(500).json({ error: 'Failed to fetch vote' });
  }
};

// ===== EXPORT ALL CONTROLLER FUNCTIONS =====
export default {
  createVote,
  deleteVote,
  getUserVote
};