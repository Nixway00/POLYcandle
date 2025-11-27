# 🎯 Multi-Token Betting System - Setup & Testing Guide

## 📋 System Overview

**PolyCandle** now supports multi-token betting with automatic swap to USDC!

### Key Features:
- ✅ **Multi-Token Support**: Bet with SOL, USDC, or BONK
- ✅ **Auto-Swap**: All tokens automatically swapped to USDC
- ✅ **USDC Payouts**: Winners receive USDC automatically
- ✅ **6% Platform Fee**: Covers swap costs + operations
- ✅ **98% Unilateral Refund**: Fair play protection
- ✅ **Real-time Quotes**: Jupiter integration for live rates

---

## 🔧 Setup Steps

### Step 1: Create Platform Wallet

The platform needs a dedicated wallet to receive bets and execute swaps.

**Option A: Create New Wallet (RECOMMENDED)**

```bash
# Install Solana CLI (if not installed)
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Create new keypair
solana-keygen new --outfile platform-wallet.json

# Get public key
solana-keygen pubkey platform-wallet.json
```

**Option B: Export from Phantom**

1. Create new wallet in Phantom
2. Settings → Security & Privacy → Export Private Key
3. Use that key (convert to base58 if needed)

**⚠️ SECURITY:** Never use personal wallet! Create dedicated one.

---

### Step 2: Fund Platform Wallet

The wallet needs SOL for:
- Receiving token payments
- Executing Jupiter swaps
- Sending USDC payouts

**Minimum recommended: 0.5 SOL**

```bash
# Check balance
solana balance <YOUR_PLATFORM_PUBLIC_KEY>

# Send from Phantom or another wallet
```

---

### Step 3: Configure Environment Variables

Add to `.env.local` (**NEVER commit!**):

```env
# Platform Wallet (CRITICAL - KEEP SECRET!)
PLATFORM_WALLET_PRIVATE_KEY=your_base58_private_key_here
PLATFORM_WALLET_PUBLIC_KEY=your_public_key_here

# Existing configs
NEXT_PUBLIC_HELIUS_RPC=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
DATABASE_URL=postgresql://...

# For frontend
NEXT_PUBLIC_PLATFORM_WALLET_PUBLIC_KEY=your_public_key_here
```

**Private Key Formats Supported:**
- Base58 (preferred): `5Kx7y2z...`
- JSON array: `[123,45,67,...]`
- Base64: `SGVsbG8...`

---

### Step 4: Verify Git Ignore

Ensure `.env.local` is NOT committed:

```bash
# Check .gitignore includes:
.env.local
.env
platform-wallet.json

# Verify:
git status
```

---

### Step 5: Update Database

```bash
# Apply new schema (multi-token fields)
npx prisma db push

# Verify
npx prisma studio
```

---

### Step 6: Install Dependencies

```bash
npm install
```

Dependencies added:
- `@solana/spl-token` - USDC transfers
- `bs58` - Key encoding
- (Jupiter API used via REST - no extra package)

---

## 🧪 Testing Flow

### Test 1: Verify Platform Wallet

Create `scripts/test-wallet.ts`:

```typescript
import { Connection } from '@solana/web3.js';
import { verifyPlatformWallet } from '@/lib/platformWallet';

async function testWallet() {
  const connection = new Connection(process.env.NEXT_PUBLIC_HELIUS_RPC!);
  const result = await verifyPlatformWallet(connection);
  
  console.log('Platform Wallet Status:');
  console.log('Valid:', result.valid);
  console.log('Message:', result.message);
  console.log('Balance:', result.balance, 'SOL');
}

testWallet();
```

Run:
```bash
npx ts-node scripts/test-wallet.ts
```

**Expected:** Valid wallet with >0.1 SOL balance

---

### Test 2: Jupiter Quote API

```bash
# Test SOL → USDC quote
curl "http://localhost:3000/api/swap/estimate?token=SOL&amount=0.1"

# Expected response:
{
  "token": "SOL",
  "amount": 0.1,
  "estimatedUsdc": 17.50,
  "conversionRate": 175
}
```

---

### Test 3: Place Real Bet (Small Amount)

1. **Start dev server:**
```bash
npm run dev
```

2. **Connect Phantom Wallet** (ensure you have ~0.01 SOL)

3. **Select Token:**
   - Choose SOL (safest for first test)
   - Amount: `0.01` SOL (~$1.75)

4. **Place Bet:**
   - Click GREEN or RED
   - Approve in Phantom
   - Wait for confirmation

5. **Check Logs:**
```
🔄 Swapping 0.01 SOL to USDC...
✅ Swap complete: 1.75 USDC received
💰 Bet value: 1.75 USDC, Fee: 0.11 USDC, Net: 1.64 USDC
```

6. **Verify in Database:**
```bash
npx prisma studio
# Check Bet record has:
# - paidToken: "SOL"
# - paidAmount: 0.01
# - actualUsdc: 1.75
# - platformFee: 0.11
# - amount: 1.64 (in pool)
```

---

### Test 4: Check Round Settlement

1. **Wait for round to end** (5 minutes)

2. **Trigger scheduler:**
```bash
curl -X POST http://localhost:3000/api/admin/run-scheduler
```

3. **Check logs:**
```
[Scheduler] Settling round...
[Payout] Processing 2 payout(s)...
✅ Sent 3.28 USDC to <wallet> (<signature>)
```

4. **Verify in Phantom:**
   - Should receive USDC in wallet
   - Check transaction on Solscan

---

## 🎯 System Flow Diagram

