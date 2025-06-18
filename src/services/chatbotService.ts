import { knowledgeBase } from './knowledgeBase';
import { generateAIResponse, OpenAIResponse } from './openaiService';
import { supabaseChatbotService } from './supabaseChatbotService';

// Types
export type MessageRole = 'user' | 'assistant' | 'system';
export type ResponseSource = 'knowledge-base' | 'ai' | 'fallback';

export interface Message {
  role: MessageRole;
  content: string;
  timestamp?: Date;
}

export interface ChatbotResponse {
  content: string;
  source: ResponseSource;
  isFromAI: boolean;
  confidence?: number;
  metadata?: Record<string, unknown>;
}

export interface ChatbotError extends Error {
  code: string;
  details?: unknown;
}

// Error codes
const ERROR_CODES = {
  INVALID_INPUT: 'INVALID_INPUT',
  KNOWLEDGE_BASE_ERROR: 'KNOWLEDGE_BASE_ERROR',
  AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
  FILE_PROCESSING_ERROR: 'FILE_PROCESSING_ERROR',
} as const;

// Custom error class
class ChatbotServiceError extends Error implements ChatbotError {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ChatbotServiceError';
  }
}

// Input validation
const validateMessage = (message: string): void => {
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new ChatbotServiceError(
      'Message must be a non-empty string',
      ERROR_CODES.INVALID_INPUT
    );
  }
};

const validateChatbotName = (name: string): void => {
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new ChatbotServiceError(
      'Chatbot name must be a non-empty string',
      ERROR_CODES.INVALID_INPUT
    );
  }
};

// Main service functions
export const generateChatbotResponse = async (
  message: string,
  chatbotId: string,
  conversationHistory: Message[] = []
): Promise<ChatbotResponse> => {
  try {
    // Input validation
    validateMessage(message);
    // We'll fetch chatbotName from the chatbot object below, so no need to validate it here

    console.log(`Processing message: "${message}" for chatbotId: ${chatbotId}`);
    
    // First, try to find a response in the knowledge base
    try {
      const knowledgeResponse = knowledgeBase.searchRelevantResponse(message);
      
      if (knowledgeResponse) {
        console.log('Found response in knowledge base');
        return {
          content: knowledgeResponse,
          source: 'knowledge-base',
          isFromAI: false,
          confidence: 0.8 // Example confidence score
        };
      }
    } catch (error) {
      console.error('Error searching knowledge base:', error);
      throw new ChatbotServiceError(
        'Failed to search knowledge base',
        ERROR_CODES.KNOWLEDGE_BASE_ERROR,
        error
      );
    }

    // If no knowledge base match, use OpenAI
    console.log('No knowledge base match, using OpenAI');
    try {
      const chatbot = await supabaseChatbotService.getChatbotById(chatbotId);
      if (!chatbot) throw new Error('Chatbot not found');
      const systemPrompt = chatbot.system_prompt || `You are ${chatbot.name}, a helpful AI assistant. ...`;

      const aiResponse = await generateAIResponse(
        message,
        systemPrompt,
        conversationHistory
          .filter(msg => msg.role === 'user' || msg.role === 'assistant')
          .map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          }))
      );
      
      return {
        content: aiResponse.content,
        source: 'ai',
        isFromAI: aiResponse.isFromAI,
        confidence: aiResponse.confidence
      };
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw new ChatbotServiceError(
        'Failed to generate AI response',
        ERROR_CODES.AI_SERVICE_ERROR,
        error
      );
    }
  } catch (error) {
    if (error instanceof ChatbotServiceError) {
      throw error;
    }
    throw new ChatbotServiceError(
      'Unexpected error in chatbot service',
      'UNKNOWN_ERROR',
      error
    );
  }
};

export const initializeChatbotKnowledge = async (
  textData: string,
  files: FileList | null
): Promise<void> => {
  try {
    console.log('Initializing chatbot knowledge...');
    
    // Add text data to knowledge base
    if (textData.trim()) {
      try {
        await knowledgeBase.addTextData(textData);
        console.log('Added text data to knowledge base');
      } catch (error) {
        throw new ChatbotServiceError(
          'Failed to add text data to knowledge base',
          ERROR_CODES.KNOWLEDGE_BASE_ERROR,
          error
        );
      }
    }

    // Process uploaded files
    if (files && files.length > 0) {
      try {
        await Promise.all(
          Array.from(files).map(async (file) => {
            // For demo purposes, we'll just add the filename as knowledge
            // In a real app, you'd extract text content from PDFs
            await knowledgeBase.addTextData(
              `This document is about ${file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ")}`,
              file.name
            );
            console.log(`Processed file: ${file.name}`);
          })
        );
      } catch (error) {
        throw new ChatbotServiceError(
          'Failed to process uploaded files',
          ERROR_CODES.FILE_PROCESSING_ERROR,
          error
        );
      }
    }

    console.log(`Knowledge base initialized with ${knowledgeBase.getEntriesCount()} entries`);
  } catch (error) {
    if (error instanceof ChatbotServiceError) {
      throw error;
    }
    throw new ChatbotServiceError(
      'Unexpected error initializing chatbot knowledge',
      'UNKNOWN_ERROR',
      error
    );
  }
};
