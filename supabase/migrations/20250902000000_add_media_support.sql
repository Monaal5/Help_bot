-- Add media support to the chatbot platform
-- This migration adds tables for storing images and videos with associated metadata

-- Create media_items table for storing images and videos
CREATE TABLE public.media_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chatbot_id UUID REFERENCES public.chatbots(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('image', 'video')),
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    tags TEXT[], -- Array of tags for searching
    keywords TEXT[], -- Keywords for semantic search
    alt_text TEXT, -- For accessibility
    thumbnail_url TEXT, -- For videos and large images
    duration INTEGER, -- For videos (in seconds)
    dimensions JSONB, -- Store width/height for images/videos
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Create indexes for better performance
CREATE INDEX idx_media_items_chatbot_id ON public.media_items(chatbot_id);
CREATE INDEX idx_media_items_type ON public.media_items(media_type);
CREATE INDEX idx_media_items_tags ON public.media_items USING GIN(tags);
CREATE INDEX idx_media_items_keywords ON public.media_items USING GIN(keywords);
CREATE INDEX idx_media_items_active ON public.media_items(is_active);
CREATE INDEX idx_media_items_created_at ON public.media_items(created_at DESC);

-- Create full-text search index for title and description
CREATE INDEX idx_media_items_search ON public.media_items USING GIN(
    to_tsvector('english', title || ' ' || COALESCE(description, ''))
);

-- Enable RLS for media_items
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for media_items
-- Chatbot owners can manage their media
CREATE POLICY "Chatbot owners can view their media" ON public.media_items
    FOR SELECT USING (
        chatbot_id IN (
            SELECT id FROM public.chatbots
            WHERE clerk_user_id = auth.uid()::text
        )
    );

CREATE POLICY "Chatbot owners can insert media" ON public.media_items
    FOR INSERT WITH CHECK (
        chatbot_id IN (
            SELECT id FROM public.chatbots
            WHERE clerk_user_id = auth.uid()::text
        )
    );

CREATE POLICY "Chatbot owners can update their media" ON public.media_items
    FOR UPDATE USING (
        chatbot_id IN (
            SELECT id FROM public.chatbots
            WHERE clerk_user_id = auth.uid()::text
        )
    );

CREATE POLICY "Chatbot owners can delete their media" ON public.media_items
    FOR DELETE USING (
        chatbot_id IN (
            SELECT id FROM public.chatbots
            WHERE clerk_user_id = auth.uid()::text
        )
    );

-- Allow public access to media for chatbot users (viewers)
CREATE POLICY "Public can view active media" ON public.media_items
    FOR SELECT USING (is_active = true);

-- Create function for media search
CREATE OR REPLACE FUNCTION search_media_items(
    chatbot_uuid UUID,
    search_query TEXT DEFAULT '',
    media_type_filter TEXT DEFAULT 'all',
    limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    description TEXT,
    media_type VARCHAR(20),
    file_url TEXT,
    thumbnail_url TEXT,
    tags TEXT[],
    keywords TEXT[],
    alt_text TEXT,
    dimensions JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    relevance_score REAL
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.title,
        m.description,
        m.media_type,
        m.file_url,
        m.thumbnail_url,
        m.tags,
        m.keywords,
        m.alt_text,
        m.dimensions,
        m.created_at,
        CASE 
            WHEN search_query = '' THEN 1.0
            ELSE (
                ts_rank(
                    to_tsvector('english', m.title || ' ' || COALESCE(m.description, '')),
                    plainto_tsquery('english', search_query)
                ) +
                CASE 
                    WHEN m.keywords && string_to_array(lower(search_query), ' ') THEN 0.5
                    ELSE 0.0
                END +
                CASE 
                    WHEN m.tags && string_to_array(lower(search_query), ' ') THEN 0.3
                    ELSE 0.0
                END
            )
        END AS relevance_score
    FROM public.media_items m
    WHERE 
        m.chatbot_id = chatbot_uuid
        AND m.is_active = true
        AND (media_type_filter = 'all' OR m.media_type = media_type_filter)
        AND (
            search_query = '' OR
            to_tsvector('english', m.title || ' ' || COALESCE(m.description, '')) @@ plainto_tsquery('english', search_query) OR
            m.keywords && string_to_array(lower(search_query), ' ') OR
            m.tags && string_to_array(lower(search_query), ' ') OR
            lower(m.title) LIKE '%' || lower(search_query) || '%' OR
            lower(m.description) LIKE '%' || lower(search_query) || '%'
        )
    ORDER BY relevance_score DESC, m.created_at DESC
    LIMIT limit_count;
END;
$$;

-- Create function to get random media items (for discovery)
CREATE OR REPLACE FUNCTION get_random_media_items(
    chatbot_uuid UUID,
    media_type_filter TEXT DEFAULT 'all',
    limit_count INTEGER DEFAULT 6
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    description TEXT,
    media_type VARCHAR(20),
    file_url TEXT,
    thumbnail_url TEXT,
    tags TEXT[],
    alt_text TEXT,
    dimensions JSONB
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.title,
        m.description,
        m.media_type,
        m.file_url,
        m.thumbnail_url,
        m.tags,
        m.alt_text,
        m.dimensions
    FROM public.media_items m
    WHERE 
        m.chatbot_id = chatbot_uuid
        AND m.is_active = true
        AND (media_type_filter = 'all' OR m.media_type = media_type_filter)
    ORDER BY RANDOM()
    LIMIT limit_count;
END;
$$;

-- Add updated_at trigger for media_items
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_media_items_updated_at 
    BEFORE UPDATE ON public.media_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for media files (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for media bucket
CREATE POLICY "Authenticated users can upload media" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'media' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Public can view media" ON storage.objects
    FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "Users can update their own media" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'media' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Users can delete their own media" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'media' AND
        auth.role() = 'authenticated'
    );
