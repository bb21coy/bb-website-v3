export const config = {
    matcher: '/api/:path*',
};

export default function middleware(request) {
    const origin = request.headers.get('origin') || '*';
    console.log("Incoming Origin:", origin);
    console.log("Request Headers:");
    for (const [key, value] of request.headers.entries()) {
        console.log(`${key}: ${value}`);
    }

    // Handle OPTIONS preflight
    if (request.method === 'OPTIONS') {
        const corsHeaders = {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400',
        };

        console.log("Returning preflight headers:");
        console.log(corsHeaders);

        return new Response(null, {
            status: 204,
            headers: corsHeaders,
        });
    }

    // For actual requests
    const headers = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
    };

    console.log("Returning main CORS headers:");
    console.log(headers);

    return new Response(null, {
        status: 200,
        headers,
    });
}
