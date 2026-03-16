const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../db');
const { ensureAuth } = require('../middleware/auth');

// AI Sentiment Analysis
async function analyzeSentiment(text) {
    try {
        const response = await axios.post(
            "https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english",
            { inputs: text.substring(0, 512) },
            { headers: { Authorization: `Bearer ${process.env.HF_API_TOKEN}` } }
        );
        const result = response.data[0];
        const score = result.score;
        const label = result.label === 'POSITIVE' ? 'Positive' : 'Negative';
        return { score, label };
    } catch (error) {
        return { score: 0.5, label: 'Neutral' };
    }
}

router.get('/', ensureAuth, async (req, res) => {
    const categories = await db.query('SELECT * FROM categories');
    res.render('pages/submit', { 
        layout: 'layouts/main', 
        categories: categories.rows 
    });
});

router.post('/', ensureAuth, async (req, res) => {
    try {
        const { message, category_id, is_anonymous } = req.body;
        const { score, label } = await analyzeSentiment(message);

        await db.query(
            `INSERT INTO feedback (user_id, message, category_id, sentiment_score, sentiment_label, is_anonymous) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [req.session.userId, message, category_id, score, label, is_anonymous === 'on']
        );

        if (req.headers['hx-request']) {
            return res.send(`
                <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                    <strong class="font-bold">Success!</strong>
                    <span class="block sm:inline">Feedback submitted. Sentiment: ${label}</span>
                </div>
            `);
        }
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error submitting feedback');
    }
});

router.get('/dashboard', ensureAuth, async (req, res) => {
    const result = await db.query(`
        SELECT f.*, c.name as category_name, c.color 
        FROM feedback f 
        LEFT JOIN categories c ON f.category_id = c.id 
        ORDER BY f.created_at DESC LIMIT 20
    `);
    res.render('pages/dashboard', { 
        layout: 'layouts/main', 
        feedbacks: result.rows 
    });
});

module.exports = router;