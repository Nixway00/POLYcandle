'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';

const menuItems = [
  { name: 'Home', path: '/', icon: '🏠', description: 'Betting' },
  { name: 'My Profile', path: '/profile', icon: '👤', description: 'Stats & Settings', requiresWallet: true },
  { name: 'Rankings', path: '/rankings', icon: '🏆', description: 'Leaderboard' },
  { name: 'My Bets', path: '/my-bets', icon: '📜', description: 'History', requiresWallet: true },
  { name: 'Statistics', path: '/stats', icon: '📊', description: 'Platform Stats' },
  { name: 'How to Play', path: '/how-to-play', icon: '❓', description: 'Guide' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { connected } = useWallet();

  const visibleItems = menuItems.filter(item => 
    !item.requiresWallet || connected
  );

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-700 min-h-screen fixed left-0 top-0 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <Link href="/" className="block hover:opacity-80 transition-opacity">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            PolyCandle
          </h1>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
            5-min Candle Betting
          </p>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {visibleItems.map((item) => {
            const isActive = pathname === item.path;
            
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                  ${isActive 
                    ? 'bg-white text-gray-900 font-semibold' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }
                `}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-gray-700">
        <div className="text-xs text-gray-400">
          {connected ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Wallet Connected</span>
            </div>
          ) : (
            <p>Connect wallet for more features</p>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          v1.0.0 • Mainnet
        </p>
      </div>
    </aside>
  );
}

