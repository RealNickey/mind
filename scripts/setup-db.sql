-- create pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- The schema is managed by Prisma, but here are extra SQL functions if needed:
-- Example: match_items for vector similarity search
CREATE OR REPLACE FUNCTION match_items(
  query_embedding vector(384),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id varchar,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    "itemId" as id,
    1 - (vector <=> query_embedding) AS similarity
  FROM "Embedding"
  WHERE 1 - (vector <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;
