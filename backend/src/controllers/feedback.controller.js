import { query } from '../config/database.js';
import { analyzeSentiment } from '../config/ai.js';

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

export const exportFeedback = async (req, res) => {
  try {
    const { format = 'csv', sentiment_label, category_id } = req.query;
    
    // ... your export logic here ...
    
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      return res.json(data);
    }
    
    // CSV export
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=export.csv');
    res.send(csv);
    
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Failed to export data' });
  }
};



// CREATE
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

// READ (list with filters)
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

// READ (single)
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

// UPDATE
export const updateFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, category_id, is_anonymous, status, admin_notes } = req.body;
    
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
    
    // Admins can update status and admin_notes
    if (isAdmin) {
      if (status !== undefined && ['pending', 'in_progress', 'resolved', 'dismissed'].includes(status)) {
        updates.push(`status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }
      if (admin_notes !== undefined) {
        updates.push(`admin_notes = $${paramIndex}`);
        params.push(admin_notes);
        paramIndex++;
      }
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

// DELETE (soft delete via status)
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