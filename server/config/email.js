const { Resend } = require('resend');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

let resend;
function getResend() {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

async function sendPasswordResetEmail(to, resetUrl) {
  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'Dealer App <onboarding@resend.dev>',
    to,
    subject: 'Reset Your Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #1a1a2e; color: #fff; border-radius: 12px;">
        <h2 style="margin: 0 0 16px; font-size: 22px;">Password Reset</h2>
        <p style="color: #ccc; font-size: 15px; line-height: 1.5;">
          You requested a password reset for your Dealer App account. Click the button below to set a new password.
        </p>
        <a href="${resetUrl}" style="display: inline-block; margin: 24px 0; padding: 12px 28px; background: #0d6efd; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px;">
          Reset Password
        </a>
        <p style="color: #999; font-size: 13px; line-height: 1.4;">
          This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

module.exports = { sendPasswordResetEmail };
