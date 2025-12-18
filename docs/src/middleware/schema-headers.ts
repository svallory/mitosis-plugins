import type { MiddlewareHandler } from 'astro';

/**
 * Middleware to serve JSON schema files with proper content-type headers and CORS.
 */
export const schemaHeaders: MiddlewareHandler = async (context, next) => {
    const { request } = context;
    const url = new URL(request.url);

    // Serve JSON schema files with proper content-type headers
    if (url.pathname.endsWith('.schema.json') || url.pathname.includes('/schemas/')) {
        const response = await next();

        if (response.headers.get('content-type') === 'application/octet-stream' ||
            response.headers.get('content-type') === null) {
            response.headers.set('content-type', 'application/schema+json');
        }

        // Enable CORS for schema files
        response.headers.set('access-control-allow-origin', '*');
        response.headers.set('access-control-allow-methods', 'GET');

        return response;
    }

    return next();
};
