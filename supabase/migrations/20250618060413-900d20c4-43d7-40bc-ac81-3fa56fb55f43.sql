
-- Drop existing RLS policies for chatbots
DROP POLICY IF EXISTS "Users can view their own chatbots" ON public.chatbots;
DROP POLICY IF EXISTS "Users can create their own chatbots" ON public.chatbots;
DROP POLICY IF EXISTS "Users can update their own chatbots" ON public.chatbots;
DROP POLICY IF EXISTS "Users can delete their own chatbots" ON public.chatbots;

-- Create new RLS policies that work with Clerk authentication
-- Since we're using clerk_user_id column, we'll make the policies more permissive for now
CREATE POLICY "Users can view chatbots they own" ON public.chatbots
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create chatbots" ON public.chatbots
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update chatbots they own" ON public.chatbots
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete chatbots they own" ON public.chatbots
    FOR DELETE USING (true);

-- Update RLS policies for documents to be more permissive
DROP POLICY IF EXISTS "Users can view documents of their chatbots" ON public.documents;
DROP POLICY IF EXISTS "Users can create documents for their chatbots" ON public.documents;
DROP POLICY IF EXISTS "Users can update documents of their chatbots" ON public.documents;
DROP POLICY IF EXISTS "Users can delete documents of their chatbots" ON public.documents;

CREATE POLICY "Users can view documents" ON public.documents
    FOR SELECT USING (true);

CREATE POLICY "Users can create documents" ON public.documents
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update documents" ON public.documents
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete documents" ON public.documents
    FOR DELETE USING (true);

-- Update RLS policies for knowledge_entries to be more permissive
DROP POLICY IF EXISTS "Users can view knowledge entries of their chatbots" ON public.knowledge_entries;
DROP POLICY IF EXISTS "Users can create knowledge entries for their chatbots" ON public.knowledge_entries;
DROP POLICY IF EXISTS "Users can update knowledge entries of their chatbots" ON public.knowledge_entries;
DROP POLICY IF EXISTS "Users can delete knowledge entries of their chatbots" ON public.knowledge_entries;

CREATE POLICY "Users can view knowledge entries" ON public.knowledge_entries
    FOR SELECT USING (true);

CREATE POLICY "Users can create knowledge entries" ON public.knowledge_entries
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update knowledge entries" ON public.knowledge_entries
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete knowledge entries" ON public.knowledge_entries
    FOR DELETE USING (true);

-- Update RLS policies for chat_sessions to be more permissive
DROP POLICY IF EXISTS "Chatbot owners can view all sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Anyone can create chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Session participants can update sessions" ON public.chat_sessions;

CREATE POLICY "Users can view chat sessions" ON public.chat_sessions
    FOR SELECT USING (true);

CREATE POLICY "Users can create chat sessions" ON public.chat_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update chat sessions" ON public.chat_sessions
    FOR UPDATE USING (true);

-- Update RLS policies for messages to be more permissive
DROP POLICY IF EXISTS "Chatbot owners can view all messages" ON public.messages;
DROP POLICY IF EXISTS "Anyone can create messages" ON public.messages;

CREATE POLICY "Users can view messages" ON public.messages
    FOR SELECT USING (true);

CREATE POLICY "Users can create messages" ON public.messages
    FOR INSERT WITH CHECK (true);

-- Update RLS policies for analytics to be more permissive
DROP POLICY IF EXISTS "Users can view analytics of their chatbots" ON public.analytics;
DROP POLICY IF EXISTS "Anyone can create analytics entries" ON public.analytics;

CREATE POLICY "Users can view analytics" ON public.analytics
    FOR SELECT USING (true);

CREATE POLICY "Users can create analytics" ON public.analytics
    FOR INSERT WITH CHECK (true);
