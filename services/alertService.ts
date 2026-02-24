import prisma from '@/lib/prisma';
import { getCryptoPrices, CryptoPrice } from './priceService';
import { sendAlertEmail } from '@/lib/email';

interface AlertWithUser {
  id: string;
  userId: string;
  cryptocurrency: string;
  targetPrice: number;
  condition: string;
  isActive: boolean;
  isTriggered: boolean;
  user: {
    email: string | null;
  };
}

export async function checkAlerts() {
  console.log('Checking alerts...');
  
  try {
    // Get all active, non-triggered alerts
    const activeAlerts: AlertWithUser[] = await prisma.alert.findMany({
      where: {
        isActive: true,
        isTriggered: false,
      },
      include: {
        user: true,
      },
    }) as AlertWithUser[];

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
        await prisma.alert.update({
          where: { id: alert.id },
          data: {
            isTriggered: true,
            isActive: false,
          },
        });

        // Create triggered alert record
        await prisma.triggeredAlert.create({
          data: {
            alertId: alert.id,
            triggeredPrice: currentPrice,
          },
        });

        // Send email notification
        if (alert.user.email) {
          await sendAlertEmail({
            to: alert.user.email,
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
