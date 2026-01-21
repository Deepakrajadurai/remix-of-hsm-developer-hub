const mysql = require('mysql2/promise');
// require('dotenv').config({ path: '../.env' });

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

async function updateSchema() {
    const connection = await pool.getConnection();
    try {
        console.log("Checking schema for email verification columns...");

        // Check if columns exist
        const [columns] = await connection.execute("DESCRIBE users");
        const columnNames = columns.map(c => c.Field);

        if (!columnNames.includes('is_verified')) {
            console.log("Adding is_verified column...");
            await connection.execute("ALTER TABLE users ADD COLUMN is_verified TINYINT(1) DEFAULT 0");
        } else {
            console.log("is_verified column already exists.");
        }

        if (!columnNames.includes('verification_token')) {
            console.log("Adding verification_token column...");
            await connection.execute("ALTER TABLE users ADD COLUMN verification_token VARCHAR(255)");
        } else {
            console.log("verification_token column already exists.");
        }

        console.log("Schema update complete.");

    } catch (err) {
        console.error("Schema Update Failed:", err);
    } finally {
        connection.release();
        process.exit();
    }
}

updateSchema();
