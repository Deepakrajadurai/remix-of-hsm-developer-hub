const mysql = require('mysql2/promise');
require('dotenv').config();

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

async function createPendingTable() {
    const connection = await pool.getConnection();
    try {
        console.log("Creating pending_registrations table...");

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS pending_registrations (
                id CHAR(36) PRIMARY KEY,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(255),
                verification_token VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log("Table pending_registrations created successfully.");

    } catch (err) {
        console.error("Schema Update Failed:", err);
    } finally {
        connection.release();
        process.exit();
    }
}

createPendingTable();
