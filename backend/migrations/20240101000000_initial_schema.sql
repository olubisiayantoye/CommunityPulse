-- =====================================================
-- CommunityPulse Database Schema
-- PostgreSQL 14+
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- ===== USERS TABLE =====
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- ===== CATEGORIES TABLE =====
CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== FEEDBACK TABLE =====
CREATE TABLE feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  sentiment_label VARCHAR(20) CHECK (sentiment_label IN ('Positive', 'Neutral', 'Negative')),
  sentiment_score FLOAT,
  is_anonymous BOOLEAN DEFAULT true,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'dismissed')),
  upvotes INTEGER DEFAULT 0,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== FEEDBACK VOTES TABLE =====
CREATE TABLE feedback_votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  feedback_id UUID REFERENCES feedback(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(feedback_id, user_id)
);

-- ===== SESSION TABLE (for express-session) =====
CREATE TABLE session (
  sid VARCHAR NOT NULL PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);
CREATE INDEX IF NOT EXISTS session_expire_idx ON session (expire);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_category_id ON feedback(category_id);
CREATE INDEX idx_feedback_sentiment ON feedback(sentiment_label);
CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX idx_votes_feedback_id ON feedback_votes(feedback_id);
CREATE INDEX idx_votes_user_id ON feedback_votes(user_id);
CREATE INDEX idx_categories_name ON categories(name);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at 
  BEFORE UPDATE ON categories 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at 
  BEFORE UPDATE ON feedback 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) - Optional for Supabase
-- =====================================================

-- Enable RLS if using Supabase
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE feedback_votes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- DEFAULT DATA - CATEGORIES
-- =====================================================

INSERT INTO categories (name, description, color) VALUES
  ('General', 'General feedback and suggestions', '#3B82F6'),
  ('Facilities', 'Building, equipment, infrastructure', '#10B981'),
  ('Events', 'Community events and activities', '#F59E0B'),
  ('Leadership', 'Management and leadership concerns', '#EF4444'),
  ('Safety', 'Safety and security issues', '#DC2626'),
  ('Technology', 'IT systems and digital tools', '#8B5CF6')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- DEFAULT USERS
-- Password hashes generated with bcrypt (12 rounds)
-- Admin: admin / Admin@2024!Secure
-- Member: member / Member@2024!Safe
-- =====================================================

INSERT INTO users (username, email, password_hash, role, is_active) VALUES
  (
    'admin',
    'admin@communitypulse.org',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.G.2f2f2f2f2f2f',
    'admin',
    true
  ),
  (
    'member',
    'member@communitypulse.org',
    '$2b$12$9xK5LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.G.2f2f2f2f',
    'member',
    true
  )
ON CONFLICT (username) DO UPDATE SET 
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;

-- =====================================================
-- SAMPLE FEEDBACK DATA (10+ Entries)
-- =====================================================

INSERT INTO feedback (user_id, message, category_id, sentiment_label, sentiment_score, is_anonymous, status, upvotes, created_at)
SELECT 
  CASE WHEN f.is_anonymous THEN NULL ELSE u.id END as user_id,
  f.message,
  c.id as category_id,
  f.sentiment_label,
  f.sentiment_score,
  f.is_anonymous,
  f.status,
  f.upvotes,
  NOW() - (f.days_ago || ' days')::INTERVAL as created_at
FROM (
  VALUES
    -- Positive Feedback (5 entries)
    ('The new community center hours are perfect! Much more convenient for working families.', 'Facilities', 'Positive', 0.92, false, 'resolved', 15, 28),
    ('Love the new newsletter format! Easy to read and great content.', 'Events', 'Positive', 0.88, false, 'resolved', 8, 24),
    ('Great job on the security upgrades at the main entrance. Feeling much safer now.', 'Safety', 'Positive', 0.95, false, 'resolved', 19, 20),
    ('The summer festival was amazing! Hope we can make it an annual tradition.', 'Events', 'Positive', 0.97, false, 'resolved', 45, 16),
    ('Appreciate the quick response to my maintenance request last week. Excellent service!', 'Facilities', 'Positive', 0.91, false, 'resolved', 11, 10),
    
    -- Neutral Feedback (2 entries)
    ('Communication about schedule changes could be better. I missed two meetings last month.', 'General', 'Neutral', 0.48, true, 'pending', 7, 14),
    ('The new system works but the learning curve is steep. More training would help.', 'Technology', 'Neutral', 0.52, true, 'in_progress', 5, 8),
    
    -- Negative Feedback (4 entries)
    ('Parking is still a major issue during weekend events. We need more spaces or a shuttle service.', 'Facilities', 'Negative', 0.18, true, 'pending', 23, 26),
    ('The leadership team seems disconnected from member concerns. More town halls would help.', 'Leadership', 'Negative', 0.25, true, 'in_progress', 31, 22),
    ('The mobile app keeps crashing when I try to submit feedback. Please fix.', 'Technology', 'Negative', 0.12, true, 'pending', 12, 18),
    ('The new online payment system is confusing. Need better instructions or a tutorial.', 'Technology', 'Negative', 0.31, false, 'in_progress', 18, 12)
) AS f(message, category_name, sentiment_label, sentiment_score, is_anonymous, status, upvotes, days_ago)
JOIN categories c ON c.name = f.category_name
LEFT JOIN users u ON u.username = 'member'
ON CONFLICT DO NOTHING;

-- =====================================================
-- SAMPLE VOTES
-- =====================================================

INSERT INTO feedback_votes (feedback_id, user_id, vote_type)
SELECT 
  f.id as feedback_id,
  u.id as user_id,
  'up' as vote_type
FROM feedback f
CROSS JOIN users u
WHERE u.username = 'member'
  AND f.is_anonymous = true
  AND f.sentiment_label IN ('Positive', 'Negative')
  AND RANDOM() < 0.7
ON CONFLICT (feedback_id, user_id) DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES (Optional - Run to Verify)
-- =====================================================

-- Verify tables created
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Verify users
-- SELECT username, role, email FROM users;

-- Verify categories
-- SELECT name, color FROM categories;

-- Verify feedback count
-- SELECT COUNT(*) as total_feedback FROM feedback;

-- Verify feedback by sentiment
-- SELECT sentiment_label, COUNT(*) as count FROM feedback GROUP BY sentiment_label;

-- Verify sample data loaded
-- SELECT 
--   (SELECT COUNT(*) FROM users) as users_count,
--   (SELECT COUNT(*) FROM categories) as categories_count,
--   (SELECT COUNT(*) FROM feedback) as feedback_count,
--   (SELECT COUNT(*) FROM feedback_votes) as votes_count;

-- =====================================================
-- END OF SCHEMA
-- =====================================================