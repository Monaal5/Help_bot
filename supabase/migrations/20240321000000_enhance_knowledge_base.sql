-- Enable pg_trgm extension for similarity function
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add category field to knowledge entries
ALTER TABLE public.knowledge_entries
ADD COLUMN IF NOT EXISTS category VARCHAR(100),
ADD COLUMN IF NOT EXISTS subcategory VARCHAR(100),
ADD COLUMN IF NOT EXISTS is_duplicate BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS similarity_score FLOAT;

-- Create index for faster category-based queries
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_knowledge_entries_category'
    ) THEN
        CREATE INDEX idx_knowledge_entries_category ON public.knowledge_entries(category, subcategory);
    END IF;
END $$;

-- Create index for faster keyword searches
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_knowledge_entries_keywords'
    ) THEN
        CREATE INDEX idx_knowledge_entries_keywords ON public.knowledge_entries USING GIN (keywords);
    END IF;
END $$;

-- Create function to check for duplicate entries
CREATE OR REPLACE FUNCTION public.check_duplicate_knowledge_entry()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for similar questions using similarity threshold
    IF EXISTS (
        SELECT 1 FROM public.knowledge_entries
        WHERE chatbot_id = NEW.chatbot_id
        AND id != NEW.id
        AND (
            -- Check question similarity
            similarity(question, NEW.question) > 0.8
            OR
            -- Check answer similarity
            similarity(answer, NEW.answer) > 0.8
        )
    ) THEN
        NEW.is_duplicate := true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS check_duplicate_knowledge_entry_trigger ON public.knowledge_entries;

-- Create trigger for duplicate detection
CREATE TRIGGER check_duplicate_knowledge_entry_trigger
BEFORE INSERT OR UPDATE ON public.knowledge_entries
FOR EACH ROW
EXECUTE FUNCTION public.check_duplicate_knowledge_entry();

-- Create function for bulk import
CREATE OR REPLACE FUNCTION public.bulk_import_knowledge_entries(
    entries JSONB,
    chatbot_uuid UUID
)
RETURNS TABLE (
    id UUID,
    question TEXT,
    answer TEXT,
    category VARCHAR,
    subcategory VARCHAR,
    is_duplicate BOOLEAN
) AS $$
DECLARE
    entry JSONB;
BEGIN
    FOR entry IN SELECT * FROM jsonb_array_elements(entries)
    LOOP
        INSERT INTO public.knowledge_entries (
            chatbot_id,
            question,
            answer,
            category,
            subcategory,
            keywords,
            metadata
        )
        VALUES (
            chatbot_uuid,
            entry->>'question',
            entry->>'answer',
            entry->>'category',
            entry->>'subcategory',
            ARRAY(SELECT jsonb_array_elements_text(entry->'keywords')),
            entry->'metadata'
        )
        RETURNING id, question, answer, category, subcategory, is_duplicate
        INTO STRICT id, question, answer, category, subcategory, is_duplicate;
        
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function for bulk export
CREATE OR REPLACE FUNCTION public.export_knowledge_entries(
    chatbot_uuid UUID,
    category_filter VARCHAR DEFAULT NULL,
    include_duplicates BOOLEAN DEFAULT false
)
RETURNS JSONB AS $$
BEGIN
    RETURN (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', id,
                'question', question,
                'answer', answer,
                'category', category,
                'subcategory', subcategory,
                'keywords', keywords,
                'metadata', metadata,
                'created_at', created_at,
                'updated_at', updated_at
            )
        )
        FROM public.knowledge_entries
        WHERE chatbot_id = chatbot_uuid
        AND (category_filter IS NULL OR category = category_filter)
        AND (include_duplicates OR NOT is_duplicate)
    );
END;
$$ LANGUAGE plpgsql; 