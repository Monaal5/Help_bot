
import { supabase } from "@/integrations/supabase/client";
import { Chatbot, ChatSession, Message, KnowledgeEntry, Document } from "@/types/database";

export class SupabaseChatbotService {
  async createChatbot(data: {
    name: string;
    description?: string;
    system_prompt?: string;
    clerk_user_id: string;
    settings?: any;
  }): Promise<Chatbot> {
    const { data: chatbot, error } = await supabase
      .from('chatbots')
      .insert([{
        name: data.name,
        description: data.description,
        system_prompt: data.system_prompt,
        clerk_user_id: data.clerk_user_id,
        settings: data.settings || {}
      }])
      .select()
      .single();

    if (error) throw error;
    return chatbot as Chatbot;
  }

  async getChatbotsByUser(clerkUserId: string): Promise<Chatbot[]> {
    const { data: chatbots, error } = await supabase
      .from('chatbots')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .eq('is_active', true);

    if (error) throw error;
    return (chatbots || []) as Chatbot[];
  }

  async getChatbotById(id: string): Promise<Chatbot | null> {
    const { data: chatbot, error } = await supabase
      .from('chatbots')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return chatbot as Chatbot;
  }

  async updateChatbot(id: string, updates: Partial<Chatbot>): Promise<Chatbot> {
    const { data: chatbot, error } = await supabase
      .from('chatbots')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return chatbot as Chatbot;
  }

  async createChatSession(chatbotId: string, userData?: { name?: string; email?: string }): Promise<ChatSession> {
    const { data: session, error } = await supabase
      .from('chat_sessions')
      .insert([{
        chatbot_id: chatbotId,
        user_name: userData?.name,
        user_email: userData?.email,
        session_data: {}
      }])
      .select()
      .single();

    if (error) throw error;
    return session as ChatSession;
  }

  async addMessage(sessionId: string, message: {
    role: 'user' | 'assistant' | 'system';
    content: string;
    response_source?: 'knowledge_base' | 'generative' | 'hybrid';
    metadata?: any;
  }): Promise<Message> {
    const { data: newMessage, error } = await supabase
      .from('messages')
      .insert([{
        session_id: sessionId,
        role: message.role,
        content: message.content,
        response_source: message.response_source,
        metadata: message.metadata || {}
      }])
      .select()
      .single();

    if (error) throw error;
    return newMessage as Message;
  }

  async getMessagesBySession(sessionId: string): Promise<Message[]> {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (messages || []) as Message[];
  }

  async searchKnowledgeBase(chatbotId: string, query: string): Promise<KnowledgeEntry[]> {
    const { data: entries, error } = await supabase
      .from('knowledge_entries')
      .select('*')
      .eq('chatbot_id', chatbotId)
      .ilike('question', `%${query}%`);

    if (error) throw error;
    return (entries || []) as KnowledgeEntry[];
  }

  async addKnowledgeEntry(data: {
    chatbot_id: string;
    question: string;
    answer: string;
    keywords?: string[];
    source_document_id?: string;
    metadata?: any;
  }): Promise<KnowledgeEntry> {
    const { data: entry, error } = await supabase
      .from('knowledge_entries')
      .insert([{
        chatbot_id: data.chatbot_id,
        question: data.question,
        answer: data.answer,
        keywords: data.keywords || [],
        source_document_id: data.source_document_id,
        metadata: data.metadata || {}
      }])
      .select()
      .single();

    if (error) throw error;
    return entry as KnowledgeEntry;
  }

  async createDocument(data: {
    chatbot_id: string;
    title: string;
    content?: string;
    file_name?: string;
    file_type?: string;
    file_size?: number;
    file_url?: string;
    metadata?: any;
  }): Promise<Document> {
    const { data: document, error } = await supabase
      .from('documents')
      .insert([{
        chatbot_id: data.chatbot_id,
        title: data.title,
        content: data.content,
        file_name: data.file_name,
        file_type: data.file_type,
        file_size: data.file_size,
        file_url: data.file_url,
        status: 'processing',
        metadata: data.metadata || {}
      }])
      .select()
      .single();

    if (error) throw error;
    return document as Document;
  }

  async updateDocumentStatus(documentId: string, status: 'processing' | 'completed' | 'failed'): Promise<void> {
    const { error } = await supabase
      .from('documents')
      .update({ status })
      .eq('id', documentId);

    if (error) throw error;
  }

  async getDocumentsByChatbot(chatbotId: string): Promise<Document[]> {
    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('chatbot_id', chatbotId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (documents || []) as Document[];
  }

  async getChatSessionsByChatbot(chatbotId: string): Promise<ChatSession[]> {
    const { data: sessions, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('chatbot_id', chatbotId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (sessions || []) as ChatSession[];
  }

  async logAnalytics(data: {
    chatbot_id: string;
    session_id?: string;
    event_type: string;
    event_data?: any;
  }): Promise<void> {
    const { error } = await supabase
      .from('analytics')
      .insert([{
        chatbot_id: data.chatbot_id,
        session_id: data.session_id,
        event_type: data.event_type,
        event_data: data.event_data || {}
      }]);

    if (error) throw error;
  }
}

export const supabaseChatbotService = new SupabaseChatbotService();

// Export individual functions for easier importing
export const getChatbots = (clerkUserId: string) => supabaseChatbotService.getChatbotsByUser(clerkUserId);
export const getChatbot = (id: string) => supabaseChatbotService.getChatbotById(id);
export const createChatSession = (chatbotId: string, userData?: { name?: string; email?: string }) => 
  supabaseChatbotService.createChatSession(chatbotId, userData);
export const getSessionMessages = (sessionId: string) => supabaseChatbotService.getMessagesBySession(sessionId);

// Mock function for generateChatbotResponse - this would integrate with OpenRouter in production
export const generateChatbotResponse = async (message: string, chatbotId: string, sessionId: string) => {
  // Log the user message
  await supabaseChatbotService.addMessage(sessionId, {
    role: 'user',
    content: message
  });

  // For now, return a simple response - this would be replaced with OpenRouter integration
  const response = {
    content: "I'm a chatbot assistant. This is a placeholder response. OpenRouter integration would be implemented here.",
    source: 'generative' as const,
    isFromAI: true
  };

  // Log the assistant response
  await supabaseChatbotService.addMessage(sessionId, {
    role: 'assistant',
    content: response.content,
    response_source: 'generative'
  });

  return response;
};
