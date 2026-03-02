const axios = require('axios');
const crypto = require('crypto');
const config = require('../config');

class PaymentService {
  constructor() {
    this.paystack = axios.create({
      baseURL: config.paystack.baseUrl,
      headers: {
        Authorization: `Bearer ${config.paystack.secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    this.flutterwave = axios.create({
      baseURL: config.flutterwave.baseUrl,
      headers: {
        Authorization: `Bearer ${config.flutterwave.secretKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  // ============================================================
  // PAYSTACK (Primary)
  // ============================================================

  /**
   * Initialize a Paystack transaction
   */
  async initializePaystack({ email, amount, reference, metadata, callbackUrl }) {
    try {
      const response = await this.paystack.post('/transaction/initialize', {
        email,
        amount: Math.round(amount * 100), // Paystack uses kobo
        reference,
        callback_url: callbackUrl || `${config.frontendUrl}/payment/callback`,
        metadata: {
          ...metadata,
          custom_fields: [
            { display_name: 'Order Number', variable_name: 'order_number', value: metadata.orderNumber },
          ],
        },
        channels: ['card', 'bank', 'ussd', 'bank_transfer', 'mobile_money'],
      });

      return {
        success: true,
        provider: 'PAYSTACK',
        authorizationUrl: response.data.data.authorization_url,
        accessCode: response.data.data.access_code,
        reference: response.data.data.reference,
      };
    } catch (error) {
      console.error('Paystack init error:', error.response?.data || error.message);
      throw new Error('Payment initialization failed');
    }
  }

  /**
   * Verify a Paystack transaction
   */
  async verifyPaystack(reference) {
    try {
      const response = await this.paystack.get(`/transaction/verify/${reference}`);
      const data = response.data.data;

      return {
        success: data.status === 'success',
        provider: 'PAYSTACK',
        reference: data.reference,
        amount: data.amount / 100, // Convert from kobo to Naira
        currency: data.currency,
        paidAt: data.paid_at,
        channel: data.channel,
        metadata: data.metadata,
        customerEmail: data.customer?.email,
      };
    } catch (error) {
      console.error('Paystack verify error:', error.response?.data || error.message);
      throw new Error('Payment verification failed');
    }
  }

  /**
   * Verify Paystack webhook signature
   */
  verifyPaystackWebhook(body, signature) {
    const hash = crypto
      .createHmac('sha512', config.paystack.secretKey)
      .update(typeof body === 'string' ? body : JSON.stringify(body))
      .digest('hex');
    return hash === signature;
  }

  // ============================================================
  // BVN VERIFICATION
  // ============================================================

  /**
   * Resolve BVN via Paystack identity API
   * Returns name/DOB info for identity verification during seller onboarding
   */
  async resolveBVN(bvn) {
    try {
      const response = await this.paystack.get(`/bank/resolve_bvn/${bvn}`);
      const data = response.data.data;
      return {
        success: true,
        firstName: data.first_name,
        lastName: data.last_name,
        dateOfBirth: data.date_of_birth,
        phone: data.mobile,
      };
    } catch (error) {
      console.error('BVN resolve error:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.message || 'BVN verification failed' };
    }
  }

  // ============================================================
  // FLUTTERWAVE (Fallback)
  // ============================================================

  /**
   * Initialize a Flutterwave transaction
   */
  async initializeFlutterwave({ email, amount, reference, metadata, customerName, customerPhone }) {
    try {
      const response = await this.flutterwave.post('/payments', {
        tx_ref: reference,
        amount,
        currency: 'NGN',
        redirect_url: `${config.frontendUrl}/payment/callback`,
        payment_options: 'card, banktransfer, ussd, account',
        customer: {
          email,
          name: customerName,
          phonenumber: customerPhone,
        },
        customizations: {
          title: 'MedSource Nigeria',
          description: `Payment for order ${metadata.orderNumber}`,
          logo: `${config.frontendUrl}/logo.png`,
        },
        meta: metadata,
      });

      return {
        success: true,
        provider: 'FLUTTERWAVE',
        paymentLink: response.data.data.link,
        reference,
      };
    } catch (error) {
      console.error('Flutterwave init error:', error.response?.data || error.message);
      throw new Error('Payment initialization failed');
    }
  }

  /**
   * Verify a Flutterwave transaction
   */
  async verifyFlutterwave(transactionId) {
    try {
      const response = await this.flutterwave.get(`/transactions/${transactionId}/verify`);
      const data = response.data.data;

      return {
        success: data.status === 'successful',
        provider: 'FLUTTERWAVE',
        reference: data.tx_ref,
        amount: data.amount,
        currency: data.currency,
        paidAt: data.created_at,
        channel: data.payment_type,
      };
    } catch (error) {
      console.error('Flutterwave verify error:', error.response?.data || error.message);
      throw new Error('Payment verification failed');
    }
  }

  /**
   * Verify Flutterwave webhook
   */
  verifyFlutterwaveWebhook(signature) {
    return signature === config.flutterwave.webhookHash;
  }

  // ============================================================
  // UNIFIED METHODS
  // ============================================================

  /**
   * Initialize payment - try Paystack first, fallback to Flutterwave
   */
  async initializePayment({ email, amount, reference, metadata, customerName, customerPhone, provider = 'PAYSTACK' }) {
    if (provider === 'FLUTTERWAVE') {
      return this.initializeFlutterwave({ email, amount, reference, metadata, customerName, customerPhone });
    }

    try {
      return await this.initializePaystack({ email, amount, reference, metadata });
    } catch (error) {
      console.warn('Paystack failed, falling back to Flutterwave');
      return this.initializeFlutterwave({ email, amount, reference, metadata, customerName, customerPhone });
    }
  }

  /**
   * Generate unique payment reference
   */
  generateReference() {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(4).toString('hex');
    return `MSN-${timestamp}-${random}`.toUpperCase();
  }
}

module.exports = new PaymentService();
