import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple in-memory rate limiter (for edge runtime)
// Note: For production at scale, use Redis or similar
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration per route type
const RATE_LIMITS = {
  api: { requests: 60, windowMs: 60000 },      // 60 req/min for general API
  auth: { requests: 10, windowMs: 60000 },     // 10 req/min for auth endpoints
  stripe: { requests: 30, windowMs: 60000 },   // 30 req/min for Stripe
  admin: { requests: 100, windowMs: 60000 },   // 100 req/min for admin
};

function getClientIP(request: NextRequest): string {
  // Try various headers for client IP
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }
  // Fallback - in production this would be the actual IP
  return "unknown";
}

function getRateLimitKey(ip: string, path: string): string {
  // Group rate limits by route type
  if (path.startsWith("/api/auth")) return `auth:${ip}`;
  if (path.startsWith("/api/stripe")) return `stripe:${ip}`;
  if (path.startsWith("/api/admin")) return `admin:${ip}`;
  if (path.startsWith("/api")) return `api:${ip}`;
  return `page:${ip}`;
}

function getRateLimitConfig(path: string) {
  if (path.startsWith("/api/auth")) return RATE_LIMITS.auth;
  if (path.startsWith("/api/stripe")) return RATE_LIMITS.stripe;
  if (path.startsWith("/api/admin")) return RATE_LIMITS.admin;
  return RATE_LIMITS.api;
}

function checkRateLimit(key: string, config: { requests: number; windowMs: number }): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    // New window
    rateLimitMap.set(key, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true, remaining: config.requests - 1, resetIn: config.windowMs };
  }

  if (record.count >= config.requests) {
    // Rate limited
    return { allowed: false, remaining: 0, resetIn: record.resetTime - now };
  }

  // Increment
  record.count++;
  return { allowed: true, remaining: config.requests - record.count, resetIn: record.resetTime - now };
}

// Clean up old entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 300000);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only rate limit API routes
  if (pathname.startsWith("/api")) {
    const ip = getClientIP(request);
    const key = getRateLimitKey(ip, pathname);
    const config = getRateLimitConfig(pathname);
    const { allowed, remaining, resetIn } = checkRateLimit(key, config);

    if (!allowed) {
      return new NextResponse(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil(resetIn / 1000)),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(resetIn / 1000)),
          },
        }
      );
    }

    // Continue with rate limit headers
    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Remaining", String(remaining));
    response.headers.set("X-RateLimit-Reset", String(Math.ceil(resetIn / 1000)));
    
    // Add security headers to API responses
    addSecurityHeaders(response);
    
    return response;
  }

  // For non-API routes, just add security headers
  const response = NextResponse.next();
  addSecurityHeaders(response);
  
  return response;
}

function addSecurityHeaders(response: NextResponse) {
  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");
  
  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");
  
  // XSS protection (legacy but still useful)
  response.headers.set("X-XSS-Protection", "1; mode=block");
  
  // Referrer policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // Permissions policy (restrict browser features)
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );
  
  // Content Security Policy - adjust as needed for your app
  // Note: 'unsafe-inline' is needed for Next.js styled-jsx
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com",
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; ")
  );
}

export const config = {
  matcher: [
    // Match all API routes
    "/api/:path*",
    // Match all pages except static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
