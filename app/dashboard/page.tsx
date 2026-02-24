'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import PriceChart from '@/components/PriceChart';

interface Alert {
  id: string;
  cryptocurrency: string;
  targetPrice: number;
  condition: string;
  isActive: boolean;
  isTriggered: boolean;
  createdAt: string;
  triggeredAlerts: {
    triggeredPrice: number;
    triggeredAt: string;
  }[];
}

interface PriceData {
  [key: string]: {
    usd: number;
    usd_24h_change: number;
  };
}

export default function DashboardPage() {
  const { user, token, logout, isLoading } = useAuth();
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [triggeredAlerts, setTriggeredAlerts] = useState<Alert[]>([]);
  const [prices, setPrices] = useState<PriceData>({});
  const [cryptos, setCryptos] = useState<{ id: string; name: string; symbol: string }[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState('bitcoin');
  const [chartCrypto, setChartCrypto] = useState('bitcoin');
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState('above');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !token) {
      router.push('/login');
    }
  }, [isLoading, token, router]);

  useEffect(() => {
    if (token) {
      fetchAlerts();
      fetchPrices();
      fetchCryptos();
      const interval = setInterval(fetchPrices, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/alerts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAlerts(data.alerts?.filter((a: Alert) => !a.isTriggered) || []);
      setTriggeredAlerts(data.alerts?.filter((a: Alert) => a.isTriggered) || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const fetchPrices = async () => {
    try {
      const res = await fetch('/api/price');
      const data = await res.json();
      if (data.prices) {
        setPrices(data.prices);
      }
    } catch (error) {
      console.error('Error fetching prices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCryptos = async () => {
    try {
      const res = await fetch('/api/price?list=true');
      const data = await res.json();
      if (data.cryptos) {
        setCryptos(data.cryptos.slice(0, 20));
      }
    } catch (error) {
      console.error('Error fetching cryptos:', error);
    }
  };

  const createAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cryptocurrency: selectedCrypto,
          targetPrice: parseFloat(targetPrice),
          condition,
        }),
      });

      if (res.ok) {
        setTargetPrice('');
        setShowForm(false);
        fetchAlerts();
      }
    } catch (error) {
      console.error('Error creating alert:', error);
    }
  };

  const deleteAlert = async (alertId: string) => {
    try {
      const res = await fetch(`/api/alerts?id=${alertId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        fetchAlerts();
      }
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (isLoading || !token) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800/50 backdrop-blur-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Crypto Alerts
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-300">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-300">Live Prices</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(prices).map(([key, value]) => (
              <div 
                key={key} 
                className="bg-gray-800/50 backdrop-blur-lg p-4 rounded-xl border border-gray-700 cursor-pointer hover:border-purple-500 transition-colors"
                onClick={() => setChartCrypto(key)}
              >
                <div className="text-gray-400 text-sm uppercase">{key}</div>
                <div className="text-2xl font-bold">${value.usd.toLocaleString()}</div>
                <div className={`text-sm ${value.usd_24h_change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {value.usd_24h_change >= 0 ? '+' : ''}{value.usd_24h_change.toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-300">Price Chart</h2>
            <select
              value={chartCrypto}
              onChange={(e) => setChartCrypto(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              {cryptos.map((crypto) => (
                <option key={crypto.id} value={crypto.id}>
                  {crypto.name} ({crypto.symbol})
                </option>
              ))}
            </select>
          </div>
          <PriceChart crypto={chartCrypto} />
        </div>

        <div className="mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg font-semibold transition-all"
          >
            {showForm ? 'Cancel' : '+ Create Alert'}
          </button>
        </div>

        {showForm && (
          <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-xl border border-gray-700 mb-8">
            <h3 className="text-lg font-semibold mb-4">Create New Alert</h3>
            <form onSubmit={createAlert} className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-gray-400 mb-2 text-sm">Cryptocurrency</label>
                <select
                  value={selectedCrypto}
                  onChange={(e) => setSelectedCrypto(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  {cryptos.map((crypto) => (
                    <option key={crypto.id} value={crypto.id}>
                      {crypto.name} ({crypto.symbol})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-gray-400 mb-2 text-sm">Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="above">Price Above</option>
                  <option value="below">Price Below</option>
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-gray-400 mb-2 text-sm">Target Price ($)</label>
                <input
                  type="number"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="Enter target price"
                  step="0.01"
                  required
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors"
              >
                Create
              </button>
            </form>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-300">Active Alerts</h2>
          {alerts.length === 0 ? (
            <p className="text-gray-400">No active alerts. Create one to get started!</p>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-gray-800/50 backdrop-blur-lg p-4 rounded-xl border border-gray-700 flex justify-between items-center"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold uppercase">{alert.cryptocurrency}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        alert.condition === 'above' ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
                      }`}>
                        {alert.condition}
                      </span>
                    </div>
                    <div className="text-gray-400">
                      Target: ${alert.targetPrice.toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteAlert(alert.id)}
                    className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-300">Alert History</h2>
          {triggeredAlerts.length === 0 ? (
            <p className="text-gray-400">No triggered alerts yet.</p>
          ) : (
            <div className="space-y-3">
              {triggeredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/50"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold uppercase">{alert.cryptocurrency}</span>
                    <span className="px-2 py-1 rounded text-xs bg-yellow-600/20 text-yellow-400">
                      Triggered
                    </span>
                  </div>
                  <div className="text-gray-400">
                    Target: ${alert.targetPrice.toLocaleString()} | 
                    Triggered at: ${alert.triggeredAlerts[0]?.triggeredPrice.toLocaleString() || 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
