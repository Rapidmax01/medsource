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

  // Helper to send email via Brevo (fire-and-forget safe)
  async _send(email, subject, html) {
    if (config.env === 'development' || !this.apiKey) {
      console.log(`\n📧 [${subject}] → ${email}\n`);
      return { success: true };
    }
    try {
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
          subject,
          htmlContent: html,
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        console.error('Brevo email error:', err);
      }
    } catch (err) {
      console.error('Email send error:', err.message);
    }
    return { success: true };
  }

  formatNaira(amount) {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount || 0);
  }

  async sendOrderConfirmation(email, order) {
    const items = (order.items || []).map((item) =>
      `<tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.product?.name || 'Product'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${this.formatNaira(item.totalPrice)}</td>
      </tr>`
    ).join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #0A8F3C; margin-bottom: 8px;">Order Confirmed!</h2>
        <p style="color: #555; font-size: 14px;">Your order <strong>${order.orderNumber}</strong> has been placed successfully.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
          <thead>
            <tr style="background: #f5f5f5;">
              <th style="padding: 8px; text-align: left;">Item</th>
              <th style="padding: 8px; text-align: center;">Qty</th>
              <th style="padding: 8px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>${items}</tbody>
        </table>
        <div style="text-align: right; font-size: 16px; font-weight: 700; color: #131921; margin-top: 8px;">
          Total: ${this.formatNaira(order.totalAmount)}
        </div>
        <p style="color: #555; font-size: 13px; margin-top: 16px;">
          Seller: ${order.seller?.businessName || 'MedSource Seller'}
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #aaa; font-size: 11px;">MedSource Nigeria — Healthcare Marketplace</p>
      </div>
    `;
    return this._send(email, `MedSource - Order ${order.orderNumber} Confirmed`, html);
  }

  async sendOrderStatusUpdate(email, order, newStatus) {
    const statusLabels = {
      CONFIRMED: 'Confirmed',
      PROCESSING: 'Processing',
      READY_FOR_PICKUP: 'Ready for Pickup',
      IN_TRANSIT: 'In Transit',
      DELIVERED: 'Delivered',
      CANCELLED: 'Cancelled',
    };
    const label = statusLabels[newStatus] || newStatus;
    const color = newStatus === 'DELIVERED' ? '#0A8F3C' : newStatus === 'CANCELLED' ? '#d93025' : '#1D4ED8';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #131921; margin-bottom: 8px;">Order Status Update</h2>
        <p style="color: #555; font-size: 14px;">Your order <strong>${order.orderNumber}</strong> status has been updated:</p>
        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; text-align: center; margin: 16px 0;">
          <span style="font-size: 20px; font-weight: 700; color: ${color};">${label}</span>
        </div>
        <p style="color: #555; font-size: 14px;">Order Total: <strong>${this.formatNaira(order.totalAmount)}</strong></p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #aaa; font-size: 11px;">MedSource Nigeria — Healthcare Marketplace</p>
      </div>
    `;
    return this._send(email, `MedSource - Order ${order.orderNumber} ${label}`, html);
  }

  async sendPaymentReceipt(email, order, payment) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #0A8F3C; margin-bottom: 8px;">Payment Receipt</h2>
        <p style="color: #555; font-size: 14px;">Your payment for order <strong>${order.orderNumber}</strong> has been received.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 16px 0;">
          <table style="width: 100%; font-size: 14px; color: #333;">
            <tr><td style="padding: 6px 0; font-weight: 600;">Reference:</td><td>${payment.reference}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600;">Amount:</td><td style="font-weight: 700; color: #0A8F3C;">${this.formatNaira(payment.amount)}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600;">Provider:</td><td>${payment.provider}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600;">Date:</td><td>${new Date().toLocaleDateString('en-NG')}</td></tr>
          </table>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #aaa; font-size: 11px;">MedSource Nigeria — Healthcare Marketplace</p>
      </div>
    `;
    return this._send(email, `MedSource - Payment Receipt for ${order.orderNumber}`, html);
  }

  async sendInquiryNotification(sellerEmail, inquiry) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #131921; margin-bottom: 8px;">New Product Inquiry</h2>
        <p style="color: #555; font-size: 14px;">You have received a new inquiry about <strong>${inquiry.product?.name || 'a product'}</strong>.</p>
        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="font-size: 14px; color: #333; margin: 0 0 8px;"><strong>From:</strong> ${inquiry.buyerName || 'A buyer'}</p>
          ${inquiry.urgency ? `<p style="font-size: 13px; color: #92400E; margin: 0 0 8px;"><strong>Urgency:</strong> ${inquiry.urgency}</p>` : ''}
          <p style="font-size: 14px; color: #555; margin: 0; line-height: 1.6;">${inquiry.message}</p>
        </div>
        <p style="color: #555; font-size: 13px;">Log in to your seller dashboard to respond.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #aaa; font-size: 11px;">MedSource Nigeria — Healthcare Marketplace</p>
      </div>
    `;
    return this._send(sellerEmail, 'MedSource - New Inquiry Received', html);
  }

  async sendInquiryResponse(buyerEmail, inquiry) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #131921; margin-bottom: 8px;">Inquiry Response</h2>
        <p style="color: #555; font-size: 14px;"><strong>${inquiry.seller?.businessName || 'A seller'}</strong> has responded to your inquiry about <strong>${inquiry.product?.name || 'a product'}</strong>.</p>
        <div style="background: #F0FDF4; border: 1px solid #BBF7D0; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="font-size: 14px; color: #166534; margin: 0; line-height: 1.6;">${inquiry.response}</p>
        </div>
        <p style="color: #555; font-size: 13px;">Log in to MedSource to continue the conversation or place an order.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #aaa; font-size: 11px;">MedSource Nigeria — Healthcare Marketplace</p>
      </div>
    `;
    return this._send(buyerEmail, 'MedSource - Seller Responded to Your Inquiry', html);
  }
}

module.exports = new EmailService();
