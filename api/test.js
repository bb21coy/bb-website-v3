export const config = {
  runtime: 'edge', // ✅ tell Vercel to run this as Edge Function
};

export default async function handler(req) {
  const origin = req.headers.get('origin');
  const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];

  const headers = new Headers({
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  });

  if (allowedOrigins.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  return new Response(JSON.stringify({ message: 'CORS passed via Edge Function' }), {
    status: 200,
    headers,
  });
}
