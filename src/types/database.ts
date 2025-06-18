export interface Chatbot {
  id: string;
  name: string;
  description?: string;
  system_prompt?: string;
  clerk_user_id: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  settings: any; // Changed from Record<string, any> to any to handle Json type
}

export interface Document {
  id: string;
  chatbot_id: string;
  title: string;
  content?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  file_url?: string;
  status: 'processing' | 'completed' | 'failed';
  metadata: any; // Changed from Record<string, any> to any
  created_at: string;
  updated_at: string;
}

export interface ChatSession {
  id: string;
  chatbot_id: string;
  user_name?: string;
  user_email?: string;
  session_data: any; // Changed from Record<string, any> to any
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface Message {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  response_source?: 'knowledge_base' | 'generative' | 'hybrid';
  metadata: any; // Changed from Record<string, any> to any
  created_at: string;
}

export interface KnowledgeEntry {
  id: string;
  chatbot_id: string;
  question: string;
  answer: string;
  keywords?: string[];
  source_document_id?: string;
  embedding?: any; // Changed from number[] to any to handle string from DB
  metadata: any; // Changed from Record<string, any> to any
  created_at: string;
  updated_at: string;
  category?: string | null;
  subcategory?: string | null;
  is_duplicate?: boolean;
  similarity_score?: number | null;
}

export interface ChatbotResponse {
  content: string;
  source: 'knowledge-base' | 'ai' | 'fallback';
  isFromAI: boolean;
}
