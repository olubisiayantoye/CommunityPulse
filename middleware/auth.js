module.exports = {
    ensureAuth: (req, res, next) => {
        if (req.session.userId) {
            return next();
        }
        if (req.headers['hx-request']) {
            return res.status(401).send('<div hx-redirect="/login" hx-trigger="load"></div>');
        }
        res.redirect('/login');
    },
    ensureAdmin: (req, res, next) => {
        if (req.session.userRole === 'admin') {
            return next();
        }
        if (req.headers['hx-request']) {
            return res.status(403).send('<div class="text-red-500">Access Denied</div>');
        }
        res.redirect('/dashboard');
    }
};