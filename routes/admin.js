const express = require('express');
const router = express.Router();
const db = require('../db');
const { ensureAuth, ensureAdmin } = require('../middleware/auth');

router.get('/', ensureAuth, ensureAdmin, async (req, res) => {
    const stats = await db.query(`
        SELECT sentiment_label, COUNT(*) FROM feedback GROUP BY sentiment_label
    `);
    const recent = await db.query(`
        SELECT * FROM feedback WHERE status = 'pending' ORDER BY created_at DESC LIMIT 10
    `);
    res.render('pages/admin', { 
        layout: 'layouts/main', 
        stats: stats.rows, 
        recent: recent.rows 
    });
});

router.put('/status/:id', ensureAuth, ensureAdmin, async (req, res) => {
    const { status } = req.body;
    await db.query('UPDATE feedback SET status = $1 WHERE id = $2', [status, req.params.id]);
    res.send('Updated');
});

module.exports = router;