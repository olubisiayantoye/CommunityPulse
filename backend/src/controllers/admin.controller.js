/**
 * Feedback Controller - CommunityPulse
 * Handles feedback submission, retrieval, and management
 * 
 * @module controllers/feedback
 */

import { query } from '../config/database.js';
import { analyzeSentiment } from '../config/ai.js';

// ===== CATEGORIES =====

/**
 * Get all active categories
 * GET /api/feedback/categories
 */
export const getCategories = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, description, color FROM categories WHERE is_active = true ORDER BY name'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Categories fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// ===== FEEDBACK SUBMISSION =====

/**
 * Submit new feedback with AI sentiment analysis
 * POST /api/feedback
 */
export const submitFeedback = async (req, res) => {
  try {
    const { message, category_id, is_anonymous = true } = req.body;

    // Validation
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }
    const cleanMessage = message.trim();
    if (cleanMessage.length < 10) {
      return res.status(400).json({ error: 'Message must be at least 10 characters' });
    }
    if (cleanMessage.length > 2000) {
      return res.status(400).json({ error: 'Message must be less than 2000 characters' });
    }

    // Analyze sentiment
    const { score, label } = await analyzeSentiment(cleanMessage);

    // Insert feedback
    const result = await query(
      `INSERT INTO feedback 
       (user_id, message, category_id, sentiment_score, sentiment_label, is_anonymous, status) 
       VALUES ($1, $2, $3, $4, $5, $6, 'pending') 
       RETURNING id, created_at, sentiment_label, sentiment_score`,
      [
        req.user.id,
        cleanMessage,
        category_id || null,
        score,
        label,
        is_anonymous === true || is_anonymous === 'true'
      ]
    );

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback: result.rows[0]
    });
  } catch (err) {
    console.error('Feedback submission error:', err);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
};

// ===== FEEDBACK RETRIEVAL =====

/**
 * Get feedback list with filters and pagination
 * GET /api/feedback
 */
