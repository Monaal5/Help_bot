-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS public.chatbots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  description text,
  system_prompt text,
  clerk_user_id character varying NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  settings jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT chatbots_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chatbot_id uuid,
  user_name character varying,
  user_email character varying,
  session_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  phone_number character varying,
  CONSTRAINT chat_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT chat_sessions_chatbot_id_fkey FOREIGN KEY (chatbot_id) REFERENCES public.chatbots(id)
);

CREATE TABLE IF NOT EXISTS public.analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chatbot_id uuid,
  session_id uuid,
  event_type character varying NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT analytics_pkey PRIMARY KEY (id),
  CONSTRAINT analytics_chatbot_id_fkey FOREIGN KEY (chatbot_id) REFERENCES public.chatbots(id),
  CONSTRAINT analytics_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.chat_sessions(id)
);

CREATE TABLE IF NOT EXISTS public.documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chatbot_id uuid,
  title character varying NOT NULL,
  content text,
  file_name character varying,
  file_type character varying,
  file_size bigint,
  file_url text,
  status document_status DEFAULT 'processing'::document_status,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  media_type character varying,
  media_url text,
  CONSTRAINT documents_pkey PRIMARY KEY (id),
  CONSTRAINT documents_chatbot_id_fkey FOREIGN KEY (chatbot_id) REFERENCES public.chatbots(id)
);

CREATE TABLE IF NOT EXISTS public.document_chunks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  document_id uuid,
  content text NOT NULL,
  embedding vector(1536),
  chunk_index integer NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT document_chunks_pkey PRIMARY KEY (id),
  CONSTRAINT document_chunks_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id)
);

CREATE TABLE IF NOT EXISTS public.knowledge_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chatbot_id uuid,
  question text NOT NULL,
  answer text NOT NULL,
  keywords text[],
  source_document_id uuid,
  embedding vector(1536),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  category character varying,
  subcategory character varying,
  is_duplicate boolean DEFAULT false,
  similarity_score double precision,
  CONSTRAINT knowledge_entries_pkey PRIMARY KEY (id),
  CONSTRAINT knowledge_entries_chatbot_id_fkey FOREIGN KEY (chatbot_id) REFERENCES public.chatbots(id),
  CONSTRAINT knowledge_entries_source_document_id_fkey FOREIGN KEY (source_document_id) REFERENCES public.documents(id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid,
  role message_role NOT NULL,
  content text NOT NULL,
  response_source response_source,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.chat_sessions(id)
);

CREATE TABLE IF NOT EXISTS public.viewer_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chatbot_id uuid,
  viewer_email character varying NOT NULL,
  granted_by character varying NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  invitation_token character varying UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  token_expires_at timestamp with time zone DEFAULT (now() + '7 days'::interval),
  CONSTRAINT viewer_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT viewer_permissions_chatbot_id_fkey FOREIGN KEY (chatbot_id) REFERENCES public.chatbots(id) ON DELETE CASCADE,
  CONSTRAINT viewer_permissions_chatbot_email_key UNIQUE (chatbot_id, viewer_email)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_viewer_permissions_email ON public.viewer_permissions(viewer_email);
CREATE INDEX IF NOT EXISTS idx_viewer_permissions_chatbot_id ON public.viewer_permissions(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_viewer_permissions_active ON public.viewer_permissions(is_active);

-- Disable RLS as security is handled at application level
ALTER TABLE public.viewer_permissions DISABLE ROW LEVEL SECURITY;
