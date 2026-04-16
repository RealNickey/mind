BEGIN;

CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_embedding_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, extensions
AS $$
BEGIN
  IF NEW.vector IS NULL AND NEW.embedding IS NOT NULL THEN
    NEW.vector := NEW.embedding;
  ELSIF NEW.embedding IS NULL AND NEW.vector IS NOT NULL THEN
    NEW.embedding := NEW.vector;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public."User" (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email text UNIQUE NOT NULL,
  name text,
  theme text NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  "createdAt" timestamptz NOT NULL DEFAULT NOW(),
  "updatedAt" timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."Item" (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" text REFERENCES public."User"(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  content text,
  type text NOT NULL,
  "sourceUrl" text,
  "isFavorite" boolean NOT NULL DEFAULT false,
  "canvasPosition" jsonb,
  "customColor" text,
  notes text,
  "extractedText" text,
  "fullTextSearch" text GENERATED ALWAYS AS (
    btrim(
      COALESCE(title, '') || ' ' ||
      COALESCE(description, '') || ' ' ||
      COALESCE(content, '') || ' ' ||
      COALESCE("extractedText", '') || ' ' ||
      COALESCE(type, '')
    )
  ) STORED,
  "createdAt" timestamptz NOT NULL DEFAULT NOW(),
  "updatedAt" timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."Tag" (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" text REFERENCES public."User"(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  color text,
  icon text,
  count integer NOT NULL DEFAULT 0,
  "createdAt" timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT "Tag_name_key" UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS public."Collection" (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" text REFERENCES public."User"(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  "isAuto" boolean NOT NULL DEFAULT false,
  "autoRule" jsonb,
  color text,
  icon text,
  "canvasState" jsonb,
  "createdAt" timestamptz NOT NULL DEFAULT NOW(),
  "updatedAt" timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."ItemMetadata" (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "itemId" text NOT NULL UNIQUE REFERENCES public."Item"(id) ON DELETE CASCADE,
  "sourceUrl" text,
  "imageUrl" text,
  favicon text,
  author text,
  "publishedDate" timestamptz,
  "readingTime" integer,
  "tmdbId" integer,
  "movieTitle" text,
  "moviePoster" text,
  "movieRating" double precision,
  "movieGenres" text[] DEFAULT '{}',
  "movieRuntime" integer,
  isbn text,
  "bookTitle" text,
  "bookAuthor" text,
  "bookCover" text,
  "bookRating" double precision,
  "dominantColors" text[] DEFAULT '{}',
  "colorPalette" jsonb,
  preview text,
  "customData" jsonb DEFAULT '{}'::jsonb,
  "createdAt" timestamptz NOT NULL DEFAULT NOW(),
  "updatedAt" timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."Embedding" (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "itemId" text NOT NULL UNIQUE REFERENCES public."Item"(id) ON DELETE CASCADE,
  vector extensions.vector(1024) NOT NULL,
  embedding extensions.vector(1024) NOT NULL,
  "modelVersion" text NOT NULL DEFAULT 'embed-english-v3.0',
  "createdAt" timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."ItemLink" (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "sourceItemId" text NOT NULL REFERENCES public."Item"(id) ON DELETE CASCADE,
  "targetItemId" text NOT NULL REFERENCES public."Item"(id) ON DELETE CASCADE,
  description text,
  "linkType" text NOT NULL DEFAULT 'related',
  strength double precision NOT NULL DEFAULT 0.5,
  "createdAt" timestamptz NOT NULL DEFAULT NOW(),
  "updatedAt" timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT "ItemLink_source_target_key" UNIQUE ("sourceItemId", "targetItemId"),
  CONSTRAINT "ItemLink_strength_range" CHECK (strength >= 0 AND strength <= 1),
  CONSTRAINT "ItemLink_no_self_link" CHECK ("sourceItemId" <> "targetItemId")
);

CREATE TABLE IF NOT EXISTS public."_ItemToTag" (
  "A" text NOT NULL REFERENCES public."Item"(id) ON DELETE CASCADE,
  "B" text NOT NULL REFERENCES public."Tag"(id) ON DELETE CASCADE,
  PRIMARY KEY ("A", "B")
);

CREATE TABLE IF NOT EXISTS public."_CollectionToItem" (
  "A" text NOT NULL REFERENCES public."Collection"(id) ON DELETE CASCADE,
  "B" text NOT NULL REFERENCES public."Item"(id) ON DELETE CASCADE,
  PRIMARY KEY ("A", "B")
);

CREATE INDEX IF NOT EXISTS "Item_userId_idx" ON public."Item" ("userId");
CREATE INDEX IF NOT EXISTS "Item_type_idx" ON public."Item" (type);
CREATE INDEX IF NOT EXISTS "Item_createdAt_idx" ON public."Item" ("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Item_updatedAt_idx" ON public."Item" ("updatedAt" DESC);
CREATE INDEX IF NOT EXISTS "Item_isFavorite_idx" ON public."Item" ("isFavorite");
CREATE INDEX IF NOT EXISTS "Item_sourceUrl_idx" ON public."Item" ("sourceUrl");
CREATE INDEX IF NOT EXISTS "Item_fullTextSearch_idx" ON public."Item" USING gin (to_tsvector('english', COALESCE("fullTextSearch", '')));

CREATE INDEX IF NOT EXISTS "ItemMetadata_tmdbId_idx" ON public."ItemMetadata" ("tmdbId");
CREATE INDEX IF NOT EXISTS "ItemMetadata_isbn_idx" ON public."ItemMetadata" (isbn);

CREATE INDEX IF NOT EXISTS "ItemLink_source_idx" ON public."ItemLink" ("sourceItemId");
CREATE INDEX IF NOT EXISTS "ItemLink_target_idx" ON public."ItemLink" ("targetItemId");

CREATE INDEX IF NOT EXISTS "Tag_count_idx" ON public."Tag" (count DESC);
CREATE INDEX IF NOT EXISTS "Tag_userId_idx" ON public."Tag" ("userId");

CREATE INDEX IF NOT EXISTS "Collection_userId_idx" ON public."Collection" ("userId");
CREATE INDEX IF NOT EXISTS "Collection_isAuto_idx" ON public."Collection" ("isAuto");
CREATE INDEX IF NOT EXISTS "Collection_userId_name_idx" ON public."Collection" (COALESCE("userId", 'global'), lower(name));

CREATE INDEX IF NOT EXISTS "_ItemToTag_B_idx" ON public."_ItemToTag" ("B");
CREATE INDEX IF NOT EXISTS "_CollectionToItem_B_idx" ON public."_CollectionToItem" ("B");

DO $$
BEGIN
  BEGIN
    EXECUTE 'CREATE INDEX IF NOT EXISTS "Embedding_vector_hnsw_idx" ON public."Embedding" USING hnsw (vector vector_cosine_ops)';
  EXCEPTION
    WHEN undefined_object OR feature_not_supported OR invalid_parameter_value THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS "Embedding_vector_ivfflat_idx" ON public."Embedding" USING ivfflat (vector vector_cosine_ops) WITH (lists = 100)';
  END;
END $$;

DROP TRIGGER IF EXISTS set_updated_at_user ON public."User";
CREATE TRIGGER set_updated_at_user
BEFORE UPDATE ON public."User"
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS set_updated_at_item ON public."Item";
CREATE TRIGGER set_updated_at_item
BEFORE UPDATE ON public."Item"
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS set_updated_at_collection ON public."Collection";
CREATE TRIGGER set_updated_at_collection
BEFORE UPDATE ON public."Collection"
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS set_updated_at_itemmetadata ON public."ItemMetadata";
CREATE TRIGGER set_updated_at_itemmetadata
BEFORE UPDATE ON public."ItemMetadata"
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS set_updated_at_itemlink ON public."ItemLink";
CREATE TRIGGER set_updated_at_itemlink
BEFORE UPDATE ON public."ItemLink"
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS sync_embedding_columns_before_write ON public."Embedding";
CREATE TRIGGER sync_embedding_columns_before_write
BEFORE INSERT OR UPDATE ON public."Embedding"
FOR EACH ROW EXECUTE FUNCTION public.sync_embedding_columns();

CREATE OR REPLACE FUNCTION public.match_items(
  query_embedding extensions.vector(1024),
  match_threshold float DEFAULT 0,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id text,
  similarity float
)
LANGUAGE sql
STABLE
SET search_path = public, extensions
AS $$
  SELECT
    e."itemId"::text AS id,
    1 - (e.vector <=> query_embedding) AS similarity
  FROM public."Embedding" AS e
  WHERE 1 - (e.vector <=> query_embedding) > match_threshold
  ORDER BY e.vector <=> query_embedding
  LIMIT GREATEST(match_count, 1);
$$;

ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Item" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Tag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Collection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ItemMetadata" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Embedding" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ItemLink" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."_ItemToTag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."_CollectionToItem" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User_public_full_access" ON public."User";
DROP POLICY IF EXISTS "User_select_own" ON public."User";
DROP POLICY IF EXISTS "User_insert_own" ON public."User";
DROP POLICY IF EXISTS "User_update_own" ON public."User";
DROP POLICY IF EXISTS "User_delete_own" ON public."User";

CREATE POLICY "User_select_own"
ON public."User"
FOR SELECT
TO anon, authenticated
USING ((SELECT auth.uid())::text = id);

CREATE POLICY "User_insert_own"
ON public."User"
FOR INSERT
TO anon, authenticated
WITH CHECK ((SELECT auth.uid())::text = id);

CREATE POLICY "User_update_own"
ON public."User"
FOR UPDATE
TO anon, authenticated
USING ((SELECT auth.uid())::text = id)
WITH CHECK ((SELECT auth.uid())::text = id);

CREATE POLICY "User_delete_own"
ON public."User"
FOR DELETE
TO anon, authenticated
USING ((SELECT auth.uid())::text = id);

DROP POLICY IF EXISTS "Item_public_full_access" ON public."Item";
DROP POLICY IF EXISTS "Item_select_visible" ON public."Item";
DROP POLICY IF EXISTS "Item_insert_visible" ON public."Item";
DROP POLICY IF EXISTS "Item_update_visible" ON public."Item";
DROP POLICY IF EXISTS "Item_delete_visible" ON public."Item";

CREATE POLICY "Item_select_visible"
ON public."Item"
FOR SELECT
TO anon, authenticated
USING ("userId" IS NULL OR "userId" = (SELECT auth.uid())::text);

CREATE POLICY "Item_insert_visible"
ON public."Item"
FOR INSERT
TO anon, authenticated
WITH CHECK ("userId" IS NULL OR "userId" = (SELECT auth.uid())::text);

CREATE POLICY "Item_update_visible"
ON public."Item"
FOR UPDATE
TO anon, authenticated
USING ("userId" IS NULL OR "userId" = (SELECT auth.uid())::text)
WITH CHECK ("userId" IS NULL OR "userId" = (SELECT auth.uid())::text);

CREATE POLICY "Item_delete_visible"
ON public."Item"
FOR DELETE
TO anon, authenticated
USING ("userId" IS NULL OR "userId" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Tag_public_full_access" ON public."Tag";
DROP POLICY IF EXISTS "Tag_select_visible" ON public."Tag";
DROP POLICY IF EXISTS "Tag_insert_visible" ON public."Tag";
DROP POLICY IF EXISTS "Tag_update_visible" ON public."Tag";
DROP POLICY IF EXISTS "Tag_delete_visible" ON public."Tag";

CREATE POLICY "Tag_select_visible"
ON public."Tag"
FOR SELECT
TO anon, authenticated
USING ("userId" IS NULL OR "userId" = (SELECT auth.uid())::text);

CREATE POLICY "Tag_insert_visible"
ON public."Tag"
FOR INSERT
TO anon, authenticated
WITH CHECK ("userId" IS NULL OR "userId" = (SELECT auth.uid())::text);

CREATE POLICY "Tag_update_visible"
ON public."Tag"
FOR UPDATE
TO anon, authenticated
USING ("userId" IS NULL OR "userId" = (SELECT auth.uid())::text)
WITH CHECK ("userId" IS NULL OR "userId" = (SELECT auth.uid())::text);

CREATE POLICY "Tag_delete_visible"
ON public."Tag"
FOR DELETE
TO anon, authenticated
USING ("userId" IS NULL OR "userId" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Collection_public_full_access" ON public."Collection";
DROP POLICY IF EXISTS "Collection_select_visible" ON public."Collection";
DROP POLICY IF EXISTS "Collection_insert_visible" ON public."Collection";
DROP POLICY IF EXISTS "Collection_update_visible" ON public."Collection";
DROP POLICY IF EXISTS "Collection_delete_visible" ON public."Collection";

CREATE POLICY "Collection_select_visible"
ON public."Collection"
FOR SELECT
TO anon, authenticated
USING ("userId" IS NULL OR "userId" = (SELECT auth.uid())::text);

CREATE POLICY "Collection_insert_visible"
ON public."Collection"
FOR INSERT
TO anon, authenticated
WITH CHECK ("userId" IS NULL OR "userId" = (SELECT auth.uid())::text);

CREATE POLICY "Collection_update_visible"
ON public."Collection"
FOR UPDATE
TO anon, authenticated
USING ("userId" IS NULL OR "userId" = (SELECT auth.uid())::text)
WITH CHECK ("userId" IS NULL OR "userId" = (SELECT auth.uid())::text);

CREATE POLICY "Collection_delete_visible"
ON public."Collection"
FOR DELETE
TO anon, authenticated
USING ("userId" IS NULL OR "userId" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "ItemMetadata_public_full_access" ON public."ItemMetadata";
DROP POLICY IF EXISTS "ItemMetadata_select_visible" ON public."ItemMetadata";
DROP POLICY IF EXISTS "ItemMetadata_insert_visible" ON public."ItemMetadata";
DROP POLICY IF EXISTS "ItemMetadata_update_visible" ON public."ItemMetadata";
DROP POLICY IF EXISTS "ItemMetadata_delete_visible" ON public."ItemMetadata";

CREATE POLICY "ItemMetadata_select_visible"
ON public."ItemMetadata"
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public."Item" i
    WHERE i.id = "itemId"
      AND (i."userId" IS NULL OR i."userId" = (SELECT auth.uid())::text)
  )
);

CREATE POLICY "ItemMetadata_insert_visible"
ON public."ItemMetadata"
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public."Item" i
    WHERE i.id = "itemId"
      AND (i."userId" IS NULL OR i."userId" = (SELECT auth.uid())::text)
  )
);

CREATE POLICY "ItemMetadata_update_visible"
ON public."ItemMetadata"
FOR UPDATE
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public."Item" i
    WHERE i.id = "itemId"
      AND (i."userId" IS NULL OR i."userId" = (SELECT auth.uid())::text)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public."Item" i
    WHERE i.id = "itemId"
      AND (i."userId" IS NULL OR i."userId" = (SELECT auth.uid())::text)
  )
);

CREATE POLICY "ItemMetadata_delete_visible"
ON public."ItemMetadata"
FOR DELETE
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public."Item" i
    WHERE i.id = "itemId"
      AND (i."userId" IS NULL OR i."userId" = (SELECT auth.uid())::text)
  )
);

DROP POLICY IF EXISTS "Embedding_public_full_access" ON public."Embedding";
DROP POLICY IF EXISTS "Embedding_select_visible" ON public."Embedding";
DROP POLICY IF EXISTS "Embedding_insert_visible" ON public."Embedding";
DROP POLICY IF EXISTS "Embedding_update_visible" ON public."Embedding";
DROP POLICY IF EXISTS "Embedding_delete_visible" ON public."Embedding";

CREATE POLICY "Embedding_select_visible"
ON public."Embedding"
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public."Item" i
    WHERE i.id = "itemId"
      AND (i."userId" IS NULL OR i."userId" = (SELECT auth.uid())::text)
  )
);

