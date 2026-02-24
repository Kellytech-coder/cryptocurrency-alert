import { NextResponse } from 'next/server';
import { checkAlerts } from '@/services/alertService';

export async function GET() {
  // Add basic authentication for the cron job
  const authHeader = process.env.CRON_SECRET;
  
  try {
    await checkAlerts();
    return NextResponse.json({ success: true, message: 'Alerts checked successfully' });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ success: false, error: 'Failed to check alerts' }, { status: 500 });
  }
}
