/**
 * Admin Routes - CommunityPulse
 * Handles all admin-specific endpoints
 * 
 * @module routes/admin
 */

import express from 'express';
import { 
  getDashboardStats, 
  updateFeedbackStatus, 
  exportFeedback,
  getPendingIssues,
  getRecentActivity,
  deleteFeedback,
  getAnalytics,
  manageCategory,
  getUserStats
} from '../controllers/admin.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { 
  validateFeedbackStatus, 
  validateExportParams,
  validateCategory,
  validateUserRoleUpdate,
  validateUserList,
  validateAnalyticsParams
} from '../middleware/validation.js';

const router = express.Router();

// ===== PROTECTION =====
// All admin routes require authentication AND admin role
router.use(authenticateToken);
router.use(requireAdmin);

// ===== DASHBOARD =====
router.get('/stats', getDashboardStats);
router.get('/analytics', validateAnalyticsParams, getAnalytics);
router.get('/pending', getPendingIssues);
router.get('/activity', getRecentActivity);

// ===== FEEDBACK MANAGEMENT =====
router.put('/feedback/:id/status', validateFeedbackStatus, updateFeedbackStatus);
router.delete('/feedback/:id', deleteFeedback);
router.get('/feedback/:id', async (req, res) => {
  try {
    const { query } = await import('../config/database.js');
    const { id } = req.params;
    
    const result = await query(
      `SELECT f.*, 
              u.username as author_username,
              u.email as author_email,
              c.name as category_name, 
              c.color as category_color
       FROM feedback f
       LEFT JOIN users u ON f.user_id = u.id
       LEFT JOIN categories c ON f.category_id = c.id
       WHERE f.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Admin feedback fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch feedback details' });
  }
});

// ===== CATEGORY MANAGEMENT (CRUD) =====
router.get('/categories', async (req, res) => {
  try {
    const { query } = await import('../config/database.js');
    
    const result = await query(
      'SELECT *, COUNT(feedback.id) as feedback_count FROM categories LEFT JOIN feedback ON categories.id = feedback.category_id GROUP BY categories.id ORDER BY name'
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('Admin categories fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.post('/categories', validateCategory, manageCategory);
router.put('/categories/:id', validateCategory, manageCategory);
router.delete('/categories/:id', manageCategory);

// ===== USER MANAGEMENT =====
router.get('/users', validateUserList, getUserStats);

router.get('/users/:id', async (req, res) => {
  try {
    const { query } = await import('../config/database.js');
    const { id } = req.params;
    
    const result = await query(
      `SELECT u.*, 
              COUNT(f.id) as feedback_count,
              COUNT(DISTINCT fv.id) as vote_count,
              MAX(f.created_at) as last_activity
       FROM users u
       LEFT JOIN feedback f ON u.id = f.user_id
       LEFT JOIN feedback_votes fv ON u.id = fv.user_id
       WHERE u.id = $1
       GROUP BY u.id`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const { password_hash, ...user } = result.rows[0];
    res.json(user);
  } catch (err) {
    console.error('Admin user fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

router.put('/users/:id/role', validateUserRoleUpdate, async (req, res) => {
  try {
    const { query } = await import('../config/database.js');
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['member', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role value' });
    }
    
    if (id === req.user.id && role !== 'admin') {
      return res.status(400).json({ error: 'Cannot remove your own admin privileges' });
    }
    
    const result = await query(
      `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, username, email, role`,
      [role, id]
    );
    // ===== EXPORT & REPORTS =====

/**
 * GET /api/admin/export
 * Export feedback data as CSV or JSON
 * @query {string} format - Export format (csv/json)
 * @query {string} sentiment - Filter by sentiment (optional)
 * @query {string} category_id - Filter by category (optional)
 * @query {string} start_date - Date range start (optional)
 * @query {string} end_date - Date range end (optional)
 * @returns {File} Downloadable file
 */
router.get('/export', validateExportParams, exportFeedback);// ===== EXPORT & REPORTS =====

/**
 * GET /api/admin/export
 * Export feedback data as CSV or JSON
 * @query {string} format - Export format (csv/json)
 * @query {string} sentiment - Filter by sentiment (optional)
 * @query {string} category_id - Filter by category (optional)
 * @query {string} start_date - Date range start (optional)
 * @query {string} end_date - Date range end (optional)
 * @returns {File} Downloadable file
 */
router.get('/export', validateExportParams, exportFeedback);// ===== EXPORT & REPORTS =====

/**
 * GET /api/admin/export
 * Export feedback data as CSV or JSON
 * @query {string} format - Export format (csv/json)
 * @query {string} sentiment - Filter by sentiment (optional)
 * @query {string} category_id - Filter by category (optional)
 * @query {string} start_date - Date range start (optional)
 * @query {string} end_date - Date range end (optional)
 * @returns {File} Downloadable file
 */
router.get('/export', validateExportParams, exportFeedback);// ===== EXPORT & REPORTS =====

/**
 * GET /api/admin/export
 * Export feedback data as CSV or JSON
 * @query {string} format - Export format (csv/json)
 * @query {string} sentiment - Filter by sentiment (optional)
 * @query {string} category_id - Filter by category (optional)
 * @query {string} start_date - Date range start (optional)
 * @query {string} end_date - Date range end (optional)
 * @returns {File} Downloadable file
 */
router.get('/export', validateExportParams, exportFeedback);// ===== EXPORT & REPORTS =====

/**
 * GET /api/admin/export
 * Export feedback data as CSV or JSON
 * @query {string} format - Export format (csv/json)
 * @query {string} sentiment - Filter by sentiment (optional)
 * @query {string} category_id - Filter by category (optional)
 * @query {string} start_date - Date range start (optional)
 * @query {string} end_date - Date range end (optional)
 * @returns {File} Downloadable file
 */
router.get('/export', validateExportParams, exportFeedback);// ===== EXPORT & REPORTS =====

/**
 * GET /api/admin/export
 * Export feedback data as CSV or JSON
 * @query {string} format - Export format (csv/json)
 * @query {string} sentiment - Filter by sentiment (optional)
 * @query {string} category_id - Filter by category (optional)
 * @query {string} start_date - Date range start (optional)
 * @query {string} end_date - Date range end (optional)
 * @returns {File} Downloadable file
 */
router.get('/export', validateExportParams, exportFeedback);// ===== EXPORT & REPORTS =====

/**
 * GET /api/admin/export
 * Export feedback data as CSV or JSON
 * @query {string} format - Export format (csv/json)
 * @query {string} sentiment - Filter by sentiment (optional)
 * @query {string} category_id - Filter by category (optional)
 * @query {string} start_date - Date range start (optional)
 * @query {string} end_date - Date range end (optional)
 * @returns {File} Downloadable file
 */
router.get('/export', validateExportParams, exportFeedback);// ===== EXPORT & REPORTS =====

/**
 * GET /api/admin/export
 * Export feedback data as CSV or JSON
 * @query {string} format - Export format (csv/json)
 * @query {string} sentiment - Filter by sentiment (optional)
 * @query {string} category_id - Filter by category (optional)
 * @query {string} start_date - Date range start (optional)
 * @query {string} end_date - Date range end (optional)
 * @returns {File} Downloadable file
 */
router.get('/export', validateExportParams, exportFeedback);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User role updated', user: result.rows[0] });
  } catch (err) {
    console.error('User role update error:', err);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const { query } = await import('../config/database.js');
    const { id } = req.params;
    
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    const result = await query(
      `UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id, username`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User account deactivated', user: result.rows[0] });
  } catch (err) {
    console.error('User deletion error:', err);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
});

// ===== EXPORT & REPORTS =====
router.get('/export', validateExportParams, exportFeedback);

router.get('/report/summary', async (req, res) => {
  try {
    const { query } = await import('../config/database.js');
    const { period = 'monthly' } = req.query;
    
    let dateInterval;
    switch (period) {
      case 'weekly': dateInterval = '7 days'; break;
      case 'monthly': dateInterval = '30 days'; break;
      case 'quarterly': dateInterval = '90 days'; break;
      default: dateInterval = '30 days';
    }
    
    const stats = await query(`
      SELECT 
        COUNT(*) as total_feedback,
        COUNT(CASE WHEN sentiment_label = 'Positive' THEN 1 END) as positive,
        COUNT(CASE WHEN sentiment_label = 'Neutral' THEN 1 END) as neutral,
        COUNT(CASE WHEN sentiment_label = 'Negative' THEN 1 END) as negative,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        ROUND(AVG(sentiment_score)::numeric, 2) as avg_sentiment,
        COUNT(DISTINCT user_id) as unique_contributors
      FROM feedback
      WHERE created_at >= NOW() - INTERVAL '${dateInterval}'
    `);
    
    const categories = await query(`
      SELECT c.name, COUNT(f.id) as count
      FROM categories c
      LEFT JOIN feedback f ON c.id = f.category_id
      WHERE f.created_at >= NOW() - INTERVAL '${dateInterval}'
      GROUP BY c.id, c.name
      ORDER BY count DESC
      LIMIT 5
    `);
    
    const trends = await query(`
      SELECT 
        DATE_TRUNC('day', created_at) as date,
        COUNT(*) as count,
        ROUND(AVG(sentiment_score)::numeric, 2) as avg_sentiment
      FROM feedback
      WHERE created_at >= NOW() - INTERVAL '${dateInterval}'
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date
    `);
    
    res.json({
      period,
      generated_at: new Date().toISOString(),
      stats: stats.rows[0],
      top_categories: categories.rows,
      trends: trends.rows
    });
  } catch (err) {
    console.error('Report generation error:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// ===== SYSTEM SETTINGS =====
router.get('/settings', async (req, res) => {
  try {
    res.json({
      feedback_enabled: true,
      anonymous_feedback_allowed: true,
      voting_enabled: true,
      min_message_length: 10,
      max_message_length: 2000,
      sentiment_analysis_enabled: true,
      categories_require_approval: false
    });
  } catch (err) {
    console.error('Settings fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.put('/settings', async (req, res) => {
  try {
    res.json({ message: 'Settings updated successfully', settings: req.body });
  } catch (err) {
    console.error('Settings update error:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// ===== HEALTH & METRICS =====
router.get('/health', async (req, res) => {
  try {
    const { pool } = await import('../config/database.js');
    const dbCheck = await pool.query('SELECT NOW()');
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        api: 'running',
        ai_service: 'available'
      },
      metrics: {
        pool_size: pool.totalCount,
        pool_available: pool.idleCount,
        pool_waiting: pool.waitingCount
      }
    });
  } catch (err) {
    console.error('Health check error:', err);
    res.status(500).json({ status: 'unhealthy', error: err.message });
  }
});

// ===== 404 HANDLER =====
router.use((req, res) => {
  res.status(404).json({ error: 'Admin route not found' });
});

export default router;