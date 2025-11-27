# ♻️ Auto-Refill System - Complete Guide

## 🎯 What is Auto-Refill?

The platform wallet needs SOL for gas fees (swaps, payouts). As the system operates, accumulated USDC fees are automatically converted back to SOL to keep the wallet funded.

---

## 🔄 How It Works

```
Lifecycle:
┌────────────────────────────────┐
│ 1. Initial Funding             │
│    Admin funds: 0.1 SOL        │
└───────┬────────────────────────┘
        │
┌───────▼────────────────────────┐
│ 2. System Operates             │
│    - Receives token bets       │
│    - Swaps to USDC             │
│    - Collects 6% fees          │
│    - Pays winners              │
│    SOL: 0.095 → 0.08 → 0.06    │
│    USDC fees: 0 → 10 → 30      │
└───────┬────────────────────────┘
        │
┌───────▼────────────────────────┐
│ 3. Threshold Reached           │
│    SOL drops below 0.05        │
│    System triggers auto-refill │
└───────┬────────────────────────┘
        │
┌───────▼────────────────────────┐
│ 4. Auto-Swap USDC → SOL        │
│    Swap 20 USDC → ~0.11 SOL    │
│    SOL: 0.04 → 0.15 ✅         │
│    USDC fees: 30 → 10          │
└───────┬────────────────────────┘
        │
┌───────▼────────────────────────┐
│ 5. System Auto-Sustainable     │
│    Cycle repeats forever ♻️    │
└────────────────────────────────┘
```

---

## ⚙️ Configuration

### Thresholds (in `lib/autoRefill.ts`):

```typescript
MIN_SOL_THRESHOLD = 0.05      // Trigger refill when below this
USDC_SWAP_AMOUNT = 20         // Swap 20 USDC each refill
MIN_USDC_FOR_REFILL = 25      // Need 25 USDC to allow refill
```

### Trigger Points:

1. **Automatic**: After each round settlement (in scheduler)
2. **Manual**: Via API endpoint or UI button

---

## 📊 System States

### State 1: Healthy 💚
```
SOL: 0.15
USDC: 50
Status: No action needed
```

### State 2: Low SOL (Auto-Refill) 🟡
```
SOL: 0.04
USDC: 30
Status: Auto-refill triggered
Action: Swap 20 USDC → 0.11 SOL
Result: SOL → 0.15 ✅
```

### State 3: Critical (Need Funding) 🔴
```
SOL: 0.03
USDC: 10
Status: Cannot auto-refill
Action: MANUAL FUNDING REQUIRED!
```

---

## 🛠️ Implementation

### Files Created:

1. **`lib/autoRefill.ts`**
   - Core auto-refill logic
   - USDC → SOL swap function
   - Balance monitoring
   - Status checking

2. **`app/api/admin/wallet-status/route.ts`**
   - GET: Check wallet status
   - POST: Trigger manual refill

3. **`components/WalletStatusCard.tsx`**
   - UI component for monitoring
   - Shows SOL/USDC balances
   - Manual refill button

4. **Updated `lib/roundScheduler.ts`**
   - Integrated auto-refill check
   - Runs after every settlement

---

## 🧪 Testing Auto-Refill

### Test 1: Check Status

```bash
# Get current wallet status
curl http://localhost:3000/api/admin/wallet-status

# Expected response:
{
  "success": true,
  "wallet": {
    "solBalance": "0.0950",
    "usdcBalance": "25.00",
    "needsRefill": false,
    "canRefill": true,
    "refillThreshold": 0.05,
    "estimatedRefills": 1
  },
  "message": "✅ Wallet SOL sufficient"
}
```

### Test 2: Manual Refill

```bash
# Trigger manual refill
curl -X POST http://localhost:3000/api/admin/wallet-status

# Expected response:
{
  "success": true,
  "message": "✅ Auto-refill successful! 20 USDC → 0.1143 SOL",
  "details": {
    "solBefore": "0.0400",
    "solAfter": "0.1543",
    "usdcSpent": "20.00"
  }
}
```

### Test 3: Automatic Trigger

```bash
# Run scheduler (will auto-check)
curl -X POST http://localhost:3000/api/admin/run-scheduler

# Check logs:
[Scheduler] Checking auto-refill status...
[Scheduler] Wallet status: 0.0400 SOL, 30.00 USDC
[Scheduler] SOL below threshold, attempting auto-refill...
🔄 Swapping 20 USDC → SOL for gas refill...
💰 Expected: 0.1143 SOL
✅ Refill successful! Received 0.1143 SOL
[Scheduler] ✅ Auto-refill successful! 20 USDC → 0.1143 SOL
```

