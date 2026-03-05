import { NextResponse } from 'next/server';
import { findUserById, updateUserVerification, findUserByVerificationCode } from '@/lib/db';
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

// POST - Verify OTP
export async function POST(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { otp } = await request.json();

    if (!otp) {
      return NextResponse.json(
        { error: 'OTP is required' },
        { status: 400 }
      );
    }

    // Find user by verification code
    const user = await findUserByVerificationCode(otp);

    if (!user || user.id !== userId) {
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      );
    }

    // Check if OTP has expired
    if (user.verificationCodeExpiry) {
      const expiryDate = new Date(user.verificationCodeExpiry);
      if (expiryDate < new Date()) {
        return NextResponse.json(
          { error: 'OTP has expired' },
          { status: 400 }
        );
      }
    }

    // Update user as OTP verified
    await updateUserVerification(userId, {
      isOTPVerified: true,
      verificationCode: undefined,
      verificationCodeExpiry: undefined,
    });

    return NextResponse.json({
      message: 'OTP verified successfully',
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Request new OTP
export async function PUT(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await findUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate new OTP
    const { generateOTP } = await import('@/lib/db');
    const newOTP = generateOTP();
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + 10); // 10 minutes expiry

    await updateUserVerification(userId, {
      verificationCode: newOTP,
      verificationCodeExpiry: expiryDate.toISOString(),
    });

    // Send OTP via email
    const { sendOTPEmail } = await import('@/lib/email');
    await sendOTPEmail({
      to: user.email,
      otp: newOTP,
      name: user.name || 'User',
    });

    return NextResponse.json({
      message: 'New OTP sent successfully',
    });
  } catch (error) {
    console.error('Request new OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
