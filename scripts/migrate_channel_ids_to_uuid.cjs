const mysql = require('mysql2/promise');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function migrateToUuidChannelIds() {
    const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DB,
        port: parseInt(process.env.MYSQL_PORT)
    });

    try {
        console.log('Starting Channel ID Migration to UUIDs...');

        // Temporarily disable foreign key checks
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

        // Get all channels with non-UUID IDs (slug-based IDs)
        const [channels] = await connection.execute(`
            SELECT id, slug, name, description, created_by, created_at 
            FROM channels 
            WHERE LENGTH(id) < 36 OR id = slug
        `);

        console.log(`Found ${channels.length} channels to migrate`);

        for (const channel of channels) {
            const oldId = channel.id;
            const newId = uuidv4();

            console.log(`Migrating channel "${channel.name}": ${oldId} -> ${newId}`);

            // 1. Update posts to reference new channel ID
            const [postsResult] = await connection.execute(`
                UPDATE posts 
                SET channel_id = ? 
                WHERE channel_id = ?
            `, [newId, oldId]);
            console.log(`  Updated ${postsResult.affectedRows} posts`);

            // 2. Update chat_messages to reference new channel ID
            const [chatResult] = await connection.execute(`
                UPDATE chat_messages 
                SET channel_id = ? 
                WHERE channel_id = ?
            `, [newId, oldId]);
            console.log(`  Updated ${chatResult.affectedRows} chat messages`);

            // 3. Update the channel ID itself
            await connection.execute(`
                UPDATE channels 
                SET id = ? 
                WHERE id = ?
            `, [newId, oldId]);
            console.log(`  Updated channel ID`);
        }

        // Re-enable foreign key checks
        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

        console.log('✅ Migration completed successfully!');

    } catch (err) {
        console.error('❌ Migration failed:', err);
        // Re-enable foreign key checks even on error
        try {
            await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
        } catch (e) {
            // Ignore
        }
        throw err;
    } finally {
        await connection.end();
    }
}

migrateToUuidChannelIds();
