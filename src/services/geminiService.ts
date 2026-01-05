import { GoogleGenAI } from "@google/genai";

// Load Gemini API key from environment variable
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.warn('Missing Gemini API key! Please set VITE_GEMINI_API_KEY or GEMINI_API_KEY in your .env file.');
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export interface AIResponse {
    content: string;
    isFromAI: boolean;
    confidence?: number;
}

// Accepts a full messages array compatible with the previous OpenAI interface
export const generateAIResponse = async (
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
): Promise<AIResponse> => {
    // Validate messages array
    if (
        !Array.isArray(messages) ||
        messages.length === 0 ||
        !messages.every(
            (msg) =>
                msg &&
                typeof msg.role === 'string' &&
                ['system', 'user', 'assistant'].includes(msg.role) &&
                typeof msg.content === 'string'
        )
    ) {
        return {
            content: "Invalid messages array sent to AI service.",
            isFromAI: false,
        };
    }

    try {
        // Convert OpenAI-style messages to Gemini-style contents
        // Gemini 2.5 Flash typically expects a system instruction separate from the chat history
        // or integrated into the prompt.

        const systemMessage = messages.find(m => m.role === 'system');
        const chatMessages = messages.filter(m => m.role !== 'system');

        // Construct the prompt history
        // Note: The @google/genai SDK might have specific chat methods, but generateContent is versatile.
        // We'll format the history into a single prompt or use the chat structure if available/preferred.
        // For simplicity and robustness with the provided example, we'll use generateContent with a constructed prompt
        // or map roles to what Gemini expects (user/model).

        // However, the user provided example uses `ai.models.generateContent`.
        // Let's try to map the conversation history.

        let prompt = "";
        if (systemMessage) {
            prompt += `System Instruction: ${systemMessage.content}\n\n`;
        }

        chatMessages.forEach(msg => {
            const role = msg.role === 'user' ? 'User' : 'Model';
            prompt += `${role}: ${msg.content}\n`;
        });

        // Add a final "Model:" to prompt for completion if the last message was from user
        if (chatMessages.length > 0 && chatMessages[chatMessages.length - 1].role === 'user') {
            prompt += "Model: ";
        }

        console.log('Sending to Gemini:', prompt);

        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: prompt,
            config: {
                temperature: 0.9,
                topP: 0.9,
                maxOutputTokens: 2048,
            }
        });

        const text = response.text;

        return {
            content: text || "I'm sorry, I couldn't generate a response at the moment.",
            isFromAI: true,
            confidence: undefined,
        };
    } catch (error) {
        console.error('Gemini API Error:', error);
        return {
            content: "I'm having trouble connecting to my AI service right now. Please try again later.",
            isFromAI: false,
        };
    }
};
