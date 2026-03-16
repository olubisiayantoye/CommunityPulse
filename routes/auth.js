const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');

router.get('/login', (req, res) => {
    if (req.session.userId) return res.redirect('/dashboard');
    res.render('pages/login', { layout: 'layouts/main' });
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        
        if (result.rows.length === 0) {
            req.flash('error', 'Invalid credentials');
            return res.redirect('/login');
        }

        const user = result.rows[0];
        const valid = await bcrypt.compare(password, user.password_hash);

        if (!valid) {
            req.flash('error', 'Invalid credentials');
            return res.redirect('/login');
        }

        req.session.userId = user.id;
        req.session.userRole = user.role;
        req.session.username = user.username;

        if (req.headers['hx-request']) {
            return res.send('<div hx-redirect="/dashboard" hx-trigger="load"></div>');
        }
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Login failed');
        res.redirect('/login');
    }
});

router.get('/register', (req, res) => {
    res.render('pages/register', { layout: 'layouts/main' });
});

router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hash = await bcrypt.hash(password, 10);
        await db.query('INSERT INTO users (username, password_hash) VALUES ($1, $2)', [username, hash]);
        req.flash('success', 'Registration successful! Please login.');
        res.redirect('/login');
    } catch (err) {
        req.flash('error', 'Username already exists');
        res.redirect('/register');
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

module.exports = router;