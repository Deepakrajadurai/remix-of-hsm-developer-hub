# Database Migration Summary: Supabase → MySQL

## ✅ Migration Files Created

### 1. **Prisma Schema** (`prisma/schema.prisma`)
Complete MySQL database schema with all tables:
- Users & Authentication
- Profiles
- Posts (Community & Blog)
- Comments & Likes
- Channels & Chat Messages
- Events & Registrations
- Hashtags
- Reports & Moderation
- Resources

### 2. **Database Client** (`src/lib/db.ts`)
Prisma-based client with Supabase-compatible API:
- Authentication helpers
- Storage helpers
- Query builders

### 3. **Migration Script** (`scripts/migrate-from-supabase.ts`)
Automated data migration from Supabase to MySQL

### 4. **Seed Script** (`prisma/seed.ts`)
Initial data population:
- Default channels
- Sample events
- Sample resources
- Admin user

### 5. **Documentation**
- `MIGRATION_GUIDE.md` - Comprehensive step-by-step guide
- `.env.example` - Environment configuration template

## 🚀 Quick Start

### Step 1: Install MySQL
Download and install MySQL 8.0+ from https://dev.mysql.com/downloads/mysql/

### Step 2: Create Database
```sql
CREATE DATABASE hsm_community CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'hsm_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON hsm_community.* TO 'hsm_user'@'localhost';
FLUSH PRIVILEGES;
```

### Step 3: Configure Environment
```bash
# Copy the example file
cp .env.example .env

# Edit .env and set your MySQL connection
DATABASE_URL="mysql://hsm_user:your_password@localhost:3306/hsm_community"
```

### Step 4: Generate Prisma Client & Push Schema
```bash
npm run db:generate
npm run db:push
```

### Step 5: Seed Initial Data
```bash
npm run db:seed
```

### Step 6: (Optional) Migrate Existing Data
If you have existing data in Supabase:
```bash
npm run migrate:from-supabase
```

## 📦 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:push` | Push schema to database (no migrations) |
| `npm run db:migrate` | Create and run migrations |
| `npm run db:migrate:deploy` | Deploy migrations (production) |
| `npm run db:studio` | Open Prisma Studio (database GUI) |
| `npm run db:seed` | Seed database with initial data |
| `npm run migrate:from-supabase` | Migrate data from Supabase |

## 🔑 Default Admin Credentials

After running the seed script:
- **Email**: admin@hsm.community
- **Password**: admin123

⚠️ **Change this password immediately after first login!**

## 📋 Database Tables

### Core Tables
- `users` - User accounts and authentication
- `profiles` - User profile information
- `user_roles` - User role assignments (admin, moderator, user)

### Community Features
- `posts` - Community posts
- `comments` - Post comments
- `post_likes` - Post likes
- `hashtags` - Hashtag definitions
- `post_hashtags` - Post-hashtag relationships
- `channels` - Community channels
- `chat_messages` - Channel messages
- `reports` - Content moderation reports

### Events
- `events` - Event listings
- `event_registrations` - Event registrations

### Content
- `blog_posts` - Blog articles
- `resources` - Resource links

## 🔄 Key Differences from Supabase

### Authentication
- **Before**: Supabase Auth (built-in)
- **After**: Custom auth with bcrypt (you'll need to implement session management)

### Realtime
- **Before**: Supabase Realtime (built-in)
- **After**: Need to implement (WebSockets, SSE, or polling)

### Storage
- **Before**: Supabase Storage (built-in)
- **After**: Need to implement (local, S3, Cloudinary, etc.)

### Row Level Security (RLS)
- **Before**: PostgreSQL RLS policies
- **After**: Application-level authorization (implement in your API)

## ⚠️ Important Notes

1. **User Passwords**: Supabase uses its own password hashing. You'll need to:
   - Export user emails from Supabase
   - Have users reset passwords, OR
   - Implement a password migration strategy

2. **File Storage**: Uploaded files in Supabase Storage need to be:
   - Downloaded from Supabase
   - Re-uploaded to your new storage solution

3. **Realtime Features**: You'll need to implement:
   - WebSocket server for real-time updates
   - Or use a service like Pusher, Ably, etc.

4. **Session Management**: Implement JWT or session-based auth:
   - Consider using `express-session` or `jsonwebtoken`
   - Set up secure cookie handling

## 🛠️ Next Steps

### 1. Implement Session Management
Choose one:
- **JWT**: Use `jsonwebtoken` package
- **Sessions**: Use `express-session` with Redis/MySQL store

### 2. Implement Real-time Features
Choose one:
- **Socket.io**: Full-featured WebSocket library
- **Native WebSockets**: Lightweight
- **Server-Sent Events**: One-way updates
- **Third-party**: Pusher, Ably, etc.

### 3. Implement File Storage
Choose one:
- **Local**: Store in `./uploads` directory
- **AWS S3**: Use `@aws-sdk/client-s3`
- **Cloudinary**: Use `cloudinary` package
- **Other**: Google Cloud Storage, Azure Blob

### 4. Update Frontend Code
Replace Supabase client calls with Prisma queries:
```typescript
// Before
const { data } = await supabase.from('posts').select('*');

// After
const posts = await prisma.post.findMany();
```

### 5. Implement Authorization
Add middleware to check user permissions:
```typescript
// Example middleware
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

function requireRole(role) {
  return async (req, res, next) => {
    const userRole = await prisma.userRole.findFirst({
      where: { userId: req.user.id, role }
    });
    if (!userRole) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
```

## 📚 Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Socket.io Documentation](https://socket.io/docs/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

## 🐛 Troubleshooting

### "Can't connect to MySQL server"
- Ensure MySQL is running: `sudo systemctl status mysql` (Linux) or check Services (Windows)
- Check connection string in `.env`
- Verify user has proper permissions

### "Table doesn't exist"
- Run: `npm run db:push` or `npm run db:migrate`

### "Prisma Client not generated"
- Run: `npm run db:generate`

### Migration script fails
- Ensure Supabase credentials are in `.env`
- Check network connectivity
- Verify table names match

## 📞 Support

For issues or questions:
1. Check the `MIGRATION_GUIDE.md` for detailed instructions
2. Review Prisma documentation
3. Check MySQL logs for database errors
4. Create an issue in the repository

---

**Status**: ✅ Migration infrastructure ready
**Next**: Follow the Quick Start guide above to complete migration
