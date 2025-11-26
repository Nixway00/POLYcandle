# 🧪 Testing Guide

Complete guide to testing PolyCandle functionality.

---

## Quick Test Scenario

This is a fast end-to-end test you can run immediately after setup.

### 1. Start the Application

```bash
npm run dev
```

### 2. Create Initial Rounds

Visit in browser:
```
http://localhost:3000/api/admin/run-scheduler
```

Expected response:
```json
{
  "success": true,
  "message": "Scheduler completed successfully"
}
```

### 3. Check Frontend

Go to:
```
http://localhost:3000
```

You should see:
- ✅ Header with "PolyCandle"
- ✅ Asset selector (BTC, ETH, SOL, ZEC)
- ✅ TradingView chart
- ✅ Current round section with countdown timer
- ✅ Betting form
- ✅ Empty history table (no settled rounds yet)

### 4. Place Test Bets

**Bet 1: GREEN**
- Wallet Address: `alice`
- Amount: `100`
- Side: GREEN 🟢

**Bet 2: RED**
- Wallet Address: `bob`
- Amount: `50`
- Side: RED 🔴

**Bet 3: GREEN**
- Wallet Address: `carol`
- Amount: `75`
- Side: GREEN 🟢

### 5. Verify Pool Totals

Current Round should now show:
- **Green Pool**: 175 (100 + 75)
- **Red Pool**: 50
- **Total Pool**: 225

### 6. Calculate Expected Multipliers

```
Total Pool (L) = 175 + 50 = 225
Fee (5%) = 225 × 0.05 = 11.25
Distribution (D) = 225 - 11.25 = 213.75

M_green = 213.75 / 175 = 1.22x
M_red = 213.75 / 50 = 4.28x
```

Verify these appear in the UI!

### 7. Wait for Round to Lock

The round will automatically lock when `startTime` is reached. You can:

**Option A: Wait 5 minutes** (default timeframe)

**Option B: Modify for faster testing**

Edit `lib/types.ts`:
```typescript
export const TIMEFRAME_MS = 1 * 60 * 1000; // 1 minute
```

Then restart and create new rounds.

### 8. Settle the Round

After `endTime` is reached, run scheduler again:
```bash
curl -X POST http://localhost:3000/api/admin/run-scheduler
```

### 9. Check Results

Go back to the frontend and look at the **History Table**.

You should see:
- The settled round
- Winner side (GREEN or RED, random in mock)
- Final multipliers

### 10. Verify Payouts in Database

```bash
npx prisma studio
```

Navigate to the `Bet` table and check:

**If GREEN won:**
- Alice: status = WON, payout = 100 × 1.22 = 122
- Bob: status = LOST, payout = 0
- Carol: status = WON, payout = 75 × 1.22 = 91.5

**If RED won:**
- Alice: status = LOST, payout = 0
- Bob: status = WON, payout = 50 × 4.28 = 214
- Carol: status = LOST, payout = 0

---

## API Testing

### Test 1: Get Current Round

```bash
curl "http://localhost:3000/api/rounds/current?symbol=BTCUSDT"
```

Expected:
```json
{
  "id": "...",
  "symbol": "BTCUSDT",
  "startTime": "2024-01-01T12:00:00.000Z",
  "endTime": "2024-01-01T12:05:00.000Z",
  "status": "OPEN",
  "totalGreen": "0",
  "totalRed": "0",
  "bonusBoost": "0",
  "feeRate": "0.05",
  "multiplierGreen": null,
  "multiplierRed": null,
  "timeRemaining": 300000
}
```

### Test 2: Get Round History

```bash
curl "http://localhost:3000/api/rounds/history?symbol=BTCUSDT&limit=5"
```

Expected: Array of settled rounds (empty initially)

### Test 3: Place Bet

```bash
curl -X POST http://localhost:3000/api/bets \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTCUSDT",
    "roundId": "YOUR_ROUND_ID_HERE",
    "side": "GREEN",
    "amount": 100,
    "walletAddress": "test_user"
  }'
```

Expected:
```json
{
  "bet": {
    "id": "...",
    "roundId": "...",
    "walletAddress": "test_user",
    "side": "GREEN",
    "amount": "100.00000000",
    "payout": "0.00000000",
    "status": "PENDING",
    "createdAt": "..."
  },
  "round": { /* Updated round with new totals */ }
}
```

### Test 4: Invalid Requests

**Missing parameter:**
```bash
curl "http://localhost:3000/api/rounds/current"
```
Expected: 400 Bad Request

**Invalid symbol:**
```bash
curl "http://localhost:3000/api/rounds/current?symbol=INVALID"
```
Expected: 400 Bad Request

**Bet on locked round:**
```bash
# Place bet on a round that has already started
```
Expected: 400 Bad Request with "Cannot place bet. Round is LOCKED"

---

## Database Testing

### Verify Schema

```bash
npx prisma studio
```

Check:
- ✅ Round table exists with correct columns
- ✅ Bet table exists with correct columns
- ✅ Enums are properly defined
- ✅ Relations work (click on a Round, see its Bets)

### Test Data Integrity

**Check Decimal Precision:**

Place a bet with: `10.12345678`

In Prisma Studio, verify it's stored as: `10.12345678` (not rounded)

**Check Timestamps:**

All `createdAt` and `updatedAt` fields should auto-populate.

**Check Cascading:**

(Currently not configured, but can be tested if added)

---

## Edge Cases Testing

### Edge Case 1: No Bets

1. Create a round
2. Don't place any bets
3. Wait for it to settle

Expected:
- Round settles with `winnerSide` = GREEN/RED/DRAW
- No errors
- `multiplierGreen` and `multiplierRed` = null (since no bets)

### Edge Case 2: Bets on One Side Only

