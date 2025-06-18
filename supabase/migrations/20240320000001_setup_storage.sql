-- Ensure storage schema exists
CREATE SCHEMA IF NOT EXISTS storage;

-- Create storage.objects table if it doesn't exist
CREATE TABLE IF NOT EXISTS storage.objects (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    last_accessed_at timestamptz DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED
);

-- Create indexes
CREATE INDEX IF NOT EXISTS objects_bucket_id_idx ON storage.objects (bucket_id);
CREATE INDEX IF NOT EXISTS objects_name_idx ON storage.objects (name);
CREATE INDEX IF NOT EXISTS objects_owner_idx ON storage.objects (owner);
CREATE INDEX IF NOT EXISTS objects_path_tokens_idx ON storage.objects USING GIN (path_tokens);

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create storage.buckets table if it doesn't exist
CREATE TABLE IF NOT EXISTS storage.buckets (
    id text PRIMARY KEY,
    name text NOT NULL,
    owner uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[]
);

-- Enable RLS on buckets
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Grant access to authenticated users
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated; 