// Migration script to add published_* columns to blogs table
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

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

        // Check and add columns one by one
        const columns = [
            { name: 'published_title', type: 'VARCHAR(500)' },
            { name: 'published_content', type: 'LONGTEXT' },
            { name: 'published_cover_image_url', type: 'LONGTEXT' }
        ];

        for (const col of columns) {
            try {
                // Check if column exists
                const [rows] = await connection.execute(`
                    SELECT COLUMN_NAME 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = ? 
                    AND TABLE_NAME = 'blogs' 
                    AND COLUMN_NAME = ?
                `, [process.env.MYSQL_DB, col.name]);

                if (rows.length === 0) {
                    // Column doesn't exist, add it
                    await connection.execute(`ALTER TABLE blogs ADD COLUMN ${col.name} ${col.type}`);
                    console.log(`✅ Added column: ${col.name}`);
                } else {
                    console.log(`ℹ️  Column already exists: ${col.name}`);
                }
            } catch (err) {
                console.error(`❌ Error adding column ${col.name}:`, err.message);
            }
        }

        // Sync existing published blogs
        try {
            const [result] = await connection.execute(`
                UPDATE blogs 
                SET 
                    published_title = title,
                    published_content = content,
                    published_cover_image_url = cover_image_url
                WHERE published = TRUE AND published_title IS NULL
            `);

            console.log(`✅ Synced ${result.affectedRows} existing published blogs`);
        } catch (syncError) {
            console.log('⚠️  Could not sync existing blogs (this is OK for new installations):', syncError.message);
        }

        console.log('🎉 Migration completed successfully!');


    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

runMigration();
