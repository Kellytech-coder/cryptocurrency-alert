import { NextResponse } from 'next/server';
import { findUserById, updateUserVerification } from '@/lib/db';
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

// POST - Verify email with token
export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Find user by verification token
    const { findUserByVerificationCode } = await import('@/lib/db');
    const user = await findUserByVerificationCode(token);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (user.verificationCodeExpiry) {
      const expiryDate = new Date(user.verificationCodeExpiry);
      if (expiryDate < new Date()) {
        return NextResponse.json(
          { error: 'Verification token has expired' },
          { status: 400 }
        );
      }
    }

    // Update user as email verified
    await updateUserVerification(user.id, {
      isEmailVerified: true,
      verificationCode: undefined,
      verificationCodeExpiry: undefined,
    });

    return NextResponse.json({
      message: 'Email verified successfully',
    });
  } catch (error) {
    console.error('Verify email error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Resend verification email
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

    if (user.isEmailVerified) {
      return NextResponse.json(
        { error: 'Email already verified' },
        { status: 400 }
      );
    }

    // Generate new verification token
    const { generateOTP, updateUserVerification } = await import('@/lib/db');
    const newToken = generateOTP();
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 24); // 24 hours expiry

    await updateUserVerification(userId, {
      verificationCode: newToken,
      verificationCodeExpiry: expiryDate.toISOString(),
    });

    // Send verification email
    const { sendVerificationEmail } = await import('@/lib/email');
    await sendVerificationEmail({
      to: user.email,
      name: user.name || 'User',
      verificationToken: newToken,
    });

    return NextResponse.json({
      message: 'Verification email sent successfully',
    });
  } catch (error) {
    console.error('Resend verification email error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
