import axios from 'axios';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

export interface CryptoPrice {
  [key: string]: {
    usd: number;
    usd_24h_change: number;
  };
}

export async function getCryptoPrices(cryptos: string[]): Promise<CryptoPrice> {
  try {
    const ids = cryptos.join(',');
    const response = await axios.get(
      `${COINGECKO_API}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
    return {};
  }
}

export async function getCryptoPrice(crypto: string): Promise<number> {
  try {
    const prices = await getCryptoPrices([crypto]);
    return prices[crypto]?.usd || 0;
  } catch {
    return 0;
  }
}

export async function getSupportedCryptos(): Promise<{ id: string; name: string; symbol: string }[]> {
  try {
    const response = await axios.get(
      `${COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1`
    );
    return response.data.map((coin: any) => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
    }));
  } catch (error) {
    console.error('Error fetching supported cryptos:', error);
    return [
      { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
      { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
      { id: 'binancecoin', name: 'BNB', symbol: 'BNB' },
      { id: 'solana', name: 'Solana', symbol: 'SOL' },
      { id: 'ripple', name: 'XRP', symbol: 'XRP' },
      { id: 'cardano', name: 'Cardano', symbol: 'ADA' },
      { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE' },
      { id: 'polkadot', name: 'Polkadot', symbol: 'DOT' },
    ];
  }
}
