'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

export default function WalletConnectButton() {
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  
  const handleClick = () => {
    if (connected) {
      disconnect();
    } else {
      setVisible(true);
    }
  };
  
  if (connected && publicKey) {
    return (
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-400 font-mono">
              {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
            </span>
          </div>
        </div>
        
        <button
          onClick={handleClick}
          className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 rounded-lg text-sm font-medium text-gray-300 transition-all"
        >
          Disconnect
        </button>
      </div>
    );
  }
  
  return (
    <button
      onClick={handleClick}
      className="px-8 py-3 bg-white hover:bg-gray-100 text-gray-900 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
    >
      Connect Wallet
    </button>
  );
}

