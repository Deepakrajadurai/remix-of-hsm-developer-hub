// Migration script to add published_* columns to blogs table
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mysql = require('mysql2/promise');

async function runMigration() {
    const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DB,
        port: parseInt(process.env.MYSQL_PORT)
    });

    try {
        console.log('🔄 Running migration: Adding published_* columns...');

        // Add the columns
        await connection.execute(`
            ALTER TABLE blogs 
            ADD COLUMN IF NOT EXISTS published_title VARCHAR(500),
            ADD COLUMN IF NOT EXISTS published_content TEXT,
            ADD COLUMN IF NOT EXISTS published_cover_image_url TEXT
        `);

        console.log('✅ Columns added successfully');

        // Sync existing published blogs
        const [result] = await connection.execute(`
            UPDATE blogs 
            SET 
                published_title = title,
                published_content = content,
                published_cover_image_url = cover_image_url
            WHERE published = TRUE AND published_title IS NULL
        `);

        console.log(`✅ Synced ${result.affectedRows} existing published blogs`);
        console.log('🎉 Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

runMigration();
