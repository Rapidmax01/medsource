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
}

module.exports = new EmailService();
