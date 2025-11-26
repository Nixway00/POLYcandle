import { SUPPORTED_SYMBOLS, SYMBOL_DISPLAY, SupportedSymbol } from '@/lib/types';

interface AssetSelectorProps {
  selectedSymbol: SupportedSymbol;
  onSelectSymbol: (symbol: SupportedSymbol) => void;
}

export default function AssetSelector({ selectedSymbol, onSelectSymbol }: AssetSelectorProps) {
  return (
    <div className="flex gap-2 justify-center">
      {SUPPORTED_SYMBOLS.map((symbol) => (
        <button
          key={symbol}
          onClick={() => onSelectSymbol(symbol)}
          className={`
            px-6 py-3 rounded-lg font-semibold transition-all
            ${selectedSymbol === symbol
              ? 'bg-blue-600 text-white shadow-lg scale-105'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }
          `}
        >
          {SYMBOL_DISPLAY[symbol]}
        </button>
      ))}
    </div>
  );
}

