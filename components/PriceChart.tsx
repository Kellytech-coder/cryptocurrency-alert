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
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${crypto}/market_chart?vs_currency=usd&days=7&interval=daily`
      );
      const data = await response.json();

      if (data.prices) {
        const labels = data.prices.map((price: [number, number]) => {
          const date = new Date(price[0]);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        const prices = data.prices.map((price: [number, number]) => price[1]);

        setChartData({
          labels,
          datasets: [
            {
              label: `${crypto.toUpperCase()} Price (USD)`,
              data: prices,
              borderColor: '#8b5cf6',
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              fill: true,
              tension: 0.4,
              pointRadius: 2,
              pointHoverRadius: 6,
            },
          ],
        });
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const options = {
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
        displayColors: false,
        callbacks: {
          label: (context: any) => `$${context.parsed.y.toLocaleString()}`,
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
    <div className="h-64 bg-gray-800/50 rounded-xl p-4">
      <Line data={chartData} options={options} />
    </div>
  );
}
