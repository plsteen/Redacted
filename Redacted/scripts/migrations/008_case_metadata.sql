-- 008_case_metadata.sql
-- Add metadata fields to mysteries table and create evidence prompts tracking

-- Add metadata columns to mysteries table
ALTER TABLE mysteries ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'very_difficult'));
ALTER TABLE mysteries ADD COLUMN IF NOT EXISTS estimated_duration_minutes INTEGER DEFAULT 30;
ALTER TABLE mysteries ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE mysteries ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE mysteries ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
ALTER TABLE mysteries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create evidence_prompts table to track AI-generated media
CREATE TABLE IF NOT EXISTS evidence_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES mysteries(id) ON DELETE CASCADE,
  evidence_key TEXT NOT NULL, -- e.g., "evidence_1", "evidence_2"
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'audio', 'document')),
  media_url TEXT,
  ai_provider TEXT DEFAULT 'openai', -- openai, midjourney, elevenlabs, etc.
  ai_model TEXT, -- e.g., "dall-e-3", "gpt-4-vision"
  prompt TEXT NOT NULL,
  prompt_version INTEGER DEFAULT 1,
  generation_timestamp TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::JSONB, -- e.g., {"width": 1024, "height": 1024, "duration": "5.2"}
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_evidence_prompts_case_id ON evidence_prompts(case_id);
CREATE INDEX IF NOT EXISTS idx_evidence_prompts_evidence_key ON evidence_prompts(evidence_key);
CREATE INDEX IF NOT EXISTS idx_evidence_prompts_media_type ON evidence_prompts(media_type);

-- Add RLS for evidence_prompts (admin only)
ALTER TABLE evidence_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage evidence prompts" ON evidence_prompts
  FOR ALL
  USING (current_user = 'postgres' OR auth.jwt() ->> 'role' = 'admin');