```
User Perspective:
┌────────────────┐
│ Select Token   │ → SOL / BONK / USDC
└───────┬────────┘
        │
┌───────▼────────┐
│ Enter Amount   │ → 0.5 SOL
└───────┬────────┘
        │
┌───────▼────────────────┐
│ See Estimate           │ → ~87.50 USDC
└───────┬────────────────┘
        │
┌───────▼────────────────┐
│ Approve Transaction    │ → Phantom wallet
└───────┬────────────────┘
        │
┌───────▼────────────────┐
│ Bet Placed! ✅         │
└────────────────────────┘

Backend Flow:
┌────────────────────────────────┐
│ 1. Receive Token Payment       │
│    Platform wallet: +0.5 SOL   │
└───────┬────────────────────────┘
        │
┌───────▼────────────────────────┐
│ 2. Execute Jupiter Swap        │
│    0.5 SOL → 87.32 USDC        │
└───────┬────────────────────────┘
        │
┌───────▼────────────────────────┐
│ 3. Calculate Fees              │
│    Gross: 87.32 USDC           │
│    Fee (6%): 5.24 USDC         │
│    Net: 82.08 USDC → Pool      │
└───────┬────────────────────────┘
        │
┌───────▼────────────────────────┐
│ 4. Update Database             │
│    Track all swap details      │
└───────┬────────────────────────┘
        │
┌───────▼────────────────────────┐
│ 5. Round Ends → Settle         │
│    Calculate winners           │
└───────┬────────────────────────┘
        │
┌───────▼────────────────────────┐
│ 6. Send USDC Payouts           │
│    Platform → Winners          │
└────────────────────────────────┘
```

---

## 💰 Fee Structure

### Normal Bets (Both Sides):
```
User pays: 100 USDC worth
├─ Platform fee (6%): 6 USDC
│  ├─ Swap cost: ~0.3 USDC
│  ├─ Gas fees: ~0.05 USDC
│  └─ Platform: ~5.65 USDC
└─ To pool: 94 USDC

On win: Payout from pool (pari-mutuel)
```

### Unilateral Bets (One Side Only):
```
User pays: 100 USDC worth
└─ Refund (98%): 98 USDC → User
└─ Gas fee (2%): 2 USDC → Platform
```

---

## 🐛 Troubleshooting

### Error: "PLATFORM_WALLET_PRIVATE_KEY not configured"

**Fix:** Add private key to `.env.local`

```bash
# Verify env file exists
cat .env.local | grep PLATFORM_WALLET
```

---

### Error: "Insufficient SOL for gas fees"

**Fix:** Fund platform wallet

```bash
# Check balance
solana balance <YOUR_PLATFORM_PUBLIC_KEY>

# Need minimum 0.1 SOL
```

---

### Error: "Failed to swap tokens to USDC"

**Causes:**
1. Jupiter API down (rare)
2. Insufficient liquidity for token
3. Slippage too tight

**Fix:**
- Check Jupiter status: https://status.jup.ag
- Try different token (SOL most liquid)
- Check logs for specific error

---

### Swap Never Completes

**Check:**
1. Platform wallet has SOL for fees
2. Jupiter transaction didn't fail
3. Check Solscan for swap signature

```bash
# View recent transactions
solana transactions <PLATFORM_WALLET_PUBLIC_KEY>
```

---

### Payout Not Received

**Check:**
1. Round settled? (Run scheduler)
2. Bet won? (Check database)
3. USDC token account created?

**Create USDC account if needed:**
- Send tiny USDC to yourself first
- Or platform creates it automatically (needs extra SOL)

---

## 📊 Monitoring

### Platform Wallet Balance

```typescript
import { monitorWalletBalance } from '@/lib/platformWallet';

// Check balance
const result = await monitorWalletBalance(connection, 0.1);
if (result.needsFunding) {
  console.warn(`⚠️ Low balance: ${result.currentBalance} SOL`);
}
```

### Fee Accumulation

```sql
-- Total fees collected
SELECT 
  SUM(platformFee) as total_fees_usdc,
  COUNT(*) as total_bets
FROM "Bet";
```

### Swap Performance

```sql
-- Average slippage
SELECT 
  AVG(slippage) as avg_slippage,
  AVG(actualUsdc / estimatedUsdc * 100) as avg_rate_accuracy
FROM "Bet"
WHERE swapSignature IS NOT NULL;
```

---

## 🚀 Production Checklist

Before going live:

- [ ] Platform wallet created & funded (1+ SOL)
- [ ] Private keys in `.env.local` (NOT in Git)
- [ ] `.gitignore` includes `.env.local`
- [ ] Test bet placed successfully
- [ ] Swap executed correctly
- [ ] Pool updated with USDC value
- [ ] Round settled and payout sent
- [ ] User received USDC in wallet
- [ ] All transactions verified on Solscan
- [ ] Monitoring in place for wallet balance
- [ ] Error alerts configured

---

## 📞 Support

If you encounter issues:

1. Check logs: `npm run dev` (verbose output)
2. Check platform wallet balance
3. Verify environment variables set
4. Test with smallest amount first (0.01 SOL)
5. Check Solscan for transaction details

---

## 🎉 Next Steps

System is ready for:
- ✅ Multi-token betting (SOL, USDC, BONK)
- ✅ Automatic swaps via Jupiter
- ✅ USDC payouts to winners
- ✅ Fee collection (6%)

**TODO Later:**
- [ ] Add more tokens (JTO, WIF, etc.)
- [ ] x402 integration for anonymous payments
- [ ] Adaptive slippage per token
- [ ] Batch swap optimization
- [ ] AWS Secrets Manager for keys

**Start testing with 0.01 SOL bets! 🚀**

