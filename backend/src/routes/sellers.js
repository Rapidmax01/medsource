const express = require('express');
const prisma = require('../models');
const { authenticate, requireSeller } = require('../middleware/auth');
const paymentService = require('../services/payment');

const router = express.Router();

/**
 * POST /api/sellers/register
 * Register as a seller (existing user becomes seller)
 */
router.post('/register', authenticate, async (req, res, next) => {
  try {
    const {
      businessName, businessType, description,
      state, city, address,
      businessPhone, businessEmail, whatsapp,
      nafdacLicense, cacNumber, bvn, nin,
    } = req.body;

    // Check if already a seller
    if (req.user.seller) {
      return res.status(409).json({ error: 'You are already registered as a seller' });
    }

    // Validate required fields
    if (!businessName || !state || !city || !businessPhone) {
      return res.status(400).json({ error: 'Business name, location, and phone are required' });
    }

    // BVN verification (non-blocking — seller still created if it fails)
    let bvnData = {};
    if (bvn && /^\d{11}$/.test(bvn)) {
      const bvnResult = await paymentService.resolveBVN(bvn);
      if (bvnResult.success) {
        bvnData = {
          bvnVerified: true,
          bvnVerifiedAt: new Date(),
          bvnFirstName: bvnResult.firstName,
          bvnLastName: bvnResult.lastName,
        };
      }
    }

    // Create seller profile and update user role
    const [seller] = await prisma.$transaction([
      prisma.seller.create({
        data: {
          userId: req.user.id,
          businessName,
          businessType: businessType || 'PHARMACY',
          description,
          state,
          city,
          address: address || '',
          businessPhone,
          businessEmail,
          whatsapp,
          nafdacLicense,
          cacNumber,
          ...(bvn && { bvn }),
          ...bvnData,
          ...(nin && { nin }),
        },
      }),
      prisma.user.update({
        where: { id: req.user.id },
        data: { role: 'SELLER' },
      }),
    ]);

    res.status(201).json({ seller });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sellers/dashboard
 * Get seller dashboard stats
 */
router.get('/dashboard', authenticate, requireSeller, async (req, res, next) => {
  try {
    if (!req.user.seller) {
      return res.status(403).json({ error: 'No seller profile found for this account' });
    }
    const sellerId = req.user.seller.id;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

    const [
      totalProducts,
      activeProducts,
      outOfStockProducts,
      expiringProducts,
      totalOrders,
      pendingOrders,
      recentOrders,
      pendingInquiries,
      totalRevenue,
      monthlyRevenue,
      reviews,
      seller,
    ] = await Promise.all([
      prisma.product.count({ where: { sellerId, isActive: true } }),
      prisma.product.count({ where: { sellerId, isActive: true, inStock: true } }),
      prisma.product.count({ where: { sellerId, isActive: true, inStock: false } }),
      prisma.product.count({
        where: {
          sellerId,
          isActive: true,
          expiryDate: {
            lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
            gt: new Date(),
          },
        },
      }),
      prisma.order.count({ where: { sellerId } }),
      prisma.order.count({ where: { sellerId, status: 'PENDING' } }),
      prisma.order.findMany({
        where: { sellerId },
        include: {
          items: { include: { product: { select: { name: true, type: true } } } },
          buyer: { select: { firstName: true, lastName: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.inquiry.count({ where: { sellerId, status: 'PENDING' } }),
      prisma.order.aggregate({
        where: { sellerId, paymentStatus: 'PAID' },
        _sum: { sellerEarnings: true, totalAmount: true },
      }),
      prisma.order.aggregate({
        where: {
          sellerId,
          paymentStatus: 'PAID',
          createdAt: { gte: thirtyDaysAgo },
        },
        _sum: { sellerEarnings: true, totalAmount: true },
      }),
      prisma.review.aggregate({
        where: { sellerId },
        _avg: { rating: true },
        _count: { id: true },
      }),
      prisma.seller.findUnique({
        where: { id: sellerId },
        select: { totalEarnings: true, totalCommissionPaid: true, pendingBalance: true },
      }),
    ]);

    res.json({
      stats: {
        products: {
          total: totalProducts,
          active: activeProducts,
          outOfStock: outOfStockProducts,
          expiring: expiringProducts,
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
        },
        inquiries: {
          pending: pendingInquiries,
        },
        revenue: {
          total: totalRevenue._sum.sellerEarnings || totalRevenue._sum.totalAmount || 0,
          monthly: monthlyRevenue._sum.sellerEarnings || monthlyRevenue._sum.totalAmount || 0,
        },
        earnings: {
          totalEarnings: seller?.totalEarnings || 0,
          totalCommissionPaid: seller?.totalCommissionPaid || 0,
          pendingBalance: seller?.pendingBalance || 0,
          commissionRate: 5, // percentage
        },
        rating: {
          average: reviews._avg.rating || 0,
          count: reviews._count.id || 0,
        },
      },
      recentOrders,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sellers/products
 * Get seller's own products
 */
router.get('/products', authenticate, requireSeller, async (req, res, next) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const where = { sellerId: req.user.seller.id };

    if (status === 'active') { where.isActive = true; where.inStock = true; }
    if (status === 'out_of_stock') { where.isActive = true; where.inStock = false; }
    if (status === 'inactive') { where.isActive = false; }
    if (type) where.type = type;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      products,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sellers/orders
 * Get seller's received orders
 */
router.get('/orders', authenticate, requireSeller, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = { sellerId: req.user.seller.id };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: { include: { product: { select: { name: true, type: true } } } },
          buyer: { select: { firstName: true, lastName: true, phone: true, state: true, city: true } },
          payment: { select: { status: true, paidAt: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      orders,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/sellers/profile
 * Update seller profile
 */
router.put('/profile', authenticate, requireSeller, async (req, res, next) => {
  try {
    const {
      businessName, description, logo,
      state, city, address,
      businessPhone, businessEmail, whatsapp,
    } = req.body;

    const seller = await prisma.seller.update({
      where: { id: req.user.seller.id },
      data: {
        ...(businessName && { businessName }),
        ...(description !== undefined && { description }),
        ...(logo && { logo }),
        ...(state && { state }),
        ...(city && { city }),
        ...(address && { address }),
        ...(businessPhone && { businessPhone }),
        ...(businessEmail !== undefined && { businessEmail }),
        ...(whatsapp !== undefined && { whatsapp }),
      },
    });

    res.json({ seller });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sellers/:id/public
 * Get public seller profile
 */
router.get('/:id/public', async (req, res, next) => {
  try {
    const seller = await prisma.seller.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        businessName: true,
        businessType: true,
        description: true,
        logo: true,
        isVerified: true,
        state: true,
        city: true,
        rating: true,
        totalSales: true,
        responseTime: true,
        createdAt: true,
        products: {
          where: { isActive: true, inStock: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    res.json({ seller });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
