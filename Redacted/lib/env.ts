import { z } from "zod";

/**
 * Server-side environment variables schema.
 * These are only available on the server and should never be exposed to the client.
 */
const serverEnvSchema = z.object({
  // Supabase
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),

  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith("sk_", "STRIPE_SECRET_KEY must start with 'sk_'"),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_", "STRIPE_WEBHOOK_SECRET must start with 'whsec_'").optional(),

  // Email
  RESEND_API_KEY: z.string().startsWith("re_", "RESEND_API_KEY must start with 're_'").optional(),
  ADMIN_NOTIFICATION_EMAIL: z.string().email().optional(),

  // Node environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

/**
 * Client-side environment variables schema.
 * These are exposed to the browser and must be prefixed with NEXT_PUBLIC_.
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  NEXT_PUBLIC_BASE_URL: z.string().url("NEXT_PUBLIC_BASE_URL must be a valid URL").optional(),
});

/**
 * Combined environment schema for server-side code.
 */
const envSchema = serverEnvSchema.merge(clientEnvSchema);

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type Env = z.infer<typeof envSchema>;

/**
 * Validates and returns server environment variables.
 * Throws an error if validation fails.
 * Only call this on the server side.
 */
export function getServerEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("❌ Invalid environment variables:");
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables. Check the server logs for details.");
  }

  return parsed.data;
}

/**
 * Validates and returns client environment variables.
 * Safe to use on both client and server.
 */
export function getClientEnv(): ClientEnv {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  });

  if (!parsed.success) {
    console.error("❌ Invalid client environment variables:");
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error("Invalid client environment variables.");
  }

  return parsed.data;
}

/**
 * Type-safe environment variable access.
 * Use this instead of process.env directly.
 */
export const env = {
  /**
   * Get a server-side environment variable.
   * Throws if the variable is missing or invalid.
   */
  server: () => getServerEnv(),

  /**
   * Get client-side environment variables.
   * Safe for use in both client and server code.
   */
  client: () => getClientEnv(),
};

// Validate environment on module load in non-test environments
if (typeof window === "undefined" && process.env.NODE_ENV !== "test") {
  // Delay validation to allow for lazy loading
  // This prevents build-time failures when env vars aren't set
  const validateOnFirstUse = false;
  if (!validateOnFirstUse) {
    try {
      // Only validate client env at build time (these are required)
      getClientEnv();
    } catch (error) {
      // Log but don't crash during build
      if (process.env.NODE_ENV === "production") {
        throw error;
      }
      console.warn("⚠️ Environment validation warning:", error);
    }
  }
}
