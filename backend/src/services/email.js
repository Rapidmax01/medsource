const config = require('../config');

class EmailService {
  constructor() {
    this.apiKey = process.env.BREVO_API_KEY;
    this.senderEmail = process.env.EMAIL_FROM_ADDRESS || process.env.BREVO_SENDER_EMAIL || 'noreply@medsource.ng';
    this.senderName = process.env.EMAIL_FROM_NAME || process.env.BREVO_SENDER_NAME || 'MedSource';
  }

  async sendVerificationCode(email, code) {
    if (config.env === 'development' || !this.apiKey) {
      console.log(`\n📧 Email OTP for ${email}: ${code}\n`);
      return { success: true, message: 'Email sent (dev mode)' };
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #131921; margin-bottom: 8px;">MedSource Verification</h2>
        <p style="color: #555; font-size: 14px;">Your verification code is:</p>
        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; text-align: center; margin: 16px 0;">
          <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #131921;">${code}</span>
        </div>
        <p style="color: #888; font-size: 12px;">This code expires in 10 minutes. Do not share it with anyone.</p>
      </div>
    `;

    const fetch = (await import('node-fetch')).default;
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': this.apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: this.senderName, email: this.senderEmail },
        to: [{ email }],
        subject: 'MedSource - Verify your email',
        htmlContent: html,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Brevo email error:', err);
      throw new Error('Failed to send verification email');
    }

    return { success: true };
  }

  async sendSubAdminWelcome(email, firstName, password) {
    if (config.env === 'development' || !this.apiKey) {
      console.log(`\n📧 Sub-Admin welcome for ${email}: password=${password}\n`);
      return { success: true, message: 'Email sent (dev mode)' };
    }

    const loginUrl = config.frontendUrl ? `${config.frontendUrl}/login` : 'https://medsourceng.com/login';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #131921; margin-bottom: 8px;">Welcome to MedSource Admin</h2>
        <p style="color: #555; font-size: 14px;">Hi ${firstName},</p>
        <p style="color: #555; font-size: 14px;">An administrator account has been created for you on MedSource. Here are your login credentials:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 16px 0;">
          <table style="width: 100%; font-size: 14px; color: #333;">
            <tr><td style="padding: 6px 0; font-weight: 600; width: 120px;">Email:</td><td>${email}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600;">Temp Password:</td><td style="font-family: monospace; font-size: 16px; font-weight: 700; color: #131921;">${password}</td></tr>
          </table>
        </div>
        <p style="color: #555; font-size: 14px;">To sign in:</p>
        <ol style="color: #555; font-size: 14px; padding-left: 20px;">
          <li>Go to <a href="${loginUrl}" style="color: #0A8F3C;">${loginUrl}</a></li>
          <li>Select the <strong>Email</strong> tab</li>
          <li>Enter your email and temporary password</li>
          <li>Go to your <strong>Profile</strong> to change your password</li>
        </ol>
        <p style="color: #d93025; font-size: 13px; font-weight: 600; margin-top: 16px;">Please change your password after your first login.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #aaa; font-size: 11px;">This is an automated message from MedSource. Do not reply to this email.</p>
      </div>
    `;

    const fetch = (await import('node-fetch')).default;
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': this.apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: this.senderName, email: this.senderEmail },
        to: [{ email }],
        subject: 'MedSource - Your Admin Account',
        htmlContent: html,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Brevo email error:', err);
      throw new Error('Failed to send welcome email');
    }

    return { success: true };
  }
}

module.exports = new EmailService();
