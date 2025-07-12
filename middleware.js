export const config = {
    matcher: '/api/:path*', // Intercept all /api/* routes
};

export default function middleware(request) {
    console.log(request);
    const origin = request.headers.get('origin') || '*';

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': origin,
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400',
            },
        });
    }

    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Credentials': 'true',
        },
    });
}
