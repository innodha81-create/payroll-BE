import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE !== 'false',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function sendPasswordResetEmail(
  to: string,
  resetToken: string,
  firstName?: string
): Promise<boolean> {
  dotenv.config();

  // Dynamic frontend base from .env / .env.production (supports http://localhost:5173 locally and https://icomplyone.com live)
  const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:5173').trim().replace(/\/+$/, '');
  const resetUrl = `${frontendBase}/reset-password?token=${resetToken}`;
  const recipientName = firstName || 'Valued User';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6fa; margin: 0; padding: 24px; color: #1e293b; }
          .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .header { background: #080d19; padding: 28px; text-align: center; }
          .logo-text { color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
          .badge { display: inline-block; padding: 4px 10px; font-size: 10px; font-weight: 700; color: #f59e0b; background: #1a140a; border: 1px solid #b45309; border-radius: 9999px; text-transform: uppercase; margin-top: 8px; }
          .content { padding: 32px 28px; }
          h2 { color: #0f172a; margin-top: 0; font-size: 18px; font-weight: 700; }
          p { color: #475569; font-size: 14px; line-height: 1.6; margin: 12px 0; }
          .button-wrap { text-align: center; margin: 28px 0; }
          .btn { background: #0b1329; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block; }
          .token-box { background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 12px; word-break: break-all; font-family: monospace; font-size: 12px; color: #334155; margin: 16px 0; }
          .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 28px; font-size: 11px; color: #64748b; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo-text">iComply</div>
            <div class="badge">&#9679; COMPLIANCE PLATFORM</div>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>Hello ${recipientName},</p>
            <p>We received a request to reset your password for your <strong>iComply</strong> account. Click the button below to set a new password:</p>
            <div class="button-wrap">
              <a href="${resetUrl}" class="btn" target="_blank">Reset My Password</a>
            </div>
            <p style="font-size: 12px; color: #64748b;">Or copy this secure link directly in your browser:</p>
            <div class="token-box">${resetUrl}</div>
            <p style="font-size: 12px; color: #dc2626; font-weight: 600;">&#9888; This link is valid for 15 minutes only and can be used once.</p>
            <p style="font-size: 12px; color: #64748b;">If you did not request this password reset, please disregard this email. Your account remains completely secure.</p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} iComply Platform &bull; Powered by Innodha Technologies Pvt Ltd
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || `"iComply Security" <${process.env.SMTP_USER}>`,
      to,
      subject: 'iComply - Password Reset Request (Valid for 15 mins)',
      html
    });
    console.log(`[Mail] Password reset email sent to ${to} (MessageId: ${info.messageId})`);
    return true;
  } catch (error) {
    console.error(`[Mail Error] Failed to send email to ${to}:`, error);
    return false;
  }
}

export async function sendPasswordChangedConfirmation(
  to: string,
  firstName?: string
): Promise<boolean> {
  const recipientName = firstName || 'Valued User';

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b;">
        <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 10px; border: 1px solid #e2e8f0; padding: 24px;">
          <h2 style="color: #0f172a; margin-top: 0;">Password Successfully Changed</h2>
          <p>Hello ${recipientName},</p>
          <p>This is a confirmation that the password for your <strong>iComply</strong> account has been successfully changed.</p>
          <p style="color: #dc2626; font-size: 13px;">If you did not perform this change, please immediately contact your company administrator to secure your account.</p>
          <p style="font-size: 11px; color: #94a3b8; margin-top: 24px;">&copy; ${new Date().getFullYear()} iComply &bull; Innodha Technologies Pvt Ltd</p>
        </div>
      </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"iComply Security" <${process.env.SMTP_USER}>`,
      to,
      subject: 'iComply Security Alert - Password Changed Successfully',
      html
    });
    return true;
  } catch (error) {
    console.error(`[Mail Error] Failed to send confirmation to ${to}:`, error);
    return false;
  }
}
