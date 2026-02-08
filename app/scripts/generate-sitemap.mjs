import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');

const SITE_URL = process.env.SITE_URL || 'https://animeku.xyz';
const BACKEND_URL = process.env.SITEMAP_BACKEND_URL || 'https://api.animeku.xyz';

const MAX_WATCH_URLS = 2000;
const MAX_ANIME_FOR_ALL_EPISODES = 50;

const staticRoutes = [
  { loc: '/', changefreq: 'daily', priority: 1.0, lastmod: new Date().toISOString() },
  { loc: '/anime-list', changefreq: 'daily', priority: 0.9, lastmod: new Date().toISOString() },
  { loc: '/movies', changefreq: 'weekly', priority: 0.7, lastmod: new Date().toISOString() },
  { loc: '/schedule', changefreq: 'daily', priority: 0.8, lastmod: new Date().toISOString() },
  { loc: '/community', changefreq: 'daily', priority: 0.7, lastmod: new Date().toISOString() },
  { loc: '/genres', changefreq: 'weekly', priority: 0.7, lastmod: new Date().toISOString() },
  { loc: '/about', changefreq: 'monthly', priority: 0.5, lastmod: new Date().toISOString() },
  { loc: '/contact', changefreq: 'monthly', priority: 0.5, lastmod: new Date().toISOString() },
  { loc: '/privacy', changefreq: 'yearly', priority: 0.3, lastmod: '2024-01-01T00:00:00.000Z' },
  { loc: '/terms', changefreq: 'yearly', priority: 0.3, lastmod: '2024-01-01T00:00:00.000Z' },
  { loc: '/faq', changefreq: 'monthly', priority: 0.5, lastmod: new Date().toISOString() },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchWithRetry = async (url, attempts = 3) => {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'animeku-sitemap/1.0',
        },
        redirect: 'follow',
      });
      if (res.ok) return res;
      console.warn(`[sitemap] backend returned ${res.status} ${res.statusText}`);
      if (res.status >= 500 && i < attempts - 1) {
        await sleep(400 * (i + 1));
        continue;
      }
      return res;
    } catch (err) {
      console.warn('[sitemap] fetch error:', err?.message || err);
      if (i < attempts - 1) {
        await sleep(400 * (i + 1));
        continue;
      }
      return null;
    }
  }
  return null;
};

// Generate clean slug dari title (tanpa ID angka)
const generateCleanSlug = (title) => {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Hapus karakter special
    .replace(/\s+/g, '-') // Spasi jadi dash
    .replace(/-+/g, '-') // Multiple dash jadi satu
    .replace(/^-|-$/g, ''); // Hapus dash di awal/akhir
};

// Extract ID dari anime.id yang formatnya: slug-id atau id
const extractId = (animeId) => {
  if (!animeId) return null;
  // Cek apakah formatnya slug-id (contoh: naruto-12345)
  const match = animeId.match(/-(\d+)$/);
  if (match) {
    return match[1]; // Return angka ID
  }
  return animeId; // Return as-is jika tidak ada format khusus
};

// Fetch anime dengan data lengkap
const fetchAnimeList = async () => {
  const res = await fetchWithRetry(`${BACKEND_URL}/api/anime/custom`);
  if (!res || !res.ok) return [];
  try {
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data
      .filter((anime) => anime && typeof anime.id === 'string' && anime.id.trim().length > 0)
      .map((anime) => ({
        id: anime.id,
        cleanSlug: generateCleanSlug(anime.title), // Slug bersih tanpa ID
        title: anime.title,
        poster: anime.poster,
        banner: anime.banner,
        updatedAt: anime.updatedAt || anime.createdAt || new Date().toISOString(),
        episodes: anime.episodes || 0,
        status: anime.status,
        episodeList: anime.episodeList || [],
        rating: anime.rating,
        studio: anime.studio,
      }));
  } catch (err) {
    console.warn('[sitemap] invalid JSON:', err?.message || err);
    return [];
  }
};

const fetchDiscussions = async () => {
  const res = await fetchWithRetry(`${BACKEND_URL}/api/discussions?limit=100`);
  if (!res || !res.ok) return [];
  try {
    const data = await res.json();
    if (!Array.isArray(data?.discussions)) return [];
    return data.discussions
      .filter((d) => d && d._id)
      .map((d) => ({
        id: d._id,
        updatedAt: d.updatedAt || d.createdAt || new Date().toISOString(),
      }));
  } catch (err) {
    console.warn('[sitemap] discussions fetch error:', err?.message || err);
    return [];
  }
};

