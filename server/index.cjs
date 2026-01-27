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
const multer = require('multer');
const fs = require('fs');
const sharp = require('sharp');

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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve Uploads - REMOVED for Base64

// Multer Storage Setup (Memory for Base64)
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});

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
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false // For development - remove in production
    }
});

// Verify email configuration on startup
transporter.verify(function (error, success) {
    if (error) {
        console.error('❌ Email transporter error:', error);
    } else {
        console.log('✅ Email server is ready to send messages');
    }
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
                avatar_url: profile.avatar_url,
                cover_url: profile.cover_url,
                github_link: profile.github_link,
                linkedin_link: profile.linkedin_link,
                location: profile.location,
                bio: profile.bio,
                website_link: profile.website_link,
                created_at: user.created_at
            },
            token
        });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET ME (Session check) - Extended Profile
app.get('/api/auth/me', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT id, email, created_at FROM users WHERE id = ?', [req.userId]);
        if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

        const user = rows[0];
        const [profiles] = await pool.execute('SELECT * FROM profiles WHERE user_id = ?', [user.id]);
        const profile = profiles[0] || {};

        res.json({
            user: {
                id: user.id,
                email: user.email,
                full_name: profile.full_name,
                avatar_url: profile.avatar_url,
                cover_url: profile.cover_url,
                github_link: profile.github_link,
                linkedin_link: profile.linkedin_link,
                location: profile.location,
                bio: profile.bio,
                website_link: profile.website_link,
                created_at: user.created_at
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// --- COMMUNITY ROUTES ---

// 1. GET CHANNELS
app.get('/api/community/channels', async (req, res) => {
    try {
        const [channels] = await pool.execute('SELECT * FROM channels ORDER BY created_at ASC');
        res.json(channels);
    } catch (err) {
        console.error("Get Channels Error:", err);
        res.status(500).json({ error: 'Server error fetching channels' });
    }
});

// 2. CREATE CHANNEL (Protected)
app.post('/api/community/channels', verifyToken, async (req, res) => {
    const { slug, name, description } = req.body;
    if (!slug || !name) return res.status(400).json({ error: 'Slug and Name are required' });

    try {
        const id = uuidv4();
        await pool.execute(
            'INSERT INTO channels (id, slug, name, description, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
            [id, slug, name, description || null, req.userId]
        );
        const [newChannel] = await pool.execute('SELECT * FROM channels WHERE id = ?', [id]);
        res.json(newChannel[0]);
    } catch (err) {
        console.error("Create Channel Error:", err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Channel slug already exists' });
        }
        res.status(500).json({ error: 'Server error creating channel' });
    }
});

// 3. GET POSTS (with filters)
// 3. GET POSTS (with filters)
app.get('/api/community/posts', async (req, res) => {
    const { channel_id, search, limit = 50 } = req.query;

    // Check for optional auth token to get 'liked' status
    let userId = null;
    const authHeader = req.headers['authorization'];
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.id;
            } catch (ignore) { }
        }
    }

    let query = `
        SELECT p.*, 
               u.email as author_email, 
               COALESCE(p.author_name, pr.full_name, 'Anonymous') as author_name, 
               COALESCE(p.author_avatar, pr.avatar_url) as author_avatar,
               c.name as channel_name,
               c.slug as channel_slug,
               (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes_count,
               (SELECT COUNT(*) FROM chat_messages WHERE reply_to_post_id = p.id) as replies_count
    `;

    if (userId) {
        query += `, (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id AND user_id = ?) > 0 as liked`;
    } else {
        query += `, 0 as liked`;
    }

    query += `
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        LEFT JOIN profiles pr ON u.id = pr.user_id
        LEFT JOIN channels c ON p.channel_id = c.id
        WHERE 1=1
    `;

    try {
        let targetChannelId = channel_id;

        // Resolve slug to ID if necessary
        if (channel_id) {
            const [channels] = await pool.execute('SELECT id FROM channels WHERE slug = ? OR id = ?', [channel_id, channel_id]);
            if (channels.length > 0) {
                targetChannelId = channels[0].id;
            } else {
                return res.json([]); // Chanel not found, return empty
            }
        }

        const params = [];
        if (userId) {
            params.push(userId);
        }

        if (targetChannelId) {
            query += ' AND p.channel_id = ?';
            params.push(targetChannelId);
        }

        if (search) {
            query += ' AND (p.content LIKE ?)';
            params.push(`%${search}%`);
        }

        query += ' ORDER BY p.created_at DESC LIMIT ?';
        params.push(parseInt(limit));

        const [posts] = await pool.query(query, params);

        // Fetch hashtags for these posts
        if (posts.length > 0) {
            const postIds = posts.map(p => p.id);
            const placeholders = postIds.map(() => '?').join(',');
            const [tags] = await pool.query(`
                SELECT ph.post_id, h.name 
                FROM post_hashtags ph 
                JOIN hashtags h ON ph.hashtag_id = h.id 
                WHERE ph.post_id IN (${placeholders})
            `, postIds);

            // Group tags by post_id
            const tagsByPost = {};
            tags.forEach(t => {
                if (!tagsByPost[t.post_id]) tagsByPost[t.post_id] = [];
                tagsByPost[t.post_id].push(t.name);
            });

            // Attach to posts
            const mappedPosts = posts.map(post => ({
                ...post,
                liked: !!post.liked,
                hashtags: tagsByPost[post.id] || [] // Array of strings
            }));
            res.json(mappedPosts);
        } else {
            res.json([]);
        }
    } catch (err) {
        console.error("Get Posts Error:", err);
        res.status(500).json({ error: 'Server error fetching posts' });
    }
});

// 4. CREATE POST (Protected)
app.post('/api/community/posts', verifyToken, async (req, res) => {
    const { title, content, channel_id, image_url, is_system_post, author_name, author_avatar } = req.body;
    if (!content || !channel_id) return res.status(400).json({ error: 'Content and channel are required' });

    try {
        const id = uuidv4();

        let finalContent = content;
        if (title && !content.startsWith(title)) {
            finalContent = `**${title}**\n\n${content}`;
        }

        // Fetch author details if not provided (for denormalization)
        let finalAuthorName = author_name;
        let finalAuthorAvatar = author_avatar;

        if (!finalAuthorName) {
            const [profiles] = await pool.execute('SELECT full_name, avatar_url FROM profiles WHERE user_id = ?', [req.userId]);
            if (profiles.length > 0) {
                finalAuthorName = profiles[0].full_name;
                finalAuthorAvatar = profiles[0].avatar_url || finalAuthorAvatar;
            }
        }

        await pool.execute(
            'INSERT INTO posts (id, author_id, channel_id, content, image_url, created_at, updated_at, is_system_post, author_name, author_avatar) VALUES (?, ?, ?, ?, ?, NOW(), NOW(), ?, ?, ?)',
            [id, req.userId, channel_id, finalContent, image_url || null, is_system_post ? 1 : 0, finalAuthorName || null, finalAuthorAvatar || null]
        );

        // Fetch full post to return
        const [newPost] = await pool.execute(`
            SELECT p.*, 
                   u.email as author_email, 
                   COALESCE(p.author_name, pr.full_name, 'Anonymous') as author_name, 
                   COALESCE(p.author_avatar, pr.avatar_url) as author_avatar,
                   c.name as channel_name,
                   c.slug as channel_slug,
                   0 as likes_count,
                   0 as replies_count
            FROM posts p
            LEFT JOIN users u ON p.author_id = u.id
            LEFT JOIN profiles pr ON u.id = pr.user_id
            LEFT JOIN channels c ON p.channel_id = c.id
            WHERE p.id = ?
        `, [id]);

        // --- HASHTAG PROCESSING ---
        try {
            const tags = (finalContent.match(/#[\w-]+/g) || []).map(t => t.slice(1).toLowerCase());
            const uniqueTags = [...new Set(tags)];

            for (const tag of uniqueTags) {
                // 1. Ensure Tag Exists (Case Insensitive Check)
                const [existingTag] = await pool.execute('SELECT id FROM hashtags WHERE LOWER(name) = ?', [tag.toLowerCase()]);
                let tagId;

                if (existingTag.length === 0) {
                    tagId = uuidv4();
                    // Store strict casing or lower? Usually store display casing (first time) or lower.
                    // Let's store as provided (first user sets casing).
                    console.log("Creating new hashtag:", tag, "using last_used_at");
                    await pool.execute('INSERT INTO hashtags (id, name, last_used_at) VALUES (?, ?, NOW())', [tagId, tag]);
                } else {
                    tagId = existingTag[0].id;
                }

                // 2. Link to Post (Check for duplicate link just in case, though Set handles it for single post)
                // IGNORE to prevent crashing if re-running or some edge case
                await pool.execute('INSERT IGNORE INTO post_hashtags (post_id, hashtag_id) VALUES (?, ?)', [id, tagId]);
            }
        } catch (tagErr) {
            console.error("Error processing hashtags:", tagErr);
            // Don't fail the request, just log it
        }

        res.json(newPost[0]);
    } catch (err) {
        console.error("Create Post Error:", err);
        res.status(500).json({ error: 'Server error creating post' });
    }
});

// 5. TOGGLE LIKE (Protected)
app.post('/api/community/posts/:id/like', verifyToken, async (req, res) => {
    const postId = req.params.id;
    try {
        // Check if already liked
        const [existing] = await pool.execute('SELECT * FROM post_likes WHERE post_id = ? AND user_id = ?', [postId, req.userId]);

        let liked = false;
        if (existing.length > 0) {
            // Unlike
            await pool.execute('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [postId, req.userId]);
            liked = false;
        } else {
            // Like
            await pool.execute('INSERT INTO post_likes (post_id, user_id, created_at) VALUES (?, ?, NOW())', [postId, req.userId]);
            liked = true;
        }

        // Return updated distinct count
        // Actually, returning just the boolean is fine, frontend can increment/decrement.
        res.json({ liked });
    } catch (err) {
        console.error("Toggle Like Error:", err);
        res.status(500).json({ error: 'Server error toggling like' });
    }
});

// 5b. DELETE POST (Protected)
app.delete('/api/community/posts/:id', verifyToken, async (req, res) => {
    const postId = req.params.id;
    try {
        // Ensure author matches
        const [posts] = await pool.execute('SELECT author_id FROM posts WHERE id = ?', [postId]);
        if (posts.length === 0) return res.status(404).json({ error: 'Post not found' });

        if (posts[0].author_id !== req.userId) {
            return res.status(403).json({ error: 'Unauthorized to delete this post' });
        }

        await pool.execute('DELETE FROM posts WHERE id = ?', [postId]);
        res.json({ message: 'Post deleted' });
    } catch (err) {
        console.error("Delete Post Error:", err);
        res.status(500).json({ error: 'Server error deleting post' });
    }
});

// 5c. EDIT POST (Protected)
app.put('/api/community/posts/:id', verifyToken, async (req, res) => {
    const postId = req.params.id;
    const { content } = req.body;

    if (!content) return res.status(400).json({ error: 'Content required' });

    try {
        // Ensure author matches
        const [posts] = await pool.execute('SELECT author_id FROM posts WHERE id = ?', [postId]);
        if (posts.length === 0) return res.status(404).json({ error: 'Post not found' });

        if (posts[0].author_id !== req.userId) {
            return res.status(403).json({ error: 'Unauthorized to edit this post' });
        }

        await pool.execute('UPDATE posts SET content = ?, updated_at = NOW() WHERE id = ?', [content, postId]);

        // --- RE-PROCESS HASHTAGS ---
        try {
            // 1. Clear existing links
            await pool.execute('DELETE FROM post_hashtags WHERE post_id = ?', [postId]);

            // 2. Parse new tags
            const tags = (content.match(/#[\w-]+/g) || []).map(t => t.slice(1).toLowerCase());
            const uniqueTags = [...new Set(tags)];

            for (const tag of uniqueTags) {
                // Ensure Tag Exists
                const [existingTag] = await pool.execute('SELECT id FROM hashtags WHERE LOWER(name) = ?', [tag.toLowerCase()]);
                let tagId;

                if (existingTag.length === 0) {
                    tagId = uuidv4();
                    console.log("Creating new hashtag (Edit):", tag);
                    await pool.execute('INSERT INTO hashtags (id, name, last_used_at) VALUES (?, ?, NOW())', [tagId, tag]);
                } else {
                    tagId = existingTag[0].id;
                    // Optional: Update last_used_at?
                    await pool.execute('UPDATE hashtags SET last_used_at = NOW() WHERE id = ?', [tagId]);
                }

                // Link to Post
                await pool.execute('INSERT IGNORE INTO post_hashtags (post_id, hashtag_id) VALUES (?, ?)', [postId, tagId]);
            }
        } catch (tagErr) {
            console.error("Error re-processing hashtags:", tagErr);
        }

        // Return updated post
        const [updatedPost] = await pool.execute('SELECT * FROM posts WHERE id = ?', [postId]);
        res.json(updatedPost[0]);
    } catch (err) {
        console.error("Edit Post Error:", err);
        res.status(500).json({ error: 'Server error editing post' });
    }
});

// 6. GET CHAT MESSAGES
app.get('/api/community/chat', async (req, res) => {
    const { channel_id, reply_to_post_id, limit = 100 } = req.query;

    // Base query
    let query = `
        SELECT m.*, 
               u.email as author_email, 
               pr.full_name as author_name, 
               pr.avatar_url as author_avatar 
        FROM chat_messages m
        JOIN users u ON m.user_id = u.id
        LEFT JOIN profiles pr ON u.id = pr.user_id
        WHERE 1=1
    `;
    try {
        let targetChannelId = channel_id;

        // Resolve slug to ID if necessary
        if (channel_id && !reply_to_post_id) {
            const [channels] = await pool.execute('SELECT id FROM channels WHERE slug = ? OR id = ?', [channel_id, channel_id]);
            if (channels.length > 0) {
                targetChannelId = channels[0].id;
            } else {
                return res.json([]); // Channel not found, return empty messages
            }
        }

        const params = [];
        if (reply_to_post_id) {
            query += ' AND m.reply_to_post_id = ?';
            params.push(reply_to_post_id);
        } else if (targetChannelId) {
            query += ' AND m.channel_id = ? AND m.reply_to_post_id IS NULL';
            params.push(targetChannelId);
        }

        query += ' ORDER BY m.created_at ASC LIMIT ?';
        params.push(parseInt(limit));

        const [messages] = await pool.query(query, params);
        res.json(messages);
    } catch (err) {
        console.error("Get Chat Error:", err);
        res.status(500).json({ error: 'Server error fetching messages' });
    }
});

// 7. SEND CHAT MESSAGE (Protected)
app.post('/api/community/chat', verifyToken, async (req, res) => {
    const { content, channel_id, reply_to_post_id } = req.body;
    if (!content) return res.status(400).json({ error: 'Message content is required' });

    try {
        const id = uuidv4();
        await pool.execute(
            'INSERT INTO chat_messages (id, user_id, channel_id, reply_to_post_id, message, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
            [id, req.userId, channel_id || null, reply_to_post_id || null, content]
        );

        // Return full message
        const [newMessage] = await pool.execute(`
             SELECT m.*, 
               u.email as author_email, 
               pr.full_name as author_name, 
               pr.avatar_url as author_avatar 
        FROM chat_messages m
        JOIN users u ON m.user_id = u.id
        LEFT JOIN profiles pr ON u.id = pr.user_id
        WHERE m.id = ?
        `, [id]);

        res.json(newMessage[0]);
    } catch (err) {
        console.error("Send Chat Error:", err);
        res.status(500).json({ error: 'Server error sending message' });
    }
});

// 8. SUBMIT REPORT (Protected) - MOVED TO 10d
// This endpoint was duplicated. Removed to allow the implementation with email notifications to work.


// 9. GET COMMENTS FOR POST
app.get('/api/community/posts/:postId/comments', async (req, res) => {
    const { postId } = req.params;

    try {
        // Create comments table if it doesn't exist
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS comments (
                id VARCHAR(36) PRIMARY KEY,
                post_id VARCHAR(36) NOT NULL,
                user_id VARCHAR(36) NOT NULL,
                user_name VARCHAR(255),
                user_avatar TEXT,
                content TEXT NOT NULL,
                created_at DATETIME DEFAULT NOW(),
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        const [comments] = await pool.execute(`
            SELECT c.*
            FROM comments c
            WHERE c.post_id = ?
            ORDER BY c.created_at ASC
        `, [postId]);

        res.json(comments);
    } catch (err) {
        console.error("Get Comments Error:", err);
        res.status(500).json({ error: 'Server error fetching comments' });
    }
});

// 10. POST COMMENT (Protected)
app.post('/api/community/posts/:postId/comments', verifyToken, async (req, res) => {
    const { postId } = req.params;
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Comment content is required' });

    try {
        const id = uuidv4();

        // Get user info for denormalization
        const [profiles] = await pool.execute(
            'SELECT full_name, avatar_url FROM profiles WHERE user_id = ?',
            [req.userId]
        );
        const userName = profiles[0]?.full_name || 'Anonymous';
        const userAvatar = profiles[0]?.avatar_url || null;

        await pool.execute(
            'INSERT INTO comments (id, post_id, user_id, user_name, user_avatar, content, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
            [id, postId, req.userId, userName, userAvatar, content]
        );

        // Update comments count on the post
        await pool.execute(
            'UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?',
            [postId]
        );

        // Return the new comment
        const [newComment] = await pool.execute(
            'SELECT * FROM comments WHERE id = ?',
            [id]
        );

        res.json(newComment[0]);
    } catch (err) {
        console.error("Post Comment Error:", err);
        res.status(500).json({ error: 'Server error posting comment' });
    }
});

// 10b. EDIT COMMENT (Protected)
app.put('/api/community/comments/:commentId', verifyToken, async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Comment content is required' });

    try {
        // Check if user is the comment author
        const [comments] = await pool.execute('SELECT user_id FROM comments WHERE id = ?', [commentId]);
        if (comments.length === 0) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (comments[0].user_id !== req.userId) {
            return res.status(403).json({ error: 'Unauthorized to edit this comment' });
        }

        await pool.execute(
            'UPDATE comments SET content = ? WHERE id = ?',
            [content, commentId]
        );

        // Return updated comment
        const [updatedComment] = await pool.execute(
            'SELECT * FROM comments WHERE id = ?',
            [commentId]
        );

        res.json(updatedComment[0]);
    } catch (err) {
        console.error("Edit Comment Error:", err);
        res.status(500).json({ error: 'Server error editing comment' });
    }
});

// 10c. DELETE COMMENT (Protected)
app.delete('/api/community/comments/:commentId', verifyToken, async (req, res) => {
    const { commentId } = req.params;

    try {
        // Check if user is the comment author
        const [comments] = await pool.execute('SELECT user_id, post_id FROM comments WHERE id = ?', [commentId]);
        if (comments.length === 0) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (comments[0].user_id !== req.userId) {
            return res.status(403).json({ error: 'Unauthorized to delete this comment' });
        }

        const postId = comments[0].post_id;

        await pool.execute('DELETE FROM comments WHERE id = ?', [commentId]);

        // Decrement comments count on the post
        await pool.execute(
            'UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = ?',
            [postId]
        );

        res.json({ success: true, message: 'Comment deleted successfully' });
    } catch (err) {
        console.error("Delete Comment Error:", err);
        res.status(500).json({ error: 'Server error deleting comment' });
    }
});

// 10d. SUBMIT REPORT (Protected)
app.post('/api/community/reports', verifyToken, async (req, res) => {
    const { post_id, reason, custom_reason } = req.body;

    if (!post_id || !reason) {
        return res.status(400).json({ error: 'Post ID and reason are required' });
    }

    try {
        // Create reports table if it doesn't exist
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS reports (
                id VARCHAR(36) PRIMARY KEY,
                post_id VARCHAR(36) NOT NULL,
                reporter_id VARCHAR(36) NOT NULL,
                reason VARCHAR(255) NOT NULL,
                custom_reason TEXT,
                status VARCHAR(50) DEFAULT 'pending',
                created_at DATETIME DEFAULT NOW(),
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        const reportId = uuidv4();

        // Insert report into database
        await pool.execute(
            'INSERT INTO reports (id, post_id, reporter_id, reason, custom_reason, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
            [reportId, post_id, req.userId, reason, custom_reason || null]
        );

        // Get post details and reporter info for email
        const [posts] = await pool.execute(`
            SELECT p.*, 
                   u.email as author_email,
                   pr.full_name as author_name,
                   (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes_count
            FROM posts p
            JOIN users u ON p.author_id = u.id
            LEFT JOIN profiles pr ON u.id = pr.user_id
            WHERE p.id = ?
        `, [post_id]);

        const [reporters] = await pool.execute(`
            SELECT u.email, pr.full_name
            FROM users u
            LEFT JOIN profiles pr ON u.id = pr.user_id
            WHERE u.id = ?
        `, [req.userId]);

        if (posts.length > 0 && reporters.length > 0) {
            const post = posts[0];
            const reporter = reporters[0];

            console.log('📝 Report Email - Post Details:', JSON.stringify(post, null, 2));

            // Prepare email content
            const emailSubject = `🚨 New Content Report - ${reason}`;
            const emailBody = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
                    <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #ef4444; margin-top: 0;">⚠️ Content Report Received</h2>
                        
                        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
                            <h3 style="margin-top: 0; color: #991b1b;">Report Details</h3>
                            <p><strong>Report ID:</strong> ${reportId}</p>
                            <p><strong>Reason:</strong> ${reason}</p>
                            ${custom_reason ? `<p><strong>Additional Details:</strong> ${custom_reason}</p>` : ''}
                            <p><strong>Reported By:</strong> ${reporter.full_name || 'Anonymous'} (${reporter.email})</p>
                        </div>

                        <div style="background-color: #f9fafb; border-radius: 6px; padding: 15px; margin: 20px 0;">
                            <h3 style="margin-top: 0; color: #374151;">Reported Post</h3>
                            <p><strong>Post ID:</strong> ${post_id}</p>
                            <p><strong>Author:</strong> ${post.author_name || 'Unknown'} (${post.author_email})</p>
                            <p><strong>Content:</strong></p>
                            <div style="background-color: #ffffff; padding: 10px; border-radius: 4px; margin-top: 10px;">
                                ${post.content.substring(0, 200)}${post.content.length > 200 ? '...' : ''}
                            </div>
                            ${post.image_url ? `<p><strong>Has Image:</strong> Yes</p>` : ''}
                            <p><strong>Posted:</strong> ${new Date(post.created_at).toLocaleString()}</p>
                            <p><strong>Likes:</strong> ${post.likes_count ?? 0} | <strong>Comments:</strong> ${post.comments_count ?? 0}</p>
                        </div>

                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                            <p style="color: #6b7280; font-size: 14px; margin: 0;">
                                This is an automated notification from HSM Developer Hub Community Moderation System.
                            </p>
                            <p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;">
                                Please review this report and take appropriate action.
                            </p>
                        </div>
                    </div>
                </div>
            `;

            // Send email to admin
            try {
                console.log('📧 Attempting to send report email...');
                console.log('From:', process.env.SMTP_USER);
                console.log('To:', process.env.SMTP_USER);
                console.log('Subject:', emailSubject);

                const info = await transporter.sendMail({
                    from: `"HSM Developer Hub" <${process.env.SMTP_USER}>`,
                    to: process.env.SMTP_USER, // Admin email
                    subject: emailSubject,
                    html: emailBody
                });

                console.log(`✅ Report email sent successfully!`);
                console.log('Message ID:', info.messageId);
                console.log('Response:', info.response);
            } catch (emailError) {
                console.error('❌ Failed to send report email:');
                console.error('Error name:', emailError.name);
                console.error('Error message:', emailError.message);
                console.error('Error stack:', emailError.stack);
                // Don't fail the request if email fails
            }
        }

        res.json({
            success: true,
            message: 'Report submitted successfully. Our team will review it shortly.',
            reportId
        });
    } catch (err) {
        console.error("Submit Report Error:", err);
        res.status(500).json({ error: 'Server error submitting report' });
    }
});

// 11. UPDATE CHANNEL (Protected)
app.put('/api/community/channels/:channelId', verifyToken, async (req, res) => {
    const { channelId } = req.params;
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Channel name is required' });

    try {
        // Check if user is the channel creator or an admin
        const [channels] = await pool.execute('SELECT created_by FROM channels WHERE id = ?', [channelId]);
        if (channels.length === 0) {
            return res.status(404).json({ error: 'Channel not found' });
        }

        const channel = channels[0];
        if (channel.created_by !== req.userId) {
            // Check if user is admin
            const [roles] = await pool.execute(
                'SELECT role FROM user_roles WHERE user_id = ?',
                [req.userId]
            );
            const isAdmin = roles.some(r => r.role === 'admin');
            if (!isAdmin) {
                return res.status(403).json({ error: 'Unauthorized to edit this channel' });
            }
        }

        await pool.execute(
            'UPDATE channels SET name = ?, description = ?, updated_at = NOW() WHERE id = ?',
            [name, description || null, channelId]
        );

        const [updatedChannel] = await pool.execute('SELECT * FROM channels WHERE id = ?', [channelId]);
        res.json(updatedChannel[0]);
    } catch (err) {
        console.error("Update Channel Error:", err);
        res.status(500).json({ error: 'Server error updating channel' });
    }
});

// 12. DELETE CHANNEL (Protected)
app.delete('/api/community/channels/:channelId', verifyToken, async (req, res) => {
    const { channelId } = req.params;

    try {
        // Check if user is the channel creator or an admin
        const [channels] = await pool.execute('SELECT created_by FROM channels WHERE id = ?', [channelId]);
        if (channels.length === 0) {
            return res.status(404).json({ error: 'Channel not found' });
        }

        const channel = channels[0];
        if (channel.created_by !== req.userId) {
            // Check if user is admin
            const [roles] = await pool.execute(
                'SELECT role FROM user_roles WHERE user_id = ?',
                [req.userId]
            );
            const isAdmin = roles.some(r => r.role === 'admin');
            if (!isAdmin) {
                return res.status(403).json({ error: 'Unauthorized to delete this channel' });
            }
        }

        await pool.execute('DELETE FROM channels WHERE id = ?', [channelId]);
        res.json({ success: true, message: 'Channel deleted successfully' });
    } catch (err) {
        console.error("Delete Channel Error:", err);
        res.status(500).json({ error: 'Server error deleting channel' });
    }
});

// --- PROFILE ROUTES ---

// 9. UPLOAD IMAGE (Protected)
// 9. UPLOAD IMAGE (Protected) - Base64 Version with Compression
app.post('/api/upload', verifyToken, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        // Compress and resize image
        const compressedBuffer = await sharp(req.file.buffer)
            .resize({ width: 800, withoutEnlargement: true }) // reasonable max width for feed
            .jpeg({ quality: 80 }) // 80% quality JPEG
            .toBuffer();

        // Convert buffer to Base64 Data URI
        const b64 = compressedBuffer.toString('base64');
        const dataURI = `data:image/jpeg;base64,${b64}`;

        // Return the Data URI as the 'url'
        res.json({ url: dataURI });
    } catch (err) {
        console.error("Image Processing Error:", err);
        return res.status(500).json({ error: 'Error processing image' });
    }
});

// 10. UPDATE PROFILE (Protected)
app.put('/api/profile', verifyToken, async (req, res) => {
    const { full_name, github_link, linkedin_link, avatar_url, cover_url, location, bio, website_link } = req.body;

    try {
        await pool.execute(
            'UPDATE profiles SET full_name = ?, github_link = ?, linkedin_link = ?, avatar_url = ?, cover_url = ?, location = ?, bio = ?, website_link = ?, updated_at = NOW() WHERE user_id = ?',
            [full_name, github_link, linkedin_link, avatar_url, cover_url, location || null, bio || null, website_link || null, req.userId]
        );

        // Return updated user data (similar to /me)
        const [rows] = await pool.execute('SELECT id, email, created_at FROM users WHERE id = ?', [req.userId]);
        const user = rows[0];
        const [profiles] = await pool.execute('SELECT * FROM profiles WHERE user_id = ?', [req.userId]);
        const profile = profiles[0] || {};

        res.json({
            user: {
                id: user.id,
                email: user.email,
                full_name: profile.full_name,
                avatar_url: profile.avatar_url,
                cover_url: profile.cover_url,
                github_link: profile.github_link,
                linkedin_link: profile.linkedin_link,
                location: profile.location,
                bio: profile.bio,
                website_link: profile.website_link,
                created_at: user.created_at
            }
        });
    } catch (err) {
        console.error("Update Profile Error:", err);
        res.status(500).json({ error: 'Server error updating profile' });
    }
});

// 11. GET PROFILE ACTIVITY
app.get('/api/profile/activity', verifyToken, async (req, res) => {
    try {
        // Query: Posts I authored OR Posts I liked
        // We use UNION to combine them.
        const query = `
            SELECT * FROM (
                SELECT p.*, 
                    'posted' as activity_type,
                    p.created_at as activity_date
                FROM posts p
                WHERE p.author_id = ?

                UNION

                SELECT p.*,
                    'liked' as activity_type,
                    pl.created_at as activity_date
                FROM posts p
                JOIN post_likes pl ON p.id = pl.post_id
                WHERE pl.user_id = ?
            ) as activity
            ORDER BY activity_date DESC
            LIMIT 5
        `;

        const [rows] = await pool.query(query, [req.userId, req.userId]);

        // We need to fetch author details and like counts for these posts
        // It's easier to fetch the IDs first, then fetch details, or do a big join
        // Let's iterate and enrich, or do a better join upfront.
        // A better join is complex with the UNION. Let's do a second simple pass for details if rows exist.

        if (rows.length === 0) return res.json([]);

        const enrichedPosts = await Promise.all(rows.map(async (post) => {
            const [authors] = await pool.query(`
                SELECT u.email, COALESCE(p.author_name, pr.full_name, 'Anonymous') as name, COALESCE(p.author_avatar, pr.avatar_url) as avatar
                FROM posts p
                LEFT JOIN users u ON p.author_id = u.id
                LEFT JOIN profiles pr ON u.id = pr.user_id
                WHERE p.id = ?
            `, [post.id]);

            const [stats] = await pool.query(`
                SELECT 
                    (SELECT COUNT(*) FROM post_likes WHERE post_id = ?) as likes_count,
                    (SELECT COUNT(*) FROM chat_messages WHERE reply_to_post_id = ?) as replies_count
            `, [post.id, post.id]);

            return {
                ...post,
                author_name: authors[0]?.name || 'Anonymous',
                author_avatar: authors[0]?.avatar,
                likes_count: stats[0].likes_count,
                replies_count: stats[0].replies_count
            };
        }));

        res.json(enrichedPosts);

    } catch (err) {
        console.error("Get Activity Error:", err);
        res.status(500).json({ error: 'Server error fetching activity' });
    }
});


// 8. GET TRENDING HASHTAGS
app.get('/api/community/trending', async (req, res) => {
    const FALLBACK_TAGS = [
        'JavaScript', 'TypeScript', 'React', 'NodeJS', 'Python',
        'AI', 'MachineLearning', 'WebDev', 'DevOps', 'Docker',
        'Kubernetes', 'Rust', 'Go', 'Database', 'SQL',
        'NoSQL', 'Frontend', 'Backend', 'FullStack', 'Mobile',
        'iOS', 'Android', 'Cloud', 'AWS', 'Azure'
    ];

    try {
        // Simple count of usage in post_hashtags
        const query = `
            SELECT h.name, COUNT(ph.post_id) as count
            FROM hashtags h
            JOIN post_hashtags ph ON h.id = ph.hashtag_id
            GROUP BY h.id, h.name
            ORDER BY count DESC
            LIMIT 10
        `;
        const [trending] = await pool.query(query);

        // Fill with fallback if less than 10
        if (trending.length < 10) {
            const existingNames = new Set(trending.map(t => t.name.toLowerCase()));
            for (const tag of FALLBACK_TAGS) {
                if (trending.length >= 10) break;
                if (!existingNames.has(tag.toLowerCase())) {
                    trending.push({ name: tag, count: 0, id: 'fallback-' + tag });
                    existingNames.add(tag.toLowerCase());
                }
            }
        }

        res.json(trending);
    } catch (err) {
        console.error("Get Trending Error:", err);
        res.status(500).json({ error: 'Server error fetching trending tags' });
    }
});

// 9. SEARCH HASHTAGS (Autocomplete with Fallback)
app.get('/api/community/hashtags', async (req, res) => {
    const { search } = req.query;
    const FALLBACK_TAGS = [
        'JavaScript', 'TypeScript', 'React', 'NodeJS', 'Python',
        'AI', 'MachineLearning', 'WebDev', 'DevOps', 'Docker',
        'Kubernetes', 'Rust', 'Go', 'Database', 'SQL',
        'NoSQL', 'Frontend', 'Backend', 'FullStack', 'Mobile',
        'iOS', 'Android', 'Cloud', 'AWS', 'Azure'
    ];

    try {
        let query = `
            SELECT h.name, COUNT(ph.post_id) as count
            FROM hashtags h
            LEFT JOIN post_hashtags ph ON h.id = ph.hashtag_id
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            query += ' AND h.name LIKE ?';
            params.push(`${search}%`); // Starts with
        }

        query += `
            GROUP BY h.id, h.name
            ORDER BY count DESC
            LIMIT 5
        `;

        const [dbResults] = await pool.query(query, params);

        // Combine with Fallback
        const searchLower = search ? search.toLowerCase() : '';
        const fallbackMatches = FALLBACK_TAGS
            .filter(tag => tag.toLowerCase().startsWith(searchLower))
            .filter(tag => !dbResults.find(r => r.name.toLowerCase() === tag.toLowerCase()))
            .map(tag => ({ name: tag, count: 0 })); // Count 0 for fallback

        // Merge: DB results first, then fallback, limit to 10
        const combined = [...dbResults, ...fallbackMatches].slice(0, 10);

        res.json(combined);
    } catch (err) {
        console.error("Search Hashtags Error:", err);
        res.status(500).json({ error: 'Server error searching hashtags' });
    }
});

app.listen(PORT, async () => {
    console.log(`Server running on ${process.env.SERVER_URL || `port ${PORT}`}`);

    // Schema Migration for Base64 Support
    try {
        console.log('--- Checking Database Schema ---');
        // Ensure image_url columns are large enough for Base64 (MEDIUMTEXT ~16MB)
        await pool.query("ALTER TABLE posts MODIFY image_url LONGTEXT");
        await pool.query("ALTER TABLE profiles MODIFY avatar_url LONGTEXT");
        await pool.query("ALTER TABLE profiles MODIFY cover_url LONGTEXT");

        // Ensure Channels Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS channels (
                id VARCHAR(36) PRIMARY KEY,
                slug VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                created_by VARCHAR(36),
                created_at DATETIME DEFAULT NOW(),
                updated_at DATETIME DEFAULT NOW()
            )
        `);

        // Check/Add created_by to channels if missing
        try {
            await pool.query("ALTER TABLE channels ADD COLUMN created_by VARCHAR(36)");
            console.log('Added created_by column to channels.');
        } catch (e) {
            // Ignore if column exists
        }

        // Check/Add updated_at to channels if missing
        try {
            await pool.query("ALTER TABLE channels ADD COLUMN updated_at DATETIME DEFAULT NOW()");
            console.log('Added updated_at column to channels.');
        } catch (e) {
            // Ignore if column exists
        }

        // Check/Add comments_count to posts if missing
        try {
            await pool.query("ALTER TABLE posts ADD COLUMN comments_count INT DEFAULT 0");
            console.log('Added comments_count column to posts.');
        } catch (e) {
            // Ignore if column exists
        }

        // Ensure Profiles Table has new columns
        const profileCols = [
            { name: 'github_link', type: 'VARCHAR(255)' },
            { name: 'linkedin_link', type: 'VARCHAR(255)' },
            { name: 'cover_url', type: 'LONGTEXT' }
        ];

        for (const col of profileCols) {
            try {
                await pool.query(`ALTER TABLE profiles ADD COLUMN ${col.name} ${col.type}`);
                console.log(`Added ${col.name} column to profiles.`);
            } catch (e) {
                // Ignore if column exists
            }
        }

        // Seed Default Channels with Proper UUIDs
        const defaultChannels = [
            { slug: 'general', name: 'General', description: 'General discussion' },
            { slug: 'ai-news', name: 'AI News & Tech', description: 'Latest AI news' },
            { slug: 'tech-memes', name: 'Tech Memes', description: 'Memes and fun' }
        ];

        for (const ch of defaultChannels) {
            try {
                // Check if channel already exists by slug
                const [existing] = await pool.query('SELECT id FROM channels WHERE slug = ?', [ch.slug]);

                if (existing.length === 0) {
                    // Create new channel with UUID
                    const channelId = uuidv4();
                    await pool.query(`
                        INSERT INTO channels (id, slug, name, description, created_at, updated_at)
                        VALUES (?, ?, ?, ?, NOW(), NOW())
                    `, [channelId, ch.slug, ch.name, ch.description]);
                    console.log(`✅ Created channel: ${ch.name} (${channelId})`);
                } else {
                    // Update existing channel name/description if needed
                    await pool.query(`
                        UPDATE channels 
                        SET name = ?, description = ?, updated_at = NOW()
                        WHERE slug = ?
                    `, [ch.name, ch.description, ch.slug]);
                }
            } catch (e) {
                console.error(`Error seeding channel ${ch.slug}:`, e.message);
            }
        }
        console.log('✅ Default channels verified.');
        console.log('Database schema updated for large image storage.');
    } catch (e) {
        // Ignore if headers already sent or other non-critical start errors, but log it
        console.log('Schema update note (safe to ignore if columns exist):', e.message);
    }
});
