-- 006_contact_messages.sql
-- Contact messages submitted from the Contact page

CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  locale TEXT DEFAULT 'en',
  user_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'open', 'closed')),
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);

-- Enable RLS
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert contact messages
CREATE POLICY "Anyone can insert contact messages" ON contact_messages
  FOR INSERT
  WITH CHECK (true);

-- Allow viewing of messages (for admins via service role)
CREATE POLICY "Anyone can view their own messages" ON contact_messages
  FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id OR current_user = 'postgres');

-- Grant permissions
GRANT INSERT ON contact_messages TO anon, authenticated;

