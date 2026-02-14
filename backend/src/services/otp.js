const axios = require('axios');
const config = require('../config');

class OtpService {
  constructor() {
    this.client = axios.create({
      baseURL: config.termii.baseUrl,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Generate a random OTP code
   */
  generateCode(length = 6) {
    return Math.random().toString().slice(2, 2 + length);
  }

  /**
   * Format phone number to international format
   * Accepts numbers already in international format (+XXX...)
   * Falls back to Nigerian +234 if no country code detected
   */
  formatPhone(phone) {
    if (phone.startsWith('+')) return phone;
    if (phone.startsWith('234') && phone.length >= 13) return '+' + phone;
    if (phone.startsWith('0')) return '+234' + phone.slice(1);
    return '+234' + phone;
  }

  /**
   * Send OTP via Termii SMS
   */
  async sendOtp(phone, code) {
    const formattedPhone = this.formatPhone(phone);

    try {
      // In development, just log the OTP
      if (config.env === 'development') {
        console.log(`\n📱 OTP for ${formattedPhone}: ${code}\n`);
        return { success: true, message: 'OTP sent (dev mode)' };
      }

      // Production: Send via Termii
      const response = await this.client.post('/sms/send', {
        to: formattedPhone,
        from: config.termii.senderId,
        sms: `Your MedSource verification code is: ${code}. Valid for 10 minutes. Do not share this code.`,
        type: 'plain',
        channel: 'generic',
        api_key: config.termii.apiKey,
      });

      return {
        success: true,
        messageId: response.data.message_id,
      };
    } catch (error) {
      console.error('Termii OTP error:', error.response?.data || error.message);

      // Fallback: Try sending via DND route (for Do-Not-Disturb numbers)
      try {
        const fallback = await this.client.post('/sms/send', {
          to: formattedPhone,
          from: config.termii.senderId,
          sms: `Your MedSource code: ${code}`,
          type: 'plain',
          channel: 'dnd', // DND channel for blocked numbers
          api_key: config.termii.apiKey,
        });

        return {
          success: true,
          messageId: fallback.data.message_id,
          channel: 'dnd',
        };
      } catch (fallbackError) {
        console.error('Termii DND fallback error:', fallbackError.response?.data);
        throw new Error('Failed to send OTP. Please try again.');
      }
    }
  }

  /**
   * Send OTP via WhatsApp (alternative channel)
   */
  async sendOtpWhatsApp(phone, code) {
    const formattedPhone = this.formatPhone(phone);

    try {
      const response = await this.client.post('/sms/send', {
        to: formattedPhone,
        from: config.termii.senderId,
        sms: `Your MedSource verification code is: ${code}. Valid for 10 minutes.`,
        type: 'plain',
        channel: 'whatsapp',
        api_key: config.termii.apiKey,
      });

      return { success: true, messageId: response.data.message_id };
    } catch (error) {
      console.error('WhatsApp OTP error:', error.response?.data || error.message);
      throw new Error('Failed to send WhatsApp OTP');
    }
  }

  /**
   * Send order notification SMS
   */
  async sendOrderNotification(phone, orderNumber, status) {
    const messages = {
      CONFIRMED: `MedSource: Your order ${orderNumber} has been confirmed. The seller is preparing your items.`,
      PROCESSING: `MedSource: Your order ${orderNumber} is being processed.`,
      READY_FOR_PICKUP: `MedSource: Your order ${orderNumber} is ready for pickup.`,
      IN_TRANSIT: `MedSource: Your order ${orderNumber} is on the way!`,
      DELIVERED: `MedSource: Your order ${orderNumber} has been delivered. Thank you!`,
      CANCELLED: `MedSource: Your order ${orderNumber} has been cancelled.`,
    };

    const message = messages[status];
    if (!message) return;

    try {
      await this.client.post('/sms/send', {
        to: this.formatPhone(phone),
        from: config.termii.senderId,
        sms: message,
        type: 'plain',
        channel: 'generic',
        api_key: config.termii.apiKey,
      });
    } catch (error) {
      console.error('Order notification SMS error:', error.message);
      // Don't throw - notification failure shouldn't break the flow
    }
  }
}

module.exports = new OtpService();
