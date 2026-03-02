const express = require('express');
const prisma = require('../models');
const searchService = require('../services/search');
const nafdacService = require('../services/nafdac');
const { authenticate, requireSeller, optionalAuth } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

const router = express.Router();

/**
 * GET /api/products
 * Search and list products (public)
 */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const {
      q: query,
      type,
      category,
      bloodType,
      state,
      city,
      inStock,
      minPrice,
      maxPrice,
      sortBy,
      page,
      limit,
    } = req.query;

    const results = await searchService.searchProducts({
      query,
      type: type?.toUpperCase(),
      category,
      bloodType: bloodType?.toUpperCase(),
      state,
      city,
      inStock: inStock === 'true' ? true : inStock === 'false' ? false : undefined,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      sortBy,
      page: page ? parseInt(page) : 1,
      limit: limit ? Math.min(parseInt(limit), 50) : 20,
    });

    res.json(results);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/products/suggestions
 * Search autocomplete suggestions
 */
router.get('/suggestions', async (req, res, next) => {
  try {
    const { q } = req.query;
    const suggestions = await searchService.getSuggestions(q);
    res.json({ suggestions });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/products/trending
 * Get trending searches
 */
router.get('/trending', async (req, res) => {
  const trending = await searchService.getTrending();
  res.json({ trending });
});

/**
 * GET /api/products/categories
 * Get all product categories with counts
 */
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await prisma.product.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const bloodTypes = await prisma.product.groupBy({
      by: ['bloodType'],
      where: { isActive: true, type: 'BLOOD_PRODUCT', bloodType: { not: null } },
      _count: { id: true },
    });

    res.json({ categories, bloodTypes });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/products/:id
 * Get single product detail
 */
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        seller: {
          select: {
            id: true,
            businessName: true,
            isVerified: true,
            state: true,
            city: true,
            rating: true,
            totalSales: true,
            responseTime: true,
            logo: true,
            reviews: {
              take: 5,
              orderBy: { createdAt: 'desc' },
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });

    if (!product || !product.isActive) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Increment view count
    await prisma.product.update({
      where: { id: req.params.id },
      data: { viewCount: { increment: 1 } },
    });

    // Get related products (same category or type)
    const related = await prisma.product.findMany({
      where: {
        id: { not: product.id },
        isActive: true,
        inStock: true,
        OR: [
          { category: product.category },
          { type: product.type },
        ],
      },
      include: {
        seller: {
          select: { businessName: true, isVerified: true, state: true, city: true },
        },
      },
      take: 4,
    });

    res.json({ product, related });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/products
 * Create a new product (seller only)
 */
router.post('/', authenticate, requireSeller, validate(schemas.createProduct), async (req, res, next) => {
  try {
    const {
      name, type, description, price, quantity, images,
      // Pharmaceutical fields
      genericName, category, dosageForm, strength, manufacturer,
      nafdacNumber, batchNumber, expiryDate,
      // Blood product fields
      bloodType, bloodProduct, screeningStatus, coldChain,
      collectionDate, storageTemp,
      tags,
    } = req.body;

    const product = await prisma.product.create({
      data: {
        sellerId: req.user.seller.id,
        name,
        type,
        description,
        price,
        quantity,
        inStock: quantity > 0,
        images: images || [],
        // Pharma
        genericName,
        category,
        dosageForm,
        strength,
        manufacturer,
        nafdacNumber,
        batchNumber,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        // Blood
        bloodType,
        bloodProduct,
        screeningStatus,
        coldChain: coldChain || false,
        collectionDate: collectionDate ? new Date(collectionDate) : null,
        storageTemp,
        tags: tags || [],
      },
      include: {
        seller: {
          select: { businessName: true, isVerified: true },
        },
      },
    });

    // Auto-verify NAFDAC number (fire-and-forget)
    if (nafdacNumber) {
      nafdacService.verify(nafdacNumber)
        .then((result) => {
          if (result && (result.verified || result.isRegistered)) {
            return prisma.product.update({
              where: { id: product.id },
              data: { nafdacVerified: true },
            });
          }
        })
        .catch((err) => console.error('NAFDAC auto-verify error:', err.message));
    }

    res.status(201).json({ product });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/products/:id
 * Update a product (seller only, own product)
 */
router.put('/:id', authenticate, requireSeller, async (req, res, next) => {
  try {
    // Verify ownership
    const existing = await prisma.product.findFirst({
      where: { id: req.params.id, sellerId: req.user.seller.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Product not found or not owned by you' });
    }

    const updateData = { ...req.body };
    delete updateData.id;
    delete updateData.sellerId;

    // Auto-update inStock based on quantity
    if (updateData.quantity !== undefined) {
      updateData.inStock = updateData.quantity > 0;
    }

    // Parse dates
    if (updateData.expiryDate) updateData.expiryDate = new Date(updateData.expiryDate);
    if (updateData.collectionDate) updateData.collectionDate = new Date(updateData.collectionDate);

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        seller: { select: { businessName: true, isVerified: true } },
      },
    });

    res.json({ product });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/products/:id
 * Soft delete a product (seller only)
 */
router.delete('/:id', authenticate, requireSeller, async (req, res, next) => {
  try {
    const existing = await prisma.product.findFirst({
      where: { id: req.params.id, sellerId: req.user.seller.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await prisma.product.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    res.json({ success: true, message: 'Product removed' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
