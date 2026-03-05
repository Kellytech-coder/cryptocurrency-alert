import nodemailer from 'nodemailer';

// Check if email is configured
const isEmailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD && 
  process.env.EMAIL_USER !== 'your-email@gmail.com' && 
  process.env.EMAIL_PASSWORD !== 'your-app-password');

// Create transporter only if email is configured
let transporter: nodemailer.Transporter | null = null;

if (isEmailConfigured) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
} else {
  console.log('⚠️ Email not configured. Emails will be logged to console in development mode.');
}

export interface AlertEmailParams {
  to: string;
  cryptocurrency: string;
  targetPrice: number;
  currentPrice: number;
  condition: string;
}

export async function sendAlertEmail({ to, cryptocurrency, targetPrice, currentPrice, condition }: AlertEmailParams) {
  // If email is not configured, log the email content
  if (!transporter) {
    console.log('========== MOCK EMAIL (Alert) ==========');
    console.log(`To: ${to}`);
    console.log(`Subject: 🚀 ${cryptocurrency} Price Alert Triggered!`);
    console.log(`Body: Alert for ${cryptocurrency} - Target: $${targetPrice}, Current: $${currentPrice}, Condition: ${condition}`);
    console.log('=========================================');
    return true;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: `🚀 ${cryptocurrency} Price Alert Triggered!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Price Alert Triggered! 🚀</h2>
        <p>Your alert for <strong>${cryptocurrency}</strong> has been triggered!</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Condition:</strong> Price goes ${condition}</p>
          <p style="margin: 5px 0;"><strong>Target Price:</strong> $${targetPrice.toLocaleString()}</p>
          <p style="margin: 5px 0;"><strong>Current Price:</strong> $${currentPrice.toLocaleString()}</p>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          Check your dashboard for more details.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export interface OTPEmailParams {
  to: string;
  otp: string;
  name: string;
}

export async function sendOTPEmail({ to, otp, name }: OTPEmailParams) {
  // If email is not configured, log the OTP content
  if (!transporter) {
    console.log('========== MOCK EMAIL (OTP) ==========');
    console.log(`To: ${to}`);
    console.log(`Subject: 🔐 Your Verification Code`);
    console.log(`Body: Hello ${name}, Your OTP is: ${otp}`);
    console.log('=======================================');
    return true;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: '🔐 Your Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Verify Your Account 🔐</h2>
        <p>Hello ${name},</p>
        <p>Your verification code is:</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #3b82f6;">${otp}</span>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          This code will expire in 10 minutes.
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          If you didn't request this code, please ignore this email.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
}

export interface VerificationEmailParams {
  to: string;
  name: string;
  verificationToken: string;
}

export async function sendVerificationEmail({ to, name, verificationToken }: VerificationEmailParams) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
  
  // If email is not configured, log the verification content
  if (!transporter) {
    console.log('========== MOCK EMAIL (Verification) ==========');
    console.log(`To: ${to}`);
    console.log(`Subject: 📧 Verify Your Email Address`);
    console.log(`Body: Hello ${name}, Verify at: ${verificationUrl}`);
    console.log('=================================================');
    return true;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: '📧 Verify Your Email Address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Welcome to CryptoAlert! 📧</h2>
        <p>Hello ${name},</p>
        <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Verify Email
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          Or copy and paste this link in your browser:<br>
          ${verificationUrl}
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          This link will expire in 24 hours.
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          If you didn't create an account, please ignore this email.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
}
