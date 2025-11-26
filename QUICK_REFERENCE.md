# ⚡ Quick Reference Card

Essential commands and URLs for PolyCandle development.

---

## 🚀 Common Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# Open Prisma Studio (database GUI)
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Run linter
npm run lint
```

---

## 🌐 Local URLs

```
Frontend:        http://localhost:3000
Prisma Studio:   http://localhost:5555
Scheduler:       http://localhost:3000/api/admin/run-scheduler
```

---

## 📡 API Endpoints

### GET Requests (browser friendly)

```
Current Round (BTC):
http://localhost:3000/api/rounds/current?symbol=BTCUSDT

Current Round (ETH):
http://localhost:3000/api/rounds/current?symbol=ETHUSDT

History (BTC):
http://localhost:3000/api/rounds/history?symbol=BTCUSDT&limit=10

Run Scheduler:
http://localhost:3000/api/admin/run-scheduler
```

### POST Requests (use curl or Postman)

**Place Bet:**
```bash
curl -X POST http://localhost:3000/api/bets \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTCUSDT",
    "roundId": "REPLACE_WITH_ROUND_ID",
    "side": "GREEN",
    "amount": 10,
    "walletAddress": "my_wallet"
  }'
```

**Run Scheduler:**
```bash
curl -X POST http://localhost:3000/api/admin/run-scheduler
```

---

## 🎮 Typical Workflow

### 1. First Time Setup
```bash
npm install
# Create .env with DATABASE_URL
npx prisma migrate dev --name init
npm run dev
```

### 2. Create Rounds
```bash
curl -X POST http://localhost:3000/api/admin/run-scheduler
```

### 3. Place Bets
- Go to http://localhost:3000
- Select asset (BTC/ETH/SOL/ZEC)
- Enter wallet address
- Enter amount
- Choose GREEN or RED
- Click "Place Bet"

### 4. Wait for Settlement
- Option A: Wait 5 minutes
- Option B: Modify TIMEFRAME_MS in lib/types.ts for faster testing

### 5. Settle Round
```bash
curl -X POST http://localhost:3000/api/admin/run-scheduler
```

### 6. Check Results
- View History table on frontend
- Or open Prisma Studio: `npx prisma studio`

---

## 🐛 Troubleshooting

### No rounds found?
```bash
curl -X POST http://localhost:3000/api/admin/run-scheduler
```

### Database connection error?
Check `.env` file has correct `DATABASE_URL`

### Prisma Client not found?
```bash
npx prisma generate
```

### Build errors?
```bash
rm -rf .next node_modules
npm install
npm run dev
```

### Reset everything?
```bash
npx prisma migrate reset
curl -X POST http://localhost:3000/api/admin/run-scheduler
```

---

## 📁 Key Files

### Configuration
- `.env` - Database connection
- `prisma/schema.prisma` - Database schema
- `tsconfig.json` - TypeScript config
- `tailwind.config.ts` - Tailwind config

### Core Logic
- `lib/roundScheduler.ts` - Round lifecycle
- `lib/priceFeed.ts` - OHLC data (mock)
- `lib/types.ts` - TypeScript types

### API Routes
- `app/api/rounds/current/route.ts`
- `app/api/rounds/history/route.ts`
- `app/api/bets/route.ts`
- `app/api/admin/run-scheduler/route.ts`

### Frontend
- `app/page.tsx` - Main page
- `components/CurrentRound.tsx` - Round display
- `components/BettingForm.tsx` - Bet form

---

## 🔑 Environment Variables

Create `.env`:
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

Example (local):
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/polycandle?schema=public"
```

---

## 🎯 Testing Checklist

- [ ] npm install works
- [ ] Database migrates successfully
- [ ] Dev server starts
- [ ] Can create rounds via scheduler
- [ ] Frontend loads
- [ ] Can select different assets
- [ ] Can place bets
- [ ] Pool totals update
- [ ] Countdown timer works
- [ ] Rounds appear in history after settling

---

## 📊 Database Models

### Round
- `symbol`: BTCUSDT | ETHUSDT | SOLUSDT | ZECUSDT
- `status`: OPEN | LOCKED | SETTLED
- `totalGreen`, `totalRed`: Decimal
- `winnerSide`: GREEN | RED | DRAW

### Bet
- `side`: GREEN | RED
- `status`: PENDING | WON | LOST | REFUNDED
- `amount`, `payout`: Decimal

---

## 💡 Pro Tips

**Faster Testing:**
```typescript
// lib/types.ts
export const TIMEFRAME_MS = 1 * 60 * 1000; // 1 minute
```

**Auto-run Scheduler:**
```bash
# In a separate terminal
watch -n 60 'curl -X POST http://localhost:3000/api/admin/run-scheduler'
```

**View Logs:**
```bash
# Server logs are in the terminal running npm run dev
# Check for [Scheduler] messages
```

**Quick Database Check:**
```bash
npx prisma studio
# Opens GUI at http://localhost:5555
```

---

## 📚 Documentation

- `README.md` - Full documentation
- `SETUP_GUIDE.md` - Detailed setup
- `TESTING_GUIDE.md` - Testing procedures
- `DEPLOYMENT.md` - Vercel deployment
- `PROJECT_SUMMARY.md` - Project overview

---

## 🚨 Emergency Commands

**Server won't start:**
```bash
rm -rf .next
npm run dev
```

**Database is corrupted:**
```bash
npx prisma migrate reset
# Recreates database from scratch
```

**Dependencies are broken:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Prisma is out of sync:**
```bash
npx prisma generate
npx prisma db push
```

---

## 🎨 Supported Assets

- **BTCUSDT** → BTC
- **ETHUSDT** → ETH
- **SOLUSDT** → SOL
- **ZECUSDT** → ZEC

---

## 🧮 Quick Math

**Multiplier Calculation:**
```
Total Pool = Green + Red
Fee = Total × 0.05
Distribution = Total - Fee
Green Multiplier = Distribution / Green
Red Multiplier = Distribution / Red
```

**Example:**
```
Green: 100, Red: 50
Total: 150
Fee: 7.5
Distribution: 142.5
Green Mult: 1.425x
Red Mult: 2.85x
```

---

## ⏱️ Timeframes

- **Round Duration**: 5 minutes (default)
- **Betting Window**: Until startTime
- **Settlement**: After endTime
- **Refresh Rate**: Frontend polls every 5 seconds

---

## 🔒 Security Notes (MVP)

⚠️ Current MVP does NOT have:
- Real authentication
- Balance checking
- Rate limiting
- Payment processing

✅ Safe for:
- Development
- Testing
- Demo purposes

❌ NOT safe for:
- Real money
- Production without enhancements

---

## 📞 Help

Stuck? Check these in order:

1. Read error message in terminal
2. Check browser console (F12)
3. Open Prisma Studio (`npx prisma studio`)
4. Review relevant documentation file
5. Check code comments (well-documented)

---

**Print this or keep it handy!** 📌

---

Last Updated: Project Creation Date
Version: MVP 1.0

