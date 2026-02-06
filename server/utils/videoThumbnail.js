const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const { Upload } = require('@aws-sdk/lib-storage');
const { s3Client, VIDEO_BUCKET_NAME } = require('./r2-storage');

// Check if ffmpeg is installed
ffmpeg.getAvailableFormats((err) => {
  if (err) {
    console.error('[VideoThumbnail] FFmpeg not found! Please install ffmpeg.');
    console.error('[VideoThumbnail] Ubuntu/Debian: sudo apt-get install ffmpeg');
    console.error('[VideoThumbnail] CentOS/RHEL: sudo yum install ffmpeg');
    console.error('[VideoThumbnail] Windows: Download from https://ffmpeg.org/download.html');
  } else {
    console.log('[VideoThumbnail] FFmpeg is available');
  }
});

/**
 * Generate thumbnail from video URL
 * @param {string} videoUrl - URL of the video
 * @param {string} animeId - Anime ID
 * @param {number} episodeNumber - Episode number
 * @param {number} timestamp - Timestamp in seconds (default: random between 3-10 minutes)
 * @returns {Promise<string>} - Thumbnail URL
 */
async function generateThumbnail(videoUrl, animeId, episodeNumber, timestamp) {
  // If timestamp not provided, generate random between 3-10 minutes (180-600 seconds)
  if (!timestamp) {
    timestamp = Math.floor(Math.random() * (600 - 180 + 1)) + 180;
    console.log(`[VideoThumbnail] Using random timestamp: ${timestamp}s (${Math.floor(timestamp/60)}m ${timestamp%60}s)`);
  }
  return new Promise((resolve, reject) => {
    // Create temp directory if not exists
    const tempDir = path.join(__dirname, '../temp/thumbnails');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const outputFile = path.join(tempDir, `${animeId}-ep-${episodeNumber}.jpg`);
    
    ffmpeg(videoUrl)
      .screenshots({
        timestamps: [timestamp],
        filename: path.basename(outputFile),
        folder: tempDir,
        size: '640x360', // 16:9 aspect ratio
      })
      .on('end', async () => {
        try {
          // Upload to R2
          const fileStream = fs.createReadStream(outputFile);
          const key = `thumbnails/${animeId}/episode-${episodeNumber}.jpg`;
          
          const upload = new Upload({
            client: s3Client,
            params: {
              Bucket: VIDEO_BUCKET_NAME,
              Key: key,
              Body: fileStream,
              ContentType: 'image/jpeg',
            },
          });

          await upload.done();
          
          // Clean up temp file
          fs.unlinkSync(outputFile);
          
          // Return thumbnail URL
          const thumbnailUrl = `${process.env.R2_PUBLIC_URL || ''}/${key}`;
          resolve(thumbnailUrl);
        } catch (err) {
          reject(err);
        }
      })
      .on('error', (err) => {
        console.error('[VideoThumbnail] Error:', err);
        reject(err);
      });
  });
}

/**
 * Get or generate thumbnail for episode
 * If thumbnail exists in R2, return it. Otherwise generate from video
 */
async function getOrGenerateThumbnail(videoUrl, animeId, episodeNumber) {
  // Check if thumbnail already exists
  const thumbnailKey = `thumbnails/${animeId}/episode-${episodeNumber}.jpg`;
  const thumbnailUrl = `${process.env.R2_PUBLIC_URL || ''}/${thumbnailKey}`;
  
  // TODO: Check if file exists in R2
  // For now, always generate
  try {
    return await generateThumbnail(videoUrl, animeId, episodeNumber);
  } catch (err) {
    console.error('[VideoThumbnail] Failed to generate:', err);
    return null;
  }
}

module.exports = {
  generateThumbnail,
  getOrGenerateThumbnail,
};
