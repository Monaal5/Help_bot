import { createClient, type Session, type User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xkynqxckgzewryzzzfgc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhreW5xeGNrZ3pld3J5enp6ZmdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0Njg1NjEsImV4cCI6MjA4MTA0NDU2MX0.YdtRrlGSKERTTGNLXv5b_OJ9vCe1_7_ZobTiCdezcUU';

// Create authenticated Supabase client for media operations
export const createAuthenticatedSupabaseClient = (clerkUserId: string) => {
  const client = createClient(supabaseUrl, supabaseAnonKey);

  // Create a mock session that matches Supabase's Session type
  const mockUser: User = {
    id: clerkUserId,
    aud: 'authenticated',
    role: 'authenticated',
    email: '',
    email_confirmed_at: new Date().toISOString(),
    phone: '',
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {},
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const mockSession: Session = {
    access_token: 'clerk-token',
    refresh_token: 'clerk-refresh',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: mockUser
  };

  // Override getSession to return our mock session
  client.auth.getSession = async () => {
    return {
      data: { session: mockSession },
      error: null
    };
  };

  return client;
};

export { supabase } from './client';
