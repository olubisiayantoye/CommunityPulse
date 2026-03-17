// routes/feedback.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../db');
const { ensureAuth } = require('../middleware/auth');

/**
 * AI Sentiment Analysis using Hugging Face API
 * @param {string} text - The message to analyze
 * @returns {Promise<{score: number, label: string}>}
 */
async function analyzeSentiment(text) {
    try {
        // Truncate to model's max input length
        const input = text.substring(0, 512);
        
        const response = await axios.post(
            'https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english',
            { inputs: input },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.HF_API_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                timeout: 5000 // 5 second timeout
            }
        );

        const result = response.data?.[0];
        if (!result || !result.label || typeof result.score !== 'number') {
            throw new Error('Invalid AI response format');
        }

        const label = result.label === 'POSITIVE' ? 'Positive' : 'Negative';
        const score = result.label === 'POSITIVE' ? result.score : (1 - result.score);

        // Determine sentiment category with thresholds
        let sentimentLabel;
        if (score > 0.7) sentimentLabel = 'Positive';
        else if (score < 0.3) sentimentLabel = 'Negative';
        else sentimentLabel = 'Neutral';

        return { score, label: sentimentLabel };

    } catch (error) {
        console.error('Sentiment analysis error:', error.message);
        // Fallback to neutral on error
        return { score: 0.5, label: 'Neutral' };
    }
}

/**
 * GET /feedback
 * Show feedback submission form
 */
router.get('/', ensureAuth, async (req, res) => {
    try {
        const categories = await db.query(
            'SELECT id, name, color FROM categories WHERE is_active = true ORDER BY name'
        );

        res.render('pages/submit', {
            pageTitle: 'Submit Feedback',
            pageDescription: 'Share your thoughts anonymously with the community',
            categories: categories.rows
        });
    } catch (err) {
        console.error('Error loading feedback form:', err);
        req.flash('error', 'Failed to load feedback form');
        res.redirect('/dashboard');
    }
});

/**
 * POST /feedback
 * Submit new feedback with AI sentiment analysis
 */
router.post('/', ensureAuth, async (req, res) => {
    try {
        const { message, category_id, is_anonymous } = req.body;

        // Validation
        if (!message || typeof message !== 'string') {
            req.flash('error', 'Message is required');
            return res.redirect('/feedback');
        }

        const cleanMessage = message.trim();
        if (cleanMessage.length < 10) {
            req.flash('error', 'Message must be at least 10 characters');
            return res.redirect('/feedback');
        }

        if (cleanMessage.length > 2000) {
            req.flash('error', 'Message must be less than 2000 characters');
            return res.redirect('/feedback');
        }

        // Analyze sentiment
        const { score, label } = await analyzeSentiment(cleanMessage);

        // Insert feedback
        const result = await db.query(
            `INSERT INTO feedback 
             (user_id, message, category_id, sentiment_score, sentiment_label, is_anonymous, status) 
             VALUES ($1, $2, $3, $4, $5, $6, 'pending') 
             RETURNING id, created_at`,
            [
                req.session.userId,
                cleanMessage,
                category_id || null,
                score,
                label,
                is_anonymous === 'on' || is_anonymous === true
            ]
        );

        const feedback = result.rows[0];

        req.flash('success', `Feedback submitted! Sentiment: ${label}`);

        // HTMX handling
        if (req.headers['hx-request']) {
            return res.set('HX-Redirect', '/dashboard').status(200).send('');
        }

        res.redirect('/dashboard');

    } catch (err) {
        console.error('Feedback submission error:', err);
        req.flash('error', 'Failed to submit feedback. Please try again.');
        
        if (req.headers['hx-request']) {
            return res.status(500).send('');
        }
        res.redirect('/feedback');
    }
});

/**
 * GET /feedback/dashboard
 * Show user dashboard with recent feedback
 */
