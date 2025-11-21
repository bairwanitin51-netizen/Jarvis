import React, { useState, useEffect } from 'react';
import { TelemetryPanel } from './TelemetryPanel';

interface Stock {
  id: string;
  ticker: string;
  price: number;
  change: number;
}

const initialStocks: Stock[] = [
  { id: 'stark', ticker: 'STARK', price: 482.17, change: 0 },
  { id: 'pym', ticker: 'PYM', price: 95.54, change: 0 },
  { id: 'ham', ticker: 'HAMMER', price: 12.89, change: 0 },
  { id: 'rox', ticker: 'ROXXON', price: 153.22, change: 0 },
];

export const StockTickerPanel: React.FC = () => {
  const [stocks, setStocks] = useState(initialStocks);

  useEffect(() => {
    const interval = setInterval(() => {
      setStocks(prevStocks =>
        prevStocks.map(stock => {
          const changePercent = (Math.random() - 0.49) * 0.05; // small fluctuation
          const newChange = stock.price * changePercent;
          const newPrice = stock.price + newChange;
          return { ...stock, price: newPrice, change: newChange };
        })
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <TelemetryPanel title="MARKET DATA">
      <div className="space-y-2">
        {stocks.map(stock => (
          <div key={stock.id} className="grid grid-cols-3 items-baseline">
            <span className="text-cyan-300 font-bold">{stock.ticker}</span>
            <span className="text-right text-cyan-200">{stock.price.toFixed(2)}</span>
            <span className={`text-right font-bold ${stock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stock.change >= 0 ? '▲' : '▼'} {Math.abs(stock.change).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </TelemetryPanel>
  );
};
