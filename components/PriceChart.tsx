'use client';

import { useState, useEffect, useRef } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PriceChartProps {
  crypto: string;
}

interface OHLCData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

type TimeFrame = '1H' | '4H' | '1D' | '1W' | '1M';

const TIMEFRAME_CONFIG: Record<TimeFrame, { days: number; interval: string; label: string }> = {
  '1H': { days: 1, interval: 'minutely', label: '1 Hour' },
  '4H': { days: 7, interval: 'hourly', label: '4 Hours' },
  '1D': { days: 30, interval: 'daily', label: '1 Day' },
  '1W': { days: 90, interval: 'daily', label: '1 Week' },
  '1M': { days: 180, interval: 'daily', label: '1 Month' },
};

export default function PriceChart({ crypto }: PriceChartProps): React.ReactNode {
  const [chartData, setChartData] = useState<any>(null);
  const [volumeData, setVolumeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<TimeFrame>('1D');
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [priceChangePercent, setPriceChangePercent] = useState<number>(0);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    fetchChartData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crypto, timeframe]);

  const fetchChartData = async (): Promise<void> => {
    setLoading(true);
    try {
      const config = TIMEFRAME_CONFIG[timeframe];
      
      // Fetch OHLC data from CoinGecko
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${crypto}/ohlc?vs_currency=usd&days=${config.days}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch OHLC data');
      }
      
      const ohlcData = await response.json();
      
      // Fetch current price data
      const priceResponse = await fetch(
        `https://api.coingecko.com/api/v3/coins/${crypto}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false`
      );
      
      const priceData = await priceResponse.json();
      
      if (priceData.market_data) {
        setCurrentPrice(priceData.market_data.current_price.usd);
        setPriceChange(priceData.market_data.price_change_24h);
        setPriceChangePercent(priceData.market_data.price_change_percentage_24h);
      }
      
      if (ohlcData && ohlcData.length > 0) {
        processOHLCData(ohlcData);
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
      // Try fallback with market chart
      try {
        const config = TIMEFRAME_CONFIG[timeframe];
        const fallbackResponse = await fetch(
          `https://api.coingecko.com/api/v3/coins/${crypto}/market_chart?vs_currency=usd&days=${config.days}&interval=${config.interval}`
        );
        const fallbackData = await fallbackResponse.json();
        
        if (fallbackData.prices) {
          setCurrentPrice(fallbackData.prices[fallbackData.prices.length - 1][1]);
          if (fallbackData.prices.length > 1) {
            const firstPrice = fallbackData.prices[0][1];
            const lastPrice = fallbackData.prices[fallbackData.prices.length - 1][1];
            setPriceChange(lastPrice - firstPrice);
            setPriceChangePercent(((lastPrice - firstPrice) / firstPrice) * 100);
          }
          processMarketChartData(fallbackData.prices, fallbackData.total_volumes);
        }
      } catch (fallbackError) {
        console.error('Error fetching fallback data:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const processOHLCData = (ohlcData: number[][]) => {
    const labels = ohlcData.map((item: number[]) => {
      const date = new Date(item[0]);
      if (timeframe === '1H' || timeframe === '4H') {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    // Create candle data (using open/close for line)
    const prices = ohlcData.map((item: number[]) => item[4]); // close price
    
    // Determine color based on price movement
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const isPositive = lastPrice >= firstPrice;
    const color = isPositive ? '#22c55e' : '#ef4444';
    
    setChartData({
      labels,
      datasets: [
        {
          label: `${crypto.toUpperCase()} Price`,
          data: prices,
          borderColor: color,
          backgroundColor: `${color}20`,
          fill: true,
          tension: 0.1,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: color,
          borderWidth: 2,
        },
      ],
    });
  };

  const processMarketChartData = (prices: [number, number][], volumes?: [number, number][]) => {
    const labels = prices.map((price: [number, number]) => {
      const date = new Date(price[0]);
      if (timeframe === '1H' || timeframe === '4H') {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const priceValues = prices.map((price: [number, number]) => price[1]);
    
    // Determine color based on price movement
    const firstPrice = priceValues[0];
    const lastPrice = priceValues[priceValues.length - 1];
    const isPositive = lastPrice >= firstPrice;
    const color = isPositive ? '#22c55e' : '#ef4444';
    
    setChartData({
      labels,
      datasets: [
        {
          label: `${crypto.toUpperCase()} Price`,
          data: priceValues,
          borderColor: color,
          backgroundColor: (context: any) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, isPositive ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)');
            gradient.addColorStop(1, isPositive ? 'rgba(34, 197, 94, 0)' : 'rgba(239, 68, 68, 0)');
            return gradient;
          },
          fill: true,
          tension: 0.1,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: color,
          borderWidth: 2,
        },
      ],
    });

    // Process volume data
    if (volumes && volumes.length > 0) {
      const volumeValues = volumes.map((vol: [number, number]) => vol[1]);
      const firstVolPrice = prices[0] ? prices[0][1] : 0;
      const lastVolPrice = prices[prices.length - 1] ? prices[prices.length - 1][1] : 0;
      const volColor = lastVolPrice >= firstVolPrice ? '#22c55e' : '#ef4444';
      
      setVolumeData({
        labels,
        datasets: [
          {
            label: 'Volume',
            data: volumeValues,
            backgroundColor: `${volColor}60`,
            borderColor: volColor,
            borderWidth: 1,
          },
        ],
      });
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#fff',
        bodyColor: '#9ca3af',
        borderColor: '#374151',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context: any) => `$${context.parsed.y.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(75, 85, 99, 0.2)',
        },
        ticks: {
          color: '#9ca3af',
          maxTicksLimit: 8,
        },
      },
      y: {
        position: 'right' as const,
        grid: {
          color: 'rgba(75, 85, 99, 0.2)',
        },
        ticks: {
          color: '#9ca3af',
          callback: (value: any) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        },
      },
    },
  };

  const volumeOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#fff',
        bodyColor: '#9ca3af',
        borderColor: '#374151',
        borderWidth: 1,
        padding: 12,
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        position: 'right' as const,
        grid: {
          display: false,
        },
        ticks: {
          color: '#9ca3af',
          callback: (value: any) => `$${(value / 1000000).toFixed(1)}M`,
        },
      },
    },
  };

  const timeframes: TimeFrame[] = ['1H', '4H', '1D', '1W', '1M'];

  return (
    <div className="bg-gray-800/50 rounded-xl p-4 space-y-4">
      {/* Header with price and timeframe */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Price Display */}
        <div className="flex items-center gap-4">
          <div>
            <h3 className="text-2xl font-bold text-white">
              {crypto.toUpperCase()}/USD
            </h3>
            {currentPrice !== null && (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-semibold text-white">
                  ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className={`text-sm font-medium ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {priceChange >= 0 ? '+' : ''}{priceChange.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                  ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="flex gap-1 bg-gray-700/50 p-1 rounded-lg">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                timeframe === tf
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-600'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Price Chart */}
      <div className="h-64">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-gray-400">Loading chart...</div>
          </div>
        ) : chartData ? (
          <Line ref={chartRef} data={chartData} options={chartOptions} />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-gray-400">No chart data available</div>
          </div>
        )}
      </div>

      {/* Volume Chart */}
      {volumeData && (
        <div className="h-20">
          <Bar data={volumeData} options={volumeOptions} />
        </div>
      )}
    </div>
  );
}
