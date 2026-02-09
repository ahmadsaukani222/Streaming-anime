/**
 * Image Proxy Route
 * Serves images from R2 cache or downloads and caches from external sources
 * 
 * Usage:
 * - GET /api/img?url=<encoded_url> - Get cached image
 * - POST /api/img/cache - Cache multiple images at once
 * - GET /api/img/status?url=<encoded_url> - Check if image is cached
 */

const express = require('express');
const router = express.Router();
const {
    processImage,
    batchProcessImages,
    isAllowedSource,
    getCachedImageUrl,
    imageExistsInR2,
    getImageKey,
    getLegacyImageKey,
    isWebPEnabled
} = require('../utils/imageProxy');

/**
 * GET /api/img
 * Redirects to cached image URL or returns cached URL
 * Query params:
 * - url: encoded original image URL
 * - redirect: if 'false', returns JSON instead of redirecting
 */
router.get('/', async (req, res) => {
    try {
        const originalUrl = req.query.url;
        const shouldRedirect = req.query.redirect !== 'false';

        if (!originalUrl) {
            return res.status(400).json({ error: 'URL parameter required' });
        }

        // Decode URL if needed
        let decodedUrl;
        try {
            decodedUrl = decodeURIComponent(originalUrl);
        } catch {
            decodedUrl = originalUrl;
        }

        // Check if source is allowed
        if (!isAllowedSource(decodedUrl)) {
            if (shouldRedirect) {
                return res.redirect(302, decodedUrl);
            }
            return res.json({ url: decodedUrl, cached: false, reason: 'source_not_allowed' });
        }

        // Process image (check cache or download)
        const result = await processImage(decodedUrl);

        if (shouldRedirect) {
            // Set cache headers for the redirect
            res.set('Cache-Control', 'public, max-age=86400'); // 24 hours
            return res.redirect(302, result.url);
        }

        return res.json({
            originalUrl: decodedUrl,
            cachedUrl: result.url,
            cached: result.fromCache,
        });
    } catch (error) {
        console.error('[ImageProxy Route] Error:', error.message);

        // Fallback to original URL
        const originalUrl = req.query.url;
        if (req.query.redirect !== 'false' && originalUrl) {
            return res.redirect(302, decodeURIComponent(originalUrl));
        }

        return res.status(500).json({ error: 'Failed to process image' });
    }
});

/**
 * POST /api/img/cache
 * Cache multiple images at once
 * Body: { urls: string[] }
 * Returns mapping of original URL to cached URL
 */
router.post('/cache', async (req, res) => {
    try {
        const { urls } = req.body;

        if (!urls || !Array.isArray(urls)) {
            return res.status(400).json({ error: 'urls array required' });
        }

        // Limit batch size
        const limitedUrls = urls.slice(0, 50);

        console.log(`[ImageProxy] Batch caching ${limitedUrls.length} images`);

        const results = await batchProcessImages(limitedUrls);

        // Convert Map to object
        const mappings = {};
        results.forEach((cachedUrl, originalUrl) => {
            mappings[originalUrl] = cachedUrl;
        });

        return res.json({
            processed: limitedUrls.length,
            mappings,
        });
    } catch (error) {
        console.error('[ImageProxy Route] Batch error:', error.message);
        return res.status(500).json({ error: 'Failed to batch cache images' });
    }
});

/**
 * GET /api/img/status
 * Check if an image is cached
 * Query params:
 * - url: encoded original image URL
 */
router.get('/status', async (req, res) => {
    try {
        const originalUrl = req.query.url;

        if (!originalUrl) {
            return res.status(400).json({ error: 'URL parameter required' });
        }

        let decodedUrl;
        try {
            decodedUrl = decodeURIComponent(originalUrl);
        } catch {
            decodedUrl = originalUrl;
        }

        if (!isAllowedSource(decodedUrl)) {
            return res.json({
                url: decodedUrl,
                cached: false,
                allowed: false
            });
        }

        const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

        // Check WebP version first (if WebP is enabled)
        if (isWebPEnabled()) {
            const webpKey = getImageKey(decodedUrl, true);
            const webpExists = await imageExistsInR2(webpKey);
            if (webpExists) {
                return res.json({
                    url: decodedUrl,
                    cached: true,
                    cachedUrl: `${R2_PUBLIC_URL}/${webpKey}`,
                    format: 'webp',
                    allowed: true,
                });
            }
        }

        // Check legacy (original format) version
        const legacyKey = getLegacyImageKey(decodedUrl);
        const legacyExists = await imageExistsInR2(legacyKey);

        return res.json({
            url: decodedUrl,
            cached: legacyExists,
            cachedUrl: legacyExists ? `${R2_PUBLIC_URL}/${legacyKey}` : null,
            format: legacyExists ? 'original' : null,
            allowed: true,
        });
    } catch (error) {
        console.error('[ImageProxy Route] Status error:', error.message);
        return res.status(500).json({ error: 'Failed to check status' });
    }
});

/**
 * GET /api/img/transform
 * Get cached URL without fetching (for frontend to construct URLs)
 * Query params:
 * - url: encoded original image URL
 */
router.get('/transform', (req, res) => {
    try {
        const originalUrl = req.query.url;

        if (!originalUrl) {
            return res.status(400).json({ error: 'URL parameter required' });
        }

        let decodedUrl;
        try {
            decodedUrl = decodeURIComponent(originalUrl);
        } catch {
            decodedUrl = originalUrl;
        }

        const cachedUrl = getCachedImageUrl(decodedUrl);

        return res.json({
            originalUrl: decodedUrl,
            cachedUrl,
            allowed: isAllowedSource(decodedUrl),
        });
    } catch (error) {
        console.error('[ImageProxy Route] Transform error:', error.message);
        return res.status(500).json({ error: 'Failed to transform URL' });
    }
});

module.exports = router;
