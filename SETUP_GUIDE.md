# 🚀 Quick Start Guide

Follow these steps to get PolyCandle running locally.

---

## Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages including Next.js, Prisma, TypeScript, and Tailwind.

---

## Step 2: Configure Database

### Option A: Local PostgreSQL

1. Install PostgreSQL if you haven't already
2. Create a database:
   ```sql
   CREATE DATABASE polycandle;
   ```

3. Create `.env` file in the project root:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/polycandle?schema=public"
   ```
   
   Replace `postgres:postgres` with your username and password.

### Option B: Cloud PostgreSQL (Supabase, Railway, etc.)

1. Create a PostgreSQL database on your preferred platform
2. Copy the connection string
3. Create `.env` file:
   ```env
   DATABASE_URL="your_connection_string_here"
   ```

---

## Step 3: Run Database Migration

```bash
npx prisma migrate dev --name init
```

This will:
- Create the `Round` and `Bet` tables
- Set up the necessary enums
- Generate the Prisma Client

You should see output like:
```
✔ Generated Prisma Client
✔ The migration has been applied successfully
```

---

## Step 4: Start Development Server

```bash
npm run dev
```

Open your browser and navigate to:
```
http://localhost:3000
```

You should see the PolyCandle interface!

---

## Step 5: Create Initial Rounds

Before you can place bets, you need to create rounds using the scheduler.

**Method 1: Browser**

Visit this URL in your browser:
```
http://localhost:3000/api/admin/run-scheduler
```

**Method 2: Command Line**

```bash
curl -X POST http://localhost:3000/api/admin/run-scheduler
```

**What happens:**
- Creates OPEN rounds for BTC, ETH, SOL, and ZEC
- Each round lasts 5 minutes
- You can now place bets!

---

## Step 6: Place Your First Bet!

1. **Select an asset** (BTC, ETH, SOL, or ZEC)
2. **View the current round** - you'll see:
   - Time remaining until betting closes
   - Current pool totals for GREEN and RED
   - Live multipliers
3. **Enter your wallet address** (any string for MVP, e.g., "user123")
4. **Enter bet amount** (e.g., 10)
5. **Choose GREEN or RED**
6. **Click "Place Bet"**

---

## Step 7: Test the Full Cycle

To see the complete game flow:

1. **Place some bets** on different sides (GREEN and RED)
2. **Wait 5 minutes** (or change the `TIMEFRAME_MS` in `lib/types.ts` for faster testing)
3. **Run the scheduler again**:
   ```bash
   curl -X POST http://localhost:3000/api/admin/run-scheduler
   ```
4. **Check the History table** - you should see the settled round with a winner!

---

## 🔍 Troubleshooting

### Database Connection Error

**Problem:** Can't connect to PostgreSQL

**Solution:**
1. Ensure PostgreSQL is running: `pg_ctl status` (or check your cloud provider)
2. Verify your `DATABASE_URL` in `.env`
3. Check username, password, host, and port

### No Rounds Found

**Problem:** "No open round found" message

**Solution:**
- Run the scheduler: `http://localhost:3000/api/admin/run-scheduler`
- Check the console for any errors
- Verify database connection

### Prisma Client Error

**Problem:** `@prisma/client` not found or outdated

**Solution:**
```bash
npx prisma generate
```

### Build Errors

**Problem:** TypeScript or build errors

**Solution:**
1. Clear the build cache:
   ```bash
   rm -rf .next
   npm run dev
   ```
2. Reinstall dependencies:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

---

## 📊 Database Management

### View Data with Prisma Studio

```bash
npx prisma studio
```

Opens a GUI at `http://localhost:5555` where you can:
- Browse all rounds and bets
- Edit data manually
- Debug issues

### Reset Database

**Warning:** This deletes all data!

```bash
npx prisma migrate reset
```

Then rerun:
```bash
npx prisma migrate dev
```

---

## ⚡ Development Tips

### Auto-Run Scheduler

For easier development, you can set up a script to run the scheduler automatically:

**Create** `scripts/auto-scheduler.js`:
```javascript
setInterval(async () => {
  console.log('Running scheduler...');
  await fetch('http://localhost:3000/api/admin/run-scheduler');
}, 60000); // Every 60 seconds
```

**Run it:**
```bash
node scripts/auto-scheduler.js
```

### Faster Testing (1-minute rounds)

**Edit** `lib/types.ts`:
```typescript
export const TIMEFRAME_MS = 1 * 60 * 1000; // 1 minute for testing
```

**Don't forget to change it back to 5 minutes for production!**

---

## 🎯 What's Next?

1. **Explore the code** - everything is well-commented
2. **Place multiple bets** - test the pari-mutuel calculations
3. **Check the API** - try calling endpoints directly
4. **Review the TODO comments** - see what needs to be integrated next (Binance API, payments, etc.)

---

## 📚 Useful Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run Prisma Studio
npx prisma studio

# Generate Prisma Client
npx prisma generate

# Create new migration
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset

# Format code
npm run lint
```

---

## 🆘 Need Help?

1. Check the main `README.md` for detailed documentation
2. Review the code comments - they explain the logic
3. Look at the console logs - useful debug information
4. Use Prisma Studio to inspect the database

---

**Happy betting! 🎲**

