/**
 * Thumbnail Generator Utility
 * Generate thumbnails from video files using ffmpeg
 */

const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');
const execPromise = promisify(exec);

// Create temp directory for thumbnails
const tempDir = path.join(__dirname, '../temp_thumbnails');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

// Check if ffmpeg is available
let ffmpegAvailable = false;
async function checkFfmpeg() {
    try {
        await execPromise('ffmpeg -version');
        ffmpegAvailable = true;
        console.log('[Thumbnail] FFmpeg is available');
    } catch (err) {
        console.warn('[Thumbnail] FFmpeg is NOT available. Thumbnail generation will be disabled.');
        console.warn('[Thumbnail] Install ffmpeg: apt-get install ffmpeg (Ubuntu/Debian) or brew install ffmpeg (macOS)');
        ffmpegAvailable = false;
    }
}
checkFfmpeg();

/**
 * Generate thumbnail from video URL (R2/S3 URL)
 * @param {string} videoUrl - Public URL of the video
 * @param {Object} options - Options for thumbnail generation
 * @param {number} options.time - Time in seconds to capture thumbnail (default: 5)
 * @param {number} options.width - Width of thumbnail (default: 640)
 * @param {number} options.height - Height of thumbnail (default: 360)
 * @returns {Promise<Buffer>} - Thumbnail image buffer
 */
async function generateThumbnail(videoUrl, options = {}) {
    if (!ffmpegAvailable) {
        throw new Error('FFmpeg is not available. Please install ffmpeg to enable thumbnail generation.');
    }
    
    const { time = 5, width = 640, height = 360 } = options;
    
    // Generate temp filename
    const tempFilename = `thumb-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
    const tempPath = path.join(tempDir, tempFilename);
    
    console.log(`[Thumbnail] Generating thumbnail for video at ${time}s, resolution: ${width}x${height}`);
    
    return new Promise((resolve, reject) => {
        ffmpeg(videoUrl)
            .screenshots({
                timestamps: [time],
                filename: tempFilename,
                folder: tempDir,
                size: `${width}x${height}`
            })
            .on('end', () => {
                console.log(`[Thumbnail] Screenshot captured: ${tempPath}`);
                try {
                    const buffer = fs.readFileSync(tempPath);
                    // Cleanup temp file
                    fs.unlinkSync(tempPath);
                    resolve(buffer);
                } catch (err) {
                    reject(err);
                }
            })
            .on('error', (err) => {
                console.error('[Thumbnail] FFmpeg error:', err.message);
                // Cleanup if exists
                if (fs.existsSync(tempPath)) {
                    fs.unlinkSync(tempPath);
                }
                reject(err);
            });
    });
}

/**
 * Generate thumbnail with retry logic
 * @param {string} videoUrl - Video URL
 * @param {Object} options - Options
 * @param {number} retries - Number of retries (default: 3)
 * @returns {Promise<Buffer>}
 */
async function generateThumbnailWithRetry(videoUrl, options = {}, retries = 3) {
    const { time = 5, width = 640, height = 360 } = options;
    
    // Try different timestamps if first fails (video might be short)
    const timestamps = [time, 1, 10, 30, 60];
    
    for (const ts of timestamps) {
        for (let i = 0; i < retries; i++) {
            try {
                console.log(`[Thumbnail] Attempt ${i + 1}/${retries} at ${ts}s`);
                const buffer = await generateThumbnail(videoUrl, { time: ts, width, height });
                return buffer;
            } catch (err) {
                console.warn(`[Thumbnail] Attempt ${i + 1} failed at ${ts}s:`, err.message);
                if (i === retries - 1) {
                    console.warn(`[Thumbnail] All retries failed for timestamp ${ts}s`);
                    break;
                }
                // Wait before retry
                await new Promise(r => setTimeout(r, 1000 * (i + 1)));
            }
        }
    }
    
    throw new Error('Failed to generate thumbnail after all retries');
}

/**
 * Generate multiple thumbnails for different resolutions
 * @param {string} videoUrl - Video URL
 * @param {number} episode - Episode number
 * @returns {Promise<Object>} - Object with different resolution thumbnails
 */
async function generateMultiResolutionThumbnails(videoUrl, episode) {
    const resolutions = [
        { width: 1280, height: 720, suffix: '720p' },
        { width: 640, height: 360, suffix: '360p' },
        { width: 320, height: 180, suffix: '180p' }
    ];
    
    const results = {};
    
    // Generate only one thumbnail (720p) and let frontend handle resizing
    // or generate all for better performance
    try {
        const buffer = await generateThumbnailWithRetry(videoUrl, { 
            time: 5, 
            width: 1280, 
            height: 720 
        });
        results.buffer = buffer;
        results.mainResolution = '720p';
        console.log(`[Thumbnail] Generated main thumbnail (1280x720)`);
    } catch (err) {
        console.error('[Thumbnail] Failed to generate main thumbnail:', err.message);
        throw err;
    }
    
    return results;
}

/**
 * Cleanup old temp files (run periodically)
 */
function cleanupTempFiles() {
    try {
        const files = fs.readdirSync(tempDir);
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        for (const file of files) {
            const filePath = path.join(tempDir, file);
            const stats = fs.statSync(filePath);
            if (now - stats.mtime.getTime() > maxAge) {
                fs.unlinkSync(filePath);
                console.log(`[Thumbnail] Cleaned up old temp file: ${file}`);
            }
        }
    } catch (err) {
        console.error('[Thumbnail] Cleanup error:', err.message);
    }
}

// Run cleanup every hour
setInterval(cleanupTempFiles, 60 * 60 * 1000);

module.exports = {
    generateThumbnail,
    generateThumbnailWithRetry,
    generateMultiResolutionThumbnails,
    cleanupTempFiles
};