CREATE POLICY "Embedding_insert_visible"
ON public."Embedding"
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public."Item" i
    WHERE i.id = "itemId"
      AND (i."userId" IS NULL OR i."userId" = (SELECT auth.uid())::text)
  )
);

CREATE POLICY "Embedding_update_visible"
ON public."Embedding"
FOR UPDATE
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public."Item" i
    WHERE i.id = "itemId"
      AND (i."userId" IS NULL OR i."userId" = (SELECT auth.uid())::text)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public."Item" i
    WHERE i.id = "itemId"
      AND (i."userId" IS NULL OR i."userId" = (SELECT auth.uid())::text)
  )
);

CREATE POLICY "Embedding_delete_visible"
ON public."Embedding"
FOR DELETE
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public."Item" i
    WHERE i.id = "itemId"
      AND (i."userId" IS NULL OR i."userId" = (SELECT auth.uid())::text)
  )
);

DROP POLICY IF EXISTS "ItemLink_public_full_access" ON public."ItemLink";
DROP POLICY IF EXISTS "ItemLink_select_visible" ON public."ItemLink";
DROP POLICY IF EXISTS "ItemLink_insert_visible" ON public."ItemLink";
DROP POLICY IF EXISTS "ItemLink_update_visible" ON public."ItemLink";
DROP POLICY IF EXISTS "ItemLink_delete_visible" ON public."ItemLink";

