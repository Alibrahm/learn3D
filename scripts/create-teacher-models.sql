-- Create teacher_models table for models uploaded by teachers
CREATE TABLE IF NOT EXISTS teacher_models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  blob_url TEXT,
  file_size BIGINT,
  category TEXT DEFAULT 'general',
  difficulty_level TEXT DEFAULT 'beginner',
  learning_objectives TEXT[],
  is_active BOOLEAN DEFAULT true,
  download_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create model_interactions table to track student interactions
CREATE TABLE IF NOT EXISTS model_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  model_id UUID REFERENCES teacher_models(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL, -- 'view', 'download', 'analyze', 'favorite'
  duration INTEGER, -- in seconds
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create class_assignments table for teachers to assign specific models
CREATE TABLE IF NOT EXISTS class_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id TEXT NOT NULL,
  class_id TEXT,
  model_id UUID REFERENCES teacher_models(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assignment_submissions table for student submissions
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID REFERENCES class_assignments(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  status TEXT DEFAULT 'not_started', -- 'not_started', 'in_progress', 'submitted', 'graded'
  submission_data JSONB,
  grade INTEGER,
  feedback TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  graded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teacher_models_teacher_id ON teacher_models(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_models_category ON teacher_models(category);
CREATE INDEX IF NOT EXISTS idx_teacher_models_active ON teacher_models(is_active);
CREATE INDEX IF NOT EXISTS idx_model_interactions_user_id ON model_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_model_interactions_model_id ON model_interactions(model_id);
CREATE INDEX IF NOT EXISTS idx_class_assignments_teacher_id ON class_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student_id ON assignment_submissions(student_id);
