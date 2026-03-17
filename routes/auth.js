// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');

/**
 * GET /login
 * Show login page (redirects to dashboard if already authenticated)
 */
router.get('/login', (req, res) => {
    if (req.session.userId) {
        return res.redirect('/dashboard');
    }
    // Layout is auto-applied via server.js (express-ejs-layouts)
    res.render('pages/login', {
        pageTitle: 'Login',
        pageDescription: 'Sign in to your account'
    });
});

/**
 * POST /login
 * Handle user authentication
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Basic validation
        if (!username || !password) {
            req.flash('error', 'Username and password are required');
            return res.redirect('/login');
        }

        // Find user
        const result = await db.query(
            'SELECT id, username, password_hash, role FROM users WHERE username = $1 AND username IS NOT NULL',
            [username.trim()]
        );

        if (result.rows.length === 0) {
            req.flash('error', 'Invalid username or password');
            return res.redirect('/login');
        }

        const user = result.rows[0];

        // Verify password
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            req.flash('error', 'Invalid username or password');
            return res.redirect('/login');
        }

        // Set session
        req.session.userId = user.id;
        req.session.userRole = user.role;
        req.session.username = user.username;

        // Update last login timestamp
        await db.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

        // Handle HTMX request vs normal request
        if (req.headers['hx-request']) {
            // HTMX: Send redirect instruction via header
            return res.set('HX-Redirect', '/dashboard').status(200).send('');
        }

        // Normal: HTTP redirect
        res.redirect('/dashboard');

    } catch (err) {
        console.error('Login error:', err);
        req.flash('error', 'An error occurred during login. Please try again.');
        res.redirect('/login');
    }
});

/**
 * GET /register
 * Show registration page
 */
router.get('/register', (req, res) => {
    if (req.session.userId) {
        return res.redirect('/dashboard');
    }
    res.render('pages/register', {
        pageTitle: 'Register',
        pageDescription: 'Create your CommunityPulse account'
    });
});

/**
 * POST /register
 * Handle new user registration
 */
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validation
        if (!username || !password) {
            req.flash('error', 'Username and password are required');
            return res.redirect('/register');
        }

        if (username.length < 3 || username.length > 50) {
            req.flash('error', 'Username must be between 3 and 50 characters');
            return res.redirect('/register');
        }

        if (password.length < 8) {
            req.flash('error', 'Password must be at least 8 characters');
            return res.redirect('/register');
        }

        // Only allow alphanumeric + underscore
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            req.flash('error', 'Username can only contain letters, numbers, and underscores');
            return res.redirect('/register');
        }

        // Hash password
        const hash = await bcrypt.hash(password, 12);

        // Insert user
        await db.query(
            'INSERT INTO users (username, password_hash) VALUES ($1, $2)',
            [username.trim(), hash]
        );

        req.flash('success', 'Registration successful! Please log in.');
        
        // HTMX handling for registration redirect
        if (req.headers['hx-request']) {
            return res.set('HX-Redirect', '/login').status(200).send('');
        }
        
        res.redirect('/login');

    } catch (err) {
        console.error('Registration error:', err);
        
        // Handle duplicate username (PostgreSQL error code 23505)
        if (err.code === '23505') {
            req.flash('error', 'Username already exists. Please choose another.');
        } else {
            req.flash('error', 'Registration failed. Please try again.');
        }
        
        if (req.headers['hx-request']) {
            return res.status(400).send('');
        }
        res.redirect('/register');
    }
});

/**
 * GET /api/check-username
 * Check if username is available (for real-time validation)
 */
router.get('/api/check-username', async (req, res) => {
    try {
        const { username } = req.query;

        if (!username || typeof username !== 'string') {
            return res.status(400).json({ error: 'Username parameter required' });
        }

        // Trim and validate length
        const cleanUsername = username.trim();
        if (cleanUsername.length < 3 || cleanUsername.length > 50) {
            return res.json({ taken: false, valid: false });
        }

        // Check format
        if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
            return res.json({ taken: false, valid: false });
        }

        // Query database
        const result = await db.query(
            'SELECT id FROM users WHERE username = $1 LIMIT 1',
            [cleanUsername]
        );

        res.json({
            taken: result.rows.length > 0,
            valid: true
        });

    } catch (err) {
        console.error('Username check error:', err);
        res.status(500).json({ 
            taken: false, 
            valid: true, // Assume valid on error to avoid blocking UX
            error: 'Service unavailable'
        });
    }
});

/**
 * GET /logout
 * End user session
 */
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        // Clear browser session cookie
        res.clearCookie('connect.sid');
        
        if (req.headers['hx-request']) {
            return res.set('HX-Redirect', '/login').status(200).send('');
        }
        res.redirect('/login');
    });
});

module.exports = router;