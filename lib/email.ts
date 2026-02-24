import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password',
  },
});

export interface AlertEmailParams {
  to: string;
  cryptocurrency: string;
  targetPrice: number;
  currentPrice: number;
  condition: string;
}

export async function sendAlertEmail({ to, cryptocurrency, targetPrice, currentPrice, condition }: AlertEmailParams) {
  const mailOptions = {
    from: process.env.EMAIL_USER || 'your-email@gmail.com',
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