CREATE POLICY "ItemLink_select_visible"
ON public."ItemLink"
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public."Item" s
    WHERE s.id = "sourceItemId"
      AND (s."userId" IS NULL OR s."userId" = (SELECT auth.uid())::text)
  )
  AND EXISTS (
    SELECT 1
    FROM public."Item" t
    WHERE t.id = "targetItemId"
      AND (t."userId" IS NULL OR t."userId" = (SELECT auth.uid())::text)
  )
);

CREATE POLICY "ItemLink_insert_visible"
ON public."ItemLink"
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public."Item" s
    WHERE s.id = "sourceItemId"
      AND (s."userId" IS NULL OR s."userId" = (SELECT auth.uid())::text)
  )
  AND EXISTS (
    SELECT 1
    FROM public."Item" t
    WHERE t.id = "targetItemId"
      AND (t."userId" IS NULL OR t."userId" = (SELECT auth.uid())::text)
  )
);

CREATE POLICY "ItemLink_update_visible"
ON public."ItemLink"
FOR UPDATE
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public."Item" s
    WHERE s.id = "sourceItemId"
      AND (s."userId" IS NULL OR s."userId" = (SELECT auth.uid())::text)
  )
  AND EXISTS (
    SELECT 1
    FROM public."Item" t
    WHERE t.id = "targetItemId"
      AND (t."userId" IS NULL OR t."userId" = (SELECT auth.uid())::text)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public."Item" s
    WHERE s.id = "sourceItemId"
      AND (s."userId" IS NULL OR s."userId" = (SELECT auth.uid())::text)
  )
  AND EXISTS (
    SELECT 1
    FROM public."Item" t
    WHERE t.id = "targetItemId"
      AND (t."userId" IS NULL OR t."userId" = (SELECT auth.uid())::text)
  )
);

