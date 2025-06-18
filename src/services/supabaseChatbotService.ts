
import { supabase } from "@/integrations/supabase/client";
import { generateAIResponse } from './openaiService';
import type { Chatbot, ChatSession, Message, KnowledgeEntry, ChatbotResponse } from '../types/database';

export const createChatbot = async (
  name: string,
  description: string,
  systemPrompt: string,
  clerkUserId: string
): Promise<Chatbot> => {
  const { data, error } = await supabase
    .from('chatbots')
    .insert({
      name,
      description,
      system_prompt: systemPrompt,
      clerk_user_id: clerkUserId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getChatbots = async (clerkUserId: string): Promise<Chatbot[]> => {
  const { data, error } = await supabase
    .from('chatbots')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getChatbot = async (id: string): Promise<Chatbot | null> => {
  const { data, error } = await supabase
    .from('chatbots')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
};

export const createChatSession = async (
  chatbotId: string,
  userName?: string,
  userEmail?: string
): Promise<ChatSession> => {
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({
      chatbot_id: chatbotId,
      user_name: userName,
      user_email: userEmail,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const addMessage = async (
  sessionId: string,
  role: 'user' | 'assistant',
  content: string,
  responseSource?: 'knowledge_base' | 'generative' | 'hybrid'
): Promise<Message> => {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      session_id: sessionId,
      role,
      content,
      response_source: responseSource,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getSessionMessages = async (sessionId: string): Promise<Message[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const searchKnowledgeBase = async (
  chatbotId: string,
  query: string
): Promise<KnowledgeEntry[]> => {
  // Simple text search for now - you can enhance this with vector search later
  const { data, error } = await supabase
    .from('knowledge_entries')
    .select('*')
    .eq('chatbot_id', chatbotId)
    .or(`question.ilike.%${query}%,answer.ilike.%${query}%`)
    .limit(3);

  if (error) throw error;
  return data || [];
};

export const generateChatbotResponse = async (
  message: string,
  chatbotId: string,
  sessionId: string
): Promise<ChatbotResponse> => {
  console.log(`Processing message: "${message}" for chatbot: ${chatbotId}`);
  
  // Get chatbot details
  const chatbot = await getChatbot(chatbotId);
  if (!chatbot) {
    throw new Error('Chatbot not found');
  }

  // First, try to find a response in the knowledge base
  const knowledgeEntries = await searchKnowledgeBase(chatbotId, message);
  
  if (knowledgeEntries.length > 0) {
    console.log('Found response in knowledge base');
    const bestMatch = knowledgeEntries[0];
    
    // Save the message and response
    await addMessage(sessionId, 'user', message);
    await addMessage(sessionId, 'assistant', bestMatch.answer, 'knowledge_base');
    
    return {
      content: bestMatch.answer,
      source: 'knowledge-base',
      isFromAI: false
    };
  }

  // If no knowledge base match, use OpenRouter AI
  console.log('No knowledge base match, using AI');
  
  // Get conversation history for context
  const messages = await getSessionMessages(sessionId);
  const conversationHistory = messages.slice(-6).map(msg => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content
  }));

  // Save user message first
  await addMessage(sessionId, 'user', message);

  const aiResponse = await generateAIResponse(
    message, 
    chatbot.name, 
    conversationHistory
  );
  
  // Save AI response
  await addMessage(sessionId, 'assistant', aiResponse.content, 'generative');
  
  return {
    content: aiResponse.content,
    source: 'ai',
    isFromAI: aiResponse.isFromAI
  };
};

export const addKnowledgeEntry = async (
  chatbotId: string,
  question: string,
  answer: string,
  keywords?: string[]
): Promise<KnowledgeEntry> => {
  const { data, error } = await supabase
    .from('knowledge_entries')
    .insert({
      chatbot_id: chatbotId,
      question,
      answer,
      keywords,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const uploadDocument = async (
  chatbotId: string,
  title: string,
  content: string,
  fileName?: string,
  fileType?: string
): Promise<any> => {
  const { data, error } = await supabase
    .from('documents')
    .insert({
      chatbot_id: chatbotId,
      title,
      content,
      file_name: fileName,
      file_type: fileType,
      status: 'completed'
    })
    .select()
    .single();

  if (error) throw error;
  
  // For now, we'll just add the content as a knowledge entry
  // In a real implementation, you'd chunk the content and create embeddings
  if (content.length > 0) {
    await addKnowledgeEntry(
      chatbotId,
      `Document: ${title}`,
      content.substring(0, 1000) + (content.length > 1000 ? '...' : ''),
      [title, fileName].filter(Boolean) as string[]
    );
  }

  return data;
};

export const getChatSessions = async (chatbotId: string): Promise<ChatSession[]> => {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('chatbot_id', chatbotId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};
