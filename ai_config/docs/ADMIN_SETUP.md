# Admin User Setup Guide

## Overview

This project includes an automatic admin user initialization system that creates a default administrator account on first-time setup. The admin credentials are stored securely in the `.env` file and automatically processed when the server starts.

## Configuration

### Environment Variables

The following variables in your `.env` file control the admin account:

```env
# Admin Account (Hardcoded for Initial Setup)
ADMIN_EMAIL=fh.developercommunity@gmail.com
ADMIN_PASSWORD=Admin@2024!Secure
```

**Important Notes:**
- The password must meet security requirements (8+ characters, at least one number and one special character)
- These credentials are used ONLY for initial setup
- The admin account is created with both `admin` and `user` roles

## How It Works

### Automatic Initialization (Recommended)

When you start the server, it automatically:

1. ✅ Checks if the admin user exists
2. ✅ Creates the user if not found
3. ✅ Assigns admin and user roles
4. ✅ Sets up the user profile
5. ✅ Marks the account as verified

**To use automatic initialization:**

```bash
# Start the server normally
node server/index.cjs
```

The server will log the initialization status:

```
--- Initializing Admin User ---
👤 Creating admin user: fh.developercommunity@gmail.com
✅ Admin user created successfully!
   📧 Email: fh.developercommunity@gmail.com
   👑 Roles: admin, user
```

### Manual Initialization (Optional)

You can also run the standalone initialization script:

```bash
node scripts/init_admin_user.cjs
```

This is useful for:
- Setting up the admin before starting the server
- Re-running initialization if needed
- Troubleshooting admin account issues

## Security Considerations

### Production Deployment

⚠️ **IMPORTANT:** Before deploying to production:

1. **Change the default password** in `.env`:
   ```env
   ADMIN_PASSWORD=YourSecurePassword123!
   ```

2. **Restrict .env file access**:
   ```bash
   # Linux/Mac
   chmod 600 .env
   
   # Windows (PowerShell)
   icacls .env /inheritance:r /grant:r "$env:USERNAME:F"
   ```

3. **Add .env to .gitignore** (already done):
   ```gitignore
   .env
   .env.local
   .env.production
   ```

4. **Use environment-specific credentials** for different environments

### Password Requirements

The system enforces the following password rules:
- Minimum 8 characters
- At least one number (0-9)
- At least one special character (!@#$%^&*)
- Mix of letters and numbers

## Database Schema

The admin user initialization creates/updates the following tables:

### `users` Table
```sql
INSERT INTO users (id, email, password_hash, is_verified, created_at, updated_at)
VALUES (uuid, 'admin@example.com', 'hashed_password', 1, NOW(), NOW())
```

### `profiles` Table
```sql
INSERT INTO profiles (id, user_id, full_name, bio, created_at, updated_at)
VALUES (uuid, user_id, 'System Administrator', 'Default administrator account', NOW(), NOW())
```

### `user_roles` Table
```sql
INSERT INTO user_roles (id, user_id, role, created_at)
VALUES 
  (uuid, user_id, 'admin', NOW()),
  (uuid, user_id, 'user', NOW())
```

## Troubleshooting

### Admin User Already Exists

If the admin email already exists in the database:
- The system will check if it has the admin role
- If missing, it will add the admin role
- If already an admin, it will skip initialization

### Password Not Meeting Requirements

Error: `Password must be at least 8 characters long and include at least one number and one special character.`

**Solution:** Update `ADMIN_PASSWORD` in `.env` to meet the requirements:
```env
ADMIN_PASSWORD=SecurePass123!
```

### Database Connection Issues

If you see database errors during initialization:
1. Verify MySQL is running
2. Check database credentials in `.env`:
   ```env
   MYSQL_HOST=localhost
   MYSQL_USER=dev-community
   MYSQL_PASSWORD=hsmdev282930
   MYSQL_DB=dev_community
   MYSQL_PORT=3306
   ```

### Skipping Admin Initialization

If you see: `⚠️ ADMIN_EMAIL or ADMIN_PASSWORD not set in .env - skipping admin initialization`

**Solution:** Add the required variables to your `.env` file.

## Login as Admin

Once initialized, you can log in with:

- **Email:** `fh.developercommunity@gmail.com` (or your configured email)
- **Password:** `Admin@2024!Secure` (or your configured password)

The admin account has full access to:
- User management
- Content moderation
- System settings
- All regular user features

## Changing Admin Credentials

### Method 1: Update .env and Restart

1. Update credentials in `.env`
2. Delete the existing admin user from the database (optional)
3. Restart the server

### Method 2: Direct Database Update

```sql
-- Update email
UPDATE users SET email = 'new-admin@example.com' WHERE email = 'old-admin@example.com';

-- Update password (use bcrypt hash)
UPDATE users SET password_hash = 'new_bcrypt_hash' WHERE email = 'admin@example.com';
```

## Best Practices

1. ✅ **Change default credentials** immediately after first setup
2. ✅ **Use strong passwords** with mixed characters
3. ✅ **Keep .env secure** and never commit to version control
4. ✅ **Use different credentials** for development and production
5. ✅ **Enable 2FA** for admin accounts (if implemented)
6. ✅ **Regularly rotate passwords** for security
7. ✅ **Monitor admin access logs** for suspicious activity

## Support

If you encounter issues with admin initialization:
1. Check the server console logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure the database schema is up to date
4. Run the manual initialization script for debugging