const escapeXml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return new Date().toISOString();
    return date.toISOString();
  } catch {
    return new Date().toISOString();
  }
};

const ensureAbsoluteUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('//')) {
    return `https:${url}`;
  }
  if (url.startsWith('/')) {
    return `${SITE_URL}${url}`;
  }
  return `${SITE_URL}/${url}`;
};

const buildUrl = (loc, changefreq, priority, lastmod, images = [], videos = []) => {
  const imageXml = images.length > 0
    ? images.map(img => `
    <image:image>
      <image:loc>${escapeXml(img.url)}</image:loc>
      <image:title>${escapeXml(img.title)}</image:title>
      <image:caption>${escapeXml(img.caption || img.title)}</image:caption>
    </image:image>`).join('')
    : '';

  const videoXml = videos.length > 0
    ? videos.map(video => `
    <video:video>
      <video:thumbnail_loc>${escapeXml(video.thumbnail)}</video:thumbnail_loc>
      <video:title>${escapeXml(video.title)}</video:title>
      <video:description>${escapeXml(video.description)}</video:description>
      <video:content_loc>${escapeXml(video.contentUrl)}</video:content_loc>
      ${video.duration ? `<video:duration>${video.duration}</video:duration>` : ''}
      <video:publication_date>${formatDate(video.pubDate)}</video:publication_date>
      <video:family_friendly>yes</video:family_friendly>
      <video:live>no</video:live>
    </video:video>`).join('')
    : '';

  return `
  <url>
    <loc>${escapeXml(`${SITE_URL}${loc}`)}</loc>
    <lastmod>${formatDate(lastmod)}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority.toFixed(1)}</priority>${imageXml}${videoXml}
  </url>`;
};

