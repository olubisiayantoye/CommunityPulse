// routes/admin.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { ensureAuth, ensureAdmin } = require('../middleware/auth');

/**
 * GET /admin
 * Admin dashboard with analytics and pending issues
 */
router.get('/', ensureAuth, ensureAdmin, async (req, res) => {
    try {
        // Overall statistics
        const statsQuery = await db.query(`
            SELECT 
                COUNT(*) as total_feedback,
                COUNT(CASE WHEN sentiment_label = 'Positive' THEN 1 END) as positive_count,
                COUNT(CASE WHEN sentiment_label = 'Neutral' THEN 1 END) as neutral_count,
                COUNT(CASE WHEN sentiment_label = 'Negative' THEN 1 END) as negative_count,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
                ROUND(AVG(sentiment_score)::numeric, 2) as avg_sentiment_score
            FROM feedback
        `);

        // Sentiment distribution for pie chart
        const sentimentQuery = await db.query(`
            SELECT sentiment_label, COUNT(*) as count
            FROM feedback
            GROUP BY sentiment_label
            ORDER BY sentiment_label
        `);

        // Category distribution for bar chart
        const categoryQuery = await db.query(`
            SELECT c.name, c.color, COUNT(f.id) as count
            FROM categories c
            LEFT JOIN feedback f ON c.id = f.category_id AND f.is_anonymous = true
            WHERE c.is_active = true
            GROUP BY c.id, c.name, c.color
            ORDER BY count DESC
        `);

        // 7-day trend data for line chart
        const trendsQuery = await db.query(`
            SELECT 
                DATE(created_at) as date,
                sentiment_label,
                COUNT(*) as count
            FROM feedback
            WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY DATE(created_at), sentiment_label
            ORDER BY date, sentiment_label
        `);

        // Pending negative feedback (priority issues)
        const pendingQuery = await db.query(`
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

        // Recent activity log
        const recentQuery = await db.query(`
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

        res.render('pages/admin', {
            pageTitle: 'Admin Dashboard',
            pageDescription: 'Manage community feedback and insights',
            stats: statsQuery.rows[0],
            sentiment: sentimentQuery.rows,
            categories: categoryQuery.rows,
            trends: trendsQuery.rows,
            pendingIssues: pendingQuery.rows,
            recentActivity: recentQuery.rows
        });

    } catch (err) {
        console.error('Admin dashboard error:', err);
        req.flash('error', 'Failed to load admin dashboard');
        res.redirect('/dashboard');
    }
});

/**
 * PUT /admin/feedback/:id/status
 * Update feedback status (pending → in_progress → resolved)
 */
router.put('/feedback/:id/status', ensureAuth, ensureAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, admin_notes } = req.body;

        // Validate status
        const validStatuses = ['pending', 'in_progress', 'resolved', 'dismissed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }

        // Update feedback
        const result = await db.query(
            `UPDATE feedback 
             SET status = $1, admin_notes = $2, updated_at = NOW() 
             WHERE id = $3 
             RETURNING id, status, admin_notes, updated_at`,
            [status, admin_notes || null, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Feedback not found' });
        }

        const updated = result.rows[0];

        // HTMX partial update response
        if (req.headers['hx-request']) {
            return res.send(`
                <div class="text-sm text-green-600 font-medium">
                    Status: ${updated.status.replace('_', ' ')}
                </div>
            `);
        }

        res.json({ success: true, feedback: updated });

    } catch (err) {
        console.error('Status update error:', err);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

/**
 * POST /admin/feedback/:id/note
 * Add admin note to feedback (internal use only)
 */
router.post('/feedback/:id/note', ensureAuth, ensureAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { note } = req.body;

        if (!note || note.trim().length < 5) {
            return res.status(400).json({ error: 'Note must be at least 5 characters' });
        }

        const result = await db.query(
            `UPDATE feedback 
             SET admin_notes = COALESCE(admin_notes, '') || $1 || E'\n[' || NOW()::text || '] ',
                 updated_at = NOW()
             WHERE id = $2
             RETURNING admin_notes`,
            [note.trim(), id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Feedback not found' });
        }

        // HTMX response: return updated notes section
        if (req.headers['hx-request']) {
            const notes = result.rows[0].admin_notes;
            return res.send(`
                <div class="space-y-2">
                    <p class="text-sm text-gray-700 whitespace-pre-wrap">${notes}</p>
                    <form hx-post="/admin/feedback/${id}/note" hx-target="closest div" class="mt-2 flex space-x-2">
                        <input type="text" name="note" placeholder="Add internal note..." 
                               class="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500">
                        <button type="submit" class="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                            Add
                        </button>
                    </form>
                </div>
            `);
        }

        res.json({ success: true, notes: result.rows[0].admin_notes });

    } catch (err) {
        console.error('Note addition error:', err);
        res.status(500).json({ error: 'Failed to add note' });
    }
});

/**
 * GET /admin/export
 * Export feedback data as CSV (for reports)
 */
router.get('/export', ensureAuth, ensureAdmin, async (req, res) => {
    try {
        const { format = 'csv', sentiment, category, start_date, end_date } = req.query;

        // Build dynamic query with filters
        let query = `
            SELECT 
                f.id, f.message, f.sentiment_label, f.sentiment_score,
                f.status, f.is_anonymous, f.created_at, f.updated_at,
                c.name as category_name,
                CASE WHEN f.is_anonymous THEN 'Anonymous' ELSE u.username END as author
            FROM feedback f
            LEFT JOIN categories c ON f.category_id = c.id
            LEFT JOIN users u ON f.user_id = u.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (sentiment && ['Positive', 'Neutral', 'Negative'].includes(sentiment)) {
            query += ` AND f.sentiment_label = $${paramIndex}`;
            params.push(sentiment);
            paramIndex++;
        }

        if (category) {
            query += ` AND f.category_id = $${paramIndex}`;
            params.push(category);
            paramIndex++;
        }

        if (start_date) {
            query += ` AND f.created_at >= $${paramIndex}`;
            params.push(start_date);
            paramIndex++;
        }

        if (end_date) {
            query += ` AND f.created_at <= $${paramIndex}`;
            params.push(end_date);
            paramIndex++;
        }

        query += ` ORDER BY f.created_at DESC`;

        const result = await db.query(query, params);

        if (format === 'json') {
            // JSON export
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename=feedback-export-${new Date().toISOString().split('T')[0]}.json`);
            return res.json(result.rows);
        }

        // CSV export (default)
        const headers = ['ID', 'Message', 'Sentiment', 'Score', 'Category', 'Status', 'Anonymous', 'Author', 'Created', 'Updated'];
        const rows = result.rows.map(row => [
            row.id,
            `"${row.message.replace(/"/g, '""')}"`, // Escape quotes for CSV
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
        req.flash('error', 'Failed to export data');
        res.redirect('/admin');
    }
});

/**
 * DELETE /admin/feedback/:id
 * Soft-delete feedback (set status to 'dismissed')
 */
router.delete('/feedback/:id', ensureAuth, ensureAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            `UPDATE feedback 
             SET status = 'dismissed', updated_at = NOW() 
             WHERE id = $1 
             RETURNING id, status`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Feedback not found' });
        }

        req.flash('success', 'Feedback dismissed');

        if (req.headers['hx-request']) {
            // HTMX: Remove the row from the table
            return res.send('');
        }

        res.redirect('/admin');

    } catch (err) {
        console.error('Delete error:', err);
        req.flash('error', 'Failed to dismiss feedback');
        res.redirect('/admin');
    }
});

/**
 * GET /admin/analytics
 * API endpoint for dashboard charts (JSON data)
 */
router.get('/analytics', ensureAuth, ensureAdmin, async (req, res) => {
    try {
        const { period = '7d' } = req.query;
        
        let interval;
        switch (period) {
            case '24h': interval = '1 day'; break;
            case '7d': interval = '7 days'; break;
            case '30d': interval = '30 days'; break;
            default: interval = '7 days';
        }

        // Time-series sentiment data
        const trends = await db.query(`
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
        const categories = await db.query(`
            SELECT c.name, COUNT(f.id) as count
            FROM categories c
            LEFT JOIN feedback f ON c.id = f.category_id
            WHERE f.created_at >= NOW() - INTERVAL '${interval}'
            GROUP BY c.id, c.name
            ORDER BY count DESC
        `);

        // Hourly activity heatmap data
        const hourly = await db.query(`
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
});

module.exports = router;