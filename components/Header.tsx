'use client';

import dynamic from 'next/dynamic';

const WalletConnectButton = dynamic(
  () => import('./WalletConnectButton'),
  { ssr: false }
);

export default function Header() {
  return (
    <header className="border-b border-gray-700 bg-gray-950 sticky top-0 z-30">
      <div className="px-6 py-4">
        <div className="flex items-center justify-end">
          {/* Right: Wallet Button */}
          <WalletConnectButton />
        </div>
      </div>
    </header>
  );
}

