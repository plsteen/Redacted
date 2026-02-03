-- 009_admin_analytics.sql
-- Comprehensive admin analytics views and tables

-- ========================================
-- ADMIN ACTION LOG (required for audit trail)
-- ========================================
CREATE TABLE IF NOT EXISTS admin_action_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'case_edit', 'session_stop', 'user_suspend', 'refund', etc.
  target_type TEXT NOT NULL, -- 'case', 'session', 'user', 'purchase', etc.
  target_id TEXT,
  details JSONB DEFAULT '{}'::JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_action_log_admin ON admin_action_log(admin_user);
CREATE INDEX IF NOT EXISTS idx_admin_action_log_action ON admin_action_log(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_action_log_created ON admin_action_log(created_at DESC);

-- ========================================
-- SYSTEM HEALTH METRICS
-- ========================================
CREATE TABLE IF NOT EXISTS system_health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_health_metrics_name ON system_health_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_health_metrics_time ON system_health_metrics(recorded_at DESC);

-- ========================================
-- IMPROVEMENT SUGGESTIONS (Admin feedback)
-- ========================================
CREATE TABLE IF NOT EXISTS admin_improvement_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user TEXT NOT NULL,
  category TEXT NOT NULL, -- 'task', 'evidence', 'case', 'ui', 'performance'
  target_reference TEXT, -- e.g., 'silent-harbour:task:3'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  status TEXT DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'wont_fix'
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_improvement_notes_status ON admin_improvement_notes(status);
CREATE INDEX IF NOT EXISTS idx_improvement_notes_category ON admin_improvement_notes(category);

-- ========================================
-- ANALYTICS VIEWS
-- ========================================

-- View: Active sessions right now
CREATE OR REPLACE VIEW v_active_sessions AS
SELECT 
  s.id,
  s.code,
  s.mystery_id,
  s.language,
  s.status,
  s.created_at,
  EXTRACT(EPOCH FROM (NOW() - s.created_at))/60 AS minutes_active,
  (SELECT COUNT(*) FROM session_players sp WHERE sp.session_id = s.id) AS player_count,
  (SELECT MAX(task_idx) FROM session_progress WHERE session_id = s.id) AS current_task
FROM sessions s
WHERE s.status IN ('active', 'lobby')
ORDER BY s.created_at DESC;

-- View: Task difficulty analysis
CREATE OR REPLACE VIEW v_task_difficulty AS
SELECT 
  sp.mystery_id,
  sp.task_idx,
  COUNT(*) AS total_attempts,
  COUNT(CASE WHEN sp.is_correct THEN 1 END) AS correct_attempts,
  AVG(sp.time_spent_seconds) AS avg_time_seconds,
  COUNT(CASE WHEN sp.hint_used THEN 1 END) AS hint_uses,
  ROUND(100.0 * COUNT(CASE WHEN sp.is_correct THEN 1 END) / NULLIF(COUNT(*), 0), 1) AS success_rate
FROM session_progress sp
GROUP BY sp.mystery_id, sp.task_idx
ORDER BY sp.mystery_id, sp.task_idx;

-- View: Daily stats
CREATE OR REPLACE VIEW v_daily_stats AS
SELECT 
  DATE(created_at) AS date,
  COUNT(*) AS sessions_started,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) AS sessions_completed,
  COUNT(DISTINCT mystery_id) AS unique_cases_played
FROM sessions
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- View: Revenue by case
CREATE OR REPLACE VIEW v_revenue_by_case AS
SELECT 
  m.code AS case_code,
  COUNT(p.id) AS total_purchases,
  SUM(p.amount) AS total_revenue,
  AVG(p.amount) AS avg_price,
  MAX(p.purchased_at) AS last_purchase
FROM purchases p
JOIN mysteries m ON m.id = p.mystery_id
WHERE p.status = 'completed'
GROUP BY m.code
ORDER BY total_revenue DESC;

-- View: User engagement funnel
CREATE OR REPLACE VIEW v_engagement_funnel AS
SELECT 
  s.mystery_id,
  COUNT(DISTINCT s.id) AS total_sessions,
  COUNT(DISTINCT CASE WHEN sp.task_idx = 1 THEN s.id END) AS started_task_1,
  COUNT(DISTINCT CASE WHEN sp.task_idx = 3 THEN s.id END) AS reached_task_3,
  COUNT(DISTINCT CASE WHEN sp.task_idx = 5 THEN s.id END) AS reached_task_5,
  COUNT(DISTINCT CASE WHEN s.status = 'completed' THEN s.id END) AS completed
FROM sessions s
LEFT JOIN session_progress sp ON sp.session_id = s.id
GROUP BY s.mystery_id;

-- View: Hourly activity pattern
CREATE OR REPLACE VIEW v_hourly_activity AS
SELECT 
  EXTRACT(HOUR FROM created_at) AS hour_of_day,
  EXTRACT(DOW FROM created_at) AS day_of_week,
  COUNT(*) AS session_count
FROM sessions
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY EXTRACT(HOUR FROM created_at), EXTRACT(DOW FROM created_at)
ORDER BY day_of_week, hour_of_day;

-- View: Recent errors
CREATE OR REPLACE VIEW v_recent_errors AS
SELECT 
  id,
  action,
  error_message,
  metadata,
  created_at
FROM user_activity_log
WHERE error_message IS NOT NULL
ORDER BY created_at DESC
LIMIT 100;

-- ========================================
-- STRIPE WEBHOOK LOG (if not exists)
-- ========================================
CREATE TABLE IF NOT EXISTS stripe_webhook_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'processed', -- 'processed', 'failed', 'ignored'
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_webhook_log_event_id ON stripe_webhook_log(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_log_type ON stripe_webhook_log(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_log_time ON stripe_webhook_log(processed_at DESC);

-- ========================================
-- RLS Policies for admin tables
-- ========================================
ALTER TABLE admin_action_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_improvement_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_webhook_log ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role can manage admin_action_log" ON admin_action_log
  FOR ALL USING (true);

CREATE POLICY "Service role can manage system_health_metrics" ON system_health_metrics
  FOR ALL USING (true);

CREATE POLICY "Service role can manage admin_improvement_notes" ON admin_improvement_notes
  FOR ALL USING (true);

CREATE POLICY "Service role can manage stripe_webhook_log" ON stripe_webhook_log
  FOR ALL USING (true);
