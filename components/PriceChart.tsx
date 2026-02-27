'use client';

import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PriceChartProps {
  crypto: string;
}

export default function PriceChart({ crypto }: PriceChartProps) {
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, [crypto]);

  const fetchChartData = async () => {
    setLoading(true);
    try {
      // Fetch more data for trading chart (30 days with hourly data)
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${crypto}/market_chart?vs_currency=usd&days=30&interval=hourly`
      );
      const data = await response.json();

      // If hourly fails, try daily
      if (data.error || !data.prices) {
        const fallbackResponse = await fetch(
          `https://api.coingecko.com/api/v3/coins/${crypto}/market_chart?vs_currency=usd&days=30&interval=daily`
        );
        const fallbackData = await fallbackResponse.json();
        if (fallbackData.prices) {
          processChartData(fallbackData.prices, 'daily');
        }
      } else {
        processChartData(data.prices, 'hourly');
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
      // Try fallback on error
      try {
        const fallbackResponse = await fetch(
          `https://api.coingecko.com/api/v3/coins/${crypto}/market_chart?vs_currency=usd&days=30&interval=daily`
        );
        const fallbackData = await fallbackResponse.json();
        if (fallbackData.prices) {
          processChartData(fallbackData.prices, 'daily');
        }
      } catch (fallbackError) {
        console.error('Error fetching fallback chart data:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (prices: [number, number][], interval: string) => {
    const isHourly = interval === 'hourly';
    
    // Sample data to avoid too many points (show every 4th point for hourly)
    const sampledPrices = isHourly ? prices.filter((_, i) => i % 4 === 0) : prices;
    
    const labels = sampledPrices.map((price: [number, number]) => {
      const date = new Date(price[0]);
      if (isHourly) {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' });
      }
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const priceValues = sampledPrices.map((price: [number, number]) => price[1]);

    setChartData({
      labels,
      datasets: [
        {
          label: `${crypto.toUpperCase()} Price (USD)`,
          data: priceValues,
          borderColor: '#8b5cf6',
          backgroundColor: (context: any) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 256);
            gradient.addColorStop(0, 'rgba(139, 92, 246, 0.3)');
            gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
            return gradient;
          },
          fill: true,
          tension: 0.1,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#8b5cf6',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2,
          borderWidth: 2,
        },
      ],
    });
  };

  const options = {
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
          label: (context: any) => `$${context.parsed.y.toLocaleString()}`,
          title: (context: any) => {
            const label = context[0].label;
            return label;
          }
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(75, 85, 99, 0.3)',
        },
        ticks: {
          color: '#9ca3af',
          maxTicksLimit: 10,
        },
      },
      y: {
        grid: {
          color: 'rgba(75, 85, 99, 0.3)',
        },
        ticks: {
          color: '#9ca3af',
          callback: (value: any) => `$${value.toLocaleString()}`,
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-800/50 rounded-xl">
        <div className="text-gray-400">Loading chart...</div>
      </div>
    );
  }

  if (!chartData) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-800/50 rounded-xl">
        <div className="text-gray-400">No chart data available</div>
      </div>
    );
  }

  return (
    <div className="h-80 bg-gray-800/50 rounded-xl p-4">
      <Line data={chartData} options={options} />
    </div>
  );
}
