import { supabase } from "@/integrations/supabase/client";
import { Chatbot, ChatSession, Message, KnowledgeEntry, Document } from "@/types/database";
import { generateDeepSeekResponse } from "./deepseekService";
import { DocumentProcessor, ProcessedDocument } from './documentProcessor';
import { knowledgeBase } from './knowledgeBase';

// Custom error class for Supabase service errors
export class SupabaseServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'SupabaseServiceError';
  }
}

// Error codes
const ERROR_CODES = {
  INVALID_INPUT: 'INVALID_INPUT',
  DATABASE_ERROR: 'DATABASE_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

// Input validation helpers
const validateId = (id: string): void => {
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    throw new SupabaseServiceError(
      'Invalid ID provided',
      ERROR_CODES.INVALID_INPUT
    );
  }
};

const validateChatbotData = (data: Partial<Chatbot>): void => {
  if (data.name && (typeof data.name !== 'string' || data.name.trim().length === 0)) {
    throw new SupabaseServiceError(
      'Chatbot name must be a non-empty string',
      ERROR_CODES.VALIDATION_ERROR
    );
  }
};

export class SupabaseChatbotService {
  async createChatbot(data: {
    name: string;
    description?: string;
    system_prompt?: string;
    clerk_user_id: string;
    settings?: Record<string, unknown>;
  }): Promise<Chatbot> {
    try {
      validateChatbotData(data);
      
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

      if (error) {
        throw new SupabaseServiceError(
          'Failed to create chatbot',
          ERROR_CODES.DATABASE_ERROR,
          error
        );
      }

      return chatbot as Chatbot;
    } catch (error) {
      if (error instanceof SupabaseServiceError) {
        throw error;
      }
      throw new SupabaseServiceError(
        'Unexpected error creating chatbot',
        ERROR_CODES.DATABASE_ERROR,
        error
      );
    }
  }

  async getChatbotsByUser(clerkUserId: string): Promise<Chatbot[]> {
    try {
      validateId(clerkUserId);

      const { data: chatbots, error } = await supabase
        .from('chatbots')
        .select('*')
        .eq('clerk_user_id', clerkUserId)
        .eq('is_active', true);

      if (error) {
        throw new SupabaseServiceError(
          'Failed to fetch chatbots',
          ERROR_CODES.DATABASE_ERROR,
          error
        );
      }

      return (chatbots || []) as Chatbot[];
    } catch (error) {
      if (error instanceof SupabaseServiceError) {
        throw error;
      }
      throw new SupabaseServiceError(
        'Unexpected error fetching chatbots',
        ERROR_CODES.DATABASE_ERROR,
        error
      );
    }
  }

