
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create enum types
CREATE TYPE public.message_role AS ENUM ('user', 'assistant', 'system');
CREATE TYPE public.response_source AS ENUM ('knowledge_base', 'generative', 'hybrid');
CREATE TYPE public.document_status AS ENUM ('processing', 'completed', 'failed');

-- Chatbots table
CREATE TABLE public.chatbots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    system_prompt TEXT,
    clerk_user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}'::jsonb
);

-- Documents table for storing uploaded files and text data
CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chatbot_id UUID REFERENCES public.chatbots(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    file_name VARCHAR(255),
    file_type VARCHAR(100),
    file_size BIGINT,
    file_url TEXT,
    status document_status DEFAULT 'processing',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document chunks table for vector embeddings
CREATE TABLE public.document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(1536), -- OpenAI embedding dimension
    chunk_index INTEGER NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat sessions table
CREATE TABLE public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chatbot_id UUID REFERENCES public.chatbots(id) ON DELETE CASCADE,
    user_name VARCHAR(255),
    user_email VARCHAR(255),
    session_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Messages table for chat history
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    role message_role NOT NULL,
    content TEXT NOT NULL,
    response_source response_source,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge base entries table
CREATE TABLE public.knowledge_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chatbot_id UUID REFERENCES public.chatbots(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    keywords TEXT[],
    source_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    embedding vector(1536),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics table for tracking usage
CREATE TABLE public.analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chatbot_id UUID REFERENCES public.chatbots(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_chatbots_clerk_user_id ON public.chatbots(clerk_user_id);
CREATE INDEX idx_chatbots_active ON public.chatbots(is_active);
CREATE INDEX idx_documents_chatbot_id ON public.documents(chatbot_id);
CREATE INDEX idx_documents_status ON public.documents(status);
CREATE INDEX idx_document_chunks_document_id ON public.document_chunks(document_id);
CREATE INDEX idx_document_chunks_embedding ON public.document_chunks USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_chat_sessions_chatbot_id ON public.chat_sessions(chatbot_id);
CREATE INDEX idx_chat_sessions_active ON public.chat_sessions(is_active);
CREATE INDEX idx_messages_session_id ON public.messages(session_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_knowledge_entries_chatbot_id ON public.knowledge_entries(chatbot_id);
CREATE INDEX idx_knowledge_entries_embedding ON public.knowledge_entries USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_knowledge_entries_keywords ON public.knowledge_entries USING gin(keywords);
CREATE INDEX idx_analytics_chatbot_id ON public.analytics(chatbot_id);
CREATE INDEX idx_analytics_event_type ON public.analytics(event_type);
CREATE INDEX idx_analytics_created_at ON public.analytics(created_at);

-- Enable Row Level Security
ALTER TABLE public.chatbots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for chatbots (users can only access their own chatbots)
CREATE POLICY "Users can view their own chatbots" ON public.chatbots
    FOR SELECT USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can create their own chatbots" ON public.chatbots
    FOR INSERT WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update their own chatbots" ON public.chatbots
    FOR UPDATE USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete their own chatbots" ON public.chatbots
    FOR DELETE USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Create RLS policies for documents
CREATE POLICY "Users can view documents of their chatbots" ON public.documents
    FOR SELECT USING (
        chatbot_id IN (
            SELECT id FROM public.chatbots 
            WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    );

CREATE POLICY "Users can create documents for their chatbots" ON public.documents
    FOR INSERT WITH CHECK (
        chatbot_id IN (
            SELECT id FROM public.chatbots 
            WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    );

CREATE POLICY "Users can update documents of their chatbots" ON public.documents
    FOR UPDATE USING (
        chatbot_id IN (
            SELECT id FROM public.chatbots 
            WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    );

CREATE POLICY "Users can delete documents of their chatbots" ON public.documents
    FOR DELETE USING (
        chatbot_id IN (
            SELECT id FROM public.chatbots 
            WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    );

-- Create RLS policies for document chunks
CREATE POLICY "Users can view chunks of their documents" ON public.document_chunks
    FOR SELECT USING (
        document_id IN (
            SELECT d.id FROM public.documents d
            JOIN public.chatbots c ON d.chatbot_id = c.id
            WHERE c.clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    );

CREATE POLICY "Users can create chunks for their documents" ON public.document_chunks
    FOR INSERT WITH CHECK (
        document_id IN (
            SELECT d.id FROM public.documents d
            JOIN public.chatbots c ON d.chatbot_id = c.id
            WHERE c.clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    );

-- Create RLS policies for chat sessions (public access for chatbot users, private access for owners)
CREATE POLICY "Chatbot owners can view all sessions" ON public.chat_sessions
    FOR SELECT USING (
        chatbot_id IN (
            SELECT id FROM public.chatbots 
            WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    );

CREATE POLICY "Anyone can create chat sessions" ON public.chat_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Session participants can update sessions" ON public.chat_sessions
    FOR UPDATE USING (true);

-- Create RLS policies for messages
CREATE POLICY "Chatbot owners can view all messages" ON public.messages
    FOR SELECT USING (
        session_id IN (
            SELECT cs.id FROM public.chat_sessions cs
            JOIN public.chatbots c ON cs.chatbot_id = c.id
            WHERE c.clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    );

CREATE POLICY "Anyone can create messages" ON public.messages
    FOR INSERT WITH CHECK (true);

-- Create RLS policies for knowledge entries
CREATE POLICY "Users can view knowledge entries of their chatbots" ON public.knowledge_entries
    FOR SELECT USING (
        chatbot_id IN (
            SELECT id FROM public.chatbots 
            WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    );

CREATE POLICY "Users can create knowledge entries for their chatbots" ON public.knowledge_entries
    FOR INSERT WITH CHECK (
        chatbot_id IN (
            SELECT id FROM public.chatbots 
            WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    );

CREATE POLICY "Users can update knowledge entries of their chatbots" ON public.knowledge_entries
    FOR UPDATE USING (
        chatbot_id IN (
            SELECT id FROM public.chatbots 
            WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    );

CREATE POLICY "Users can delete knowledge entries of their chatbots" ON public.knowledge_entries
    FOR DELETE USING (
        chatbot_id IN (
            SELECT id FROM public.chatbots 
            WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    );

-- Create RLS policies for analytics
CREATE POLICY "Users can view analytics of their chatbots" ON public.analytics
    FOR SELECT USING (
        chatbot_id IN (
            SELECT id FROM public.chatbots 
            WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    );

CREATE POLICY "Anyone can create analytics entries" ON public.analytics
    FOR INSERT WITH CHECK (true);

-- Create functions for vector similarity search
CREATE OR REPLACE FUNCTION public.search_similar_chunks(
    query_embedding vector(1536),
    chatbot_uuid UUID,
    similarity_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    chunk_id UUID,
    content TEXT,
    similarity FLOAT,
    document_title VARCHAR(500),
    metadata JSONB
)
LANGUAGE sql
AS $$
    SELECT 
        dc.id,
        dc.content,
        1 - (dc.embedding <=> query_embedding) AS similarity,
        d.title,
        dc.metadata
    FROM public.document_chunks dc
    JOIN public.documents d ON dc.document_id = d.id
    WHERE d.chatbot_id = chatbot_uuid
    AND 1 - (dc.embedding <=> query_embedding) > similarity_threshold
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- Create function for searching knowledge entries
CREATE OR REPLACE FUNCTION public.search_knowledge_entries(
    query_embedding vector(1536),
    chatbot_uuid UUID,
    similarity_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 3
)
RETURNS TABLE (
    entry_id UUID,
    question TEXT,
    answer TEXT,
    similarity FLOAT,
    keywords TEXT[],
    metadata JSONB
)
LANGUAGE sql
AS $$
    SELECT 
        ke.id,
        ke.question,
        ke.answer,
        1 - (ke.embedding <=> query_embedding) AS similarity,
        ke.keywords,
        ke.metadata
    FROM public.knowledge_entries ke
    WHERE ke.chatbot_id = chatbot_uuid
    AND ke.embedding IS NOT NULL
    AND 1 - (ke.embedding <=> query_embedding) > similarity_threshold
    ORDER BY ke.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- Create function to get chatbot analytics
CREATE OR REPLACE FUNCTION public.get_chatbot_analytics(chatbot_uuid UUID)
RETURNS JSONB
LANGUAGE sql
AS $$
    SELECT jsonb_build_object(
        'total_sessions', (
            SELECT COUNT(*) FROM public.chat_sessions 
            WHERE chatbot_id = chatbot_uuid
        ),
        'total_messages', (
            SELECT COUNT(*) FROM public.messages m
            JOIN public.chat_sessions cs ON m.session_id = cs.id
            WHERE cs.chatbot_id = chatbot_uuid
        ),
        'active_sessions_today', (
            SELECT COUNT(*) FROM public.chat_sessions 
            WHERE chatbot_id = chatbot_uuid 
            AND created_at >= CURRENT_DATE
        ),
        'total_documents', (
            SELECT COUNT(*) FROM public.documents 
            WHERE chatbot_id = chatbot_uuid AND status = 'completed'
        ),
        'knowledge_entries_count', (
            SELECT COUNT(*) FROM public.knowledge_entries 
            WHERE chatbot_id = chatbot_uuid
        )
    );
$$;

-- Create triggers to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chatbots_updated_at BEFORE UPDATE ON public.chatbots
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON public.chat_sessions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_knowledge_entries_updated_at BEFORE UPDATE ON public.knowledge_entries
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
