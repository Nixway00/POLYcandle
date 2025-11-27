import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { WalletProvider } from '@/components/WalletProvider'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PolyCandle - Bet on Crypto Candles',
  description: 'Bet on the next 5m candle - green or red',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <WalletProvider>
          <div className="flex">
            {/* Sidebar - Fixed Left */}
            <Sidebar />
            
            {/* Main Content - Right of Sidebar */}
            <div className="flex-1 ml-64">
              <Header />
              {children}
            </div>
          </div>
        </WalletProvider>
      </body>
    </html>
  )
}

