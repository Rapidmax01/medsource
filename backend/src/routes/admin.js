const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../models');
const { authenticate, requireAdmin, requireSuperAdmin } = require('../middleware/auth');
const emailService = require('../services/email');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

// ============================================================
// PLATFORM STATS
// ============================================================

/**
 * GET /api/admin/stats
 * Platform overview stats (both admin roles)
 */
router.get('/stats', async (req, res, next) => {
  try {
    const [totalUsers, totalSellers, verifiedSellers, totalOrders, totalProducts, activeProducts] = await Promise.all([
      prisma.user.count(),
      prisma.seller.count(),
      prisma.seller.count({ where: { isVerified: true } }),
      prisma.order.count(),
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
    ]);

    // Calculate revenue breakdown from paid orders
    const revenueResult = await prisma.order.aggregate({
      _sum: { totalAmount: true, commission: true, serviceFee: true, sellerEarnings: true },
      where: { paymentStatus: 'PAID' },
    });

    const pendingSellers = await prisma.seller.count({ where: { isVerified: false } });

    const totalRevenue = revenueResult._sum.totalAmount || 0;
    const totalCommission = revenueResult._sum.commission || 0;
    const totalServiceFees = revenueResult._sum.serviceFee || 0;
    const totalSellerEarnings = revenueResult._sum.sellerEarnings || 0;
    const platformRevenue = totalCommission + totalServiceFees;

    res.json({
      totalUsers,
      totalSellers,
      verifiedSellers,
      pendingSellers,
      totalOrders,
      totalProducts,
      activeProducts,
      totalRevenue,
      totalCommission,
      totalServiceFees,
      totalSellerEarnings,
      platformRevenue,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// USER MANAGEMENT
// ============================================================

/**
 * GET /api/admin/users
 * List users with search/filter (both admin roles)
 */
router.get('/users', async (req, res, next) => {
  try {
    const { search, role, isActive, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {};
    // Sub-admins cannot see super admins
    if (req.user.role !== 'SUPER_ADMIN') {
      where.role = { not: 'SUPER_ADMIN' };
    }
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          phone: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          accountType: true,
          isVerified: true,
          isActive: true,
          state: true,
          city: true,
          createdAt: true,
          seller: { select: { id: true, businessName: true, isVerified: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/users/:id/approve
 * Activate a user account (both admin roles)
 */
router.put('/users/:id/approve', async (req, res, next) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: true },
      select: { id: true, firstName: true, lastName: true, isActive: true },
    });
    res.json({ success: true, user });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    next(error);
  }
});

/**
 * PUT /api/admin/users/:id/suspend
 * Suspend a user account (SUPER_ADMIN only)
 */
router.put('/users/:id/suspend', requireSuperAdmin, async (req, res, next) => {
  try {
    // Prevent suspending yourself
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot suspend your own account' });
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: false },
      select: { id: true, firstName: true, lastName: true, isActive: true },
    });
    res.json({ success: true, user });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    next(error);
  }
});

// ============================================================
// SUB-ADMIN MANAGEMENT (SUPER_ADMIN only)
// ============================================================

/**
 * POST /api/admin/sub-admins
 * Create a sub-admin account (SUPER_ADMIN only)
 */
router.post('/sub-admins', requireSuperAdmin, async (req, res, next) => {
  try {
    const { phone, email, password, firstName, lastName, state, city } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Email, password, first name, and last name are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check email uniqueness
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }

    // Check phone uniqueness if provided
    if (phone) {
      const existing = await prisma.user.findUnique({ where: { phone } });
      if (existing) {
        return res.status(409).json({ error: 'A user with this phone number already exists' });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const subAdmin = await prisma.user.create({
      data: {
        phone: phone || null,
        email,
        passwordHash,
        firstName,
        lastName,
        role: 'SUB_ADMIN',
        isVerified: true,
        isActive: true,
        state: state || null,
        city: city || null,
      },
      select: {
        id: true,
        phone: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Send welcome email with credentials
    try {
      await emailService.sendSubAdminWelcome(email, firstName, password);
    } catch (emailErr) {
      console.error('Failed to send sub-admin welcome email:', emailErr);
    }

    res.status(201).json({ success: true, subAdmin });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/sub-admins
 * List all sub-admins (SUPER_ADMIN only)
 */
router.get('/sub-admins', requireSuperAdmin, async (req, res, next) => {
  try {
    const subAdmins = await prisma.user.findMany({
      where: { role: 'SUB_ADMIN' },
      select: {
        id: true,
        phone: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        state: true,
        city: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ subAdmins });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/sub-admins/:id
 * Delete a sub-admin (SUPER_ADMIN only)
 */
router.delete('/sub-admins/:id', requireSuperAdmin, async (req, res, next) => {
  try {
    // Verify the target is actually a SUB_ADMIN
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (target.role !== 'SUB_ADMIN') {
      return res.status(400).json({ error: 'User is not a sub-admin' });
    }

    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Sub-admin deleted' });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// SELLER VERIFICATION
// ============================================================

/**
 * GET /api/admin/sellers/pending
 * List pending seller verifications (both admin roles)
 */
router.get('/sellers/pending', async (req, res, next) => {
  try {
    const sellers = await prisma.seller.findMany({
      where: { isVerified: false },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ sellers });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/sellers/:id/verify
 * Verify a seller (both admin roles)
 */
router.put('/sellers/:id/verify', async (req, res, next) => {
  try {
    const seller = await prisma.seller.update({
      where: { id: req.params.id },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
      },
      select: { id: true, businessName: true, isVerified: true, verifiedAt: true },
    });
    res.json({ success: true, seller });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Seller not found' });
    }
    next(error);
  }
});

/**
 * PUT /api/admin/sellers/:id/reject
 * Reject a seller (SUPER_ADMIN only)
 */
router.put('/sellers/:id/reject', requireSuperAdmin, async (req, res, next) => {
  try {
    // Remove seller profile and revert user role to BUYER
    const seller = await prisma.seller.findUnique({
      where: { id: req.params.id },
      select: { id: true, userId: true, businessName: true },
    });

    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    // Delete the seller record and revert the user to BUYER
    await prisma.$transaction([
      prisma.seller.delete({ where: { id: req.params.id } }),
      prisma.user.update({
        where: { id: seller.userId },
        data: { role: 'BUYER' },
      }),
    ]);

    res.json({ success: true, message: `Seller "${seller.businessName}" rejected and removed` });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
