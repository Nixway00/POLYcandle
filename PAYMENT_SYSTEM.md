# 💰 Payment System Architecture

## Overview

PolyCandle supports multi-token payments with automatic conversion to USDC using Jupiter Aggregator.

---

## 🎯 Payment Flow

### User Places Bet

```
1. User clicks "Place Bet" (10 USDC worth)
2. Frontend shows token options:
   - USDC (10 USDC)
   - SOL (~0.07 SOL)
   - BONK (~1,000,000 BONK)
   - Other SPL tokens

3. User selects token and confirms in Phantom
4. Transaction sent to blockchain
5. Backend receives payment notification
6. If token != USDC:
   - Backend calls Jupiter API
   - Swap token → USDC
   - Transaction signature saved
7. Bet recorded in database (amount always in USDC)
8. Live Bet Feed updates in real-time
```

---

## 🔄 Jupiter Integration

### Automatic Token Swap

```typescript
// Example: User pays 0.07 SOL for 10 USDC bet

import { Connection, PublicKey } from '@solana/web3.js';

async function swapToUSDC(inputToken: string, inputAmount: number) {
  // 1. Get quote from Jupiter
  const quote = await fetch(
    `https://quote-api.jup.ag/v6/quote?` +
    `inputMint=${inputToken}` +
    `&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` + // USDC
    `&amount=${inputAmount}` +
    `&slippageBps=50` // 0.5% slippage
  ).then(res => res.json());

  // 2. Get swap transaction
  const { swapTransaction } = await fetch('https://quote-api.jup.ag/v6/swap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey: escrowWallet.publicKey.toString(),
    })
  }).then(res => res.json());

  // 3. Execute swap
  const transaction = Transaction.from(
    Buffer.from(swapTransaction, 'base64')
  );
  
  const signature = await connection.sendTransaction(
    transaction,
    [escrowWallet]
  );

  return {
    signature,
    outputAmount: quote.outAmount / 1e6, // USDC has 6 decimals
  };
}
```

---

## 📊 Database Schema

### Bet Model

```prisma
model Bet {
  id                    String    @id @default(cuid())
  roundId               String
  walletAddress         String
  side                  BetSide
  amount                Decimal   // Always in USDC
  
  // Payment tracking
  transactionSignature  String?   // Solana TX ID
  paidToken             String?   // "SOL", "USDC", "BONK"
  paidAmount            Decimal?  // Amount in original token
  paymentMethod         String    // "wallet" or "x402"
  
  // User identity
  username              String?   // Display name
  isAnonymous           Boolean   // Hide from live feed
  
  // ... rest
}
```

---

## 🔴 Live Bets Feed

### Features

- Real-time updates (3 second polling)
- Shows last 50 bets for current round
- Display format:
  ```
  🕶️ Anonymous
  GREEN
  10.00 USDC
  18:32:15
  ```

### Privacy Options

**Public Mode (default):**
- Shows username or truncated wallet
- Displays transaction in feed

**Anonymous Mode (x402 or user choice):**
- Shows "🕶️ Anonymous"
- Transaction still recorded but hidden

---

## 💼 Wallet Structure

### Escrow Wallet
- Receives all incoming bets
- Holds funds during round
- Sends payouts to winners
- Automatic via backend

### Fee Wallet (5%)
- Receives platform fee from each round
- Secure storage (multi-sig recommended)
- Periodic withdrawal by admins

---

## 🔐 Security

### Transaction Verification

```typescript
// Verify on-chain transaction before crediting bet
async function verifyTransaction(signature: string, expectedAmount: number) {
  const tx = await connection.getTransaction(signature);
  
  // Check:
  // 1. Transaction exists and confirmed
  // 2. Amount matches expected
  // 3. Recipient is our escrow wallet
  // 4. Transaction not already used
  
  if (valid) {
    // Credit bet
  } else {
    // Reject
  }
}
```

### Anti-Fraud

- Each transaction signature used only once
- Amount verification on-chain
- Rate limiting per wallet
- Suspicious activity monitoring

---

## 💸 Settlement Flow

### When Round Ends

```typescript
// Example: Round with 225 USDC total

const totalPool = 225; // USDC
const platformFee = totalPool * 0.05; // 11.25 USDC
const distributionPool = totalPool - platformFee; // 213.75 USDC

// Winners (Bob bet 50 USDC on RED, multiplier 4.275x)
const bobPayout = 50 * 4.275; // 213.75 USDC

// Automatic transactions:
1. Send 213.75 USDC to Bob's wallet
2. Send 11.25 USDC to fee wallet
3. Update database: Bob status = WON, payout = 213.75
4. Transaction signature saved for Bob's payout
```

---

## 🌐 Supported Tokens (Launch)

- ✅ USDC (native)
- ✅ SOL
- ✅ BONK
- ✅ JUP
- ✅ Any SPL token with liquidity

### Adding New Tokens

Jupiter supports 100+ tokens automatically. No code changes needed!

---

## 📱 Frontend Components

### Payment Modal

```tsx
<PaymentModal
  amount={10}           // USDC value
  onSuccess={(tx) => {
    // Bet placed successfully
    // Transaction: tx.signature
  }}
  allowedTokens={['USDC', 'SOL', 'BONK']}
  showAnonymousOption={true}
/>
```

### Live Bets Feed

```tsx
<LiveBetsFeed 
  symbol="BTCUSDT"
  refreshInterval={3000}
/>
```

---

## 🚀 Future Enhancements

### Phase 2
- [ ] WebSocket for instant bet updates (no polling)
- [ ] Bulk settlement (multiple rounds at once)
- [ ] Batched transactions (lower fees)

### Phase 3 (Full On-Chain)
- [ ] Solana Program (smart contract)
- [ ] PDA-based escrow (zero trust)
- [ ] On-chain settlement
- [ ] Fully decentralized

---

## 📊 Cost Analysis

### Per Round (10 users, average bet)

**Costs:**
- 10 incoming transactions: ~$0.0025
- 1 Jupiter swap (avg): ~$0.005
- 5 payout transactions: ~$0.00125
- **Total: ~$0.008 per round**

**Revenue (10 users × $10 bet):**
- Total pool: $100
- Platform fee (5%): $5
- **Net profit: $4.99**

**Margin: 99.8%** 🚀

---

## 🔧 Implementation Checklist

- [x] Database schema updated
- [x] Live Bets Feed component
- [x] Live Bets API endpoint
- [x] UI layout with sidebar
- [ ] Phantom wallet integration
- [ ] Jupiter swap integration
- [ ] Payment verification
- [ ] Settlement automation
- [ ] Transaction signature tracking
- [ ] Anonymous mode

---

**Next Steps:** Implement Phantom Wallet connection and Jupiter swap integration.