---

## 📈 Monitoring Dashboard

The `WalletStatusCard` component shows:

- **SOL Balance**: Current gas balance
- **USDC Fees**: Accumulated platform fees
- **Status**: Healthy / Low SOL warning
- **Estimated Refills**: How many times can refill with current USDC
- **Manual Refill Button**: Emergency refill trigger

---

## 🚨 Edge Cases

### Case 1: Insufficient USDC

```
SOL: 0.03 (below threshold)
USDC: 10 (below 25 minimum)

Status: Cannot auto-refill
Solution: Wait for more bets to accumulate USDC
          OR manually fund with SOL
```

### Case 2: Jupiter API Down

```
Refill attempt fails
Status: Retry on next scheduler run
Fallback: Manual funding if critical
```

### Case 3: First Startup (Empty Wallet)

```
SOL: 0
USDC: 0

Status: System cannot start
Solution: MUST manually fund with 0.1 SOL initially
```

---

## 💰 Economics

### Cost Analysis:

```
Gas Fee per Transaction: ~0.00005 SOL (~$0.01)

Operations per Round:
├─ Receive bets: ~5 transactions
├─ Execute swaps: ~5 transactions  
└─ Send payouts: ~5 transactions
Total: ~15 transactions

Cost per Round: ~0.00075 SOL (~$0.15)

Fee Revenue per Round (example):
├─ 10 bets × 20 USDC average = 200 USDC
├─ Platform fee (6%): 12 USDC
└─ Gas costs: ~0.15 USDC
Net profit: 11.85 USDC per round ✅

Refill Frequency:
0.1 SOL ÷ 0.00075 per round = ~133 rounds
If rounds = 5 min → ~11 hours of operation per refill
```

### Sustainability:

```
Break-even: ~1.25 USDC in fees per round
Actual: ~12 USDC per round (10x margin!) ✅

System is HIGHLY sustainable! 🚀
```

---

## 🎯 Best Practices

### 1. Initial Funding
- **Start with**: 0.1 - 0.2 SOL
- **Minimum**: 0.05 SOL (emergency threshold)
- **Optimal**: 0.5 SOL (worry-free)

### 2. Monitoring
- Check wallet status daily (or use alerts)
- Monitor USDC fee accumulation
- Set up notifications for low SOL

### 3. Emergency Procedures
If SOL drops to 0:
1. Check USDC balance
2. If USDC > 25: Manually trigger refill via API
3. If USDC < 25: Fund externally with SOL

### 4. Optimization
- Adjust `MIN_SOL_THRESHOLD` based on traffic
- Increase `USDC_SWAP_AMOUNT` for busy periods
- Lower `MIN_USDC_FOR_REFILL` if needed

---

## 🔧 Configuration Changes

To adjust thresholds, edit `lib/autoRefill.ts`:

```typescript
// Conservative (more frequent refills)
const MIN_SOL_THRESHOLD = 0.1;  // Refill sooner
const USDC_SWAP_AMOUNT = 30;    // Larger swaps

// Aggressive (fewer refills)
const MIN_SOL_THRESHOLD = 0.03; // Wait longer
const USDC_SWAP_AMOUNT = 15;    // Smaller swaps
```

**Recommended**: Keep defaults for balanced operation.

---

## 📞 Troubleshooting

### Error: "Insufficient USDC for refill"

**Cause**: USDC balance < 25
**Fix**: Wait for more bets or lower `MIN_USDC_FOR_REFILL`

### Error: "Failed to get Jupiter quote"

**Cause**: Jupiter API issue or low liquidity
**Fix**: Retry later or manually fund with SOL

### Warning: "Wallet SOL below threshold"

**Cause**: High transaction volume
**Fix**: System will auto-refill if USDC available

### Critical: "Cannot execute swaps"

**Cause**: SOL = 0
**Fix**: Immediately fund wallet with SOL externally

---

## 🎉 Summary

The Auto-Refill system makes PolyCandle **fully autonomous**:

- ✅ No manual SOL management needed
- ✅ Accumulated fees fund operations
- ✅ Self-sustaining after initial funding
- ✅ Monitoring UI for transparency
- ✅ Manual override available
- ✅ Highly profitable (10x margin)

**Initial investment**: 0.1 SOL (~$17.50)  
**Break-even**: After ~2-3 rounds  
**Sustainability**: Infinite ♾️

---

## 🚀 Next Steps

1. ✅ Fund wallet with 0.1 SOL
2. ✅ Place test bet
3. ✅ Wait for fees to accumulate
4. ✅ Watch auto-refill trigger
5. ✅ System runs autonomously!

**The platform is now self-sustaining! 🎊**

