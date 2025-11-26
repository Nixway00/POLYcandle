export default function Header() {
  return (
    <header className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              PolyCandle
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Bet on the next 5m candle – green or red
            </p>
          </div>
          
          <div className="text-right">
            <p className="text-xs text-gray-500">MVP Version</p>
            <p className="text-xs text-gray-500">No real money involved</p>
          </div>
        </div>
      </div>
    </header>
  );
}

