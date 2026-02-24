'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && token) {
      router.push('/dashboard');
    }
  }, [token, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-gray-900 to-blue-900/20"></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        
        {/* Header */}
        <header className="relative z-10 max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Crypto Alerts
          </h1>
          <div className="flex gap-4">
            <Link
              href="/login"
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg font-medium transition-all"
            >
              Get Started
            </Link>
          </div>
        </header>

        {/* Hero Content */}
        <main className="relative z-10 max-w-7xl mx-auto px-4 py-20 text-center">
          <h2 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            Never Miss a Trade
          </h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Set price alerts for your favorite cryptocurrencies and get instant notifications 
            when the market hits your target prices.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl font-semibold text-lg transition-all hover:scale-105"
            >
              Start Free
            </Link>
            <Link
              href="/dashboard"
              className="px-8 py-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl font-semibold text-lg transition-all"
            >
              View Demo
            </Link>
          </div>
        </main>
      </div>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <h3 className="text-3xl font-bold text-center mb-12">Why Choose Crypto Alerts?</h3>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-800/50 backdrop-blur-lg p-8 rounded-2xl border border-gray-700">
            <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h4 className="text-xl font-semibold mb-3">Real-time Alerts</h4>
            <p className="text-gray-400">
              Get instant email notifications when cryptocurrency prices reach your target.
            </p>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-lg p-8 rounded-2xl border border-gray-700">
            <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h4 className="text-xl font-semibold mb-3">Live Price Charts</h4>
            <p className="text-gray-400">
              View real-time price data and historical charts for informed decisions.
            </p>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-lg p-8 rounded-2xl border border-gray-700">
            <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h4 className="text-xl font-semibold mb-3">Secure & Private</h4>
            <p className="text-gray-400">
              Your data is protected with industry-standard encryption.
            </p>
          </div>
        </div>
      </section>

      {/* Supported Cryptos */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <h3 className="text-3xl font-bold text-center mb-4">Supported Cryptocurrencies</h3>
        <p className="text-gray-400 text-center mb-12">Track prices for all major cryptocurrencies</p>
        <div className="flex flex-wrap justify-center gap-4">
          {['Bitcoin', 'Ethereum', 'BNB', 'Solana', 'XRP', 'Cardano', 'Dogecoin', 'Polkadot'].map((crypto) => (
            <div key={crypto} className="px-6 py-3 bg-gray-800/50 border border-gray-700 rounded-full text-gray-300">
              {crypto}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500">
          <p>© 2024 Crypto Alerts. Built for traders, by traders.</p>
        </div>
      </footer>
    </div>
  );
}
