export const config = {
    matcher: '/api/:path*',
};

export default function middleware(request) {
    console.log('🔥 Middleware ran:', request.url);
    return;
}
