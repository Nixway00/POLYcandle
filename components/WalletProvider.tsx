'use client';

import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

// Import Solana wallet styles
import '@solana/wallet-adapter-react-ui/styles.css';

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: FC<WalletProviderProps> = ({ children }) => {
  // Mainnet for real SOL transactions
  const network = WalletAdapterNetwork.Mainnet;
  
  // Use public RPC for wallet operations (client-side)
  // Server-side operations use private Helius RPC with API key
  const endpoint = useMemo(() => {
    // Option 1: Use public Helius (no API key, has rate limits)
    // return 'https://api.mainnet-beta.solana.com';
    
    // Option 2: Use Solana Labs public RPC
    return clusterApiUrl(network);
    
    // Note: Sensitive operations (swaps, bets) are done server-side
    // with private Helius RPC that has API key
  }, [network]);
  
  // Initialize wallets
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
    ],
    [network]
  );
  
  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};

