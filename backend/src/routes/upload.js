const express = require('express');
const multer = require('multer');
const { authenticate, requireSeller } = require('../middleware/auth');
const { uploadImage, uploadMultiple, deleteImage } = require('../services/upload');

const router = express.Router();

// Multer config: memory storage, 5MB limit, images only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

/**
 * POST /api/upload
 * Upload a single image (authenticated, seller only)
 */
router.post(
  '/',
  authenticate,
  requireSeller,
  upload.single('image'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      const result = await uploadImage(req.file.buffer);
      res.status(200).json({ url: result.url, publicId: result.publicId });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/upload/multiple
 * Upload up to 5 images (authenticated, seller only)
 */
router.post(
  '/multiple',
  authenticate,
  requireSeller,
  upload.array('images', 5),
  async (req, res, next) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No image files provided' });
      }

      const images = await uploadMultiple(req.files);
      res.status(200).json({ images });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/upload/:publicId
 * Delete an image (authenticated, seller only)
 */
router.delete(
  '/:publicId(*)',
  authenticate,
  requireSeller,
  async (req, res, next) => {
    try {
      const { publicId } = req.params;

      if (!publicId) {
        return res.status(400).json({ error: 'Public ID is required' });
      }

      const result = await deleteImage(publicId);

      if (result.result === 'not found') {
        return res.status(404).json({ error: 'Image not found' });
      }

      res.status(200).json({ message: 'Image deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

// Handle multer errors
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds 5MB limit' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Maximum 5 images allowed' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err.message === 'Only image files are allowed') {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;
