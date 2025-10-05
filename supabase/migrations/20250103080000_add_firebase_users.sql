-- Create firebase_users table for Firebase authentication
CREATE TABLE IF NOT EXISTS firebase_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid TEXT UNIQUE NOT NULL,
  phone_number TEXT,
  display_name TEXT,
  email TEXT,
  photo_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  last_sign_in TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_firebase_users_firebase_uid ON firebase_users(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_firebase_users_phone_number ON firebase_users(phone_number);

-- Enable Row Level Security
ALTER TABLE firebase_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own data" ON firebase_users
  FOR SELECT USING (auth.uid()::text = firebase_uid);

CREATE POLICY "Users can update their own data" ON firebase_users
  FOR UPDATE USING (auth.uid()::text = firebase_uid);

CREATE POLICY "Users can insert their own data" ON firebase_users
  FOR INSERT WITH CHECK (auth.uid()::text = firebase_uid);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_firebase_users_updated_at 
  BEFORE UPDATE ON firebase_users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create firebase_sessions table for session management
CREATE TABLE IF NOT EXISTS firebase_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid TEXT NOT NULL REFERENCES firebase_users(firebase_uid) ON DELETE CASCADE,
  session_data JSONB,
  device_info JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- Create indexes for firebase_sessions
CREATE INDEX IF NOT EXISTS idx_firebase_sessions_firebase_uid ON firebase_sessions(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_firebase_sessions_expires_at ON firebase_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_firebase_sessions_is_active ON firebase_sessions(is_active);

-- Enable RLS for firebase_sessions
ALTER TABLE firebase_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for firebase_sessions
CREATE POLICY "Users can view their own sessions" ON firebase_sessions
  FOR SELECT USING (auth.uid()::text = firebase_uid);

CREATE POLICY "Users can insert their own sessions" ON firebase_sessions
  FOR INSERT WITH CHECK (auth.uid()::text = firebase_uid);

CREATE POLICY "Users can update their own sessions" ON firebase_sessions
  FOR UPDATE USING (auth.uid()::text = firebase_uid);

-- Create firebase_verification_logs table for audit trail
CREATE TABLE IF NOT EXISTS firebase_verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid TEXT,
  phone_number TEXT,
  verification_type TEXT NOT NULL, -- 'sms_sent', 'otp_verified', 'login_success', 'login_failed'
  status TEXT NOT NULL, -- 'success', 'failed', 'pending'
  error_message TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for firebase_verification_logs
CREATE INDEX IF NOT EXISTS idx_firebase_verification_logs_firebase_uid ON firebase_verification_logs(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_firebase_verification_logs_phone_number ON firebase_verification_logs(phone_number);
CREATE INDEX IF NOT EXISTS idx_firebase_verification_logs_created_at ON firebase_verification_logs(created_at);

-- Enable RLS for firebase_verification_logs
ALTER TABLE firebase_verification_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for firebase_verification_logs
CREATE POLICY "Users can view their own verification logs" ON firebase_verification_logs
  FOR SELECT USING (auth.uid()::text = firebase_uid);

CREATE POLICY "System can insert verification logs" ON firebase_verification_logs
  FOR INSERT WITH CHECK (true); -- Allow system to insert logs

-- Create view for user statistics
CREATE OR REPLACE VIEW firebase_user_stats AS
SELECT 
  fu.firebase_uid,
  fu.phone_number,
  fu.display_name,
  fu.is_verified,
  fu.last_sign_in,
  fu.created_at,
  COUNT(fs.id) as session_count,
  MAX(fs.created_at) as last_session
FROM firebase_users fu
LEFT JOIN firebase_sessions fs ON fu.firebase_uid = fs.firebase_uid AND fs.is_active = true
GROUP BY fu.firebase_uid, fu.phone_number, fu.display_name, fu.is_verified, fu.last_sign_in, fu.created_at;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON firebase_users TO authenticated;
GRANT ALL ON firebase_sessions TO authenticated;
GRANT ALL ON firebase_verification_logs TO authenticated;
GRANT SELECT ON firebase_user_stats TO authenticated;
