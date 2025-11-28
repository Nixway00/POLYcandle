# 🔐 Environment Variables Guide

## ⚠️ SECURITY: Public vs Private Variables

### Understanding NEXT_PUBLIC_*

In Next.js:
- Variables starting with `NEXT_PUBLIC_` are **EXPOSED to the browser**
- Anyone can see them in the client-side JavaScript bundle
- **NEVER** put API keys, secrets, or sensitive data in `NEXT_PUBLIC_*`

---

## 📋 Required Environment Variables

### For Local Development (`.env.local`)

```env
# ========================================
# DATABASE
# ========================================
DATABASE_URL=postgresql://postgres.[PROJECT]:[PASSWORD]@[HOST]/postgres?pgbouncer=true

# ========================================
# SOLANA RPC (SERVER-SIDE ONLY)
# ========================================
# Private Helius RPC with API key - NEVER expose this!
HELIUS_RPC=https://mainnet.helius-rpc.com/?api-key=YOUR_HELIUS_API_KEY

# ========================================
# PLATFORM WALLET (CRITICAL SECRETS!)
# ========================================
# Private key - MUST be kept secret!
PLATFORM_WALLET_PRIVATE_KEY=your_base58_private_key_here

# Public keys - safe to expose
PLATFORM_WALLET_PUBLIC_KEY=ANARPXURjPnZGa4beymeJMP1iBtM2BenjznSMPadLfKw
NEXT_PUBLIC_PLATFORM_WALLET_PUBLIC_KEY=ANARPXURjPnZGa4beymeJMP1iBtM2BenjznSMPadLfKw
```

---

## 🌐 For Vercel Deployment

Add these in **Vercel Dashboard** → **Settings** → **Environment Variables**:

### Production Variables

```
DATABASE_URL
HELIUS_RPC
PLATFORM_WALLET_PRIVATE_KEY
PLATFORM_WALLET_PUBLIC_KEY
NEXT_PUBLIC_PLATFORM_WALLET_PUBLIC_KEY
```

**Important:**
- All variables except `NEXT_PUBLIC_*` are server-side only
- They are NOT exposed to the browser
- Safe to store API keys and secrets

---

## 🔒 How We Protect Helius API Key

### The Problem
```
❌ OLD (INSECURE):
NEXT_PUBLIC_HELIUS_RPC=https://mainnet.helius-rpc.com/?api-key=xxx

Client (Browser) → Helius RPC (with API key visible!)
Anyone can steal your API key from browser DevTools!
```

### The Solution
```
✅ NEW (SECURE):
HELIUS_RPC=https://mainnet.helius-rpc.com/?api-key=xxx
(Server-side only, never exposed)

Client (Browser) → /api/rpc-proxy → Helius RPC (API key hidden!)
API key stays on server, clients can't see it!
```

---

## 🏗️ Architecture

### Client-Side (Browser)
```typescript
// WalletProvider.tsx
const endpoint = clusterApiUrl(WalletAdapterNetwork.Mainnet);
// Uses public Solana RPC (no API key needed)
// Only for wallet operations (connect, sign)
```

### Server-Side (API Routes)
```typescript
// app/api/bets/route.ts
const connection = new Connection(process.env.HELIUS_RPC!);
// Uses private Helius RPC with API key
// For swaps, bets, settlements
```

### RPC Proxy (Optional)
```typescript
// app/api/rpc-proxy/route.ts
// Client can call this for better performance
// Server forwards to Helius with API key
```

---

## 📝 Variable Descriptions

### `DATABASE_URL`
- **Type:** Server-side
- **Purpose:** PostgreSQL connection string
- **Example:** `postgresql://user:pass@host/db?pgbouncer=true`

### `HELIUS_RPC`
- **Type:** Server-side (CRITICAL!)
- **Purpose:** Solana RPC with API key for server operations
- **Example:** `https://mainnet.helius-rpc.com/?api-key=xxx`
- **⚠️ NEVER expose this!**

### `PLATFORM_WALLET_PRIVATE_KEY`
- **Type:** Server-side (CRITICAL!)
- **Purpose:** Private key for platform escrow wallet
- **Format:** Base58, JSON array, or Base64
- **⚠️ NEVER expose this! Loss = loss of all funds!**

### `PLATFORM_WALLET_PUBLIC_KEY`
- **Type:** Server-side
- **Purpose:** Public address of platform wallet
- **Example:** `ANARPXURjPnZGa4beymeJMP1iBtM2BenjznSMPadLfKw`

### `NEXT_PUBLIC_PLATFORM_WALLET_PUBLIC_KEY`
- **Type:** Client-side (public)
- **Purpose:** Platform wallet address for client to send payments
- **Example:** `ANARPXURjPnZGa4beymeJMP1iBtM2BenjznSMPadLfKw`
- **✅ Safe to expose (it's a public address)**

---

## 🧪 Testing Configuration

### Check if variables are set correctly:

```typescript
// Server-side test (API route)
console.log('HELIUS_RPC:', process.env.HELIUS_RPC ? 'Set ✅' : 'Missing ❌');
console.log('PLATFORM_WALLET_PRIVATE_KEY:', process.env.PLATFORM_WALLET_PRIVATE_KEY ? 'Set ✅' : 'Missing ❌');

// Client-side test (component)
console.log('PUBLIC_WALLET:', process.env.NEXT_PUBLIC_PLATFORM_WALLET_PUBLIC_KEY);
console.log('HELIUS (should be undefined):', process.env.HELIUS_RPC); // undefined = good!
```

---

## ⚠️ Security Checklist

- [x] `.env.local` in `.gitignore` ✅
- [x] `HELIUS_RPC` is NOT `NEXT_PUBLIC_*` ✅
- [x] Platform private key is NOT `NEXT_PUBLIC_*` ✅
- [x] Client uses public RPC for wallet operations ✅
- [x] Server uses private RPC for swaps/bets ✅
- [x] RPC proxy implemented for optional client performance ✅

---

## 🚨 Common Mistakes

### ❌ DON'T DO THIS:
```env
# WRONG! This exposes your API key!
NEXT_PUBLIC_HELIUS_RPC=https://mainnet.helius-rpc.com/?api-key=xxx
```

### ✅ DO THIS:
```env
# Server-side only (safe)
HELIUS_RPC=https://mainnet.helius-rpc.com/?api-key=xxx
```

---

## 📞 Troubleshooting

### "RPC endpoint not configured"
- Check `HELIUS_RPC` is set in environment
- Make sure it's NOT `NEXT_PUBLIC_HELIUS_RPC`

### "API key visible in browser"
- Remove any `NEXT_PUBLIC_` prefix from sensitive variables
- Client should use public RPC or proxy

### "Wallet operations failing"
- Check `NEXT_PUBLIC_PLATFORM_WALLET_PUBLIC_KEY` is set
- Verify it matches the actual platform wallet address

---

## 🎉 Summary

**Server-Side (Secret):**
- `DATABASE_URL`
- `HELIUS_RPC` ⚠️
- `PLATFORM_WALLET_PRIVATE_KEY` ⚠️
- `PLATFORM_WALLET_PUBLIC_KEY`

**Client-Side (Public):**
- `NEXT_PUBLIC_PLATFORM_WALLET_PUBLIC_KEY`

**RPC Strategy:**
- Client: Public Solana RPC (or proxy)
- Server: Private Helius RPC with API key
- Critical operations: Always server-side

**Your API key is now safe!** 🔒

