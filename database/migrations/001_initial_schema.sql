-- Genesis Music Platform Database Schema
-- Version: 1.0.0
-- Date: 2024

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS transcription_jobs CASCADE;
DROP TABLE IF EXISTS learning_progress CASCADE;
DROP TABLE IF EXISTS scores CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ==========================================
-- Users Table
-- ==========================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Profile information
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url VARCHAR(500),
    bio TEXT,
    
    -- Account status
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Subscription
    subscription_tier VARCHAR(50) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'hobbyist', 'professional', 'master', 'enterprise')),
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    storage_used_mb INTEGER DEFAULT 0,
    storage_limit_mb INTEGER DEFAULT 1000,
    
    -- Additional metadata
    preferences JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}'
);

-- Indexes for users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_subscription ON users(subscription_tier);
CREATE INDEX idx_users_active ON users(is_active);

-- ==========================================
-- Refresh Tokens Table
-- ==========================================
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    user_agent TEXT,
    is_revoked BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);

-- ==========================================
-- Scores Table (Music Transcriptions)
-- ==========================================
CREATE TABLE scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Basic information
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255),
    album VARCHAR(255),
    genre VARCHAR(100),
    year INTEGER,
    description TEXT,
    
    -- Transcription data
    transcription_data JSONB NOT NULL DEFAULT '{}',
    midi_data BYTEA,
    musicxml_data TEXT,
    abc_notation TEXT,
    render_cache JSONB,
    
    -- Audio files
    original_audio_url VARCHAR(500),
    processed_audio_url VARCHAR(500),
    audio_duration_seconds INTEGER,
    audio_format VARCHAR(20),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_public BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    
    -- Musical metadata
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 10),
    key_signature VARCHAR(10),
    time_signature VARCHAR(10),
    tempo INTEGER,
    tuning VARCHAR(50) DEFAULT 'standard',
    capo_position INTEGER DEFAULT 0,
    
    -- AI analysis results
    style_analysis JSONB DEFAULT '{}',
    technique_analysis JSONB DEFAULT '{}',
    chord_progression JSONB DEFAULT '{}',
    scale_analysis JSONB DEFAULT '{}',
    similarity_matches JSONB DEFAULT '[]',
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    
    -- Tags and categorization
    tags TEXT[] DEFAULT '{}',
    instruments TEXT[] DEFAULT '{}',
    techniques TEXT[] DEFAULT '{}',
    
    -- Version control
    version INTEGER DEFAULT 1,
    parent_score_id UUID REFERENCES scores(id),
    is_draft BOOLEAN DEFAULT FALSE
);

-- Indexes for scores table
CREATE INDEX idx_scores_user_id ON scores(user_id);
CREATE INDEX idx_scores_public ON scores(is_public);
CREATE INDEX idx_scores_featured ON scores(is_featured);
CREATE INDEX idx_scores_created_at ON scores(created_at DESC);
CREATE INDEX idx_scores_artist ON scores(artist);
CREATE INDEX idx_scores_title ON scores(title);
CREATE INDEX idx_scores_tags ON scores USING GIN(tags);
CREATE INDEX idx_scores_instruments ON scores USING GIN(instruments);
CREATE INDEX idx_scores_techniques ON scores USING GIN(techniques);
CREATE INDEX idx_scores_title_search ON scores USING GIN(to_tsvector('english', title));
CREATE INDEX idx_scores_artist_search ON scores USING GIN(to_tsvector('english', artist));

-- ==========================================
-- Learning Progress Table
-- ==========================================
CREATE TABLE learning_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    score_id UUID REFERENCES scores(id) ON DELETE CASCADE,
    
    -- Progress tracking
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_practiced_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    total_practice_time_minutes INTEGER DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    
    -- Detailed progress (JSON arrays of section IDs)
    sections_viewed JSONB DEFAULT '[]',
    sections_practiced JSONB DEFAULT '[]',
    sections_completed JSONB DEFAULT '[]',
    sections_mastered JSONB DEFAULT '[]',
    problem_areas JSONB DEFAULT '[]',
    
    -- Performance metrics
    accuracy_percentage DECIMAL(5,2) CHECK (accuracy_percentage >= 0 AND accuracy_percentage <= 100),
    timing_accuracy DECIMAL(5,2) CHECK (timing_accuracy >= 0 AND timing_accuracy <= 100),
    technique_scores JSONB DEFAULT '{}',
    best_streak_days INTEGER DEFAULT 0,
    current_streak_days INTEGER DEFAULT 0,
    
    -- User feedback
    difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5),
    enjoyment_rating INTEGER CHECK (enjoyment_rating BETWEEN 1 AND 5),
    would_recommend BOOLEAN,
    notes TEXT,
    
    -- Learning goals
    target_tempo INTEGER,
    current_tempo INTEGER,
    target_completion_date DATE,
    daily_practice_goal_minutes INTEGER DEFAULT 30,
    weekly_practice_goal_minutes INTEGER DEFAULT 150,
    
    -- Achievements
    achievements JSONB DEFAULT '[]',
    milestones_reached JSONB DEFAULT '[]',
    
    UNIQUE(user_id, score_id)
);

