-- Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('student', 'teacher')) DEFAULT 'student',
  class_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create learning progress table
CREATE TABLE IF NOT EXISTS learning_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  completed_lessons TEXT[] DEFAULT '{}',
  completed_exercises TEXT[] DEFAULT '{}',
  scores JSONB DEFAULT '{}',
  total_time_spent INTEGER DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create saved projects table
CREATE TABLE IF NOT EXISTS saved_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  shapes JSONB NOT NULL DEFAULT '[]',
  thumbnail TEXT,
  likes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user actions table for analytics
CREATE TABLE IF NOT EXISTS user_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  category TEXT NOT NULL,
  data JSONB,
  success BOOLEAN DEFAULT TRUE,
  duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_clerk_id ON user_profiles(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_user_id ON learning_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_projects_user_id ON saved_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_projects_public ON saved_projects(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_actions_user_id ON user_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_created_at ON user_actions(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_learning_progress_updated_at BEFORE UPDATE ON learning_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saved_projects_updated_at BEFORE UPDATE ON saved_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- User profiles: users can only see and edit their own profile
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (clerk_user_id = auth.jwt() ->> 'sub');
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (clerk_user_id = auth.jwt() ->> 'sub');
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

-- Learning progress: users can only access their own progress
CREATE POLICY "Users can view own progress" ON learning_progress FOR SELECT USING (user_id IN (SELECT id FROM user_profiles WHERE clerk_user_id = auth.jwt() ->> 'sub'));
CREATE POLICY "Users can update own progress" ON learning_progress FOR UPDATE USING (user_id IN (SELECT id FROM user_profiles WHERE clerk_user_id = auth.jwt() ->> 'sub'));
CREATE POLICY "Users can insert own progress" ON learning_progress FOR INSERT WITH CHECK (user_id IN (SELECT id FROM user_profiles WHERE clerk_user_id = auth.jwt() ->> 'sub'));

-- Saved projects: users can access their own projects and public projects
CREATE POLICY "Users can view own projects" ON saved_projects FOR SELECT USING (user_id IN (SELECT id FROM user_profiles WHERE clerk_user_id = auth.jwt() ->> 'sub') OR is_public = TRUE);
CREATE POLICY "Users can update own projects" ON saved_projects FOR UPDATE USING (user_id IN (SELECT id FROM user_profiles WHERE clerk_user_id = auth.jwt() ->> 'sub'));
CREATE POLICY "Users can insert own projects" ON saved_projects FOR INSERT WITH CHECK (user_id IN (SELECT id FROM user_profiles WHERE clerk_user_id = auth.jwt() ->> 'sub'));
CREATE POLICY "Users can delete own projects" ON saved_projects FOR DELETE USING (user_id IN (SELECT id FROM user_profiles WHERE clerk_user_id = auth.jwt() ->> 'sub'));

-- User actions: users can only insert their own actions, teachers can view student actions in their class
CREATE POLICY "Users can insert own actions" ON user_actions FOR INSERT WITH CHECK (user_id IN (SELECT id FROM user_profiles WHERE clerk_user_id = auth.jwt() ->> 'sub'));
CREATE POLICY "Users can view own actions" ON user_actions FOR SELECT USING (user_id IN (SELECT id FROM user_profiles WHERE clerk_user_id = auth.jwt() ->> 'sub'));
