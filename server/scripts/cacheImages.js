/**
 * Pre-cache All Anime Images Script
 * Downloads all anime poster and banner images from database and caches them to R2
 * 
 * Usage:
 * - npm run cache:images         - Cache all images
 * - npm run cache:images -- --dry-run  - Preview without caching
 * - npm run cache:images -- --limit=100  - Limit to first 100 anime
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { CustomAnime } = require('../models/CustomAnime');
const { processImage, isAllowedSource } = require('../utils/imageProxy');

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const limitArg = args.find(arg => arg.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 0;

// Stats tracking
const stats = {
    total: 0,
    processed: 0,
    cached: 0,
    skipped: 0,
    failed: 0,
    alreadyCached: 0,
};

async function main() {
    console.log('🖼️  Anime Image Pre-caching Script');
    console.log('=====================================');

    if (isDryRun) {
        console.log('📋 DRY RUN MODE - No images will be cached\n');
    }

    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
        console.error('❌ MONGODB_URI not found in .env');
        process.exit(1);
    }

    // Check R2 credentials
    if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
        console.error('❌ R2 credentials not found in .env');
        process.exit(1);
    }

    try {
        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Fetch all anime
        let query = CustomAnime.find({}).select('title poster banner');
        if (limit > 0) {
            query = query.limit(limit);
            console.log(`📦 Fetching first ${limit} anime...\n`);
        } else {
            console.log('📦 Fetching all anime...\n');
        }

        const animeList = await query.lean();
        stats.total = animeList.length;

        console.log(`Found ${stats.total} anime to process\n`);

        // Collect all unique image URLs
        const imageUrls = new Set();
        animeList.forEach(anime => {
            if (anime.poster) imageUrls.add(anime.poster);
            if (anime.banner) imageUrls.add(anime.banner);
        });

        const uniqueUrls = Array.from(imageUrls).filter(url => url && isAllowedSource(url));
        console.log(`📷 Found ${uniqueUrls.length} unique images from allowed sources\n`);

        if (isDryRun) {
            console.log('DRY RUN - Would cache the following images:');
            uniqueUrls.slice(0, 10).forEach(url => console.log(`  - ${url}`));
            if (uniqueUrls.length > 10) {
                console.log(`  ... and ${uniqueUrls.length - 10} more`);
            }
            console.log('\n✅ Dry run complete');
            await mongoose.disconnect();
            process.exit(0);
        }

        // Process images in batches
        const BATCH_SIZE = 5;
        const DELAY_BETWEEN_BATCHES = 500; // ms

        console.log(`Processing in batches of ${BATCH_SIZE}...\n`);

        for (let i = 0; i < uniqueUrls.length; i += BATCH_SIZE) {
            const batch = uniqueUrls.slice(i, i + BATCH_SIZE);
            const batchNum = Math.floor(i / BATCH_SIZE) + 1;
            const totalBatches = Math.ceil(uniqueUrls.length / BATCH_SIZE);

            process.stdout.write(`\r⏳ Processing batch ${batchNum}/${totalBatches} (${i + batch.length}/${uniqueUrls.length})...`);

            const promises = batch.map(async (url) => {
                try {
                    stats.processed++;
                    const result = await processImage(url);

                    if (result.fromCache) {
                        stats.alreadyCached++;
                    } else if (result.url !== url) {
                        stats.cached++;
                    } else {
                        stats.skipped++;
                    }
                } catch (error) {
                    stats.failed++;
                    console.error(`\n❌ Failed: ${url} - ${error.message}`);
                }
            });

            await Promise.all(promises);

            // Small delay to avoid rate limiting
            if (i + BATCH_SIZE < uniqueUrls.length) {
                await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
            }
        }

        console.log('\n\n=====================================');
        console.log('📊 RESULTS:');
        console.log('=====================================');
        console.log(`  Total anime:       ${stats.total}`);
        console.log(`  Images processed:  ${stats.processed}`);
        console.log(`  Newly cached:      ${stats.cached}`);
        console.log(`  Already cached:    ${stats.alreadyCached}`);
        console.log(`  Skipped:           ${stats.skipped}`);
        console.log(`  Failed:            ${stats.failed}`);
        console.log('=====================================\n');

        if (stats.failed > 0) {
            console.log('⚠️  Some images failed to cache. They will use original URLs as fallback.');
        }

        console.log('✅ Pre-caching complete!\n');

    } catch (error) {
        console.error('\n❌ Script error:', error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('📡 Disconnected from MongoDB');
    }
}

main().catch(console.error);
