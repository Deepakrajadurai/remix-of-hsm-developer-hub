const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const nodemailer = require('nodemailer');
const path = require('path');
// Explicitly load .env from root
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001; // Restored fallback for safety during debug

console.log('--- Server Startup Debug ---');
console.log('Loading .env from:', path.resolve(__dirname, '../.env'));
console.log('PORT:', process.env.PORT);
console.log('MYSQL_HOST:', process.env.MYSQL_HOST);
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('Start Port:', PORT);
console.log('----------------------------');

app.use(cors());
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});

// Database Connection Pool
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB,
    port: parseInt(process.env.MYSQL_PORT),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Helper: Email Transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER, // User must set this
        pass: process.env.SMTP_PASS, // User must set this
    },
});

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(403).json({ error: 'No token provided' });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Unauthorized' });
        req.userId = decoded.id;
        next();
    });
};


// Helper: Ensure User, Profile, and Role exist
async function ensureUser(email, passwordHash, fullName, avatarUrl, isVerified = false) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Check or Create User
        let [users] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);
        let userId;

        if (users.length === 0) {
            console.log(`[ensureUser] Creating new user for ${email}`);
            userId = uuidv4();
            await connection.execute(
                'INSERT INTO users (id, email, password_hash, is_verified, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
                [userId, email, passwordHash, isVerified ? 1 : 0]
            );
        } else {
            console.log(`[ensureUser] Found existing user for ${email}`);
            userId = users[0].id;
            // If OAuth login, auto-verify email if not verified? Usually yes for Google/GitHub
            if (isVerified && !users[0].is_verified) {
                console.log(`[ensureUser] Verifying existing user: ${userId}`);
                await connection.execute('UPDATE users SET is_verified = 1 WHERE id = ?', [userId]);
            }
        }

        // 2. Check or Create Profile
        console.log(`[ensureUser] Checking profile for user: ${userId}`);
        const [profiles] = await connection.execute('SELECT * FROM profiles WHERE user_id = ?', [userId]);
        let finalFullName = fullName;
        let finalAvatarUrl = avatarUrl;

        if (profiles.length === 0) {
            console.log(`[ensureUser] Creating profile for user: ${userId}`);
            await connection.execute(
                'INSERT INTO profiles (id, user_id, full_name, avatar_url, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
                [uuidv4(), userId, fullName || null, avatarUrl || null]
            );
        } else {
            console.log(`[ensureUser] Using existing profile for user: ${userId}`);
            finalFullName = profiles[0].full_name || fullName;
            finalAvatarUrl = profiles[0].avatar_url || avatarUrl;
        }

        // 3. Check or Create User Role
        console.log(`[ensureUser] Checking roles for user: ${userId}`);
        const [roles] = await connection.execute('SELECT * FROM user_roles WHERE user_id = ?', [userId]);
        if (roles.length === 0) {
            console.log(`[ensureUser] Assigning default role to user: ${userId}`);
            await connection.execute(
                'INSERT INTO user_roles (id, user_id, role, created_at) VALUES (?, ?, ?, NOW())',
                [uuidv4(), userId, 'user']
            );
        }

        await connection.commit();
        // Re-fetch user to get latest verify status
        const [freshUsers] = await connection.execute('SELECT * FROM users WHERE id = ?', [userId]);

        return {
            id: userId,
            email,
            full_name: finalFullName,
            avatar_url: finalAvatarUrl,
            is_verified: freshUsers[0].is_verified
        };

    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
}

// Passport Setup
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
},
    async function (accessToken, refreshToken, profile, cb) {
        try {
            const email = profile.emails[0].value;
            // OAuth users are implicitly verified
            const user = await ensureUser(email, null, profile.displayName, profile.photos?.[0]?.value, true);
            return cb(null, user);
        } catch (err) {
            return cb(err, null);
        }
    }
));

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL,
    scope: ['user:email']
},
    async function (accessToken, refreshToken, profile, cb) {
        try {
            const email = profile.emails?.[0]?.value || `${profile.username}@github.com`;
            const user = await ensureUser(email, null, profile.displayName || profile.username, profile.photos?.[0]?.value, true);
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
        try {
            const token = jwt.sign({ id: req.user.id, email: req.user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });
            res.redirect(`${process.env.CLIENT_URL}/auth?token=${token}`);
        } catch (err) {
            console.error('Google Callback Error:', err);
            res.redirect(`${process.env.CLIENT_URL}/auth?error=token_generation_failed`);
        }
    }
);

