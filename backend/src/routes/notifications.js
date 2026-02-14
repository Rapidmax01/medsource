const express = require('express');
const prisma = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/notifications
 * Get user's notifications
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { unread, page = 1, limit = 30 } = req.query;
    const where = { userId: req.user.id };
    if (unread === 'true') where.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: req.user.id, isRead: false } }),
    ]);

    res.json({
      notifications,
      unreadCount,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/notifications/unread-count
 * Get just the unread count (for badge display)
 */
router.get('/unread-count', authenticate, async (req, res, next) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false },
    });
    res.json({ count });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark a single notification as read
 */
router.put('/:id/read', authenticate, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user.id },
      data: { isRead: true },
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
router.put('/read-all', authenticate, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await prisma.notification.deleteMany({
      where: { id: req.params.id, userId: req.user.id },
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
