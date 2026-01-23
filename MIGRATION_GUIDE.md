# Migration Guide: Supabase to MySQL

This guide will help you migrate your HSM Community application from Supabase (PostgreSQL) to MySQL.

## Prerequisites

1. **MySQL Server**: Install MySQL 8.0 or higher
2. **Node.js**: Ensure you have Node.js 18+ installed
3. **Backup**: Export your current Supabase data before starting

## Step 1: Install Required Dependencies

```bash
npm install bcryptjs @types/bcryptjs mysql2
```

## Step 2: Set Up MySQL Database

### Option A: Local MySQL Installation

1. Install MySQL Server from https://dev.mysql.com/downloads/mysql/
2. Create a new database:

```sql
CREATE DATABASE hsm_community CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'hsm_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON hsm_community.* TO 'hsm_user'@'localhost';
FLUSH PRIVILEGES;
```

### Option B: Cloud MySQL (e.g., PlanetScale, AWS RDS, Google Cloud SQL)

Follow your cloud provider's instructions to create a MySQL database.

## Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your MySQL connection string:
   ```
   DATABASE_URL="mysql://hsm_user:your_password@localhost:3306/hsm_community"
   ```

## Step 4: Run Prisma Migrations

1. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```

2. Push the schema to your MySQL database:
   ```bash
   npx prisma db push
   ```

   Or create and run migrations:
   ```bash
   npx prisma migrate dev --name init
   ```

3. Verify the schema:
   ```bash
   npx prisma studio
   ```

## Step 5: Export Data from Supabase

### Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to Database → Backups
3. Create a new backup and download it

### Using SQL Export

Run this SQL in your Supabase SQL Editor to export data:

```sql
-- Export users (you'll need to handle passwords separately)
COPY (SELECT * FROM auth.users) TO '/tmp/users.csv' WITH CSV HEADER;

-- Export profiles
COPY (SELECT * FROM profiles) TO '/tmp/profiles.csv' WITH CSV HEADER;

-- Export posts
COPY (SELECT * FROM posts) TO '/tmp/posts.csv' WITH CSV HEADER;

-- Export other tables similarly...
```

## Step 6: Import Data to MySQL

You can use the provided migration script or manually import:

### Using Migration Script

```bash
npm run migrate:data
```

### Manual Import

Use Prisma Client to import data:

```typescript
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import csv from 'csv-parser';

const prisma = new PrismaClient();

async function importUsers() {
  const users = [];
  fs.createReadStream('users.csv')
    .pipe(csv())
    .on('data', (row) => users.push(row))
    .on('end', async () => {
      for (const user of users) {
        await prisma.user.create({
          data: {
            id: user.id,
            email: user.email,
            // Note: You'll need to handle password hashing
            passwordHash: user.encrypted_password,
            createdAt: new Date(user.created_at),
          },
        });
      }
    });
}
```

## Step 7: Update Application Code

The migration includes a database wrapper (`src/lib/db.ts`) that mimics Supabase's API. However, you may need to update some code:

### Authentication Changes

**Before (Supabase):**
```typescript
import { supabase } from '@/integrations/supabase/client';

const { data, error } = await supabase.auth.signUp({
  email,
  password,
});
```

**After (MySQL):**
```typescript
import { auth } from '@/lib/db';

const { data, error } = await auth.signUp(email, password, {
  full_name: fullName,
});
```

### Database Queries

**Before (Supabase):**
```typescript
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .eq('channel_id', channelId);
```

**After (MySQL with Prisma):**
```typescript
import { prisma } from '@/lib/db';

const posts = await prisma.post.findMany({
  where: { channelId },
  include: {
    author: true,
    comments: true,
  },
});
```

## Step 8: Handle Realtime Features

Supabase provides realtime subscriptions out of the box. For MySQL, you'll need to implement this differently:

### Options:

1. **WebSockets**: Use Socket.io or native WebSockets
2. **Polling**: Simple but less efficient
3. **Server-Sent Events (SSE)**: One-way real-time updates
4. **Third-party services**: Pusher, Ably, etc.

### Example with Socket.io:

```bash
npm install socket.io socket.io-client
```

Create a WebSocket server (see `server/websocket.ts` for implementation).

## Step 9: Handle File Storage

Supabase Storage needs to be replaced:

### Options:

1. **Local Storage**: Store files in `./uploads` directory
2. **AWS S3**: Use `@aws-sdk/client-s3`
3. **Cloudinary**: Use `cloudinary` package
4. **Other cloud storage**: Google Cloud Storage, Azure Blob Storage

The `src/lib/db.ts` file includes a storage helper that you can customize.

## Step 10: Seed Initial Data

Run the seed script to populate default channels and sample data:

```bash
npx prisma db seed
```

## Step 11: Test the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Test all features:
   - [ ] User registration and login
   - [ ] Creating posts
   - [ ] Comments and likes
   - [ ] Events and registrations
   - [ ] File uploads
   - [ ] Real-time updates (if implemented)

## Step 12: Update Deployment

Update your deployment configuration to use MySQL instead of Supabase:

1. Set environment variables in your hosting platform
2. Ensure MySQL database is accessible from your deployment
3. Run migrations in production:
   ```bash
   npx prisma migrate deploy
   ```

## Troubleshooting

### Common Issues

1. **UUID vs Auto-increment IDs**: MySQL handles UUIDs differently than PostgreSQL
   - Solution: Use `@default(uuid())` in Prisma schema

2. **Timestamp Differences**: MySQL and PostgreSQL handle timezones differently
   - Solution: Always use UTC and convert on the client side

3. **Text Field Limits**: MySQL has different text field size limits
   - Solution: Use `@db.LongText` for large text fields

4. **Case Sensitivity**: MySQL is case-insensitive by default
   - Solution: Use `BINARY` or configure collation

### Getting Help

- Check Prisma documentation: https://www.prisma.io/docs
- MySQL documentation: https://dev.mysql.com/doc/
- Community support: Create an issue in the repository

## Rollback Plan

If you need to rollback to Supabase:

1. Keep your Supabase project active during migration
2. Maintain both `.env` configurations
3. Use feature flags to switch between databases
4. Test thoroughly before decommissioning Supabase

## Performance Optimization

After migration:

1. Add indexes for frequently queried fields
2. Use Prisma's query optimization features
3. Implement caching (Redis, in-memory)
4. Monitor query performance with Prisma's logging

## Security Considerations

1. **Password Hashing**: Ensure bcrypt is used with proper salt rounds (10+)
2. **SQL Injection**: Prisma protects against this, but be careful with raw queries
3. **Environment Variables**: Never commit `.env` file
4. **Database Credentials**: Use strong passwords and rotate regularly
5. **Connection Pooling**: Configure properly for production

## Next Steps

1. Implement session management (JWT, cookies)
2. Set up WebSocket server for real-time features
3. Configure file storage solution
4. Set up database backups
5. Implement monitoring and logging
6. Configure CI/CD pipeline for migrations

---

**Note**: This migration removes dependency on Supabase's authentication and realtime features. You'll need to implement these separately or use alternative services.
