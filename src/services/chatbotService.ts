
import { knowledgeBase } from './knowledgeBase';
import { generateAIResponse, OpenAIResponse } from './openaiService';

export interface ChatbotResponse {
  content: string;
  source: 'knowledge-base' | 'ai' | 'fallback';
  isFromAI: boolean;
}

export const generateChatbotResponse = async (
  message: string,
  chatbotName: string,
  conversationHistory: Array<{role: 'user' | 'assistant', content: string}> = []
): Promise<ChatbotResponse> => {
  console.log(`Processing message: "${message}" for chatbot: ${chatbotName}`);
  
  // First, try to find a response in the knowledge base
  const knowledgeResponse = knowledgeBase.searchRelevantResponse(message);
  
  if (knowledgeResponse) {
    console.log('Found response in knowledge base');
    return {
      content: knowledgeResponse,
      source: 'knowledge-base',
      isFromAI: false
    };
  }

  // If no knowledge base match, use OpenAI
  console.log('No knowledge base match, using OpenAI');
  const aiResponse = await generateAIResponse(message, chatbotName, conversationHistory);
  
  return {
    content: aiResponse.content,
    source: 'ai',
    isFromAI: aiResponse.isFromAI
  };
};

export const initializeChatbotKnowledge = (textData: string, files: FileList | null) => {
  console.log('Initializing chatbot knowledge...');
  
  // Add text data to knowledge base
  if (textData.trim()) {
    knowledgeBase.addTextData(textData);
    console.log('Added text data to knowledge base');
  }

  // Process uploaded files (simplified - in real app you'd parse PDF content)
  if (files && files.length > 0) {
    Array.from(files).forEach(file => {
      // For demo purposes, we'll just add the filename as knowledge
      // In a real app, you'd extract text content from PDFs
      knowledgeBase.addTextData(
        `This document is about ${file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ")}`,
        file.name
      );
      console.log(`Processed file: ${file.name}`);
    });
  }

  console.log(`Knowledge base initialized with ${knowledgeBase.getEntriesCount()} entries`);
};
