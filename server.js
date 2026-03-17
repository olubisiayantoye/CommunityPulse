// server.js
const express = require('express');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const flash = require('connect-flash');
const helmet = require('helmet');
const expressLayouts = require('express-ejs-layouts'); // ✅ Add this
const path = require('path');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// 🔐 Security & Middleware
// ============================================

// Helmet with relaxed CSP for CDN scripts (customize for production)
app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'", 
                "'unsafe-inline'", 
                'https://cdn.tailwindcss.com',
                'https://unpkg.com',
                'https://cdn.jsdelivr.net'
            ],
            styleSrc: [
                "'self'", 
                "'unsafe-inline'", 
                'https://cdn.tailwindcss.com',
                'https://fonts.googleapis.com'
            ],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", 'https://api-inference.huggingface.co']
        }
    } : false // Disable in dev for easier debugging
}));

// Body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static files with cache control for production
app.use(express.static('public', {
    maxAge: process.env.NODE_ENV === 'production' ? '1y' : 0,
    immutable: process.env.NODE_ENV === 'production'
}));

// ============================================
// 🗄️ Session & Flash Messages
// ============================================

app.use(session({
    store: new PgSession({ 
        pool: db.pool,
        createTableIfMissing: true, // Auto-create sessions table
        tableName: 'session' // Optional: customize table name
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'lax' // CSRF protection
    }
}));

// Flash messages MUST come after session
app.use(flash());

// ============================================
// 🌍 Global View Variables
// ============================================

app.use((req, res, next) => {
    // Make user available to all views
    res.locals.user = req.session.userId ? {
        id: req.session.userId,
        role: req.session.userRole,
        username: req.session.username
    } : null;
    
    // Make flash messages available (connect-flash stores them in session)
    res.locals.messages = {
        error: req.flash('error'),
        success: req.flash('success'),
        warning: req.flash('warning'),
        info: req.flash('info')
    };
    
    // Make current path available for active nav highlighting
    res.locals.currentPath = req.path;
    
    next();
});

// ============================================
// 🎨 View Engine & Layouts
// ============================================

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ✅ Enable express-ejs-layouts
app.use(expressLayouts);
app.set('layout', 'layouts/main'); // Default layout for all views

// Helper: Render with custom layout (optional)
app.locals.renderWithLayout = function(view, options = {}, layout = null) {
    return new Promise((resolve, reject) => {
        // Create a mock res object for internal rendering
        const mockRes = {
            render: (v, opts, cb) => {
                app.render(v, opts, cb);
            }
        };
        app.render(view, { ...options, layout: layout || options.layout || 'layouts/main' }, (err, html) => {
            if (err) reject(err);
            else resolve(html);
        });
    });
};

// ============================================
// 📡 HTMX Support Middleware
// ============================================

// Add HTMX-specific headers to responses
app.use((req, res, next) => {
    if (req.headers['hx-request']) {
        res.setHeader('HX-Location', req.headers['hx-current-url'] || '/');
    }
    next();
});

// Handle HTMX redirects properly
app.use((req, res, next) => {
    const originalRedirect = res.redirect;
    res.redirect = function(url) {
        if (req.headers['hx-request']) {
            // For HTMX requests, send a redirect instruction instead of HTTP redirect
            return res.set('HX-Redirect', url).status(200).send('');
        }
        return originalRedirect.call(this, url);
    };
    next();
});

// ============================================
// 🛣️ Routes
// ============================================

app.use('/', require('./routes/auth'));
app.use('/feedback', require('./routes/feedback'));
app.use('/admin', require('./routes/admin'));
app.use('/profile', require('./routes/profile'));

//https://your-app.onrender.com/init-db

// TEMPORARY: Run once to initialize DB, then remove this route
app.get('/init-db', async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).send('Disabled in production');
    }
    try {
        const schema = require('fs').readFileSync('./schema.sql', 'utf8');
        await db.query(schema);
        res.send('Database initialized!');
    } catch (err) {
        res.status(500).send('Error: ' + err.message);
    }
});

// Home route
app.get('/', (req, res) => {
    if (req.session.userId) {
        return res.redirect('/dashboard');
    }
    res.redirect('/login');
});

// Health check endpoint (for Render/Uptime monitoring)
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// 404 Handler
app.use((req, res) => {
    if (req.headers['hx-request']) {
        return res.status(404).send('<div class="text-center py-8 text-gray-500">Page not found</div>');
    }
    res.status(404).render('error', { 
        layout: 'layouts/main',
        pageTitle: '404 - Not Found',
        message: 'The page you\'re looking for doesn\'t exist.'
    });
});

// ============================================
// 🚨 Error Handling
// ============================================

// Development error handler (detailed)
if (process.env.NODE_ENV !== 'production') {
    app.use((err, req, res, next) => {
        console.error('❌ Error:', err.stack);
        console.error('📍 Path:', req.path);
        console.error('📦 Body:', req.body);
        
        if (req.headers['hx-request']) {
            return res.status(500).send(`
                <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <p class="text-red-800 font-medium">Error: ${err.message}</p>
                    <pre class="text-xs text-red-600 mt-2 overflow-auto">${err.stack}</pre>
                </div>
            `);
        }
        
        res.status(500).render('error', {
            layout: 'layouts/main',
            pageTitle: 'Server Error',
            message: err.message,
            stack: err.stack,
            error: err
        });
    });
}

// Production error handler (minimal)
if (process.env.NODE_ENV === 'production') {
    app.use((err, req, res, next) => {
        console.error('❌ Production Error:', err.message);
        
        if (req.headers['hx-request']) {
            return res.status(500).send(`
                <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded text-center">
                    <p class="text-red-800 font-medium">Something went wrong</p>
                    <button onclick="window.location.reload()" class="mt-2 text-sm text-blue-600 hover:underline">Try again</button>
                </div>
            `);
        }
        
        res.status(500).render('error', {
            layout: 'layouts/main',
            pageTitle: 'Error',
            message: 'An unexpected error occurred. Please try again later.'
        });
    });
}

// ============================================
// 🚀 Start Server
// ============================================

// Graceful shutdown handling
process.on('SIGTERM', () => {
    console.log('🔄 SIGTERM received, shutting down gracefully');
    db.pool.end(() => {
        console.log('🔌 Database pool closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🔄 SIGINT received, shutting down gracefully');
    db.pool.end(() => {
        console.log('🔌 Database pool closed');
        process.exit(0);
    });
});

// Start listening
app.listen(PORT, () => {
    console.log(`🚀 CommunityPulse running on port http://localhost:${PORT}`);
    console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
    if (process.env.NODE_ENV === 'production') {
        console.log(`🔒 Secure mode: HTTPS cookies enabled`);
    }
});

// Export for testing
module.exports = app;