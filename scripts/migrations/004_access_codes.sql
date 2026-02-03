-- 004_access_codes.sql
-- Admin-generated access codes and refund tracking

-- ============================================================================
-- ACCESS CODES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS access_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    mystery_id UUID REFERENCES mysteries(id) ON DELETE CASCADE,
    created_by TEXT NOT NULL,           -- Admin identifier
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,             -- NULL = never expires
    max_uses INT DEFAULT 1,             -- How many times can be redeemed
    used_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    note TEXT                           -- Admin note (e.g., "For influencer X")
);

CREATE INDEX IF NOT EXISTS idx_access_codes_code ON access_codes(code);
CREATE INDEX IF NOT EXISTS idx_access_codes_mystery ON access_codes(mystery_id);

-- ============================================================================
-- ACCESS CODE REDEMPTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS access_code_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    access_code_id UUID NOT NULL REFERENCES access_codes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mystery_id UUID NOT NULL REFERENCES mysteries(id),
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(access_code_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_redemptions_user ON access_code_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_code ON access_code_redemptions(access_code_id);

-- ============================================================================
-- REFUNDS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    amount INT NOT NULL,                -- Amount in øre/cents
    currency TEXT DEFAULT 'NOK',
    reason TEXT,
    refunded_by TEXT NOT NULL,          -- Admin identifier
    refunded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    stripe_refund_id TEXT               -- If refunded via Stripe
);

CREATE INDEX IF NOT EXISTS idx_refunds_purchase ON refunds(purchase_id);
CREATE INDEX IF NOT EXISTS idx_refunds_user ON refunds(user_id);

-- Update purchases to track refund status
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS refund_amount INT;

-- ============================================================================
-- INSERT TEST USER (stenpal@gmail.com)
-- ============================================================================

-- First, create the user in auth.users (this needs to be done via Supabase dashboard or API)
-- Then we can add to public.users

-- Add user to public.users if not exists
INSERT INTO users (id, display_name, email)
VALUES (
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'Pål',
    'stenpal@gmail.com'
) ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_code_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

-- Access codes: Only admin can manage (via service role)
-- Redemptions: Users can see their own
CREATE POLICY "Users can view own redemptions"
    ON access_code_redemptions FOR SELECT
    USING (auth.uid() = user_id);

-- Refunds: Users can see their own
CREATE POLICY "Users can view own refunds"
    ON refunds FOR SELECT
    USING (auth.uid() = user_id);
