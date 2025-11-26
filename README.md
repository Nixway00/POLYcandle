# 🕯️ PolyCandle

**Real-time crypto candle prediction platform with pari-mutuel betting model**

Bet on whether the next 5-minute crypto candle will close GREEN (up) or RED (down). Winners are paid from the losers' pool using a fair pari-mutuel system.

---

## 🎮 Features

- **Multi-Asset Support**: BTC, ETH, SOL, ZEC
- **Pari-Mutuel Betting**: Fair odds based on total pool distribution
- **Real-time Updates**: Live multipliers and countdown timers
- **TradingView Integration**: Professional charting
- **Payment Options** (Coming Soon):
  - Anonymous via Web Monetization (x402)
  - Phantom Wallet integration for Solana payments

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **UI**: React + Tailwind CSS
- **Payments**: Web Monetization + Solana/Phantom (In Development)
- **Deploy**: Vercel

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (or Supabase free tier)
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/polycandle.git
cd polycandle

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your database URL

# Run database migration
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Create Initial Rounds

```bash
# Call scheduler to create rounds (in browser or curl)
curl http://localhost:3000/api/admin/run-scheduler
```

For continuous operation, call the scheduler every minute (or use Vercel Cron in production).

---

## 🎯 How It Works

### Pari-Mutuel Model

```
Total Pool (L) = Green Bets (V) + Red Bets (R)
Platform Fee = L × 5%
Distribution Pool (D) = L - Fee + Bonus

Green Multiplier = D / V
Red Multiplier = D / R

Payout = Bet Amount × Multiplier (if you win)
```

**Example:**
```
Green Bets: 175 (Alice: 100, Carol: 75)
Red Bets: 50 (Bob: 50)
Total Pool: 225
Fee (5%): 11.25
Distribution: 213.75

If GREEN wins:
  - Green Multiplier: 213.75 / 175 = 1.22x
  - Alice gets: 100 × 1.22 = 122
  - Carol gets: 75 × 1.22 = 91.5

If RED wins:
  - Red Multiplier: 213.75 / 50 = 4.28x
  - Bob gets: 50 × 4.28 = 213.75
```

### Round Lifecycle

1. **OPEN** (before candle starts): Users can place bets
2. **LOCKED** (during 5-min candle): No more bets, waiting for result
3. **SETTLED** (after candle closes): Winner determined, payouts calculated

---

## 📁 Project Structure

```
polycandle/
├── app/                      # Next.js App Router
│   ├── api/                 # API endpoints
│   │   ├── admin/           # Admin routes (scheduler)
│   │   ├── bets/            # Betting endpoints
│   │   └── rounds/          # Round data endpoints
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main page
├── components/              # React components
│   ├── AssetSelector.tsx    # BTC/ETH/SOL/ZEC tabs
│   ├── BettingForm.tsx      # Bet placement form
│   ├── CurrentRound.tsx     # Current round display
│   ├── Header.tsx           # App header
│   ├── RoundHistory.tsx     # Settled rounds table
│   └── TradingViewWidget.tsx # Chart integration
├── lib/                     # Core business logic
│   ├── priceFeed.ts        # Price data (TODO: Binance)
│   ├── prisma.ts           # Prisma client
│   ├── roundScheduler.ts   # Round lifecycle
│   └── types.ts            # TypeScript types
├── prisma/
│   └── schema.prisma       # Database schema
├── .env.example            # Environment template
├── package.json
└── README.md
```

---

## 🔌 API Endpoints

### `GET /api/rounds/current?symbol=BTCUSDT`
Returns the current OPEN round for betting.

**Query Parameters:**
- `symbol` (required): One of `BTCUSDT`, `ETHUSDT`, `SOLUSDT`, `ZECUSDT`

**Response:**
```json
{
  "id": "...",
  "symbol": "BTCUSDT",
  "startTime": "2024-01-01T12:00:00Z",
  "endTime": "2024-01-01T12:05:00Z",
  "status": "OPEN",
  "totalGreen": "100.00",
  "totalRed": "50.00",
  "multiplierGreen": "1.425",
  "multiplierRed": "2.85",
  "timeRemaining": 180000
}
```

### `GET /api/rounds/history?symbol=BTCUSDT&limit=20`
Returns settled rounds history.

**Query Parameters:**
- `symbol` (required)
- `limit` (optional, default 20)

### `POST /api/bets`
Place a new bet on an open round.

**Request Body:**
```json
{
  "symbol": "BTCUSDT",
  "roundId": "round_id",
  "side": "GREEN",
  "amount": 10,
  "walletAddress": "user_wallet"
}
```

**Response:**
```json
{
  "bet": { /* bet data */ },
  "round": { /* updated round data */ }
}
```

### `POST /api/admin/run-scheduler`
Manually trigger the scheduler (automated via Vercel Cron in production).

---

## 🔮 Roadmap

**Phase 1: MVP** ✅
- [x] Multi-asset support (BTC, ETH, SOL, ZEC)
- [x] Pari-mutuel betting model
- [x] Real-time multipliers and countdown
- [x] Round lifecycle management
- [x] TradingView chart integration
- [x] Mock price feed for testing

**Phase 2: Payments** 🔄
- [ ] Web Monetization (x402) for anonymous betting
- [ ] Phantom Wallet integration
- [ ] Solana payments (SOL/USDC)
- [ ] Real balance management

**Phase 3: User System** 📋
- [ ] User authentication (Phantom + OAuth)
- [ ] Personal profile with statistics
- [ ] Leaderboard/Rankings
- [ ] Bet history per user
- [ ] Win rate, profit tracking, streaks

**Phase 4: Production** 🚀
- [ ] Real price feed (Binance API)
- [ ] WebSocket for live updates
- [ ] Bonus boost system
- [ ] Sponsored rounds
- [ ] Mobile responsive improvements
- [ ] Push notifications

---

## 🧪 Testing

### Manual Testing Flow

1. Start the app: `npm run dev`
2. Create rounds: Visit `/api/admin/run-scheduler`
3. Place bets on the homepage
4. Wait for round to complete
5. Call scheduler again to settle
6. Check results in Round History

### Database Inspection

```bash
npx prisma studio
```

Opens a GUI at `http://localhost:5555` to view all database records.

---

## 🚀 Deployment (Vercel)

1. Push code to GitHub
2. Import project on Vercel
3. Add environment variable: `DATABASE_URL`
4. Deploy!

The `vercel.json` file is configured to run the scheduler every minute automatically.

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📄 License

MIT License - Free to use for any purpose.

---

## ⚠️ Disclaimer

**This is a demo application for educational purposes.**

- Currently uses **mock price data** (not real market prices)
- Uses **fictional amounts** (no real money involved in MVP)
- Do not use with real funds until production-ready integrations are complete
- Proper licensing and regulations may be required for real-money betting applications

---

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/) - React framework
- [Prisma](https://www.prisma.io/) - Database ORM
- [TradingView](https://www.tradingview.com/) - Chart widgets
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Supabase](https://supabase.com/) - PostgreSQL hosting

---

**Built with ❤️ for the crypto community**

*Bet responsibly. Only risk what you can afford to lose.*
