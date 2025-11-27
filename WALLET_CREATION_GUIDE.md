# 🔐 Platform Wallet Setup Guide

## Option 1: Create Dedicated Wallet (RECOMMENDED)

### Using Solana CLI:

```bash
# Install Solana CLI (if not installed)
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Create new wallet
solana-keygen new --outfile platform-wallet.json

# This will output:
# - Public key (wallet address)
# - Seed phrase (SAVE THIS SECURELY!)
```

### Extract Private Key:

```bash
# View the keypair
solana-keygen pubkey platform-wallet.json

# Get base58 private key for .env
# (You'll need to convert the JSON array to base58)
```

---

## Option 2: Use Phantom Wallet

1. Create a new wallet in Phantom
2. Export private key from Settings → Security & Privacy
3. Use that private key in .env

⚠️ **WARNING:** Never use your personal wallet! Create dedicated one.

---

## Environment Variables Setup

Add to `.env.local`:

```env
# Platform Escrow Wallet (NEVER COMMIT!)
PLATFORM_WALLET_PRIVATE_KEY=your_base58_private_key_here
PLATFORM_WALLET_PUBLIC_KEY=your_public_key_here

# Jupiter API (for token swaps)
JUPITER_API_URL=https://quote-api.jup.ag/v6
```

---

## Initial Funding

The platform wallet needs SOL for:
- Gas fees for receiving tokens
- Gas fees for executing swaps
- Gas fees for sending payouts

**Recommended initial balance:** 0.5 - 1 SOL

```bash
# Check balance
solana balance <PLATFORM_WALLET_PUBLIC_KEY>

# Transfer SOL from your wallet
# (Use Phantom or CLI)
```

---

## Security Best Practices

1. ✅ **NEVER** commit private keys to Git
2. ✅ Keep backup of seed phrase in secure location
3. ✅ Use environment variables for keys
4. ✅ Monitor wallet balance regularly
5. ✅ Set up alerts for low balance
6. ✅ Consider using AWS Secrets Manager for production

---

## Verification

Test the wallet connection:

```typescript
import { Keypair, Connection } from '@solana/web3.js';

const connection = new Connection(process.env.NEXT_PUBLIC_HELIUS_RPC!);
const privateKey = Buffer.from(
  process.env.PLATFORM_WALLET_PRIVATE_KEY!,
  'base64'
);
const wallet = Keypair.fromSecretKey(privateKey);

console.log('Platform Wallet:', wallet.publicKey.toBase58());
const balance = await connection.getBalance(wallet.publicKey);
console.log('Balance:', balance / 1e9, 'SOL');
```

---

## Next Steps

After wallet is created and funded:
1. Add keys to `.env.local`
2. Never commit `.env.local`
3. Verify Git ignore is working
4. Test wallet connection
5. Proceed with Jupiter integration