1. Create a round
2. Place bets ONLY on GREEN
3. Wait for settlement

Expected:
- If GREEN wins: multipliers calculated normally
- If RED wins: All GREEN bets lose, payout = 0
- No division by zero errors

### Edge Case 3: DRAW Outcome

The mock price feed can produce draws (open == close).

When DRAW occurs:
- All bets should be REFUNDED
- payout = original amount
- No winners, no losers

Test by checking Prisma Studio after a DRAW.

### Edge Case 4: Very Small Amounts

Place bet: `0.00000001`

Expected:
- Accepted
- Calculations remain accurate
- No precision loss

### Edge Case 5: Very Large Amounts

Place bet: `999999999.99`

Expected:
- Accepted (we're not checking user balance in MVP)
- Calculations remain accurate
- Multipliers adjust accordingly

### Edge Case 6: Rapid Bets

Place 10 bets simultaneously using a script:

```bash
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/bets \
    -H "Content-Type: application/json" \
    -d '{
      "symbol": "BTCUSDT",
      "roundId": "YOUR_ROUND_ID",
      "side": "GREEN",
      "amount": 10,
      "walletAddress": "user'$i'"
    }' &
done
wait
```

Expected:
- All bets created successfully
- No race conditions
- Total pool = 100 (10 × 10)

### Edge Case 7: Multiple Symbols

1. Create rounds for all 4 symbols
2. Place bets on each
3. Verify they're independent

Expected:
- Each symbol has separate pool
- Settling one doesn't affect others

---

## Performance Testing

### Load Test: Betting

Use [Artillery](https://artillery.io/) or similar:

```yaml
# artillery.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: 'Place bets'
    flow:
      - post:
          url: '/api/bets'
          json:
            symbol: 'BTCUSDT'
            roundId: 'YOUR_ROUND_ID'
            side: 'GREEN'
            amount: 10
            walletAddress: 'load_test_user'
```

Run:
```bash
npm install -g artillery
artillery run artillery.yml
```

### Database Query Performance

```bash
npx prisma studio
```

Check query times in the Prisma logs (if enabled).

---

## Security Testing

### Test 1: SQL Injection

Try malicious inputs:

```bash
curl -X POST http://localhost:3000/api/bets \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTCUSDT",
    "roundId": "123; DROP TABLE Round;--",
    "side": "GREEN",
    "amount": 10,
    "walletAddress": "hacker"
  }'
```

Expected:
- Request fails (invalid ID format)
- No SQL injection (Prisma protects against this)

### Test 2: XSS

Place bet with:
```json
{
  "walletAddress": "<script>alert('xss')</script>"
}
```

Expected:
- Stored in database as plain text
- Rendered safely in UI (React escapes by default)

### Test 3: Large Payload

Send a 10MB JSON request.

Expected:
- Rejected by Next.js (default body size limit)

---

## Regression Testing Checklist

After any code changes, verify:

- [ ] Can create rounds via scheduler
- [ ] Can place bets (GREEN and RED)
- [ ] Pool totals update correctly
- [ ] Multipliers calculate correctly
- [ ] Rounds lock at startTime
- [ ] Rounds settle at endTime
- [ ] Payouts calculated correctly
- [ ] History displays settled rounds
- [ ] TradingView chart loads
- [ ] All 4 symbols work independently
- [ ] API returns proper error codes
- [ ] Database constraints enforced
- [ ] No console errors in browser
- [ ] No errors in server logs

---

## Automated Testing (Future)

### Unit Tests

Create `__tests__/` directory:

```typescript
// __tests__/pari-mutuel.test.ts
describe('Pari-mutuel calculations', () => {
  test('calculates multipliers correctly', () => {
    const V = 100;
    const R = 50;
    const f = 0.05;
    const L = V + R;
    const D = L * (1 - f);
    
    expect(D / V).toBeCloseTo(1.425);
    expect(D / R).toBeCloseTo(2.85);
  });
});
```

### Integration Tests

Use [Playwright](https://playwright.dev/):

```typescript
// e2e/betting.spec.ts
test('can place a bet', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.fill('input[placeholder*="wallet"]', 'test_user');
  await page.fill('input[placeholder*="amount"]', '10');
  await page.click('button:has-text("GREEN")');
  await page.click('button:has-text("Place Bet")');
  await expect(page.locator('text=Bet placed successfully')).toBeVisible();
});
```

---

## Monitoring in Production

### Vercel Logs

```bash
vercel logs --follow
```

Watch for:
- Scheduler execution
- API errors
- Database connection issues

### Sentry Integration

Add error tracking:

```bash
npm install @sentry/nextjs
```

### Uptime Monitoring

Use services like:
- [UptimeRobot](https://uptimerobot.com/)
- [Pingdom](https://www.pingdom.com/)

Monitor:
- `GET /api/rounds/current?symbol=BTCUSDT`
- `POST /api/admin/run-scheduler`

---

## Debug Checklist

If something doesn't work:

1. **Check server logs**: Look for errors in terminal
2. **Check browser console**: Look for network errors
3. **Check Prisma Studio**: Verify data is correct
4. **Check database connection**: `DATABASE_URL` in `.env`
5. **Check scheduler**: Has it run recently?
6. **Check round status**: Is there an OPEN round?
7. **Clear cache**: `rm -rf .next && npm run dev`
8. **Reset database**: `npx prisma migrate reset` (WARNING: deletes data)

---

## Test Data Cleanup

After testing, clean up:

```bash
npx prisma migrate reset
```

Or manually in Prisma Studio:
- Delete all Bets
- Delete all Rounds

Then create fresh rounds:
```bash
curl -X POST http://localhost:3000/api/admin/run-scheduler
```

---

**Happy testing! 🧪**

Report any bugs or unexpected behavior for future improvements.