router.get('/dashboard', ensureAuth, async (req, res) => {
    try {
        let query = `
            SELECT f.id, f.message, f.sentiment_label, f.sentiment_score, 
                   f.category_id, f.is_anonymous, f.status, f.created_at,
                   c.name as category_name, c.color as category_color
            FROM feedback f
            LEFT JOIN categories c ON f.category_id = c.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        // Filter: show user's own feedback OR anonymous feedback from others
        if (req.session.userRole !== 'admin') {
            query += ` AND (f.is_anonymous = true OR f.user_id = $${paramIndex})`;
            params.push(req.session.userId);
            paramIndex++;
        }

        // Optional category filter
        if (req.query.category) {
            query += ` AND f.category_id = $${paramIndex}`;
            params.push(req.query.category);
            paramIndex++;
        }

        // Optional sentiment filter
        if (req.query.sentiment && ['Positive', 'Neutral', 'Negative'].includes(req.query.sentiment)) {
            query += ` AND f.sentiment_label = $${paramIndex}`;
            params.push(req.query.sentiment);
            paramIndex++;
        }

        query += ` ORDER BY f.created_at DESC LIMIT 50`;

        const result = await db.query(query, params);

        // Get categories for filter dropdown
        const categories = await db.query(
            'SELECT id, name, color FROM categories WHERE is_active = true ORDER BY name'
        );

        res.render('pages/dashboard', {
            pageTitle: 'Dashboard',
            pageDescription: 'View community feedback and insights',
            feedbacks: result.rows,
            categories: categories.rows,
            filters: {
                category: req.query.category || '',
                sentiment: req.query.sentiment || ''
            }
        });

    } catch (err) {
        console.error('Dashboard load error:', err);
        req.flash('error', 'Failed to load dashboard');
        res.redirect('/');
    }
});

/**
 * POST /feedback/:id/vote
 * Upvote or downvote feedback (for members)
 */
router.post('/:id/vote', ensureAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { vote_type } = req.body; // 'up' or 'down'

        if (!['up', 'down'].includes(vote_type)) {
            return res.status(400).json({ error: 'Invalid vote type' });
        }

        // Check if feedback exists and is not user's own (can't vote on self)
        const feedback = await db.query(
            'SELECT user_id FROM feedback WHERE id = $1',
            [id]
        );

        if (feedback.rows.length === 0) {
            return res.status(404).json({ error: 'Feedback not found' });
        }

        if (feedback.rows[0].user_id === req.session.userId) {
            return res.status(400).json({ error: 'Cannot vote on your own feedback' });
        }

        // Check if already voted
        const existing = await db.query(
            'SELECT id FROM feedback_votes WHERE feedback_id = $1 AND user_id = $2',
            [id, req.session.userId]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Already voted on this feedback' });
        }

        // Record vote
        await db.query(
            'INSERT INTO feedback_votes (feedback_id, user_id, vote_type) VALUES ($1, $2, $3)',
            [id, req.session.userId, vote_type]
        );

        // Update vote count
        const change = vote_type === 'up' ? 1 : -1;
        await db.query(
            'UPDATE feedback SET upvotes = COALESCE(upvotes, 0) + $1 WHERE id = $2',
            [change, id]
        );

        // Return updated count
        const updated = await db.query(
            'SELECT upvotes FROM feedback WHERE id = $1',
            [id]
        );

        if (req.headers['hx-request']) {
            return res.send(`
                <span class="font-semibold">${updated.rows[0].upvotes}</span>
            `);
        }

        res.json({ success: true, upvotes: updated.rows[0].upvotes });

    } catch (err) {
        console.error('Vote error:', err);
        res.status(500).json({ error: 'Failed to record vote' });
    }
});

/**
 * GET /feedback/categories
 * API endpoint to fetch active categories (for dynamic forms)
 */
router.get('/categories', ensureAuth, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, name, color, description FROM categories WHERE is_active = true ORDER BY name'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Categories fetch error:', err);
        res.status(500).json({ error: 'Failed to load categories' });
    }
});

module.exports = router;