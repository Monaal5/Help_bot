
export interface Chatbot {
  id: string;
  name: string;
  description?: string;
  system_prompt?: string;
  clerk_user_id: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  settings: Record<string, any>;
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
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ChatSession {
  id: string;
  chatbot_id: string;
  user_name?: string;
  user_email?: string;
  session_data: Record<string, any>;
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
  metadata: Record<string, any>;
  created_at: string;
}

export interface KnowledgeEntry {
  id: string;
  chatbot_id: string;
  question: string;
  answer: string;
  keywords?: string[];
  source_document_id?: string;
  embedding?: number[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ChatbotResponse {
  content: string;
  source: 'knowledge-base' | 'ai' | 'fallback';
  isFromAI: boolean;
}
