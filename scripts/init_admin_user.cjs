const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function initAdminUser() {
    console.log('🚀 Starting Admin User Initialization...\n');

    // Validate required environment variables
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
        console.error('❌ ERROR: ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env file');
        process.exit(1);
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    console.log(`📧 Admin Email: ${adminEmail}`);
    console.log(`🔐 Admin Password: ${adminPassword.replace(/./g, '*')}\n`);

    // Create database connection
    const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DB,
        port: parseInt(process.env.MYSQL_PORT)
    });

    try {
        await connection.beginTransaction();

        // Check if admin user already exists
        const [existingUsers] = await connection.execute(
            'SELECT id, email FROM users WHERE email = ?',
            [adminEmail]
        );

        if (existingUsers.length > 0) {
            console.log('⚠️  Admin user already exists!');
            console.log(`   User ID: ${existingUsers[0].id}`);
            console.log(`   Email: ${existingUsers[0].email}\n`);

            // Check if user has admin role
            const [existingRoles] = await connection.execute(
                'SELECT role FROM user_roles WHERE user_id = ? AND role = ?',
                [existingUsers[0].id, 'admin']
            );

            if (existingRoles.length === 0) {
                console.log('🔧 Adding admin role to existing user...');
                await connection.execute(
                    'INSERT INTO user_roles (id, user_id, role, created_at) VALUES (?, ?, ?, NOW())',
                    [uuidv4(), existingUsers[0].id, 'admin']
                );
                console.log('✅ Admin role added successfully!\n');
            } else {
                console.log('✅ User already has admin role\n');
            }

            await connection.commit();
            console.log('✨ Admin initialization complete!');
            return;
        }

        console.log('👤 Creating new admin user...\n');

        // Generate password hash
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(adminPassword, salt);

        // Create user ID
        const userId = uuidv4();

        // 1. Insert into users table
        console.log('   📝 Creating user record...');
        await connection.execute(
            'INSERT INTO users (id, email, password_hash, is_verified, created_at, updated_at) VALUES (?, ?, ?, 1, NOW(), NOW())',
            [userId, adminEmail, passwordHash]
        );
        console.log('   ✅ User record created');

        // 2. Insert into profiles table
        console.log('   📝 Creating profile record...');
        await connection.execute(
            'INSERT INTO profiles (id, user_id, full_name, bio, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
            [uuidv4(), userId, 'System Administrator', 'Default administrator account']
        );
        console.log('   ✅ Profile record created');

        // 3. Insert admin role
        console.log('   📝 Assigning admin role...');
        await connection.execute(
            'INSERT INTO user_roles (id, user_id, role, created_at) VALUES (?, ?, ?, NOW())',
            [uuidv4(), userId, 'admin']
        );
        console.log('   ✅ Admin role assigned');

        // 4. Also add default 'user' role
        console.log('   📝 Assigning user role...');
        await connection.execute(
            'INSERT INTO user_roles (id, user_id, role, created_at) VALUES (?, ?, ?, NOW())',
            [uuidv4(), userId, 'user']
        );
        console.log('   ✅ User role assigned');

        await connection.commit();

        console.log('\n✨ Admin user created successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📧 Email: ${adminEmail}`);
        console.log(`🔐 Password: ${adminPassword}`);
        console.log(`🆔 User ID: ${userId}`);
        console.log(`👑 Roles: admin, user`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        await connection.rollback();
        console.error('❌ Error during admin initialization:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

// Run the script
initAdminUser()
    .then(() => {
        console.log('🎉 Script completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Script failed:', error.message);
        process.exit(1);
    });
