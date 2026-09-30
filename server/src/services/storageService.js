const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * Storage Service: Multi-tier cloud and zero-dependency persistence adapter.
 * Supports:
 * 1. Cloudinary API (when credentials are set in .env)
 * 2. Persistent Base64 Data URI (guarantees image persistence across Render container sleeps)
 * 3. Local filesystem fallback (/uploads in development)
 */

const isCloudinaryConfigured = () => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

/**
 * Uploads a local file or buffer to persistent storage.
 * @param {Express.Multer.File} file - Multer file object
 * @returns {Promise<string>} Public URL or persistent Base64 Data URI
 */
const uploadToStorage = async (file) => {
  if (!file) return null;

  // 1. Cloudinary upload if configured
  if (isCloudinaryConfigured()) {
    try {
      const cloudinaryUrl = await uploadToCloudinary(file);
      if (cloudinaryUrl) return cloudinaryUrl;
    } catch (err) {
      console.warn('[Storage] Cloudinary upload failed, falling back:', err.message);
    }
  }

  // 2. Production fallback on containerized host: Base64 Data URI
  // If in production without Cloudinary, or if file is under 2MB, store as persistent Data URI
  if (process.env.NODE_ENV === 'production' || process.env.PERSIST_AS_DATA_URI === 'true') {
    try {
      const fileBuffer = fs.readFileSync(file.path);
      const mimeType = file.mimetype || 'image/jpeg';
      const base64 = fileBuffer.toString('base64');
      // Clean up temporary local file
      try { fs.unlinkSync(file.path); } catch (e) {}
      return `data:${mimeType};base64,${base64}`;
    } catch (err) {
      console.error('[Storage] Base64 encoding error:', err.message);
    }
  }

  // 3. Development fallback: local relative URL
  return `/uploads/${file.filename}`;
};

/**
 * Upload to Cloudinary using direct HTTPS multipart POST without heavy SDK dependencies.
 */
const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const timestamp = Math.round(Date.now() / 1000);

    const crypto = require('crypto');
    const signature = crypto
      .createHash('sha1')
      .update(`timestamp=${timestamp}${apiSecret}`)
      .digest('hex');

    // Read file as base64 for data upload
    const fileBuffer = fs.readFileSync(file.path);
    const dataUri = `data:${file.mimetype};base64,${fileBuffer.toString('base64')}`;
    const postData = JSON.stringify({
      file: dataUri,
      api_key: apiKey,
      timestamp,
      signature,
    });

    const options = {
      hostname: 'api.cloudinary.com',
      port: 443,
      path: `/v1_1/${cloudName}/image/upload`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.secure_url) {
            // Remove local temp file
            try { fs.unlinkSync(file.path); } catch (e) {}
            resolve(json.secure_url);
          } else {
            reject(new Error(json.error?.message || 'Cloudinary upload failed'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
};

module.exports = {
  uploadToStorage,
  isCloudinaryConfigured,
};
