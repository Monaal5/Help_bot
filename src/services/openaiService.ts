// Load OpenAI API key from environment variable
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  throw new Error('Missing OpenAI API key! Please set VITE_OPENAI_API_KEY in your .env file.');
}

export interface OpenAIResponse {
  content: string;
  isFromAI: boolean;
  confidence?: number;
}

// Accepts a full OpenAI messages array
export const generateAIResponse = async (
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
): Promise<OpenAIResponse> => {
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
      content: "Invalid messages array sent to OpenAI API.",
      isFromAI: false,
    };
  }

  try {
    const requestBody = {
      model: 'gpt-3.5-turbo',
      messages,
      max_tokens: 200,
      temperature: 0.9,
      top_p: 0.9,
    };

    // Log the request for debugging
    console.log('Sending to OpenAI:', requestBody);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      // Log the error details from OpenAI
      console.error('OpenAI API error details:', data);
      throw new Error(
        `OpenAI API error: ${response.status} - ${data.error?.message || 'Unknown error'}`
      );
    }

    return {
      content: data.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response at the moment.",
      isFromAI: true,
      confidence: undefined, // OpenAI does not return confidence
    };
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return {
      content: "I'm having trouble connecting to my AI service right now. Please try again later.",
      isFromAI: false,
    };
  }
};

// Fallback response function
const getFallbackResponse = (message: string, chatbotName: string): string => {
  const userMessage = message.toLowerCase();
  
  if (userMessage.includes('hello') || userMessage.includes('hi')) {
    return `Hello! I'm ${chatbotName}. I'm currently running in demo mode due to API limitations, but I'm here to help!`;
  }
  
  if (userMessage.includes('help')) {
    return `I'm ${chatbotName}, and I'm here to help! Currently in demo mode, but I can still assist with basic questions.`;
  }
  
  if (userMessage.includes('thank')) {
    return "You're welcome! I'm glad I could help, even in demo mode.";
  }
  
  return `Hi! I'm ${chatbotName}. I'm currently running in demo mode due to API balance limitations. For full AI capabilities, please add funds to your DeepSeek API account at https://platform.deepseek.com/`;
};
