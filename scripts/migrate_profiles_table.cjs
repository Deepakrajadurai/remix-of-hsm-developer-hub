const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

async function migrate() {
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
        console.log("Connected to database.");

        const columns = [
            'github_link VARCHAR(255)',
            'linkedin_link VARCHAR(255)',
            'cover_url LONGTEXT'
        ];

        for (const colDef of columns) {
            try {
                const colName = colDef.split(' ')[0];
                await connection.query(`ALTER TABLE profiles ADD COLUMN ${colDef}`);
                console.log(`Added column: ${colName}`);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`Column already exists: ${colDef.split(' ')[0]}`);
                } else {
                    console.error(`Error adding column ${colDef.split(' ')[0]}:`, err.message);
                }
            }
        }

        console.log("Migration complete.");
        connection.release();
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await pool.end();
    }
}

migrate();
