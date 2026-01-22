const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function migrateBlogSchema() {
    const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DB,
        port: parseInt(process.env.MYSQL_PORT)
    });

    try {
        console.log('Starting Blog Schema Migration...');

        // Blog Posts Table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS blog_posts (
                id VARCHAR(36) PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                excerpt TEXT,
                content MEDIUMTEXT NOT NULL,
                published BOOLEAN DEFAULT TRUE,
                author_id VARCHAR(36),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);
        console.log('✅ Created table: blog_posts');

        console.log('Migration completed successfully!');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await connection.end();
    }
}

migrateBlogSchema();
