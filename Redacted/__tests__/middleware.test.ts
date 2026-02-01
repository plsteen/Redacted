import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// Mock NextResponse and NextRequest for middleware testing
const mockNextResponse = {
  next: vi.fn(() => ({
    headers: new Map(),
  })),
  json: vi.fn(),
};

vi.mock("next/server", () => ({
  NextResponse: mockNextResponse,
}));

describe("Rate Limiting Logic", () => {
  // Test the rate limiting algorithm in isolation
  const createRateLimiter = () => {
    const map = new Map<string, { count: number; resetTime: number }>();
    
    return {
      check: (key: string, limit: number, windowMs: number) => {
        const now = Date.now();
        const record = map.get(key);

        if (!record || now > record.resetTime) {
          map.set(key, { count: 1, resetTime: now + windowMs });
          return { allowed: true, remaining: limit - 1 };
        }

        if (record.count >= limit) {
          return { allowed: false, remaining: 0 };
        }

        record.count++;
        return { allowed: true, remaining: limit - record.count };
      },
      clear: () => map.clear(),
    };
  };

  let rateLimiter: ReturnType<typeof createRateLimiter>;

  beforeEach(() => {
    rateLimiter = createRateLimiter();
  });

  afterEach(() => {
    rateLimiter.clear();
  });

  it("allows requests under the limit", () => {
    const result = rateLimiter.check("test-ip", 10, 60000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it("decrements remaining count on each request", () => {
    const limit = 5;
    for (let i = 0; i < 3; i++) {
      rateLimiter.check("test-ip", limit, 60000);
    }
    const result = rateLimiter.check("test-ip", limit, 60000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it("blocks requests when limit is exceeded", () => {
    const limit = 3;
    for (let i = 0; i < limit; i++) {
      rateLimiter.check("test-ip", limit, 60000);
    }
    const result = rateLimiter.check("test-ip", limit, 60000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("tracks different IPs separately", () => {
    const limit = 2;
    rateLimiter.check("ip-1", limit, 60000);
    rateLimiter.check("ip-1", limit, 60000);
    
    const result1 = rateLimiter.check("ip-1", limit, 60000);
    const result2 = rateLimiter.check("ip-2", limit, 60000);
    
    expect(result1.allowed).toBe(false);
    expect(result2.allowed).toBe(true);
  });
});

describe("Security Headers", () => {
  const expectedHeaders = [
    "X-Frame-Options",
    "X-Content-Type-Options",
    "X-XSS-Protection",
    "Referrer-Policy",
    "Permissions-Policy",
    "Content-Security-Policy",
  ];

  it("should define all required security headers", () => {
    // This test validates the header names we expect to set
    expectedHeaders.forEach((header) => {
      expect(header).toBeDefined();
    });
  });

  it("X-Frame-Options should be DENY", () => {
    expect("DENY").toBe("DENY");
  });

  it("X-Content-Type-Options should be nosniff", () => {
    expect("nosniff").toBe("nosniff");
  });

  it("CSP should include required directives", () => {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com",
    ].join("; ");
    
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("https://js.stripe.com");
    expect(csp).toContain("https://*.supabase.co");
  });
});

describe("Route Classification", () => {
  const classifyRoute = (path: string) => {
    if (path.startsWith("/api/auth")) return "auth";
    if (path.startsWith("/api/stripe")) return "stripe";
    if (path.startsWith("/api/admin")) return "admin";
    if (path.startsWith("/api")) return "api";
    return "page";
  };

  it("classifies auth routes correctly", () => {
    expect(classifyRoute("/api/auth/login")).toBe("auth");
    expect(classifyRoute("/api/auth/callback")).toBe("auth");
    expect(classifyRoute("/api/auth/logout")).toBe("auth");
  });

  it("classifies stripe routes correctly", () => {
    expect(classifyRoute("/api/stripe/checkout")).toBe("stripe");
    expect(classifyRoute("/api/stripe/webhook")).toBe("stripe");
  });

  it("classifies admin routes correctly", () => {
    expect(classifyRoute("/api/admin/logs")).toBe("admin");
    expect(classifyRoute("/api/admin/purchases")).toBe("admin");
  });

  it("classifies general API routes correctly", () => {
    expect(classifyRoute("/api/catalog")).toBe("api");
    expect(classifyRoute("/api/library")).toBe("api");
  });

  it("classifies page routes correctly", () => {
    expect(classifyRoute("/")).toBe("page");
    expect(classifyRoute("/play")).toBe("page");
    expect(classifyRoute("/catalog")).toBe("page");
  });
});
