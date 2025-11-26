# 🚀 Deployment Guide

This guide covers deploying PolyCandle to production on Vercel.

---

## Prerequisites

- GitHub account
- Vercel account (free tier works)
- PostgreSQL database (Vercel Postgres, Supabase, Railway, etc.)

---

## Step 1: Prepare Your Repository

1. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: PolyCandle MVP"
   ```

2. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/polycandle.git
   git branch -M main
   git push -u origin main
   ```

---

## Step 2: Set Up Database

### Option A: Vercel Postgres

1. Go to your Vercel dashboard
2. Create a new Postgres database
3. Copy the connection string (it will be automatically added to your environment variables)

### Option B: External Provider (Supabase, Railway, Neon, etc.)

1. Create a PostgreSQL database on your preferred platform
2. Copy the connection string
3. You'll add this to Vercel in the next step

---

## Step 3: Deploy to Vercel

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**

2. **Click "Add New Project"**

3. **Import your GitHub repository**

4. **Configure Project**:
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

5. **Add Environment Variables**:
   
   Click "Environment Variables" and add:
   
   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | Your PostgreSQL connection string |
   
   Example:
   ```
   DATABASE_URL=postgresql://user:password@host:5432/database?schema=public
   ```

6. **Click "Deploy"**

7. **Wait for deployment** (~2-3 minutes)

---

## Step 4: Run Database Migration

After your first deployment:

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Link your project**:
   ```bash
   vercel link
   ```

3. **Run migrations on Vercel**:
   ```bash
   vercel env pull .env.local
   npx prisma migrate deploy
   ```

   Or manually run:
   ```bash
   vercel exec -- npx prisma migrate deploy
   ```

---

## Step 5: Set Up Automated Scheduler

The `vercel.json` file is already configured to run the scheduler every minute:

```json
{
  "crons": [{
    "path": "/api/admin/run-scheduler",
    "schedule": "*/1 * * * *"
  }]
}
```

**Important**: Cron jobs are only available on Vercel Pro plan and above. 

### Free Tier Alternative

Use an external cron service to call your scheduler:

