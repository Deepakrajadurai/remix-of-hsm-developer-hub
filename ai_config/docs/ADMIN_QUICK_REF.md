# 🔐 Admin User Quick Reference

## Default Admin Credentials

```
📧 Email:    fh.developercommunity@gmail.com
🔑 Password: Admin@2024!Secure
👑 Roles:    admin, user
```

## Quick Commands

### Initialize Admin Manually
```bash
node scripts/init_admin_user.cjs
```

### Start Server (Auto-initializes Admin)
```bash
node server/index.cjs
```

### Login via API
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "fh.developercommunity@gmail.com",
    "password": "Admin@2024!Secure"
  }'
```

## Environment Variables

Located in `.env`:
```env
ADMIN_EMAIL=fh.developercommunity@gmail.com
ADMIN_PASSWORD=Admin@2024!Secure
```

## Files Created/Modified

- ✅ `.env` - Added admin credentials
- ✅ `scripts/init_admin_user.cjs` - Standalone initialization script
- ✅ `server/index.cjs` - Auto-initialization on startup
- ✅ `docs/ADMIN_SETUP.md` - Full documentation
- ✅ `.env.example` - Template for new setups

## What Happens on Server Start

1. Server loads environment variables
2. Database schema is updated
3. **Admin initialization runs automatically**
4. Checks if admin exists
5. Creates admin if needed (or adds admin role)
6. Server is ready to accept requests

## Security Checklist

- [ ] Change default password in production
- [ ] Restrict `.env` file permissions
- [ ] Never commit `.env` to version control
- [ ] Use different credentials per environment
- [ ] Enable 2FA (if available)
- [ ] Regularly rotate passwords

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "ADMIN_EMAIL not set" | Add `ADMIN_EMAIL` to `.env` |
| "Password validation failed" | Ensure 8+ chars, number, special char |
| "Email already exists" | Admin already created, use existing credentials |
| Database connection error | Check MySQL is running and credentials are correct |

## Next Steps

1. ✅ Admin user is now configured
2. ✅ Start the server to auto-create admin
3. ✅ Login with admin credentials
4. ⚠️ **Change the password in production!**

---

For detailed documentation, see: `docs/ADMIN_SETUP.md`