CREATE INDEX idx_learning_progress_user ON learning_progress(user_id);
CREATE INDEX idx_learning_progress_score ON learning_progress(score_id);
CREATE INDEX idx_learning_progress_last_practiced ON learning_progress(last_practiced_at DESC);
CREATE INDEX idx_learning_progress_completion ON learning_progress(completion_percentage);

-- ==========================================
-- Transcription Jobs Table (Async Processing)
-- ==========================================
CREATE TABLE transcription_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Job status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    priority INTEGER DEFAULT 0,
    
    -- Input information
    input_type VARCHAR(50) CHECK (input_type IN ('file', 'youtube', 'url', 'direct')),
    input_url VARCHAR(500),
    input_filename VARCHAR(255),
    input_metadata JSONB DEFAULT '{}',
    
    -- Output information
    score_id UUID REFERENCES scores(id) ON DELETE SET NULL,
    result_data JSONB,
    error_message TEXT,
    error_details JSONB,
    
    -- Timing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_completion_at TIMESTAMP WITH TIME ZONE,
    processing_time_ms INTEGER,
    
    -- Settings and configuration
    transcription_settings JSONB DEFAULT '{}',
    ai_model VARCHAR(50) DEFAULT 'basic_pitch',
    
    -- Resource tracking
    cpu_usage_seconds DECIMAL(10,2),
    memory_usage_mb INTEGER,
    gpu_usage_seconds DECIMAL(10,2)
);

CREATE INDEX idx_transcription_jobs_user ON transcription_jobs(user_id);
CREATE INDEX idx_transcription_jobs_status ON transcription_jobs(status);
CREATE INDEX idx_transcription_jobs_created ON transcription_jobs(created_at DESC);
CREATE INDEX idx_transcription_jobs_priority ON transcription_jobs(priority DESC, created_at);

-- ==========================================
-- Utility Functions
-- ==========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scores_updated_at BEFORE UPDATE ON scores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate storage usage
CREATE OR REPLACE FUNCTION calculate_user_storage(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    total_size INTEGER;
BEGIN
    SELECT COALESCE(SUM(
        COALESCE(octet_length(midi_data), 0) +
        COALESCE(octet_length(musicxml_data), 0) +
        COALESCE(octet_length(abc_notation), 0) +
        COALESCE(octet_length(transcription_data::text), 0)
    ) / 1024 / 1024, 0)::INTEGER
    INTO total_size
    FROM scores
    WHERE user_id = user_uuid;
    
    RETURN total_size;
END;
$$ LANGUAGE plpgsql;

-- Function to check subscription limits
CREATE OR REPLACE FUNCTION check_subscription_limits(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_record RECORD;
    current_storage INTEGER;
BEGIN
    SELECT subscription_tier, storage_limit_mb
    INTO user_record
    FROM users
    WHERE id = user_uuid;
    
    current_storage := calculate_user_storage(user_uuid);
    
    UPDATE users
    SET storage_used_mb = current_storage
    WHERE id = user_uuid;
    
    RETURN current_storage < user_record.storage_limit_mb;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- Initial Data (Optional)
-- ==========================================

-- Insert default admin user (password: admin123)
-- Note: In production, use proper password hashing
INSERT INTO users (email, username, password_hash, subscription_tier, storage_limit_mb, is_active, email_verified)
VALUES ('admin@genesis-music.com', 'admin', '$2a$10$YourHashedPasswordHere', 'enterprise', 999999, true, true)
ON CONFLICT DO NOTHING;

-- ==========================================
-- Permissions and Security
-- ==========================================

-- Create read-only role for analytics
CREATE ROLE genesis_readonly;
GRANT CONNECT ON DATABASE genesis_music TO genesis_readonly;
GRANT USAGE ON SCHEMA public TO genesis_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO genesis_readonly;

-- Create application role with full access
CREATE ROLE genesis_app;
GRANT CONNECT ON DATABASE genesis_music TO genesis_app;
GRANT USAGE ON SCHEMA public TO genesis_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO genesis_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO genesis_app;

-- ==========================================
-- Comments for Documentation
-- ==========================================

COMMENT ON TABLE users IS 'User accounts and authentication information';
COMMENT ON TABLE scores IS 'Musical scores and transcriptions';
COMMENT ON TABLE learning_progress IS 'User learning progress and practice tracking';
COMMENT ON TABLE transcription_jobs IS 'Asynchronous transcription job queue';
COMMENT ON TABLE refresh_tokens IS 'JWT refresh tokens for authentication';

COMMENT ON COLUMN users.subscription_tier IS 'User subscription level: free, hobbyist, professional, master, enterprise';
COMMENT ON COLUMN scores.confidence_score IS 'AI confidence score for transcription accuracy (0.0 to 1.0)';
COMMENT ON COLUMN learning_progress.completion_percentage IS 'Overall completion percentage of the score (0 to 100)';
COMMENT ON COLUMN transcription_jobs.status IS 'Job status: pending, processing, completed, failed, cancelled';