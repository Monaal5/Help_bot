interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
  }>;
}

// Default OpenRouter API key for all chatbots
const DEFAULT_OPENROUTER_KEY = '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';

const getOpenRouterKey = (): string => {
  return DEFAULT_OPENROUTER_KEY;
};

const DEFAULT_RESPONSES = [
  "I understand you're asking about that. Let me help you with that.",
  "That's an interesting question. Here's what I can tell you about that.",
  "I'd be happy to help you with that. Let me explain.",
  "Thanks for your question. Here's what you need to know about that.",
  "I can help you with that. Let me provide some information.",
];

const getRandomDefaultResponse = (): string => {
  return DEFAULT_RESPONSES[Math.floor(Math.random() * DEFAULT_RESPONSES.length)];
};

export const generateOpenRouterResponse = async (
  messages: OpenRouterMessage[],
  apiKey?: string
): Promise<string> => {
  // Always use the provided hardcoded key
  const key = DEFAULT_OPENROUTER_KEY;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Talk Link Chatbots Hub',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-r1-0528:free',
        messages: [
          {
            role: 'system',
            content: 'You are an intelligent AI assistant that combines specific knowledge with general understanding. ' +
                    'When given specific information, use it to enhance your responses while maintaining a natural, ' +
                    'conversational tone. Provide comprehensive answers that draw from both the provided context and ' +
                    'your general knowledge. Make connections between different pieces of information to give more ' +
                    'insightful responses.'
          },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 1000,
        format: 'markdown',
        presence_penalty: 0.6,
        frequency_penalty: 0.3,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data: OpenRouterResponse = await response.json();
    const content = data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    
    // Format the response to ensure proper markdown rendering
    return content.replace(/\n/g, '\n\n');
  } catch (error) {
    console.error('OpenRouter API error:', error);
    throw error;
  }
};
