-- 005_user_activity_log.sql
-- User activity logging for debugging and analytics

-- User activity log table
CREATE TABLE IF NOT EXISTS user_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT,                    -- Browser session identifier
    action TEXT NOT NULL,               -- login, page_view, purchase, redeem_code, start_game, etc.
    page_url TEXT,
    referrer TEXT,
    
    -- Device info
    user_agent TEXT,
    browser_name TEXT,
    browser_version TEXT,
    os_name TEXT,
    os_version TEXT,
    device_type TEXT,                   -- desktop, mobile, tablet
    screen_width INT,
    screen_height INT,
    
    -- Request info
    ip_address INET,
    country TEXT,
    city TEXT,
    
    -- Action-specific data (JSON for flexibility)
    metadata JSONB DEFAULT '{}',
    
    -- Error tracking
    error_message TEXT,
    error_stack TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_activity_user ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_action ON user_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_activity_created ON user_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_session ON user_activity_log(session_id);
CREATE INDEX IF NOT EXISTS idx_activity_error ON user_activity_log(error_message) WHERE error_message IS NOT NULL;

-- Error log table for detailed error tracking
CREATE TABLE IF NOT EXISTS error_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT,
    
    -- Error details
    error_type TEXT NOT NULL,           -- api_error, client_error, validation_error
    error_code TEXT,
    error_message TEXT NOT NULL,
    error_stack TEXT,
    
    -- Context
    endpoint TEXT,
    http_method TEXT,
    request_body JSONB,
    response_status INT,
    
    -- Device info
    user_agent TEXT,
    browser_name TEXT,
    os_name TEXT,
    
    -- Resolution
    resolved_at TIMESTAMPTZ,
    resolved_by TEXT,
    resolution_notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_error_type ON error_log(error_type);
CREATE INDEX IF NOT EXISTS idx_error_created ON error_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_unresolved ON error_log(resolved_at) WHERE resolved_at IS NULL;

-- RLS policies
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_log ENABLE ROW LEVEL SECURITY;

-- Only service role can access logs
CREATE POLICY "Service role full access to activity log"
    ON user_activity_log FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to error log"
    ON error_log FOR ALL
    USING (auth.role() = 'service_role');
