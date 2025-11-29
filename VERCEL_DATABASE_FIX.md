# 🔧 Fix Database Connection on Vercel

## Problem
Prisma cannot connect to Supabase database from Vercel:
```
Can't reach database server at `aws-1-eu-west-1.pooler.supabase.com`:`5432`
```

## Solution

### Step 1: Check DATABASE_URL on Vercel

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Verify `DATABASE_URL` is set for **Production** environment
3. Check the format matches your local `.env`

### Step 2: URL Encode Special Characters

If your password contains special characters (`@`, `#`, `%`, etc.), they must be URL-encoded:

**Special Characters Encoding:**
- `@` → `%40`
- `#` → `%23`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- `=` → `%3D`

**Example:**
If your password is `Devocambiarla12@`, the connection string should be:
```
postgresql://postgres.mmavbudoperbeysduvec:Devocambiarla12%40@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?pgbouncer=true
```

### Step 3: Verify Connection String Format

The correct format for Supabase Pooler is:
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?pgbouncer=true
```

**Important:**
- Use the **Pooler** connection string (not direct connection)
- Port must be `5432`
- Must include `?pgbouncer=true` parameter

### Step 4: Alternative - Use Direct Connection

If pooler doesn't work, try the direct connection string:
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-1-eu-west-1.connect.supabase.com:5432/postgres
```

**Note:** Direct connection doesn't use `?pgbouncer=true`

### Step 5: Check Supabase Settings

1. Go to **Supabase Dashboard** → Your Project → **Settings** → **Database**
2. Check **Connection Pooling** is enabled
3. Verify **IP Allowlist** - Vercel IPs should be allowed (or allow all if testing)

### Step 6: Test Connection

After updating `DATABASE_URL` on Vercel:

1. **Redeploy** your application
2. Test the connection:
   ```
   https://your-app.vercel.app/api/test/prisma
   ```
3. Should return `{"success": true}`

## Common Issues

### Issue 1: Password with `@` symbol
**Problem:** Password `Devocambiarla12@` breaks connection string parsing
**Solution:** Encode as `Devocambiarla12%40`

### Issue 2: Missing `pgbouncer=true`
**Problem:** Connection fails with pooler URL
**Solution:** Add `?pgbouncer=true` to connection string

### Issue 3: Wrong environment variable
**Problem:** `DATABASE_URL` set only for Development, not Production
**Solution:** Set for **Production** environment in Vercel

### Issue 4: IP Whitelist
**Problem:** Supabase blocks Vercel IPs
**Solution:** Allow all IPs in Supabase settings (or add Vercel IP ranges)

## Quick Fix Script

If you need to URL-encode your password:

```javascript
// In browser console or Node.js
const password = "Devocambiarla12@";
const encoded = encodeURIComponent(password);
console.log(encoded); // "Devocambiarla12%40"
```

Then update your connection string:
```
postgresql://postgres.mmavbudoperbeysduvec:Devocambiarla12%40@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?pgbouncer=true
```

