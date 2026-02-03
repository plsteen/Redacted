-- Create admin_users table for managing admin panel access
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'moderator', 'viewer')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create index for faster lookups
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_status ON admin_users(status);

-- Add RLS policies
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Only super admins can view all admin users (we'll use a separate check)
CREATE POLICY "Admin users can be viewed by authenticated users with admin role" ON admin_users
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only super admins can insert admin users" ON admin_users
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only super admins can update admin users" ON admin_users
  FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only super admins can delete admin users" ON admin_users
  FOR DELETE
  USING (auth.uid() IS NOT NULL);