  async getChatbotById(id: string): Promise<Chatbot | null> {
    try {
      validateId(id);

      const { data: chatbot, error } = await supabase
        .from('chatbots')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new SupabaseServiceError(
          'Failed to fetch chatbot',
          ERROR_CODES.DATABASE_ERROR,
          error
        );
      }

      return chatbot as Chatbot;
    } catch (error) {
      if (error instanceof SupabaseServiceError) {
        throw error;
      }
      throw new SupabaseServiceError(
        'Unexpected error fetching chatbot',
        ERROR_CODES.DATABASE_ERROR,
        error
      );
    }
  }

  async updateChatbot(id: string, updates: Partial<Chatbot>): Promise<Chatbot> {
    try {
      validateId(id);
      validateChatbotData(updates);

      const { data: chatbot, error } = await supabase
        .from('chatbots')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new SupabaseServiceError(
          'Failed to update chatbot',
          ERROR_CODES.DATABASE_ERROR,
          error
        );
      }

      return chatbot as Chatbot;
    } catch (error) {
      if (error instanceof SupabaseServiceError) {
        throw error;
      }
      throw new SupabaseServiceError(
        'Unexpected error updating chatbot',
        ERROR_CODES.DATABASE_ERROR,
        error
      );
    }
  }

  async createChatSession(chatbotId: string, userData?: { name?: string; email?: string }): Promise<ChatSession> {
    try {
      validateId(chatbotId);

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

      if (error) {
        throw new SupabaseServiceError(
          'Failed to create chat session',
          ERROR_CODES.DATABASE_ERROR,
          error
        );
      }

      return session as ChatSession;
    } catch (error) {
      if (error instanceof SupabaseServiceError) {
        throw error;
      }
      throw new SupabaseServiceError(
        'Unexpected error creating chat session',
        ERROR_CODES.DATABASE_ERROR,
        error
      );
    }
  }

  async addMessage(sessionId: string, message: {
    role: 'user' | 'assistant' | 'system';
    content: string;
    response_source?: 'knowledge_base' | 'generative' | 'hybrid';
    metadata?: Record<string, unknown>;
  }): Promise<Message> {
    try {
      validateId(sessionId);

      if (!message.content || typeof message.content !== 'string' || message.content.trim().length === 0) {
        throw new SupabaseServiceError(
          'Message content must be a non-empty string',
          ERROR_CODES.VALIDATION_ERROR
        );
      }

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

      if (error) {
        throw new SupabaseServiceError(
          'Failed to add message',
          ERROR_CODES.DATABASE_ERROR,
          error
        );
      }

      return newMessage as Message;
    } catch (error) {
      if (error instanceof SupabaseServiceError) {
        throw error;
      }
      throw new SupabaseServiceError(
        'Unexpected error adding message',
        ERROR_CODES.DATABASE_ERROR,
        error
      );
    }
  }

  async getMessagesBySession(sessionId: string): Promise<Message[]> {
    try {
      validateId(sessionId);

      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        throw new SupabaseServiceError(
          'Failed to fetch messages',
          ERROR_CODES.DATABASE_ERROR,
          error
        );
      }

      return (messages || []) as Message[];
    } catch (error) {
      if (error instanceof SupabaseServiceError) {
        throw error;
      }
      throw new SupabaseServiceError(
        'Unexpected error fetching messages',
        ERROR_CODES.DATABASE_ERROR,
        error
      );
    }
  }

  async searchKnowledgeBase(chatbotId: string, query: string): Promise<KnowledgeEntry[]> {
    const { data: entries, error } = await supabase
      .from('knowledge_entries')
      .select('*')
      .eq('chatbot_id', chatbotId)
      .or(`question.ilike.%${query}%,answer.ilike.%${query}%,keywords.cs.{${query}}`);

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
        status: 'completed',
        metadata: data.metadata || {}
      }])
      .select()
      .single();

    if (error) throw error;

    // If content exists, create chunks
    if (data.content) {
      const chunks = DocumentProcessor.chunkContent(data.content);
      for (let i = 0; i < chunks.length; i++) {
        await this.createDocumentChunk(document.id, chunks[i], i);
      }
    }

    return document as Document;
  }

  private async createDocumentChunk(documentId: string, content: string, chunkIndex: number): Promise<void> {
    const { error } = await supabase
      .from('document_chunks')
      .insert([{
        document_id: documentId,
        content,
        chunk_index: chunkIndex,
        metadata: {
          created_at: new Date().toISOString()
        }
      }]);

    if (error) throw error;
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

  async deleteDocument(documentId: string): Promise<void> {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (error) throw error;
  }

  async getKnowledgeEntries(chatbotId: string): Promise<KnowledgeEntry[]> {
    const { data: entries, error } = await supabase
      .from('knowledge_entries')
      .select('*')
      .eq('chatbot_id', chatbotId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (entries || []) as KnowledgeEntry[];
  }

  async deleteChatbot(id: string): Promise<void> {
    const { error } = await supabase
      .from('chatbots')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async toggleChatbotStatus(id: string): Promise<Chatbot> {
    const chatbot = await this.getChatbotById(id);
    if (!chatbot) throw new Error('Chatbot not found');

    return this.updateChatbot(id, { is_active: !chatbot.is_active });
  }

  async getCategories(): Promise<{ category: string; subcategories: string[] }[]> {
    const { data, error } = await supabase
      .from('knowledge_entries')
      .select('category, subcategory')
      .not('category', 'is', null);

    if (error) throw error;

    const categories = new Map<string, Set<string>>();
    data.forEach(entry => {
      if (entry.category) {
        if (!categories.has(entry.category)) {
          categories.set(entry.category, new Set());
        }
        if (entry.subcategory) {
          categories.get(entry.category)?.add(entry.subcategory);
        }
      }
    });

    return Array.from(categories.entries()).map(([category, subcategories]) => ({
      category,
      subcategories: Array.from(subcategories)
    }));
  }

  async bulkImport(entries: Array<Omit<KnowledgeEntry, 'id' | 'created_at' | 'updated_at'>>, chatbotId: string): Promise<Array<{ id: string; question: string; answer: string; category: string | null; subcategory: string | null; is_duplicate: boolean }>> {
    const { data, error } = await supabase
      .rpc('bulk_import_knowledge_entries', {
        entries: entries,
        chatbot_uuid: chatbotId
      });

    if (error) throw error;
    return data || [];
  }

  async exportEntries(chatbotId: string, category?: string, includeDuplicates: boolean = false): Promise<KnowledgeEntry[]> {
    const { data, error } = await supabase
      .rpc('export_knowledge_entries', {
        chatbot_uuid: chatbotId,
        category_filter: category,
        include_duplicates: includeDuplicates
      });

    if (error) throw error;
    return data || [];
  }

  async getChatSessionsByUserEmail(userEmail: string): Promise<ChatSession[]> {
    if (!userEmail) return [];
    const { data: sessions, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (sessions || []) as ChatSession[];
  }

  async getAllChatbots(): Promise<Chatbot[]> {
    const { data: chatbots, error } = await supabase
      .from('chatbots')
      .select('*');
    if (error) throw error;
    return (chatbots || []) as Chatbot[];
  }
}

// Create a singleton instance
export const supabaseChatbotService = new SupabaseChatbotService();

// Export helper functions
export const getChatbots = (clerkUserId: string) => supabaseChatbotService.getChatbotsByUser(clerkUserId);
export const getChatbot = (id: string) => supabaseChatbotService.getChatbotById(id);
export const createChatSession = (chatbotId: string, userData?: { name?: string; email?: string }) => 
  supabaseChatbotService.createChatSession(chatbotId, userData);
export const getSessionMessages = (sessionId: string) => supabaseChatbotService.getMessagesBySession(sessionId);
export const getChatSessionsByUserEmail = (userEmail: string) =>
  supabaseChatbotService.getChatSessionsByUserEmail(userEmail);
export const getAllChatbots = () => supabaseChatbotService.getAllChatbots();

// Updated generateChatbotResponse function with enhanced intelligence
export const generateChatbotResponse = async (message: string, chatbotId: string, sessionId: string) => {
  console.log(`Generating response for message: "${message}" in chatbot: ${chatbotId}`);
  
  try {
    // Get chatbot details
    const chatbot = await supabaseChatbotService.getChatbotById(chatbotId);
    if (!chatbot) {
      throw new Error('Chatbot not found');
    }

    // Initialize knowledge base for this chatbot
    await knowledgeBase.initialize(chatbotId);
    console.log('Knowledge base initialized');

    // Log the user message first
    await supabaseChatbotService.addMessage(sessionId, {
      role: 'user',
      content: message
    });

    // First, try to find a response in the knowledge base
    const knowledgeResponse = knowledgeBase.searchRelevantResponse(message);
    console.log('Knowledge base search result:', knowledgeResponse ? 'Found match' : 'No match found');
    
    if (knowledgeResponse) {
      console.log('Using knowledge base response');
      // Get previous messages for context
      const previousMessages = await supabaseChatbotService.getMessagesBySession(sessionId);
      
      // Build a more natural response using the knowledge base data
      const systemPrompt = `You are ${chatbot.name}, an AI assistant. Use the following information to create a natural, conversational response. Make it sound like a real conversation, not just reciting information. If the user is greeting you, respond warmly. If they're asking a question, answer naturally while incorporating the provided information.`;

      const messages = [
        {
          role: 'system' as const,
          content: systemPrompt
        },
        ...previousMessages.slice(-5).map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        {
          role: 'system' as const,
          content: `Here is the relevant information to use in your response: ${knowledgeResponse}`
        },
        {
          role: 'user' as const,
          content: message
        }
      ];

      // Generate a natural response using the knowledge base data
      const response = await generateDeepSeekResponse(messages);

      await supabaseChatbotService.addMessage(sessionId, {
        role: 'assistant',
        content: response,
        response_source: 'knowledge_base'
      });

      return {
        content: response,
        source: 'knowledge-base',
        isFromAI: true
      };
    }

    // If no knowledge base match, search documents and use AI
    console.log('No knowledge base match, searching documents and using AI');
    const documents = await supabaseChatbotService.getDocumentsByChatbot(chatbotId);
    const previousMessages = await supabaseChatbotService.getMessagesBySession(sessionId);

    // Build enhanced system prompt with all available knowledge
    let systemPrompt = chatbot.system_prompt || `You are ${chatbot.name}, an AI assistant.`;
    
    // Add document context
    if (documents.length > 0) {
      systemPrompt += '\n\nHere is additional information from our documents:\n';
      documents.forEach(doc => {
        systemPrompt += `\n${doc.content}\n`;
      });
    }

    // Add instructions for using the knowledge
    systemPrompt += `
Use this information to provide intelligent, contextual responses.
Make your responses natural and conversational while ensuring accuracy.
If the information is not directly related to the question, use it to provide relevant context or examples.
If the user is greeting you, respond warmly and introduce yourself.
If they're asking a question, answer naturally while incorporating any relevant information.`;

    // Build messages array for DeepSeek
    const messages = [
      {
        role: 'system' as const,
        content: systemPrompt || 'You are a helpful AI assistant.'
      },
      ...previousMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content
      })),
      {
        role: 'user' as const,
        content: message
      }
    ];

    // Generate response using DeepSeek with enhanced context
    const response = await generateDeepSeekResponse(messages);

    // Log the assistant response
    await supabaseChatbotService.addMessage(sessionId, {
      role: 'assistant',
      content: response,
      response_source: 'generative'
    });

    return {
      content: response,
      source: 'generative',
      isFromAI: true
    };
  } catch (error) {
    console.error('Error generating response:', error);
    return {
      content: "I'm here to help! What would you like to know more about?",
      source: 'generative',
      isFromAI: true
    };
  }
};
