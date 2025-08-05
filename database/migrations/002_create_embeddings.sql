-- @id: 002_create_embeddings
-- @name: Create vector embeddings table
-- @description: Vector embeddings storage for AI similarity search
-- @dependencies: 001_create_conversations

-- Enable vector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "vector";

-- Vector embeddings table
CREATE TABLE IF NOT EXISTS embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID, -- Can reference files, messages, or other content
    content_type VARCHAR(100) NOT NULL,
    content_chunk TEXT NOT NULL,
    embedding vector(1536), -- OpenAI embedding dimension
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for vector similarity search
CREATE INDEX IF NOT EXISTS idx_embeddings_content_type ON embeddings(content_type);
CREATE INDEX IF NOT EXISTS idx_embeddings_content_id ON embeddings(content_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON embeddings USING ivfflat (embedding vector_cosine_ops);

-- Add embedding chunks for different dimensions
CREATE TABLE IF NOT EXISTS embedding_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES embeddings(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    chunk_size INTEGER NOT NULL,
    overlap_size INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Function to search similar embeddings
CREATE OR REPLACE FUNCTION search_similar_embeddings(
    query_embedding vector(1536),
    content_type_filter VARCHAR(100) DEFAULT NULL,
    similarity_threshold FLOAT DEFAULT 0.7,
    max_results INTEGER DEFAULT 10
) 
RETURNS TABLE (
    id UUID,
    content_id UUID,
    content_type VARCHAR(100),
    content_chunk TEXT,
    similarity FLOAT,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.content_id,
        e.content_type,
        e.content_chunk,
        1 - (e.embedding <=> query_embedding) as similarity,
        e.metadata
    FROM embeddings e
    WHERE 
        (content_type_filter IS NULL OR e.content_type = content_type_filter)
        AND (1 - (e.embedding <=> query_embedding)) >= similarity_threshold
    ORDER BY e.embedding <=> query_embedding
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql;
