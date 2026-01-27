const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function migrate() {
    console.log("Starting profile schema expansion...");
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

    try {
        const connection = await pool.getConnection();

        const newCols = [
            'location VARCHAR(255)',
            'bio TEXT',
            'website_link VARCHAR(255)'
        ];

        for (const col of newCols) {
            try {
                await connection.query(`ALTER TABLE profiles ADD COLUMN ${col}`);
                console.log(`Added: ${col}`);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`Skipping ${col} (exists)`);
                } else {
                    console.error(`Error adding ${col}:`, err.message);
                }
            }
        }

        console.log("Schema update complete.");
        connection.release();
    } catch (err) {
        console.error("Migration fatal error:", err);
    } finally {
        await pool.end();
    }
}

migrate();
