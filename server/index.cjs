const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Database Connection Pool
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'dev-community',
    password: process.env.MYSQL_PASSWORD || 'hsmdev282930',
    database: process.env.MYSQL_DB || 'dev_community',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(403).json({ error: 'No token provided' });

    jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Unauthorized' });
        req.userId = decoded.id;
        next();
    });
};


// Helper: Ensure User, Profile, and Role exist
async function ensureUser(email, passwordHash, fullName, avatarUrl) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Check or Create User
        let [users] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);
        let userId;

        if (users.length === 0) {
            userId = uuidv4();
            await connection.execute(
                'INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
                [userId, email, passwordHash] // passwordHash might be null for OAuth
            );
        } else {
            userId = users[0].id; // Don't overwrite existing user
        }

        // 2. Check or Create Profile
        const [profiles] = await connection.execute('SELECT * FROM profiles WHERE user_id = ?', [userId]);
        let finalFullName = fullName;
        let finalAvatarUrl = avatarUrl;

        if (profiles.length === 0) {
            await connection.execute(
                'INSERT INTO profiles (id, user_id, full_name, avatar_url, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
                [uuidv4(), userId, fullName || null, avatarUrl || null]
            );
        } else {
            finalFullName = profiles[0].full_name || fullName;
            finalAvatarUrl = profiles[0].avatar_url || avatarUrl;
        }

        // 3. Check or Create User Role
        const [roles] = await connection.execute('SELECT * FROM user_roles WHERE user_id = ?', [userId]);
        if (roles.length === 0) {
            await connection.execute(
                'INSERT INTO user_roles (id, user_id, role, created_at) VALUES (?, ?, ?, NOW())',
                [uuidv4(), userId, 'user']
            );
        }

        await connection.commit();
        return { id: userId, email, full_name: finalFullName, avatar_url: finalAvatarUrl };

    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
}

// Passport Setup
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || "MISSING_ID",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "MISSING_SECRET",
    callbackURL: "http://localhost:3001/api/auth/google/callback"
},
    async function (accessToken, refreshToken, profile, cb) {
        try {
            const email = profile.emails[0].value;
            const user = await ensureUser(email, null, profile.displayName, profile.photos?.[0]?.value);
            return cb(null, user);
        } catch (err) {
            return cb(err, null);
        }
    }
));

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID || "MISSING_ID",
    clientSecret: process.env.GITHUB_CLIENT_SECRET || "MISSING_SECRET",
    callbackURL: "http://localhost:3001/api/auth/github/callback",
    scope: ['user:email']
},
    async function (accessToken, refreshToken, profile, cb) {
        try {
            const email = profile.emails?.[0]?.value || `${profile.username}@github.com`;
            const user = await ensureUser(email, null, profile.displayName || profile.username, profile.photos?.[0]?.value);
            return cb(null, user);
        } catch (err) {
            return cb(err, null);
        }
    }
));

// Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', db: 'mysql' });
});

// --- OAUTH ROUTES ---
app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/api/auth/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/auth?error=google_failed' }),
    function (req, res) {
        const token = jwt.sign({ id: req.user.id, email: req.user.email }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '24h' });
        res.redirect(`http://localhost:8080/auth?token=${token}`);
    }
);

app.get('/api/auth/github', passport.authenticate('github', { scope: ['user:email'] }));

app.get('/api/auth/github/callback',
    passport.authenticate('github', { session: false, failureRedirect: '/auth?error=github_failed' }),
    function (req, res) {
        const token = jwt.sign({ id: req.user.id, email: req.user.email }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '24h' });
        res.redirect(`http://localhost:8080/auth?token=${token}`);
    }
);


// SIGNUP
app.post('/api/auth/register', async (req, res) => {
    const { email, password, full_name } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        // Use helper to ensure consistency (creates user, profile, AND role)
        const user = await ensureUser(email, hash, full_name, null);

        const token = jwt.sign({ id: user.id, email }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '24h' });

        res.json({
            user,
            token
        });

    } catch (err) {
        console.error("Signup Error:", err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = rows[0];

        if (!user.password_hash) {
            return res.status(401).json({ error: 'Please sign in with your social account or reset password' });
        }

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Fetch profile
        const [profiles] = await pool.execute('SELECT * FROM profiles WHERE user_id = ?', [user.id]);
        const profile = profiles[0] || {};

        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '24h' });

        res.json({
            user: {
                id: user.id,
                email: user.email,
                full_name: profile.full_name,
                avatar_url: profile.avatar_url
            },
            token
        });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET ME (Session check)
app.get('/api/auth/me', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT id, email FROM users WHERE id = ?', [req.userId]);
        if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

        const user = rows[0];
        const [profiles] = await pool.execute('SELECT * FROM profiles WHERE user_id = ?', [user.id]);
        const profile = profiles[0] || {};

        res.json({
            user: {
                id: user.id,
                email: user.email,
                full_name: profile.full_name,
                avatar_url: profile.avatar_url
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
