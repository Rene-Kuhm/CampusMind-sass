-- CampusMind Database Initialization Script
-- This script runs automatically when the PostgreSQL container starts

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable UUID extension for better ID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE campusmind_db TO campusmind;

-- Create index function for vector similarity search
-- This will be used by Prisma after schema push