export const getFeedback = async (req, res) => {
  try {
    const { category_id, sentiment_label, status, search, page = 1, limit = 20, include_mine = false } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    // Filter by user access (RLS-like logic)
    if (req.user?.role !== 'admin') {
      if (include_mine === 'true') {
        whereClause += ` AND f.user_id = $${paramIndex}`;
        params.push(req.user?.id);
        paramIndex++;
      } else {
        whereClause += ` AND (f.is_anonymous = true OR f.user_id = $${paramIndex})`;
        params.push(req.user?.id);
        paramIndex++;
      }
    }

    // Apply filters
    if (category_id) {
      whereClause += ` AND f.category_id = $${paramIndex}`;
      params.push(category_id);
      paramIndex++;
    }
    if (sentiment_label && ['Positive', 'Neutral', 'Negative'].includes(sentiment_label)) {
      whereClause += ` AND f.sentiment_label = $${paramIndex}`;
      params.push(sentiment_label);
      paramIndex++;
    }
    if (status && req.user?.role === 'admin') {
      whereClause += ` AND f.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    if (search) {
      whereClause += ` AND f.message ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Main query
    const feedbackQuery = `
      SELECT f.*, 
             u.username as author_username,
             c.name as category_name, 
             c.color as category_color
      FROM feedback f
      LEFT JOIN users u ON f.user_id = u.id
      LEFT JOIN categories c ON f.category_id = c.id
      ${whereClause}
      ORDER BY f.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);

    const feedbackResult = await query(feedbackQuery, params);

    // Count query for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM feedback f
      ${whereClause}
    `;
    const countParams = params.slice(0, paramIndex - 2);
    const countResult = await query(countQuery, countParams);

    res.json({
      feedback: feedbackResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        totalPages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
  } catch (err) {
    console.error('Feedback fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
};

/**
 * Get single feedback item by ID
 * GET /api/feedback/:id
 */
export const getFeedbackById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `SELECT f.*, 
              u.username as author_username,
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
    
    const feedback = result.rows[0];
    
    // Check access permissions
    if (req.user?.role !== 'admin' && !feedback.is_anonymous && feedback.user_id !== req.user?.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(feedback);
  } catch (err) {
    console.error('Fetch feedback error:', err);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
};

// ===== FEEDBACK UPDATE =====

/**
 * Update feedback (users can edit their own pending feedback, admins can edit any)
 * PUT /api/feedback/:id
 */
export const updateFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, category_id, is_anonymous } = req.body;
    
    // Check ownership/permissions
    const existing = await query('SELECT user_id, status FROM feedback WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    
    const feedback = existing.rows[0];
    const isAdmin = req.user?.role === 'admin';
    const isOwner = feedback.user_id === req.user?.id;
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Build update query
    const updates = [];
    const params = [];
    let paramIndex = 1;
    
    // Users can only update message, category, is_anonymous (if pending)
    if (!isAdmin && feedback.status !== 'pending') {
      return res.status(400).json({ error: 'Cannot edit feedback that is not pending' });
    }
    
    if (message !== undefined && !isAdmin) {
      const cleanMessage = message.trim();
      if (cleanMessage.length < 10 || cleanMessage.length > 2000) {
        return res.status(400).json({ error: 'Message must be 10-2000 characters' });
      }
      // Re-analyze sentiment if message changed
      const { score, label } = await analyzeSentiment(cleanMessage);
      updates.push(`message = $${paramIndex}`, `sentiment_score = $${paramIndex + 1}`, `sentiment_label = $${paramIndex + 2}`);
      params.push(cleanMessage, score, label);
      paramIndex += 3;
    }
    if (category_id !== undefined && !isAdmin) {
      updates.push(`category_id = $${paramIndex}`);
      params.push(category_id || null);
      paramIndex++;
    }
    if (is_anonymous !== undefined && !isAdmin) {
      updates.push(`is_anonymous = $${paramIndex}`);
      params.push(is_anonymous);
      paramIndex++;
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    updates.push(`updated_at = NOW()`);
    params.push(id);
    
    const result = await query(
      `UPDATE feedback SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );
    
    res.json({ message: 'Feedback updated', feedback: result.rows[0] });
  } catch (err) {
    console.error('Update feedback error:', err);
    res.status(500).json({ error: 'Failed to update feedback' });
  }
};

// ===== FEEDBACK DELETE (SOFT DELETE) =====

/**
 * Soft delete feedback by setting status to 'dismissed'
 * DELETE /api/feedback/:id
 */
export const deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check ownership/permissions
    const existing = await query('SELECT user_id, status FROM feedback WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    
    const isAdmin = req.user?.role === 'admin';
    const isOwner = existing.rows[0].user_id === req.user?.id;
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Soft delete: update status to 'dismissed'
    const result = await query(
      `UPDATE feedback 
       SET status = 'dismissed', updated_at = NOW() 
       WHERE id = $1 
       RETURNING id, status, updated_at`,
      [id]
    );
    
    res.json({ message: 'Feedback dismissed', feedback: result.rows[0] });
  } catch (err) {
    console.error('Delete feedback error:', err);
    res.status(500).json({ error: 'Failed to dismiss feedback' });
  }
};



// ===== ANALYTICS =====

/**
 * Get detailed analytics data for charts
 */
export const getAnalytics = async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    let interval;
    switch (period) {
      case '24h': interval = '1 day'; break;
      case '7d': interval = '7 days'; break;
      case '30d': interval = '30 days'; break;
      case '90d': interval = '90 days'; break;
      default: interval = '7 days';
    }

    // Time-series sentiment data
    const trends = await query(`
      SELECT 
        DATE_TRUNC('day', created_at) as date,
        sentiment_label,
        COUNT(*) as count
      FROM feedback
      WHERE created_at >= NOW() - INTERVAL '${interval}'
      GROUP BY DATE_TRUNC('day', created_at), sentiment_label
      ORDER BY date
    `);

    // Category breakdown
    const categories = await query(`
      SELECT c.name, COUNT(f.id) as count
      FROM categories c
      LEFT JOIN feedback f ON c.id = f.category_id
      WHERE f.created_at >= NOW() - INTERVAL '${interval}'
      GROUP BY c.id, c.name
      ORDER BY count DESC
    `);

    // Hourly activity heatmap data
    const hourly = await query(`
      SELECT 
        EXTRACT(HOUR FROM created_at) as hour,
        EXTRACT(DOW FROM created_at) as day_of_week,
        COUNT(*) as count
      FROM feedback
      WHERE created_at >= NOW() - INTERVAL '${interval}'
      GROUP BY EXTRACT(HOUR FROM created_at), EXTRACT(DOW FROM created_at)
      ORDER BY day_of_week, hour
    `);

    res.json({
      trends: trends.rows,
      categories: categories.rows,
      hourly: hourly.rows,
      period
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
};

// ===== DASHBOARD STATS =====

/**
 * Get comprehensive dashboard statistics
 */
export const getDashboardStats = async (req, res) => {
  try {
    // Overall statistics
    const statsQuery = await query(`
      SELECT 
        COUNT(*) as total_feedback,
        COUNT(CASE WHEN sentiment_label = 'Positive' THEN 1 END) as positive_count,
        COUNT(CASE WHEN sentiment_label = 'Neutral' THEN 1 END) as neutral_count,
        COUNT(CASE WHEN sentiment_label = 'Negative' THEN 1 END) as negative_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        ROUND(AVG(sentiment_score)::numeric, 2) as avg_sentiment_score
      FROM feedback
    `);

    // Sentiment distribution
    const sentimentQuery = await query(`
      SELECT sentiment_label, COUNT(*) as count
      FROM feedback
      GROUP BY sentiment_label
      ORDER BY sentiment_label
    `);

    // Category distribution
    const categoryQuery = await query(`
      SELECT c.name, c.color, COUNT(f.id) as count
      FROM categories c
      LEFT JOIN feedback f ON c.id = f.category_id
      WHERE c.is_active = true
      GROUP BY c.id, c.name, c.color
      ORDER BY count DESC
    `);

    // 7-day trends
    const trendsQuery = await query(`
      SELECT 
        DATE(created_at) as date,
        sentiment_label,
        COUNT(*) as count
      FROM feedback
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(created_at), sentiment_label
      ORDER BY date, sentiment_label
    `);

    // Pending negative feedback (priority)
    const pendingQuery = await query(`
      SELECT 
        f.id, f.message, f.sentiment_label, f.sentiment_score,
        f.status, f.created_at, f.is_anonymous,
        c.name as category_name, c.color as category_color
      FROM feedback f
      LEFT JOIN categories c ON f.category_id = c.id
      WHERE f.status = 'pending' AND f.sentiment_label = 'Negative'
      ORDER BY f.created_at DESC
      LIMIT 20
    `);

    // Recent activity
    const recentQuery = await query(`
      SELECT 
        f.id, f.message, f.sentiment_label, f.status,
        f.created_at, c.name as category_name,
        CASE WHEN f.is_anonymous THEN 'Anonymous' ELSE u.username END as author
      FROM feedback f
      LEFT JOIN categories c ON f.category_id = c.id
      LEFT JOIN users u ON f.user_id = u.id
      ORDER BY f.created_at DESC
      LIMIT 15
    `);

    res.json({
      stats: statsQuery.rows[0],
      sentiment: sentimentQuery.rows,
      categories: categoryQuery.rows,
      trends: trendsQuery.rows,
      pendingIssues: pendingQuery.rows,
      recentActivity: recentQuery.rows
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to load dashboard stats' });
  }
};

// ===== PENDING ISSUES =====

/**
 * Get all pending feedback items requiring attention
 */
export const getPendingIssues = async (req, res) => {
  try {
    const { sentiment, limit = 20 } = req.query;
    
    let whereClause = "WHERE f.status = 'pending'";
    const params = [];
    
    if (sentiment && ['Positive', 'Neutral', 'Negative'].includes(sentiment)) {
      whereClause += ` AND f.sentiment_label = $1`;
      params.push(sentiment);
    }
    
    const result = await query(`
      SELECT 
        f.id, f.message, f.sentiment_label, f.sentiment_score,
        f.status, f.created_at, f.is_anonymous, f.upvotes,
        c.name as category_name, c.color as category_color
      FROM feedback f
      LEFT JOIN categories c ON f.category_id = c.id
      ${whereClause}
      ORDER BY f.created_at DESC
      LIMIT $${params.length + 1}
    `, [...params, limit]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Pending issues error:', err);
    res.status(500).json({ error: 'Failed to fetch pending issues' });
  }
};

// ===== RECENT ACTIVITY =====

/**
 * Get recent activity log for audit purposes
 */
export const getRecentActivity = async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const result = await query(`
      SELECT 
        f.id, f.message, f.sentiment_label, f.status,
        f.created_at, f.updated_at,
        c.name as category_name,
        CASE WHEN f.is_anonymous THEN 'Anonymous' ELSE u.username END as author,
        f.admin_notes
      FROM feedback f
      LEFT JOIN categories c ON f.category_id = c.id
      LEFT JOIN users u ON f.user_id = u.id
      ORDER BY f.updated_at DESC
      LIMIT $1
    `, [limit]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Activity log error:', err);
    res.status(500).json({ error: 'Failed to fetch activity log' });
  }
};

// ===== FEEDBACK STATUS UPDATE =====

/**
 * Update feedback status (pending → in_progress → resolved → dismissed)
 */
export const updateFeedbackStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    const validStatuses = ['pending', 'in_progress', 'resolved', 'dismissed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const result = await query(
      `UPDATE feedback 
       SET status = $1, admin_notes = COALESCE(admin_notes, '') || $2 || E'\n[' || NOW()::text || '] ', updated_at = NOW() 
       WHERE id = $3 
       RETURNING id, status, admin_notes, updated_at`,
      [status, admin_notes ? `[Admin] ${admin_notes}` : null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    res.json({ success: true, feedback: result.rows[0] });
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
};



// ===== CATEGORY MANAGEMENT (CRUD) =====

export const manageCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, is_active } = req.body;
    const method = req.method;
    
    if (method === 'POST') {
      if (!name) {
        return res.status(400).json({ error: 'Category name is required' });
      }
      
      const result = await query(
        `INSERT INTO categories (name, description, color) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
        [name.trim(), description?.trim() || null, color || '#3B82F6']
      );
      
      return res.status(201).json({ 
        message: 'Category created', 
        category: result.rows[0] 
      });
    }
    
    if (method === 'PUT' && id) {
      const updates = [];
      const params = [];
      let paramIndex = 1;
      
      if (name !== undefined) {
        updates.push(`name = $${paramIndex}`);
        params.push(name.trim());
        paramIndex++;
      }
      if (description !== undefined) {
        updates.push(`description = $${paramIndex}`);
        params.push(description?.trim() || null);
        paramIndex++;
      }
      if (color !== undefined) {
        updates.push(`color = $${paramIndex}`);
        params.push(color);
        paramIndex++;
      }
      if (is_active !== undefined) {
        updates.push(`is_active = $${paramIndex}`);
        params.push(is_active);
        paramIndex++;
      }
      
      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }
      
      updates.push(`updated_at = NOW()`);
      params.push(id);
      
      const result = await query(
        `UPDATE categories SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        params
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      return res.json({ 
        message: 'Category updated', 
        category: result.rows[0] 
      });
    }
    
    if (method === 'DELETE' && id) {
      const feedbackCheck = await query(
        'SELECT COUNT(*) as count FROM feedback WHERE category_id = $1',
        [id]
      );
      
      if (parseInt(feedbackCheck.rows[0].count) > 0) {
        const result = await query(
          'UPDATE categories SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING *',
          [id]
        );
        return res.json({ 
          message: 'Category deactivated (has existing feedback)', 
          category: result.rows[0] 
        });
      }
      
      const result = await query(
        'DELETE FROM categories WHERE id = $1 RETURNING *',
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      return res.json({ 
        message: 'Category deleted', 
        category: result.rows[0] 
      });
    }
    
    if (method === 'GET') {
      const result = await query(
        'SELECT *, COUNT(feedback.id) as feedback_count FROM categories LEFT JOIN feedback ON categories.id = feedback.category_id GROUP BY categories.id ORDER BY name'
      );
      return res.json(result.rows);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (err) {
    console.error('Category management error:', err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Category name already exists' });
    }
    res.status(500).json({ error: 'Failed to manage category' });
  }
};

// ===== USER STATS =====

export const getUserStats = async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (role && ['member', 'admin'].includes(role)) {
      whereClause += ` AND role = $${params.length + 1}`;
      params.push(role);
    }
    
    const usersQuery = `
      SELECT 
        u.id, u.username, u.email, u.role, u.is_active,
        u.created_at, u.last_login,
        COUNT(DISTINCT f.id) as feedback_count,
        COUNT(DISTINCT fv.id) as vote_count
      FROM users u
      LEFT JOIN feedback f ON u.id = f.user_id
      LEFT JOIN feedback_votes fv ON u.id = fv.user_id
      ${whereClause}
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    
    const usersResult = await query(usersQuery, [...params, limit, offset]);
    
    const countQuery = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM users u
      ${whereClause}
    `;
    const countResult = await query(countQuery, params);
    
    res.json({
      users: usersResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        totalPages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
  } catch (err) {
    console.error('User stats error:', err);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
};

// ===== EXPORT FEEDBACK (CSV/JSON) =====

/**
 * Export feedback data as CSV or JSON - THIS IS THE MISSING FUNCTION
 */
export const exportFeedback = async (req, res) => {
  try {
    const { format = 'csv', sentiment_label, category_id, start_date, end_date } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (sentiment_label && ['Positive', 'Neutral', 'Negative'].includes(sentiment_label)) {
      whereClause += ` AND f.sentiment_label = $${paramIndex}`;
      params.push(sentiment_label);
      paramIndex++;
    }
    if (category_id) {
      whereClause += ` AND f.category_id = $${paramIndex}`;
      params.push(category_id);
      paramIndex++;
    }
    if (start_date) {
      whereClause += ` AND f.created_at >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }
    if (end_date) {
      whereClause += ` AND f.created_at <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    const result = await query(`
      SELECT 
        f.id, f.message, f.sentiment_label, f.sentiment_score,
        f.status, f.is_anonymous, f.created_at, f.updated_at,
        c.name as category_name,
        CASE WHEN f.is_anonymous THEN 'Anonymous' ELSE u.username END as author
      FROM feedback f
      LEFT JOIN categories c ON f.category_id = c.id
      LEFT JOIN users u ON f.user_id = u.id
      ${whereClause}
      ORDER BY f.created_at DESC
    `, params);

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=feedback-export-${new Date().toISOString().split('T')[0]}.json`);
      return res.json(result.rows);
    }

    // CSV export
    const headers = ['ID', 'Message', 'Sentiment', 'Score', 'Category', 'Status', 'Anonymous', 'Author', 'Created', 'Updated'];
    const rows = result.rows.map(row => [
      row.id,
      `"${row.message.replace(/"/g, '""')}"`,
      row.sentiment_label,
      row.sentiment_score,
      row.category_name || 'Uncategorized',
      row.status,
      row.is_anonymous ? 'Yes' : 'No',
      row.author,
      new Date(row.created_at).toLocaleString(),
      row.updated_at ? new Date(row.updated_at).toLocaleString() : ''
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=feedback-export-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Failed to export data' });
  }
};

