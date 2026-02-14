const admin = require('firebase-admin');
const config = require('../config');
const prisma = require('../models');

// Initialize Firebase Admin
const hasValidFirebaseConfig = config.firebase.projectId &&
  config.firebase.privateKey &&
  !config.firebase.privateKey.includes('YOUR_KEY');

if (hasValidFirebaseConfig) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.firebase.projectId,
      privateKey: config.firebase.privateKey,
      clientEmail: config.firebase.clientEmail,
    }),
  });
} else {
  console.log('Firebase not configured — push notifications disabled');
}

class NotificationService {
  /**
   * Send push notification to a single device
   */
  async sendPush(fcmToken, title, body, data = {}) {
    if (!fcmToken) return null;

    try {
      const message = {
        token: fcmToken,
        notification: { title, body },
        data: Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)])
        ),
        android: {
          priority: 'high',
          notification: {
            channelId: 'medsource-default',
            icon: 'ic_notification',
            color: '#0F5132',
          },
        },
        webpush: {
          notification: {
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
          },
          fcmOptions: {
            link: data.url || config.frontendUrl,
          },
        },
      };

      const result = await admin.messaging().send(message);
      return result;
    } catch (error) {
      console.error('Push notification error:', error.message);

      // Remove invalid token
      if (error.code === 'messaging/registration-token-not-registered' ||
          error.code === 'messaging/invalid-registration-token') {
        // Token is no longer valid - clean up
        console.log('Removing invalid FCM token');
      }
      return null;
    }
  }

  /**
   * Send push to multiple devices
   */
  async sendPushMultiple(fcmTokens, title, body, data = {}) {
    if (!fcmTokens.length) return;

    try {
      const message = {
        tokens: fcmTokens.filter(Boolean),
        notification: { title, body },
        data: Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)])
        ),
      };

      const result = await admin.messaging().sendEachForMulticast(message);
      return result;
    } catch (error) {
      console.error('Multi-push error:', error.message);
    }
  }

  /**
   * Create in-app notification + send push
   */
  async notify(userId, { type, title, body, data = {}, orderId = null }) {
    try {
      // 1. Save to database
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          body,
          data,
          orderId,
        },
      });

      // 2. Send push notification
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { fcmToken: true },
      });

      if (user?.fcmToken) {
        await this.sendPush(user.fcmToken, title, body, {
          ...data,
          notificationId: notification.id,
          type,
        });

        // Mark as sent via push
        await prisma.notification.update({
          where: { id: notification.id },
          data: { sentViaPush: true },
        });
      }

      return notification;
    } catch (error) {
      console.error('Notify error:', error.message);
      return null;
    }
  }

  // ============================================================
  // ORDER NOTIFICATIONS
  // ============================================================

  async notifyOrderPlaced(order) {
    // Notify seller
    await this.notify(order.seller.userId, {
      type: 'ORDER_PLACED',
      title: '🛒 New Order Received!',
      body: `Order ${order.orderNumber} - ${order.items.length} item(s) worth ₦${order.totalAmount.toLocaleString()}`,
      orderId: order.id,
      data: { orderNumber: order.orderNumber, screen: 'seller-orders' },
    });

    // Notify buyer
    await this.notify(order.buyerId, {
      type: 'ORDER_PLACED',
      title: 'Order Placed',
      body: `Your order ${order.orderNumber} has been placed successfully.`,
      orderId: order.id,
      data: { orderNumber: order.orderNumber, screen: 'order-detail' },
    });
  }

  async notifyOrderConfirmed(order) {
    await this.notify(order.buyerId, {
      type: 'ORDER_CONFIRMED',
      title: '✅ Order Confirmed',
      body: `Your order ${order.orderNumber} has been confirmed by the seller.`,
      orderId: order.id,
      data: { orderNumber: order.orderNumber },
    });
  }

  async notifyOrderShipped(order) {
    await this.notify(order.buyerId, {
      type: 'ORDER_SHIPPED',
      title: '🚚 Order On The Way',
      body: `Your order ${order.orderNumber} is on its way to you.`,
      orderId: order.id,
      data: { orderNumber: order.orderNumber },
    });
  }

  async notifyOrderDelivered(order) {
    await this.notify(order.buyerId, {
      type: 'ORDER_DELIVERED',
      title: '📦 Order Delivered',
      body: `Your order ${order.orderNumber} has been delivered. Please confirm receipt.`,
      orderId: order.id,
      data: { orderNumber: order.orderNumber },
    });
  }

  // ============================================================
  // INQUIRY NOTIFICATIONS
  // ============================================================

  async notifyInquiryReceived(inquiry) {
    await this.notify(inquiry.seller.userId, {
      type: 'INQUIRY_RECEIVED',
      title: '💬 New Inquiry',
      body: `${inquiry.buyerName} is asking about ${inquiry.product.name}`,
      data: { inquiryId: inquiry.id, screen: 'seller-inquiries' },
    });
  }

  async notifyInquiryResponded(inquiry) {
    await this.notify(inquiry.buyerId, {
      type: 'INQUIRY_RESPONDED',
      title: '💬 Inquiry Response',
      body: `${inquiry.seller.businessName} responded to your inquiry about ${inquiry.product.name}`,
      data: { inquiryId: inquiry.id },
    });
  }

  // ============================================================
  // PAYMENT NOTIFICATIONS
  // ============================================================

  async notifyPaymentReceived(order) {
    await this.notify(order.seller.userId, {
      type: 'PAYMENT_RECEIVED',
      title: '💰 Payment Received',
      body: `Payment of ₦${order.totalAmount.toLocaleString()} received for order ${order.orderNumber}`,
      orderId: order.id,
      data: { orderNumber: order.orderNumber },
    });
  }

  // ============================================================
  // INVENTORY ALERTS
  // ============================================================

  async notifyLowStock(product) {
    await this.notify(product.seller.userId, {
      type: 'PRODUCT_LOW_STOCK',
      title: '⚠️ Low Stock Alert',
      body: `${product.name} has only ${product.quantity} units remaining.`,
      data: { productId: product.id, screen: 'seller-products' },
    });
  }

  async notifyProductExpiring(product) {
    await this.notify(product.seller.userId, {
      type: 'PRODUCT_EXPIRING',
      title: '⏰ Expiry Warning',
      body: `${product.name} expires on ${product.expiryDate.toLocaleDateString()}. Consider updating your listing.`,
      data: { productId: product.id, screen: 'seller-products' },
    });
  }
}

module.exports = new NotificationService();