const generateMainSitemap = async () => {
  const [animeList, discussions] = await Promise.all([
    fetchAnimeList(),
    fetchDiscussions(),
  ]);

  console.log(`[sitemap] fetched ${animeList.length} anime, ${discussions.length} discussions`);

  const sortedAnime = animeList.sort((a, b) => {
    if (a.status === 'Ongoing' && b.status !== 'Ongoing') return -1;
    if (a.status !== 'Ongoing' && b.status === 'Ongoing') return 1;
    return (b.rating || 0) - (a.rating || 0);
  });

  let urls = [];

  // Static routes
  urls = staticRoutes.map((route) =>
    buildUrl(route.loc, route.changefreq, route.priority, route.lastmod)
  );

  // Anime detail pages dengan CLEAN SLUG (tanpa ID angka)
  const animeUrls = sortedAnime.map((anime) => {
    const images = [];
    const bannerUrl = ensureAbsoluteUrl(anime.banner);
    const posterUrl = ensureAbsoluteUrl(anime.poster);
    
    if (bannerUrl) {
      images.push({
        url: bannerUrl,
        title: `Banner ${anime.title}`,
        caption: `Nonton ${anime.title} Subtitle Indonesia`,
      });
    }
    if (posterUrl) {
      images.push({
        url: posterUrl,
        title: `Poster ${anime.title}`,
        caption: `Streaming ${anime.title} Subtitle Indonesia`,
      });
    }

    // Gunakan clean slug tanpa ID angka
    const slug = anime.cleanSlug || encodeURIComponent(anime.id);
    
    return buildUrl(
      `/anime/${slug}`,
      anime.status === 'Ongoing' ? 'daily' : 'weekly',
      0.8,
      anime.updatedAt,
      images
    );
  });
  urls = urls.concat(animeUrls);

  // Watch pages dengan CLEAN SLUG
  let watchUrlCount = 0;
  const watchUrls = [];

  for (const anime of sortedAnime) {
    if (watchUrlCount >= MAX_WATCH_URLS) {
      console.log(`[sitemap] reached watch URL limit (${MAX_WATCH_URLS})`);
      break;
    }

    const episodeCount = anime.episodes || 1;
    const isPriorityAnime = anime.status === 'Ongoing' || 
                           (anime.rating && anime.rating >= 8.0) ||
                           watchUrls.length < MAX_ANIME_FOR_ALL_EPISODES;

    const slug = anime.cleanSlug || encodeURIComponent(anime.id);

    if (isPriorityAnime) {
      for (let i = 1; i <= episodeCount && watchUrlCount < MAX_WATCH_URLS; i++) {
        const posterUrl = ensureAbsoluteUrl(anime.poster);
        const images = posterUrl ? [{
          url: posterUrl,
          title: `${anime.title} Episode ${i}`,
          caption: `Streaming ${anime.title} Episode ${i} Subtitle Indonesia`,
        }] : [];

        const videos = [];
        const episodeData = anime.episodeList?.find(e => e.number === i);
        if (episodeData?.videoUrl) {
          videos.push({
            thumbnail: posterUrl || `${SITE_URL}/favicon.svg`,
            title: `${anime.title} Episode ${i} Subtitle Indonesia`,
            description: `Nonton ${anime.title} Episode ${i} subtitle Indonesia gratis di Animeku`,
            contentUrl: ensureAbsoluteUrl(episodeData.videoUrl),
            duration: episodeData.duration ? parseInt(episodeData.duration) * 60 : 1440,
            pubDate: anime.updatedAt,
          });
        }

        watchUrls.push(buildUrl(
          `/watch/${slug}/${i}`,
          'weekly',
          0.6,
          anime.updatedAt,
          images,
          videos
        ));
        watchUrlCount++;
      }
    } else {
      const episodesToInclude = [1];
      if (episodeCount > 1) {
        episodesToInclude.push(episodeCount);
      }

      for (const epNum of episodesToInclude) {
        if (watchUrlCount >= MAX_WATCH_URLS) break;
        
        const posterUrl = ensureAbsoluteUrl(anime.poster);
        const images = posterUrl ? [{
          url: posterUrl,
          title: `${anime.title} Episode ${epNum}`,
          caption: `Streaming ${anime.title} Episode ${epNum} Subtitle Indonesia`,
        }] : [];

        watchUrls.push(buildUrl(
          `/watch/${slug}/${epNum}`,
          'monthly',
          0.5,
          anime.updatedAt,
          images
        ));
        watchUrlCount++;
      }
    }
  }
  urls = urls.concat(watchUrls);

  console.log(`[sitemap] generated ${watchUrls.length} watch URLs`);

  // Discussion pages
  const discussionUrls = discussions.map((d) =>
    buildUrl(
      `/community/discussion/${d.id}`,
      'weekly',
      0.6,
      d.updatedAt
    )
  );
  urls = urls.concat(discussionUrls);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urls.join('')}
</urlset>`;

  await fs.mkdir(publicDir, { recursive: true });
  await fs.writeFile(path.join(publicDir, 'sitemap.xml'), xml, 'utf8');
  console.log(`[sitemap] generated ${urls.length} URLs in main sitemap`);

  return { 
    animeCount: animeList.length, 
    discussionCount: discussions.length,
    watchCount: watchUrls.length,
    totalUrls: urls.length,
    sampleUrls: sortedAnime.slice(0, 3).map(a => ({
      original: a.id,
      cleanSlug: a.cleanSlug
    }))
  };
};

const generateSitemapIndex = async (stats) => {
  const now = new Date().toISOString();
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/sitemap.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`;

  await fs.writeFile(path.join(publicDir, 'sitemap-index.xml'), xml, 'utf8');
  console.log('[sitemap] generated sitemap index');
};

const run = async () => {
  try {
    const stats = await generateMainSitemap();
    await generateSitemapIndex(stats);
    console.log('[sitemap] =========================================');
    console.log(`[sitemap] Total URLs: ${stats.totalUrls}`);
    console.log(`[sitemap] Anime detail: ${stats.animeCount}`);
    console.log(`[sitemap] Watch pages: ${stats.watchCount}`);
    console.log(`[sitemap] Discussions: ${stats.discussionCount}`);
    console.log('[sitemap] Sample clean slugs:');
    stats.sampleUrls?.forEach(s => {
      console.log(`[sitemap]   ${s.original} → ${s.cleanSlug}`);
    });
    console.log('[sitemap] =========================================');
    process.exit(0);
  } catch (err) {
    console.error('[sitemap] generation failed:', err);
    process.exit(1);
  }
};

run();
