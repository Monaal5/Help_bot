-- Complete Viewer Permissions Migration
-- Run this entire script in Supabase SQL Editor to enable the viewer permissions feature

-- Step 1: Create the viewer_permissions table
CREATE TABLE IF NOT EXISTS public.viewer_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chatbot_id UUID REFERENCES public.chatbots(id) ON DELETE CASCADE,
    viewer_email VARCHAR(255) NOT NULL,
    granted_by VARCHAR(255) NOT NULL, -- Clerk user ID of the admin who granted access
    invitation_token VARCHAR(255) UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'), -- Unique invitation token
    token_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'), -- Token expires in 7 days
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(chatbot_id, viewer_email)
);

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_viewer_permissions_email ON public.viewer_permissions(viewer_email);
CREATE INDEX IF NOT EXISTS idx_viewer_permissions_chatbot_id ON public.viewer_permissions(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_viewer_permissions_active ON public.viewer_permissions(is_active);

-- Step 3: Disable RLS to avoid authentication issues with Clerk
-- Security is handled at the application level
ALTER TABLE public.viewer_permissions DISABLE ROW LEVEL SECURITY;

-- Step 4: Clean up any existing policies that might cause conflicts
DROP POLICY IF EXISTS "Chatbot owners can view their viewer permissions" ON public.viewer_permissions;
DROP POLICY IF EXISTS "Chatbot owners can create viewer permissions" ON public.viewer_permissions;
DROP POLICY IF EXISTS "Chatbot owners can update their viewer permissions" ON public.viewer_permissions;
DROP POLICY IF EXISTS "Chatbot owners can delete their viewer permissions" ON public.viewer_permissions;
DROP POLICY IF EXISTS "Viewers can view permitted chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Viewers can view messages from permitted sessions" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can view chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Authenticated users can view messages" ON public.messages;

-- Migration complete!
-- The viewer permissions feature should now work without 404 or 401 errors.
