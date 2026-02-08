export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Backend API URL
    const BACKEND_URL = 'https://api.animeku.xyz';

    // SSR Routes - Proxy ke backend server untuk SEO/Social Sharing
    if (path.match(/^\/anime\/[^\/]+/) || path.match(/^\/watch\/[^\/]+/)) {
      const backendUrl = BACKEND_URL + path + url.search;
      
      try {
        const response = await fetch(backendUrl, {
          method: request.method,
          headers: {
            'Host': 'api.animeku.xyz',
            'Accept': request.headers.get('Accept') || 'text/html',
            'User-Agent': request.headers.get('User-Agent') || '',
          }
        });
        
        const newHeaders = new Headers(response.headers);
        newHeaders.set('X-Worker-Cache', 'BYPASS');
        
        return new Response(response.body, {
          status: response.status,
          headers: newHeaders
        });
      } catch (err) {
        console.error('Backend error:', err);
        // Fallback ke static jika backend error
      }
    }

    // API Routes - Proxy ke backend
    if (path.startsWith('/api/') || path.startsWith('/socket.io/')) {
      const backendUrl = BACKEND_URL + path + url.search;
      
      try {
        const response = await fetch(backendUrl, {
          method: request.method,
          headers: request.headers,
          body: request.body
        });
        
        return new Response(response.body, {
          status: response.status,
          headers: response.headers
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: 'Backend unavailable' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Static Files - Ambil dari R2 Bucket
    let objectPath = path.slice(1) || 'index.html';
    if (objectPath.startsWith('/')) {
      objectPath = objectPath.slice(1);
    }

    let object = await env.BUCKET.get(objectPath);

    if (!object && !objectPath.includes('.')) {
      object = await env.BUCKET.get('index.html');
    }

    if (!object) {
      return new Response('Not found', { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=3600');
    
    return new Response(object.body, { headers });
  }
};