// middleware/auth.js
module.exports = {
    ensureAuth: (req, res, next) => {
        if (req.session.userId) return next();
        if (req.headers['hx-request']) {
            return res.set('HX-Redirect', '/login').status(200).send('');
        }
        res.redirect('/login');
    },
    
    ensureAdmin: (req, res, next) => {
        if (req.session.userRole === 'admin') return next();
        if (req.headers['hx-request']) {
            return res.status(403).send('<div class="text-red-600">Admin access required</div>');
        }
        req.flash('error', 'Admin access required');
        res.redirect('/dashboard');
    }
};