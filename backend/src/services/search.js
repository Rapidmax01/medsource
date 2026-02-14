const prisma = require('../models');

class SearchService {
  /**
   * Full-text search across products
   * Uses PostgreSQL's built-in text search capabilities
   */
  async searchProducts({
    query,
    type,           // PHARMACEUTICAL or BLOOD_PRODUCT
    category,
    bloodType,
    state,
    city,
    inStock,
    minPrice,
    maxPrice,
    sortBy = 'relevance',  // relevance, price_asc, price_desc, newest
    page = 1,
    limit = 20,
  }) {
    const skip = (page - 1) * limit;
    const where = { isActive: true };

    // Product type filter
    if (type) where.type = type;

    // Category filter
    if (category) where.category = { contains: category, mode: 'insensitive' };

    // Blood type filter
    if (bloodType) where.bloodType = bloodType;

    // Stock filter
    if (inStock !== undefined) where.inStock = inStock;

    // Price range
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = minPrice;
      if (maxPrice) where.price.lte = maxPrice;
    }

    // Location filter (via seller)
    if (state || city) {
      where.seller = {};
      if (state) where.seller.state = { contains: state, mode: 'insensitive' };
      if (city) where.seller.city = { contains: city, mode: 'insensitive' };
    }

    // Text search across name, generic name, description, tags
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { genericName: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { category: { contains: query, mode: 'insensitive' } },
        { manufacturer: { contains: query, mode: 'insensitive' } },
        { bloodType: { contains: query, mode: 'insensitive' } },
        { tags: { hasSome: query.toLowerCase().split(' ') } },
        { seller: { businessName: { contains: query, mode: 'insensitive' } } },
      ];
    }

    // Sort order
    let orderBy;
    switch (sortBy) {
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'popular':
        orderBy = { viewCount: 'desc' };
        break;
      default:
        // Relevance: prioritize in-stock, featured, then newest
        orderBy = [
          { isFeatured: 'desc' },
          { inStock: 'desc' },
          { createdAt: 'desc' },
        ];
    }

    // Execute query
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              businessName: true,
              isVerified: true,
              state: true,
              city: true,
              rating: true,
              businessPhone: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasMore: skip + products.length < total,
      },
    };
  }

  /**
   * Get search suggestions / autocomplete
   */
  async getSuggestions(query, limit = 8) {
    if (!query || query.length < 2) return [];

    const [products, categories, sellers] = await Promise.all([
      prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { genericName: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: { name: true, genericName: true, type: true },
        take: 4,
        distinct: ['name'],
      }),
      prisma.product.findMany({
        where: {
          isActive: true,
          category: { contains: query, mode: 'insensitive' },
        },
        select: { category: true },
        take: 2,
        distinct: ['category'],
      }),
      prisma.seller.findMany({
        where: {
          isVerified: true,
          businessName: { contains: query, mode: 'insensitive' },
        },
        select: { businessName: true },
        take: 2,
      }),
    ]);

    return [
      ...products.map((p) => ({
        type: 'product',
        text: p.name,
        subtext: p.genericName,
        productType: p.type,
      })),
      ...categories.map((c) => ({
        type: 'category',
        text: c.category,
      })),
      ...sellers.map((s) => ({
        type: 'seller',
        text: s.businessName,
      })),
    ].slice(0, limit);
  }

  /**
   * Get trending/popular searches
   */
  async getTrending() {
    // In production, track search queries and return most popular
    return [
      'Rituximab',
      'O Negative blood',
      'Imatinib',
      'Platelet concentrate',
      'Eculizumab',
      'AB+ blood',
      'Daptomycin',
      'Fresh frozen plasma',
    ];
  }
}

module.exports = new SearchService();
