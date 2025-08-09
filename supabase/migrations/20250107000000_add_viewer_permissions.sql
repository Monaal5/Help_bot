-- Create viewer permissions table
CREATE TABLE public.viewer_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chatbot_id UUID REFERENCES public.chatbots(id) ON DELETE CASCADE,
    viewer_email VARCHAR(255) NOT NULL,
    granted_by VARCHAR(255) NOT NULL, -- Clerk user ID of the admin who granted access
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(chatbot_id, viewer_email)
);

-- Enable RLS for viewer permissions
ALTER TABLE public.viewer_permissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for viewer permissions (only chatbot owners can manage viewers)
-- Note: Using auth.uid() instead of JWT claims for better compatibility with Clerk
CREATE POLICY "Chatbot owners can view their viewer permissions" ON public.viewer_permissions
    FOR SELECT USING (
        chatbot_id IN (
            SELECT id FROM public.chatbots
            WHERE clerk_user_id = auth.uid()::text
        )
    );

CREATE POLICY "Chatbot owners can create viewer permissions" ON public.viewer_permissions
    FOR INSERT WITH CHECK (
        chatbot_id IN (
            SELECT id FROM public.chatbots
            WHERE clerk_user_id = auth.uid()::text
        )
    );

CREATE POLICY "Chatbot owners can update their viewer permissions" ON public.viewer_permissions
    FOR UPDATE USING (
        chatbot_id IN (
            SELECT id FROM public.chatbots
            WHERE clerk_user_id = auth.uid()::text
        )
    );

CREATE POLICY "Chatbot owners can delete their viewer permissions" ON public.viewer_permissions
    FOR DELETE USING (
        chatbot_id IN (
            SELECT id FROM public.chatbots
            WHERE clerk_user_id = auth.uid()::text
        )
    );

-- Create RLS policies for viewers to access chat sessions
-- Note: We'll handle viewer access through application logic instead of RLS for better Clerk compatibility
-- These policies allow authenticated users to view sessions, with application-level filtering
CREATE POLICY "Authenticated users can view chat sessions" ON public.chat_sessions
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create RLS policies for viewers to access messages
CREATE POLICY "Authenticated users can view messages" ON public.messages
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX idx_viewer_permissions_email ON public.viewer_permissions(viewer_email);
CREATE INDEX idx_viewer_permissions_chatbot_id ON public.viewer_permissions(chatbot_id);
CREATE INDEX idx_viewer_permissions_active ON public.viewer_permissions(is_active);