1. **[Cron-job.org](https://cron-job.org/)** (Free)
   - Create account
   - Add job: `https://your-app.vercel.app/api/admin/run-scheduler`
   - Schedule: Every 1 minute

2. **[EasyCron](https://www.easycron.com/)** (Free tier available)

3. **GitHub Actions** (Free):
   
   Create `.github/workflows/scheduler.yml`:
   ```yaml
   name: Run Scheduler
   on:
     schedule:
       - cron: '*/1 * * * *'  # Every minute
   jobs:
     call-scheduler:
       runs-on: ubuntu-latest
       steps:
         - name: Call Scheduler API
           run: curl -X POST https://your-app.vercel.app/api/admin/run-scheduler
   ```

---

## Step 6: Verify Deployment

1. **Visit your app**: `https://your-app.vercel.app`

2. **Check scheduler manually**:
   ```
   https://your-app.vercel.app/api/admin/run-scheduler
   ```

3. **Test the full flow**:
   - Select an asset
   - Place a bet
   - Check round history

4. **Monitor logs**:
   - Go to Vercel Dashboard → Your Project → Logs
   - Look for scheduler execution logs

---

## Step 7: Custom Domain (Optional)

1. **Go to Vercel Dashboard** → Your Project → Settings → Domains

2. **Add your domain**:
   ```
   polycandle.com
   ```

3. **Follow DNS instructions** from Vercel

4. **Wait for DNS propagation** (~5-10 minutes)

---

## Environment Variables Reference

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |

### Optional (Future)

| Variable | Description |
|----------|-------------|
| `BINANCE_API_KEY` | For real price feed |
| `BINANCE_API_SECRET` | For real price feed |
| `NEXT_PUBLIC_APP_URL` | Your app URL |

---

## Post-Deployment Checklist

- [ ] Database connected and migrated
- [ ] Scheduler running (check logs)
- [ ] Can place bets successfully
- [ ] Round history populating
- [ ] TradingView charts loading
- [ ] Mobile responsive
- [ ] Custom domain configured (if applicable)

---

## Monitoring & Maintenance

### Check Logs

```bash
vercel logs
```

Or view in dashboard: Vercel → Your Project → Logs

### Update Environment Variables

```bash
vercel env add DATABASE_URL
```

Or via dashboard: Settings → Environment Variables

### Redeploy

Push to GitHub main branch:
```bash
git push origin main
```

Vercel will auto-deploy.

### Manual Deployment

```bash
vercel --prod
```

---

## Troubleshooting

### Scheduler Not Running

**Problem**: No rounds being created

**Solutions**:
1. Check if you're on Vercel Pro (for built-in cron)
2. Use external cron service (see Step 5)
3. Manually call: `curl https://your-app.vercel.app/api/admin/run-scheduler`

### Database Connection Error

**Problem**: Can't connect to database

**Solutions**:
1. Verify `DATABASE_URL` in environment variables
2. Check database is accessible from internet
3. Whitelist Vercel IPs (if using IP restrictions)
4. Test connection locally with the same URL

### Build Errors

**Problem**: Deployment fails

**Solutions**:
1. Check build logs in Vercel dashboard
2. Test build locally: `npm run build`
3. Ensure all dependencies are in `package.json`
4. Check TypeScript errors

### Prisma Client Error

**Problem**: `@prisma/client` not found

**Solutions**:
1. Ensure `postinstall` script in `package.json`:
   ```json
   "postinstall": "prisma generate"
   ```
2. Redeploy

---

## Performance Optimization

### Database Indexing

The Prisma schema already includes optimal indexes:
- `Round`: `[symbol, status]`, `[status, endTime]`
- `Bet`: `[roundId]`, `[walletAddress]`

### Caching (Future Enhancement)

Consider adding:
- Redis for current round caching
- CDN for static assets
- Edge functions for global performance

---

## Security Considerations

### Current MVP

- No real money involved
- Simple wallet address auth
- No rate limiting

### Production Recommendations

1. **Add rate limiting**:
   ```bash
   npm install @upstash/ratelimit
   ```

2. **Implement proper authentication**:
   - OAuth (Google, GitHub)
   - Web3 wallet connection (MetaMask)
   - JWT tokens

3. **Add CORS restrictions**:
   ```typescript
   // In API routes
   res.setHeader('Access-Control-Allow-Origin', 'https://your-domain.com');
   ```

4. **Environment variable security**:
   - Never commit `.env` files
   - Use Vercel's encrypted variables
   - Rotate database credentials regularly

5. **SQL injection protection**:
   - Prisma already handles this
   - Always use parameterized queries

---

## Scaling Considerations

### Current Limitations

- Single PostgreSQL instance
- Mock price feed
- No load balancing

### Scaling Path

1. **Database**: 
   - Connection pooling (Prisma already uses this)
   - Read replicas for history queries
   - Consider sharding by symbol

2. **Price Feed**:
   - WebSocket connection to Binance
   - Multiple data sources for redundancy
   - Real-time updates via Server-Sent Events

3. **Infrastructure**:
   - Move scheduler to separate service
   - Use message queue (Redis/RabbitMQ)
   - Implement circuit breakers

---

## Cost Estimation

### Free Tier (Hobby)

- **Vercel**: Free
  - 100GB bandwidth/month
  - No cron jobs
  - Serverless functions
  
- **Database**: ~$5-25/month
  - Vercel Postgres: $20/month
  - Supabase: Free tier available
  - Railway: $5/month

- **External Cron**: Free
  - Cron-job.org
  - GitHub Actions

**Total**: $0-25/month

### Production (Pro)

- **Vercel Pro**: $20/month
  - Cron jobs included
  - More bandwidth
  - Team features

- **Database**: $25-100/month
  - Based on usage

- **Monitoring**: Optional
  - Datadog, Sentry, etc.

**Total**: $45-150/month

---

## Next Steps

1. **Monitor your deployment** for the first few days
2. **Collect user feedback** 
3. **Implement real price feed** (see `lib/priceFeed.ts` TODO)
4. **Add payment integration** (Lightning, x402, etc.)
5. **Scale as needed** based on traffic

---

**Your app is now live! 🎉**

Share it with users and start collecting feedback for the next iteration.

