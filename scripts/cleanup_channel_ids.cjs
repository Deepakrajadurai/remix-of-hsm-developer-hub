const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function cleanupChannelIds() {
    const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DB,
        port: parseInt(process.env.MYSQL_PORT)
    });

    try {
        console.log('Starting Channel ID Cleanup...');

        // 1. Update NULL channel IDs in channels table to proper IDs
        await connection.execute(`
            UPDATE channels 
            SET id = CASE 
                WHEN slug = 'general' THEN 'general'
                WHEN slug = 'ai-news' THEN 'ai-news'
                WHEN slug = 'tech-memes' OR slug = 'memes' THEN 'tech-memes'
                ELSE id
            END
            WHERE id IS NULL OR id = ''
        `);
        console.log('✅ Updated channel IDs');

        // 2. Update chat_messages to reference proper channel IDs
        await connection.execute(`
            UPDATE chat_messages cm
            JOIN channels c ON (
                (cm.channel_id IS NULL AND c.slug = 'general') OR
                (cm.channel_id = c.slug)
            )
            SET cm.channel_id = c.id
            WHERE cm.channel_id IS NULL OR cm.channel_id NOT IN (SELECT id FROM channels)
        `);
        console.log('✅ Updated chat_messages channel references');

        // 3. Update posts to reference proper channel IDs
        await connection.execute(`
            UPDATE posts p
            JOIN channels c ON (
                (p.channel_id IS NULL AND c.slug = 'general') OR
                (p.channel_id = c.slug)
            )
            SET p.channel_id = c.id
            WHERE p.channel_id IS NULL OR p.channel_id NOT IN (SELECT id FROM channels)
        `);
        console.log('✅ Updated posts channel references');

        // 4. Delete orphaned channels with NULL IDs
        await connection.execute(`DELETE FROM channels WHERE id IS NULL OR id = ''`);
        console.log('✅ Removed orphaned channel entries');

        console.log('✅ Cleanup completed successfully!');

    } catch (err) {
        console.error('Cleanup failed:', err);
    } finally {
        await connection.end();
    }
}

cleanupChannelIds();
