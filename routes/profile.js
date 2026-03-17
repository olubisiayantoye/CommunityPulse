// routes/profile.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');
const { ensureAuth } = require('../middleware/auth');

/**
 * GET /profile
 * Show user profile page
 */
router.get('/', ensureAuth, async (req, res) => {
    try {
        // Get user stats
        const statsQuery = await db.query(`
            SELECT 
                COUNT(*) as feedback_count,
                EXTRACT(DAY FROM NOW() - created_at) as days_member
            FROM feedback
            WHERE user_id = $1
        `, [req.session.userId]);

        const stats = statsQuery.rows[0] || { feedback_count: 0, days_member: 0 };

        // Get full user data
        const userQuery = await db.query(
            'SELECT id, username, email, role, created_at FROM users WHERE id = $1',
            [req.session.userId]
        );

        res.render('pages/profile', {
            pageTitle: 'My Profile',
            pageDescription: 'Manage your account settings',
            user: userQuery.rows[0],
            stats
        });

    } catch (err) {
        console.error('Profile load error:', err);
        req.flash('error', 'Failed to load profile');
        res.redirect('/dashboard');
    }
});

/**
 * PUT /profile/email
 * Update user email
 */
router.put('/email', ensureAuth, async (req, res) => {
    try {
        const { email } = req.body;

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            req.flash('error', 'Invalid email address');
            if (req.headers['hx-request']) {
                return res.send('<div class="text-red-600 text-sm">Invalid email address</div>');
            }
            return res.redirect('/profile');
        }

        await db.query('UPDATE users SET email = $1 WHERE id = $2', [email || null, req.session.userId]);

        req.flash('success', 'Email updated successfully');

        if (req.headers['hx-request']) {
            return res.send('<div class="text-green-600 text-sm">✓ Email updated successfully</div>');
        }
        res.redirect('/profile');

    } catch (err) {
        console.error('Email update error:', err);
        req.flash('error', 'Failed to update email');
        
        if (req.headers['hx-request']) {
            return res.send('<div class="text-red-600 text-sm">Failed to update email</div>');
        }
        res.redirect('/profile');
    }
});

/**
 * PUT /profile/password
 * Change user password
 */
router.put('/password', ensureAuth, async (req, res) => {
    try {
        const { current_password, new_password } = req.body;

        // Validate new password
        if (!new_password || new_password.length < 8) {
            req.flash('error', 'New password must be at least 8 characters');
            if (req.headers['hx-request']) {
                return res.send('<div class="text-red-600 text-sm">Password must be at least 8 characters</div>');
            }
            return res.redirect('/profile');
        }

        // Verify current password
        const userQuery = await db.query(
            'SELECT password_hash FROM users WHERE id = $1',
            [req.session.userId]
        );

        if (userQuery.rows.length === 0) {
            throw new Error('User not found');
        }

        const valid = await bcrypt.compare(current_password, userQuery.rows[0].password_hash);
        if (!valid) {
            req.flash('error', 'Current password is incorrect');
            if (req.headers['hx-request']) {
                return res.send('<div class="text-red-600 text-sm">Current password is incorrect</div>');
            }
            return res.redirect('/profile');
        }

        // Hash and update new password
        const hash = await bcrypt.hash(new_password, 12);
        await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.session.userId]);

        req.flash('success', 'Password changed successfully');

        if (req.headers['hx-request']) {
            return res.send('<div class="text-green-600 text-sm">✓ Password changed successfully</div>');
        }
        res.redirect('/profile');

    } catch (err) {
        console.error('Password change error:', err);
        req.flash('error', 'Failed to change password');
        
        if (req.headers['hx-request']) {
            return res.send('<div class="text-red-600 text-sm">Failed to change password</div>');
        }
        res.redirect('/profile');
    }
});

/**
 * DELETE /profile/account
 * Delete user account (soft delete or hard delete)
 */
router.delete('/account', ensureAuth, async (req, res) => {
    try {
        // Option 1: Soft delete (recommended)
        await db.query(`
            UPDATE users 
            SET is_active = false, 
                username = 'deleted_' || id,
                email = NULL
            WHERE id = $1
        `, [req.session.userId]);

        // Option 2: Hard delete (uncomment if needed)
        // await db.query('DELETE FROM feedback WHERE user_id = $1', [req.session.userId]);
        // await db.query('DELETE FROM users WHERE id = $1', [req.session.userId]);

        req.session.destroy();
        res.clearCookie('connect.sid');

        if (req.headers['hx-request']) {
            return res.set('HX-Redirect', '/login?message=account_deleted').status(200).send('');
        }
        res.redirect('/login?message=account_deleted');

    } catch (err) {
        console.error('Account deletion error:', err);
        req.flash('error', 'Failed to delete account');
        
        if (req.headers['hx-request']) {
            return res.send('<div class="text-red-600 text-sm">Failed to delete account</div>');
        }
        res.redirect('/profile');
    }
});

module.exports = router;