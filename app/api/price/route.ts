import { NextResponse } from 'next/server';
import { getCryptoPrices, getSupportedCryptos } from '@/services/priceService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const crypto = searchParams.get('crypto');
    const list = searchParams.get('list');

    if (list === 'true') {
      const cryptos = await getSupportedCryptos();
      return NextResponse.json({ cryptos });
    }

    if (crypto) {
      const prices = await getCryptoPrices([crypto]);
      return NextResponse.json({ 
        crypto,
        price: prices[crypto]?.usd || 0,
        change24h: prices[crypto]?.usd_24h_change || 0
      });
    }

    // Return default popular cryptos
    const defaultCryptos = ['bitcoin', 'ethereum', 'binancecoin', 'solana', 'ripple'];
    const prices = await getCryptoPrices(defaultCryptos);
    return NextResponse.json({ prices });
  } catch (error) {
    console.error('Get price error:', error);
    return NextResponse.json({ error: 'Failed to fetch price data' }, { status: 500 });
  }
}