app.get('/api/auth/github', passport.authenticate('github', { scope: ['user:email'] }));

app.get('/api/auth/github/callback',
    passport.authenticate('github', { session: false, failureRedirect: '/auth?error=github_failed' }),
    function (req, res) {
        try {
            const token = jwt.sign({ id: req.user.id, email: req.user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });
            res.redirect(`${process.env.CLIENT_URL}/auth?token=${token}`);
        } catch (err) {
            console.error('GitHub Callback Error:', err);
            res.redirect(`${process.env.CLIENT_URL}/auth?error=token_generation_failed`);
        }
    }
);


// SIGNUP with EMAIL (Temporary Storage)
app.post('/api/auth/register', async (req, res) => {
    const { email, password, full_name } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    // Strict Password Validation
    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long and include at least one number and one special character.' });
    }

    try {
        const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(409).json({ error: 'Email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        const verificationToken = uuidv4();
        const pendingId = uuidv4();

        // Save to pending_registrations instead of users
        await pool.execute(
            `INSERT INTO pending_registrations (id, email, password_hash, full_name, verification_token, created_at) 
             VALUES (?, ?, ?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), full_name = VALUES(full_name), verification_token = VALUES(verification_token), created_at = NOW()`,
            [pendingId, email, hash, full_name || null, verificationToken]
        );

        // Send Verification Email
        const verifyLink = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
        try {
            await transporter.sendMail({
                from: process.env.SMTP_USER,
                to: email,
                subject: 'Verify your email - Developer Hub',
                html: `<p>Please click the link below to verify your email:</p><a href="${verifyLink}">${verifyLink}</a>`
            });
        } catch (emailErr) {
            console.error("Email send failed:", emailErr);
        }

        res.json({
            message: "Registration started. Please check your email to verify your account."
        });

    } catch (err) {
        console.error("Signup Error:", err);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// VERIFY EMAIL ENDPOINT (Move from Pending to Real)
app.post('/api/auth/verify', async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token required' });

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Find in Pending
        const [pendings] = await connection.execute('SELECT * FROM pending_registrations WHERE verification_token = ?', [token]);

        if (pendings.length === 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        const pendingUser = pendings[0];
        const userId = uuidv4();

        // 2. Insert into Users
        await connection.execute(
            'INSERT INTO users (id, email, password_hash, is_verified, created_at, updated_at) VALUES (?, ?, ?, 1, NOW(), NOW())',
            [userId, pendingUser.email, pendingUser.password_hash]
        );

        // 3. Insert into Profiles
        await connection.execute(
            'INSERT INTO profiles (id, user_id, full_name, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
            [uuidv4(), userId, pendingUser.full_name || null]
        );

        // 4. Insert into User Roles
        await connection.execute(
            'INSERT INTO user_roles (id, user_id, role, created_at) VALUES (?, ?, ?, NOW())',
            [uuidv4(), userId, 'user']
        );

        // 5. Delete from Pending
        await connection.execute('DELETE FROM pending_registrations WHERE email = ?', [pendingUser.email]);

        await connection.commit();

        res.json({ message: 'Email verified successfully. Account created. You can now login.' });

    } catch (err) {
        await connection.rollback();
        console.error("Verification Error:", err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Account already verified or email exists.' });
        }
        res.status(500).json({ error: 'Server error during verification' });
    } finally {
        connection.release();
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
            // Check if they are verified (OAuth users are verified by default)
            if (user.is_verified) {
                // If verified but no password, we assume it's a social login user trying to sign in with email/empty password?
                // NO, we can't allow email/password login without a password.
                // However, the user might be trying to "Sign In" but using the Google button?
                // The frontend handles Google button separately.
                // If this is an email/password login attempt:
                return res.status(401).json({ error: 'Please sign in with your social account or reset password' });
            }
        } else {
            const match = await bcrypt.compare(password, user.password_hash);
            if (!match) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }
        }

        // Check Verification
        if (user.is_verified === 0) {
            return res.status(403).json({ error: 'Please verify your email before logging in.' });
        }

        // Fetch profile
        const [profiles] = await pool.execute('SELECT * FROM profiles WHERE user_id = ?', [user.id]);
        const profile = profiles[0] || {};

        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });

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
    console.log(`Server running on ${process.env.SERVER_URL || `port ${PORT}`}`);
});
