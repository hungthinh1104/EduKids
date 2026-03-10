-- PostgreSQL initialization script
-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS users;
CREATE SCHEMA IF NOT EXISTS content;
CREATE SCHEMA IF NOT EXISTS learning;
CREATE SCHEMA IF NOT EXISTS gamification;
CREATE SCHEMA IF NOT EXISTS analytics;

-- Comment on schemas
COMMENT ON SCHEMA auth IS 'Authentication and authorization related tables';
COMMENT ON SCHEMA users IS 'User profiles and family relationships';
COMMENT ON SCHEMA content IS 'Learning content: topics and vocabulary';
COMMENT ON SCHEMA learning IS 'Learning progress and user activities';
COMMENT ON SCHEMA gamification IS 'Points, badges, achievements, leaderboards';
COMMENT ON SCHEMA analytics IS 'Activity logs and analytics data';
