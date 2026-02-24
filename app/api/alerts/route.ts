import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// Helper function to get user ID from token
function getUserIdFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  return decoded?.userId || null;
}

// GET - Get all alerts for user
export async function GET(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const triggered = searchParams.get('triggered');

    const alerts = await prisma.alert.findMany({
      where: {
        userId,
        ...(triggered === 'true' ? { isTriggered: true } : { isTriggered: false }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        triggeredAlerts: {
          orderBy: { triggeredAt: 'desc' },
          take: 1,
        },
      },
    });

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('Get alerts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new alert
export async function POST(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cryptocurrency, targetPrice, condition } = await request.json();

    if (!cryptocurrency || !targetPrice || !condition) {
      return NextResponse.json(
        { error: 'Cryptocurrency, target price, and condition are required' },
        { status: 400 }
      );
    }

    if (!['above', 'below'].includes(condition)) {
      return NextResponse.json(
        { error: 'Condition must be either "above" or "below"' },
        { status: 400 }
      );
    }

    const alert = await prisma.alert.create({
      data: {
        userId,
        cryptocurrency,
        targetPrice: parseFloat(targetPrice),
        condition,
      },
    });

    return NextResponse.json({
      message: 'Alert created successfully',
      alert,
    });
  } catch (error) {
    console.error('Create alert error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete alert
export async function DELETE(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get('id');

    if (!alertId) {
      return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 });
    }

    // Verify the alert belongs to the user
    const alert = await prisma.alert.findFirst({
      where: {
        id: alertId,
        userId,
      },
    });

    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    await prisma.alert.delete({
      where: { id: alertId },
    });

    return NextResponse.json({ message: 'Alert deleted successfully' });
  } catch (error) {
    console.error('Delete alert error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