CREATE POLICY "ItemLink_delete_visible"
ON public."ItemLink"
FOR DELETE
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public."Item" s
    WHERE s.id = "sourceItemId"
      AND (s."userId" IS NULL OR s."userId" = (SELECT auth.uid())::text)
  )
  AND EXISTS (
    SELECT 1
    FROM public."Item" t
    WHERE t.id = "targetItemId"
      AND (t."userId" IS NULL OR t."userId" = (SELECT auth.uid())::text)
  )
);

DROP POLICY IF EXISTS "ItemToTag_public_full_access" ON public."_ItemToTag";
DROP POLICY IF EXISTS "ItemToTag_select_visible" ON public."_ItemToTag";
DROP POLICY IF EXISTS "ItemToTag_insert_visible" ON public."_ItemToTag";
DROP POLICY IF EXISTS "ItemToTag_delete_visible" ON public."_ItemToTag";

CREATE POLICY "ItemToTag_select_visible"
ON public."_ItemToTag"
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public."Item" i
    WHERE i.id = "A"
      AND (i."userId" IS NULL OR i."userId" = (SELECT auth.uid())::text)
  )
);

CREATE POLICY "ItemToTag_insert_visible"
ON public."_ItemToTag"
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public."Item" i
    WHERE i.id = "A"
      AND (i."userId" IS NULL OR i."userId" = (SELECT auth.uid())::text)
  )
  AND EXISTS (
    SELECT 1
    FROM public."Tag" t
    WHERE t.id = "B"
      AND (t."userId" IS NULL OR t."userId" = (SELECT auth.uid())::text)
  )
);

