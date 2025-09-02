import { knowledgeBase } from './knowledgeBase';
import { generateAIResponse, OpenAIResponse } from './openaiService';
import { supabaseChatbotService } from './supabaseChatbotService';

// Types
export type MessageRole = 'system' | 'user' | 'assistant';
export type ResponseSource = 'knowledge-base' | 'ai' | 'fallback';

export interface Message {
  role: 'system' | 'user' | 'assistant';
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
  sessionId?: string,
  conversationHistory: Message[] = []
): Promise<ChatbotResponse> => {
  try {
    validateMessage(message);
    console.log(`Processing message: "${message}" for chatbotId: ${chatbotId}`);

    // Fetch chatbot details (for system_prompt and name)
    const chatbot = await supabaseChatbotService.getChatbotById(chatbotId);
    if (!chatbot) throw new ChatbotServiceError('Chatbot not found', ERROR_CODES.INVALID_INPUT);
    const systemPrompt = chatbot.system_prompt || `You are ${chatbot.name}, a helpful AI assistant. Use the provided knowledge base entry to answer as intelligently, creatively, and conversationally as possible.`;

    // If user greets, check phone number and suggest languages
   const greetings = ['hi', 'hello', 'hey', 'heyy', 'hii', 'hai', 'hola', 'bonjour', 'namaste'];
    if (sessionId && greetings.some(greet => message.trim().toLowerCase().startsWith(greet))) {
      // Fetch session info
      let session;
      try {
        session = await supabaseChatbotService.getChatSessionsByChatbot(chatbotId)
          .then (sessions => Array.isArray(sessions) ? sessions.find(s => s.id === sessionId) : null);
      } catch {}
      let phone = session?.phone_number || '';
      let countryCode = '';
      if (phone.startsWith('+')) {
        countryCode = phone.split(' ')[0].replace('+', '');
      }
      // Simple country code to language mapping
      const countryLangs: Record<string, string[]> = {
        '1': ['English', 'Spanish', 'French'], // US/Canada
        '91': ['Hindi', 'English', 'Bengali', 'Tamil', 'Telugu'], // India
        '44': ['English', 'Welsh', 'Scottish Gaelic'], // UK
        '49': ['German', 'English'], // Germany
        '33': ['French', 'English'], // France
        '81': ['Japanese', 'English'], // Japan
        '86': ['Mandarin', 'Cantonese', 'English'], // China
        // Add more as needed
      };
      let langs = ['English'];
      if (countryCode && countryLangs[countryCode]) {
        langs = countryLangs[countryCode];
      }
      return {
        content: `Hey!${countryCode ? ` Based on your country code (+${countryCode}),` : ''} which language are you comfortable with? ${langs.join(', ')}`,
        source: 'ai',
        isFromAI: true
      };
    }

    // Get all KB entries for this chatbot
    const allKnowledgeEntries = await supabaseChatbotService.getKnowledgeEntries(chatbotId);
    // Find the top relevant KB entry
    function getTopRelevantEntries(query: string, entries: any[], topN: number = 1) {
      const extractKeywords = (text: string): string[] => {
        const words = text.toLowerCase().split(/\s+/);
        const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about']);
        return [...new Set(words.filter((word: string) => word.length > 3 && !stopWords.has(word)))];
      };
      const calculateSimilarity = (str1: string, str2: string): number => {
        const words1 = str1.toLowerCase().split(/\s+/);
        const words2 = str2.toLowerCase().split(/\s+/);
        const set1 = new Set(words1);
        const set2 = new Set(words2);
        const intersection = new Set([...set1].filter((x: string) => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        return intersection.size / union.size;
      };
      const queryKeywords = extractKeywords(query);
      return entries
        .map((entry: any) => {
          if (!entry.keywords) return { entry, score: 0 };
          const commonKeywords = entry.keywords.filter((keyword: string) => queryKeywords.some((qk: string) => qk.includes(keyword) || keyword.includes(qk)));
          const keywordScore = commonKeywords.length / Math.max(entry.keywords.length, queryKeywords.length);
          const questionSimilarity = calculateSimilarity(query, entry.question);
          const answerSimilarity = calculateSimilarity(query, entry.answer);
          const textScore = Math.max(questionSimilarity, answerSimilarity);
          const finalScore = (keywordScore * 0.4) + (textScore * 0.6);
          return { entry, score: finalScore };
        })
        .filter(({ score }: { entry: any; score: number }) => score > 0.15)
        .sort((a, b) => b.score - a.score)
        .slice(0, topN)
        .map(({ entry }) => entry);
    }
    const topRelevantEntries = getTopRelevantEntries(message, allKnowledgeEntries, 1);
    const kbEntry = topRelevantEntries[0];

    // Build OpenAI messages array
    const allowedRoles = ['system', 'user', 'assistant'] as const;
    function isAllowedRole(role: string): role is 'system' | 'user' | 'assistant' {
      return allowedRoles.includes(role as any);
    }
    const safeHistory = conversationHistory.slice(-5)
      .filter(msg => isAllowedRole(msg.role))
      .map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content
      }));
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt },
      ...(kbEntry
        ? [{
            role: 'system' as const,
            content: `Here is the most relevant knowledge base entry for this conversation:\nQ: ${kbEntry.question}\nA: ${kbEntry.answer}`
          }]
        : []),
      ...safeHistory,
      { role: 'user', content: message }
    ];

    // Call OpenAI with the full messages array
    const aiResponse = await generateAIResponse(messages);
    return {
      content: aiResponse.content,
      source: 'ai',
      isFromAI: aiResponse.isFromAI,
      confidence: aiResponse.confidence
    };
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
