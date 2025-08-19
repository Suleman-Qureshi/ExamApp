import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Configure your allowed origin(s). For multiple, use a comma-separated list in CORS_ORIGIN.
const allowed = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map(s => s.trim());

function resolveOrigin(origin: string | null) {
  if (!origin) return '*';
  if (allowed.includes('*') || allowed.includes(origin)) return origin;
  // Fallback to first configured origin or '*'
  return allowed[0] || '*';
}

export function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const origin = req.headers.get('origin');
  const corsHeaders = {
    'Access-Control-Allow-Origin': resolveOrigin(origin),
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }

  const res = NextResponse.next();
  Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

export const config = {
  matcher: ['/api/:path*'],
};