CREATE POLICY "ItemToTag_delete_visible"
ON public."_ItemToTag"
FOR DELETE
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public."Item" i
    WHERE i.id = "A"
      AND (i."userId" IS NULL OR i."userId" = (SELECT auth.uid())::text)
  )
);

DROP POLICY IF EXISTS "CollectionToItem_public_full_access" ON public."_CollectionToItem";
DROP POLICY IF EXISTS "CollectionToItem_select_visible" ON public."_CollectionToItem";
DROP POLICY IF EXISTS "CollectionToItem_insert_visible" ON public."_CollectionToItem";
DROP POLICY IF EXISTS "CollectionToItem_delete_visible" ON public."_CollectionToItem";

CREATE POLICY "CollectionToItem_select_visible"
ON public."_CollectionToItem"
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public."Collection" c
    WHERE c.id = "A"
      AND (c."userId" IS NULL OR c."userId" = (SELECT auth.uid())::text)
  )
);

CREATE POLICY "CollectionToItem_insert_visible"
ON public."_CollectionToItem"
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public."Collection" c
    WHERE c.id = "A"
      AND (c."userId" IS NULL OR c."userId" = (SELECT auth.uid())::text)
  )
  AND EXISTS (
    SELECT 1
    FROM public."Item" i
    WHERE i.id = "B"
      AND (i."userId" IS NULL OR i."userId" = (SELECT auth.uid())::text)
  )
);

CREATE POLICY "CollectionToItem_delete_visible"
ON public."_CollectionToItem"
FOR DELETE
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public."Collection" c
    WHERE c.id = "A"
      AND (c."userId" IS NULL OR c."userId" = (SELECT auth.uid())::text)
  )
);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated;

COMMIT;
