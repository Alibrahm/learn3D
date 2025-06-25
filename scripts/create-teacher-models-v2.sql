-- Update teacher_models table to include teacher_name column
ALTER TABLE teacher_models 
ADD COLUMN IF NOT EXISTS teacher_name TEXT;

-- Update existing records to populate teacher_name from user_profiles
UPDATE teacher_models 
SET teacher_name = (
  SELECT name 
  FROM user_profiles 
  WHERE user_profiles.id = teacher_models.teacher_id
)
WHERE teacher_name IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_teacher_models_teacher_name ON teacher_models(teacher_name);

-- Add view_count and download_count columns if they don't exist
ALTER TABLE teacher_models 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;

-- Create model_interactions table for tracking
CREATE TABLE IF NOT EXISTS model_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  model_id UUID REFERENCES teacher_models(id) ON DELETE CASCADE,
  interaction_type TEXT CHECK (interaction_type IN ('view', 'download')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for model_interactions
CREATE INDEX IF NOT EXISTS idx_model_interactions_user_id ON model_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_model_interactions_model_id ON model_interactions(model_id);
CREATE INDEX IF NOT EXISTS idx_model_interactions_created_at ON model_interactions(created_at);
