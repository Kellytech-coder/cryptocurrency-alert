import axios, { AxiosError } from 'axios';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Default crypto list as fallback when API is rate limited
const DEFAULT_CRYPTOS = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
  { id: 'binancecoin', name: 'BNB', symbol: 'BNB' },
  { id: 'solana', name: 'Solana', symbol: 'SOL' },
  { id: 'ripple', name: 'XRP', symbol: 'XRP' },
  { id: 'cardano', name: 'Cardano', symbol: 'ADA' },
  { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE' },
  { id: 'polkadot', name: 'Polkadot', symbol: 'DOT' },
];

export interface CryptoPrice {
  [key: string]: {
    usd: number;
    usd_24h_change: number;
  };
}

// Check if error is a rate limit (429)
function isRateLimitError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.response?.status === 429;
  }
  return false;
}

// Retry helper with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // If rate limited, wait before retrying
      if (isRateLimitError(error)) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Rate limited. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // For other errors, don't retry
        throw error;
      }
    }
  }
  
  throw lastError;
}

export async function getCryptoPrices(cryptos: string[]): Promise<CryptoPrice> {
  try {
    return await withRetry(async () => {
      const ids = cryptos.join(',');
      const response = await axios.get(
        `${COINGECKO_API}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
      );
      return response.data;
    });
  } catch (error) {
    if (isRateLimitError(error)) {
      console.warn('CoinGecko API rate limited. Returning empty prices.');
    } else {
      console.error('Error fetching crypto prices:', error);
    }
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
    return await withRetry(async () => {
      const response = await axios.get(
        `${COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1`
      );
      return response.data.map((coin: any) => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
      }));
    });
  } catch (error) {
    if (isRateLimitError(error)) {
      console.warn('CoinGecko API rate limited. Returning default crypto list.');
    } else {
      console.error('Error fetching supported cryptos:', error);
    }
    return DEFAULT_CRYPTOS;
  }
}
