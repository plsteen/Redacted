-- 003_payments.sql
-- Payment system: Stripe integration, Auth, and content protection

-- ============================================================================
-- EXTEND USERS TABLE
-- ============================================================================

-- Add email for magic link auth
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- Add Stripe customer ID for payment tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);

-- ============================================================================
-- STRIPE EVENTS TABLE (for webhook idempotency)
-- ============================================================================

CREATE TABLE IF NOT EXISTS stripe_events (
    id TEXT PRIMARY KEY,               -- Stripe event ID (evt_xxx)
    event_type TEXT NOT NULL,          -- e.g., 'checkout.session.completed'
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    payload JSONB                      -- Store full event for debugging
);

-- ============================================================================
-- ENHANCE PURCHASES TABLE
-- ============================================================================

-- Add Stripe-specific fields if not exist
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_mystery_id ON purchases(mystery_id);
CREATE INDEX IF NOT EXISTS idx_purchases_stripe_checkout ON purchases(stripe_checkout_session_id);

-- ============================================================================
-- CONTENT ACCESS TABLE (tracks temporary co-player access)
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mystery_id UUID NOT NULL REFERENCES mysteries(id),
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,            -- NULL = session-based (ends when session ends)
    UNIQUE(session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_content_access_session ON content_access(session_id);
CREATE INDEX IF NOT EXISTS idx_content_access_user ON content_access(user_id);

-- ============================================================================
-- UPDATE SESSIONS TABLE
-- ============================================================================

-- Add host reference
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS host_user_id UUID REFERENCES users(id);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_access ENABLE ROW LEVEL SECURITY;

-- Stripe events: Only service role can access (handled by API routes)
-- No public policies - only accessible via service role

-- Content access: Users can see their own access
CREATE POLICY "Users can view own content access"
    ON content_access FOR SELECT
    USING (auth.uid() = user_id);

-- Content access: Hosts can grant access (via API routes with service role)
-- No direct insert policy - handled by service role in API

-- Purchases: Users can only see their own purchases
DROP POLICY IF EXISTS "Users can view own purchases" ON purchases;
CREATE POLICY "Users can view own purchases"
    ON purchases FOR SELECT
    USING (auth.uid() = user_id);

-- Users: Users can see their own data
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if a user has access to a mystery (purchased or active session)
CREATE OR REPLACE FUNCTION user_has_mystery_access(p_user_id UUID, p_mystery_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user purchased this mystery
    IF EXISTS (
        SELECT 1 FROM purchases 
        WHERE user_id = p_user_id 
        AND mystery_id = p_mystery_id
        AND status = 'completed'
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user has active content access (co-player in session)
    IF EXISTS (
        SELECT 1 FROM content_access ca
        JOIN sessions s ON ca.session_id = s.id
        WHERE ca.user_id = p_user_id
        AND ca.mystery_id = p_mystery_id
        AND s.status = 'active'
        AND (ca.expires_at IS NULL OR ca.expires_at > NOW())
    ) THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's purchased mysteries
CREATE OR REPLACE FUNCTION get_user_library(p_user_id UUID)
RETURNS TABLE (
    mystery_id UUID,
    title TEXT,
    slug TEXT,
    purchased_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id AS mystery_id,
        m.title,
        m.slug,
        p.purchased_at
    FROM purchases p
    JOIN mysteries m ON p.mystery_id = m.id
    WHERE p.user_id = p_user_id
    AND p.status = 'completed'
    ORDER BY p.purchased_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
