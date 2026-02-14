const cloudinary = require('cloudinary').v2;
const config = require('../config');

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Upload a single image buffer to Cloudinary
 * @param {Buffer} fileBuffer - The image file buffer
 * @param {Object} options - Optional upload overrides
 * @returns {Promise<{ url: string, publicId: string }>}
 */
const uploadImage = (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    if (fileBuffer.length > MAX_FILE_SIZE) {
      return reject(new Error('File size exceeds 5MB limit'));
    }

    const uploadOptions = {
      folder: 'medsource/products',
      resource_type: 'image',
      format: 'auto',
      quality: 'auto',
      ...options,
    };

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    stream.end(fileBuffer);
  });
};

/**
 * Upload multiple image buffers to Cloudinary
 * @param {Array<{ buffer: Buffer }>} files - Array of file objects with buffer property
 * @param {Object} options - Optional upload overrides
 * @returns {Promise<Array<{ url: string, publicId: string }>>}
 */
const uploadMultiple = async (files, options = {}) => {
  const uploads = files.map((file) => uploadImage(file.buffer, options));
  return Promise.all(uploads);
};

/**
 * Delete an image from Cloudinary by public ID
 * @param {string} publicId - The Cloudinary public ID
 * @returns {Promise<Object>}
 */
const deleteImage = async (publicId) => {
  const result = await cloudinary.uploader.destroy(publicId);
  return result;
};

module.exports = { uploadImage, uploadMultiple, deleteImage };
