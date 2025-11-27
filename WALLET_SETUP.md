# 💳 Wallet Setup Guide

## Quick Setup for Testing

### Step 1: Install Dependencies

```bash
npm install
```

This installs:
- `@solana/wallet-adapter-react`
- `@solana/wallet-adapter-react-ui`
- `@solana/web3.js`
- Phantom & Solflare wallet adapters

---

### Step 2: Create Escrow Wallet

You need a Solana wallet to receive bet payments.

**Option A: Use Phantom (Easy)**

1. Open Phantom browser extension
2. Create a new wallet or use existing
3. Copy your wallet address
4. Create `.env.local` in project root:

```env
NEXT_PUBLIC_ESCROW_WALLET="YOUR_WALLET_ADDRESS_HERE"
```

**Option B: Generate with Solana CLI (Advanced)**

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Generate new keypair
solana-keygen new --outfile escrow-wallet.json

# Get public key
solana-keygen pubkey escrow-wallet.json
```

Add to `.env.local`:
```env
NEXT_PUBLIC_ESCROW_WALLET="<output_from_above_command>"
```

---

### Step 3: Get Testnet SOL

**For Testing on Devnet:**

```bash
# Install Solana CLI if not already
# Then airdrop testnet SOL
solana airdrop 2 YOUR_WALLET_ADDRESS --url devnet
```

Or use faucet:
https://faucet.solana.com/

---

### Step 4: Configure Network

**Edit `components/WalletProvider.tsx`:**

For testing:
```typescript
const network = WalletAdapterNetwork.Devnet; // Use devnet
```

For production:
```typescript
const network = WalletAdapterNetwork.Mainnet; // Use mainnet-beta
```

---

### Step 5: Start the App

```bash
npm run dev
```

---

## Testing the Wallet

1. **Connect Phantom**
   - Click "Select Wallet" button in header
   - Choose Phantom
   - Approve connection

2. **Place a Test Bet**
   - Select an asset (BTC/ETH/SOL/ZEC)
   - Enter amount (e.g., 0.01 SOL)
   - Choose GREEN or RED
   - Click "Place Bet"
   - Approve transaction in Phantom

3. **Check Transaction**
   - Copy transaction signature from success message
   - View on Solana Explorer:
     - Devnet: `https://explorer.solana.com/?cluster=devnet`
     - Mainnet: `https://explorer.solana.com/`

---

## Wallet Security

### For Testing (Devnet)
- Use a separate wallet with no real funds
- Never share private keys

### For Production (Mainnet)
- Use a dedicated escrow wallet
- Consider multi-sig for security
- Implement withdrawal limits
- Monitor wallet balance regularly
- Use hardware wallet for cold storage

---

## Troubleshooting

### "Connect your wallet first"
- Make sure Phantom extension is installed
- Click "Select Wallet" button
- Approve connection request

### "Insufficient funds"
- Check wallet balance in Phantom
- On devnet: use faucet to get test SOL
- On mainnet: add real SOL

### "Transaction failed"
- Check network (devnet vs mainnet)
- Ensure escrow wallet address is correct
- Verify sufficient SOL for gas fees (~0.000005 SOL)

### Wallet not detected
- Install Phantom: https://phantom.app/
- Refresh the page
- Try different browser if issues persist

---

## Next Steps

- [ ] Test betting with real wallet
- [ ] Implement Jupiter swap for multi-token support
- [ ] Add settlement automation
- [ ] Set up fee wallet for 5% platform fees

---

**Ready to test!** 🚀

