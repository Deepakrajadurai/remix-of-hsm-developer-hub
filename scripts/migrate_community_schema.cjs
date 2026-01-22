const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function migrateCommunitySchema() {
    const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DB,
        port: parseInt(process.env.MYSQL_PORT)
    });

    try {
        console.log('Starting Community Schema Migration...');

        // Disable FK checks to allow dropping tables
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
        await connection.execute('DROP TABLE IF EXISTS channels');
        await connection.execute('DROP TABLE IF EXISTS posts');
        await connection.execute('DROP TABLE IF EXISTS post_likes');
        await connection.execute('DROP TABLE IF EXISTS chat_messages');
        await connection.execute('DROP TABLE IF EXISTS hashtags');
        await connection.execute('DROP TABLE IF EXISTS post_hashtags');
        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

        // 1. Channels Table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS channels (
                id VARCHAR(36) PRIMARY KEY,
                slug VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                type VARCHAR(50) DEFAULT 'text',
                description TEXT,
                created_by VARCHAR(36),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
            )
        `);
        console.log('✅ Created table: channels');

        // Insert Default Channels
        const defaultChannels = [
            { id: 'general', slug: 'general', name: 'General', type: 'text', description: 'General discussion' },
            { id: 'ai-news', slug: 'ai-news', name: 'AI News & Tech', type: 'news', description: 'Latest AI news' },
            { id: 'tech-memes', slug: 'tech-memes', name: 'Tech Memes', type: 'media', description: 'Memes and fun' }
        ];

        for (const ch of defaultChannels) {
            await connection.execute(`
                INSERT INTO channels (id, slug, name, type, description)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE name=?, type=?, description=?
            `, [ch.id, ch.slug, ch.name, ch.type, ch.description, ch.name, ch.type, ch.description]);
        }
        console.log('✅ Seeded default channels');

        // 2. Posts Table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS posts (
                id VARCHAR(36) PRIMARY KEY,
                author_id VARCHAR(36),
                author_name VARCHAR(255),
                author_avatar TEXT,
                content TEXT,
                image_url TEXT,
                channel_id VARCHAR(36),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                is_system_post BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Created table: posts');

        // 3. Post Likes Table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS post_likes (
                post_id VARCHAR(36),
                user_id VARCHAR(36),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (post_id, user_id),
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Created table: post_likes');

        // 4. Chat Messages Table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS chat_messages (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36),
                user_name VARCHAR(255),
                user_avatar TEXT,
                message TEXT,
                channel_id VARCHAR(36),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Created table: chat_messages');

        // 5. Hashtags Table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS hashtags (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                post_count INT DEFAULT 1,
                last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Created table: hashtags');

        // 6. Post Hashtags Junction Table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS post_hashtags (
                post_id VARCHAR(36),
                hashtag_id VARCHAR(36),
                PRIMARY KEY (post_id, hashtag_id),
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                FOREIGN KEY (hashtag_id) REFERENCES hashtags(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Created table: post_hashtags');

        console.log('Migration completed successfully!');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await connection.end();
    }
}

migrateCommunitySchema();
