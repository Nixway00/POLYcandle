import Link from 'next/link';

export default function HowToPlayPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">❓ How to Play</h1>

        <div className="space-y-6">
          {/* Step 1 */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-3">1. 💳 Connect Your Wallet</h2>
            <p className="text-gray-300">
              Click "Select Wallet" in the header and connect your Phantom wallet. 
              Make sure you're on Solana Mainnet and have some SOL for betting.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-3">2. 🎯 Choose an Asset</h2>
            <p className="text-gray-300">
              Select from BTC, ETH, SOL, or ZEC. Each asset has independent 5-minute rounds.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-3">3. 🟢🔴 Predict the Outcome</h2>
            <p className="text-gray-300 mb-4">
              Will the next 5-minute candle close GREEN (up) or RED (down)?
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li><strong className="text-green-400">GREEN</strong>: Close price &gt; Open price</li>
              <li><strong className="text-red-400">RED</strong>: Close price &lt; Open price</li>
              <li><strong className="text-gray-400">DRAW</strong>: Close price = Open price (rare, bet refunded)</li>
            </ul>
          </div>

          {/* Step 4 */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-3">4. 💰 Place Your Bet</h2>
            <p className="text-gray-300">
              Enter your bet amount in SOL and click "Place Bet". 
              Approve the transaction in Phantom. Your bet is now placed!
            </p>
          </div>

          {/* Pari-Mutuel System */}
          <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-3">📊 Pari-Mutuel System</h2>
            <p className="text-gray-300 mb-4">
              PolyCandle uses a <strong>pari-mutuel betting model</strong>:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>All bets go into a shared pool</li>
              <li>Platform takes 5% fee</li>
              <li>Winners split the remaining pool based on their bet size</li>
              <li>Your multiplier depends on the pool ratio (more on losing side = higher multiplier)</li>
            </ul>
            
            <div className="mt-4 p-4 bg-gray-800 rounded">
              <p className="font-mono text-sm text-gray-400">
                <strong>Example:</strong><br/>
                Green Pool: 100 SOL<br/>
                Red Pool: 50 SOL<br/>
                Total: 150 SOL<br/>
                Fee (5%): 7.5 SOL<br/>
                Distribution: 142.5 SOL<br/><br/>
                
                If GREEN wins: Multiplier = 142.5 / 100 = <span className="text-green-400">1.425x</span><br/>
                If RED wins: Multiplier = 142.5 / 50 = <span className="text-red-400">2.85x</span>
              </p>
            </div>
          </div>

          {/* Payouts */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-3">💎 Automatic Payouts</h2>
            <p className="text-gray-300">
              When the round ends and you win, payout is automatically sent to your wallet! 
              No need to claim manually. Check your Phantom wallet for the transaction.
            </p>
          </div>

          {/* Fair Play Rule */}
          <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-3">⚖️ Fair Play Rule</h2>
            <p className="text-gray-300 mb-4">
              <strong>Unilateral Betting Protection:</strong> If a round ends with bets only on one side 
              (e.g., everyone bet GREEN but no one bet RED), all bets are automatically refunded.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li><strong>98% refund</strong> - You get back 98% of your bet</li>
              <li><strong>2% gas fee</strong> - Covers blockchain transaction costs for refunds</li>
              <li><strong>Automatic</strong> - No action needed, refund sent to your wallet</li>
            </ul>
            <p className="text-sm text-yellow-300 mt-4">
              💡 This ensures fair play and prevents situations where money would be locked!
            </p>
          </div>

          {/* Tips */}
          <div className="bg-green-900/20 border border-green-500 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-3">💡 Pro Tips</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>Watch the live multipliers - they change as more bets come in</li>
              <li>Check the pool distribution bar to see which side has more bets</li>
              <li>Betting on the underdog (smaller pool) gives higher multipliers but lower win chance</li>
              <li>Set up your profile with a username and avatar to show off in the live feed</li>
              <li>Check Rankings to see top performers and learn from them</li>
            </ul>
          </div>

          {/* CTA */}
          <div className="text-center pt-6">
            <Link
              href="/"
              className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-lg transition"
            >
              Start Betting Now! 🚀
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

