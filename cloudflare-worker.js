export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const userAgent = request.headers.get('User-Agent') || '';

    const BACKEND_URL = 'https://api.animeku.xyz';
    const isCrawler = /facebookexternalhit|WhatsApp|Twitterbot|LinkedInBot|Googlebot|bingbot|Slurp|DuckDuckBot|Applebot/i.test(userAgent);

    // SSR Routes - Only for crawlers
    if ((path.match(/^\/anime\/[^\/]+/) || path.match(/^\/watch\/[^\/]+/)) && isCrawler) {
      const backendUrl = BACKEND_URL + path + url.search;

      try {
        const response = await fetch(backendUrl, {
          method: request.method,
          headers: {
            'Host': 'api.animeku.xyz',
            'Accept': 'text/html',
            'User-Agent': userAgent,
          }
        });

        return new Response(response.body, {
          status: response.status,
          headers: response.headers
        });
      } catch (err) {
        console.error('Backend error:', err);
      }
    }

    // API Routes
    if (path.startsWith('/api/') || path.startsWith('/socket.io/')) {
      const backendUrl = BACKEND_URL + path + url.search;
      const response = await fetch(backendUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body
      });
      return new Response(response.body, {
        status: response.status,
        headers: response.headers
      });
    }

    // Static Files dari R2 dengan CACHE HEADERS
    let objectPath = path.slice(1) || 'index.html';
    if (objectPath.startsWith('/')) {
      objectPath = objectPath.slice(1);
    }

    let object = await env.BUCKET.get(objectPath);
    if (!object && !objectPath.includes('.')) {
      object = await env.BUCKET.get('index.html');
    }
    if (!object) return new Response('Not found', { status: 404 });

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    
    // ⭐ TAMBAH CACHE HEADERS
    const ext = objectPath.split('.').pop()?.toLowerCase();
    
    if (['js', 'css'].includes(ext)) {
      // Code: 1 year (immutable dengan hash)
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (['png', 'jpg', 'jpeg', 'webp', 'avif', 'gif', 'svg', 'ico'].includes(ext)) {
      // Images: 1 year
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (ext === 'html') {
      // HTML: 1 hour
      headers.set('Cache-Control', 'public, max-age=3600');
    } else {
      // Default: 1 day
      headers.set('Cache-Control', 'public, max-age=86400');
    }
    
    return new Response(object.body, { headers });
  }
};