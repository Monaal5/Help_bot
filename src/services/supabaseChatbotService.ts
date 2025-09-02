import { supabase } from "@/integrations/supabase/client";
import { Chatbot, ChatSession, Message, KnowledgeEntry, Document, ViewerPermission } from "@/types/database";
import { DocumentProcessor, ProcessedDocument } from './documentProcessor';
import { knowledgeBase } from './knowledgeBase';
import { generateAIResponse } from './openaiService';

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

  async createChatSession(chatbotId: string, userData?: { name?: string; email?: string; phone_number?: string }): Promise<ChatSession> {
    try {
      validateId(chatbotId);

      const { data: session, error } = await supabase
        .from('chat_sessions')
        .insert([{
          chatbot_id: chatbotId,
          user_name: userData?.name,
          user_email: userData?.email,
          phone_number: userData?.phone_number,
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

  // Viewer permission methods
  async createViewerPermission(chatbotId: string, viewerEmail: string, grantedBy: string): Promise<ViewerPermission> {
    try {
      // First verify that the user owns the chatbot
      const { data: chatbot, error: chatbotError } = await supabase
        .from('chatbots')
        .select('clerk_user_id')
        .eq('id', chatbotId)
        .single();

      if (chatbotError) throw chatbotError;

      if (chatbot.clerk_user_id !== grantedBy) {
        throw new Error('You can only manage viewers for your own chatbots');
      }

      const normalizedEmail = (viewerEmail || '').trim().toLowerCase();
      if (!normalizedEmail) {
        throw new Error('Viewer email is required');
      }

      // Generate (or refresh) an invitation token and expiry (7 days)
      const newToken = `vt_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
      const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      // Upsert to gracefully handle duplicates (reactivate if previously revoked)
      const { data, error } = await supabase
        .from('viewer_permissions')
        .upsert([
          {
            chatbot_id: chatbotId,
            viewer_email: normalizedEmail,
            granted_by: grantedBy,
            is_active: true,
            invitation_token: newToken,
            token_expires_at: newExpiry,
            updated_at: new Date().toISOString(),
          },
        ], { onConflict: 'chatbot_id,viewer_email' })
        .select()
        .single();

      if (error) throw error;
      return data as ViewerPermission;
    } catch (error: any) {
      // Improve error messaging for uniqueness/conflicts
      const msg = error?.message || '';
      if (msg.includes('duplicate key') || msg.includes('conflict') || error?.code === '23505') {
        throw new Error('This viewer already has access to this chatbot');
      }
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create viewer permission');
    }
  }

  async getViewerPermissions(chatbotId: string, userId?: string): Promise<ViewerPermission[]> {
    try {
      // If userId is provided, verify ownership
      if (userId) {
        const { data: chatbot, error: chatbotError } = await supabase
          .from('chatbots')
          .select('clerk_user_id')
          .eq('id', chatbotId)
          .single();

        if (chatbotError) throw chatbotError;

        if (chatbot.clerk_user_id !== userId) {
          throw new Error('You can only view permissions for your own chatbots');
        }
      }

      const { data, error } = await supabase
        .from('viewer_permissions')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .eq('is_active', true);

      if (error) throw error;
      return (data || []) as ViewerPermission[];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to get viewer permissions');
    }
  }

  async revokeViewerPermission(permissionId: string): Promise<void> {
    const { error } = await supabase
      .from('viewer_permissions')
      .update({ is_active: false })
      .eq('id', permissionId);

    if (error) throw error;
  }

  async getViewerAccessibleChatbots(viewerEmail: string): Promise<Chatbot[]> {
    const { data, error } = await supabase
      .from('viewer_permissions')
      .select(`
        chatbot_id,
        chatbots (
          id,
          name,
          description,
          system_prompt,
          clerk_user_id,
          created_at,
          updated_at,
          is_active,
          settings
        )
      `)
      .eq('viewer_email', viewerEmail)
      .eq('is_active', true);

    if (error) throw error;
    return (data?.map((item: any) => item.chatbots).filter(Boolean) || []) as Chatbot[];
  }

  async getAllSessionsForViewer(viewerEmail: string): Promise<ChatSession[]> {
    // First get the chatbot IDs that the viewer has access to
    const { data: permissions, error: permError } = await supabase
      .from('viewer_permissions')
      .select('chatbot_id')
      .eq('viewer_email', viewerEmail)
      .eq('is_active', true);

    if (permError) throw permError;

    if (!permissions || permissions.length === 0) {
      return [];
    }

    const chatbotIds = permissions.map(p => p.chatbot_id);

    // Then get sessions for those chatbots
    const { data, error } = await supabase
      .from('chat_sessions')
      .select(`
        *,
        chatbots (name)
      `)
      .in('chatbot_id', chatbotIds)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ChatSession[];
  }

  // Invitation token methods
  async getViewerPermissionByToken(token: string): Promise<ViewerPermission | null> {
    try {
      const { data, error } = await supabase
        .from('viewer_permissions')
        .select(`
          *,
          chatbots (name)
        `)
        .eq('invitation_token', token)
        .eq('is_active', true)
        .gte('token_expires_at', new Date().toISOString())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw error;
      }

      return data as ViewerPermission;
    } catch (error) {
      console.error('Error getting viewer permission by token:', error);
      return null;
    }
  }

  async regenerateInvitationToken(permissionId: string, userId: string): Promise<ViewerPermission> {
    try {
      // First verify ownership
      const { data: permission, error: permError } = await supabase
        .from('viewer_permissions')
        .select(`
          *,
          chatbots (clerk_user_id)
        `)
        .eq('id', permissionId)
        .single();

      if (permError) throw permError;

      if ((permission as any).chatbots.clerk_user_id !== userId) {
        throw new Error('You can only regenerate tokens for your own chatbots');
      }

      // Generate new token and extend expiry
      const { data, error } = await supabase
        .from('viewer_permissions')
        .update({
          invitation_token: `vt_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
          token_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          updated_at: new Date().toISOString()
        })
        .eq('id', permissionId)
        .select()
        .single();

      if (error) throw error;
      return data as ViewerPermission;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to regenerate invitation token');
    }
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

    // Log the user message first
    await supabaseChatbotService.addMessage(sessionId, {
      role: 'user',
      content: message
    });

    // Use only the system_prompt for the response
    if (!chatbot.system_prompt || chatbot.system_prompt.trim().length === 0) {
      const fallback = "I'm sorry, I don't have enough information to answer that right now.";
      await supabaseChatbotService.addMessage(sessionId, {
        role: 'assistant',
        content: fallback,
        response_source: 'generative'
      });
      return {
        content: fallback,
        source: 'system-prompt',
        isFromAI: true
      };
    }

    // Build the system prompt for the AI
    const systemPrompt = chatbot.system_prompt;
    const aiMessages: { role: 'user' | 'assistant' | 'system'; content: string }[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ];
    const aiResponse = await generateAIResponse(aiMessages);

    await supabaseChatbotService.addMessage(sessionId, {
      role: 'assistant',
      content: aiResponse.content,
      response_source: 'generative'
    });

    return {
      content: aiResponse.content,
      source: 'system-prompt',
      isFromAI: true
    };
  } catch (error) {
    console.error('Error generating response:', error);
    return {
      content: "I'm here to help! What would you like to know more about?",
      source: 'system-prompt',
      isFromAI: true
    };
  }
};
