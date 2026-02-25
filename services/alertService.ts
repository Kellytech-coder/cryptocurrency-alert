import { getActiveAlerts, getAllAlerts, updateAlert, createTriggeredAlert, findAlertById } from '@/lib/db';
import { findUserById } from '@/lib/db';
import { getCryptoPrices, CryptoPrice } from './priceService';
import { sendAlertEmail } from '@/lib/email';

export async function checkAlerts() {
  console.log('Checking alerts...');
  
  try {
    // Get all active, non-triggered alerts
    const activeAlerts = await getActiveAlerts();

    if (activeAlerts.length === 0) {
      console.log('No active alerts to check');
      return;
    }

    // Get unique cryptocurrencies
    const cryptos: string[] = activeAlerts.map(alert => alert.cryptocurrency);
    const uniqueCryptos = [...new Set(cryptos)];
    
    // Fetch current prices
    const prices: CryptoPrice = await getCryptoPrices(uniqueCryptos);

    // Check each alert
    for (const alert of activeAlerts) {
      const currentPrice = prices[alert.cryptocurrency]?.usd;
      
      if (!currentPrice) continue;

      let shouldTrigger = false;

      if (alert.condition === 'above' && currentPrice >= alert.targetPrice) {
        shouldTrigger = true;
      } else if (alert.condition === 'below' && currentPrice <= alert.targetPrice) {
        shouldTrigger = true;
      }

      if (shouldTrigger) {
        console.log(`Triggering alert for ${alert.cryptocurrency}: ${alert.condition} $${alert.targetPrice}`);
        
        // Update alert as triggered
        await updateAlert(alert.id, {
          isTriggered: true,
          isActive: false,
        });

        // Create triggered alert record
        await createTriggeredAlert(alert.id, currentPrice);

        // Get user for email
        const user = await findUserById(alert.userId);

        // Send email notification
        if (user?.email) {
          await sendAlertEmail({
            to: user.email,
            cryptocurrency: alert.cryptocurrency.toUpperCase(),
            targetPrice: alert.targetPrice,
            currentPrice,
            condition: alert.condition,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error checking alerts:', error);
  }
}
