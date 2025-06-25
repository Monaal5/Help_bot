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
      let errorText = '';
      try {
        errorText = await response.text();
        console.error('OpenRouter API error response:', errorText);
      } catch (e) {
        console.error('OpenRouter API error: Could not read error body', e);
      }
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    if ('error' in data) {
      console.error('OpenRouter API error:', data.error);
      return `Sorry, the AI service returned an error: ${data.error.message || 'Unknown error.'}`;
    }
    if (!data || !Array.isArray(data.choices) || data.choices.length === 0 || !data.choices[0]?.message?.content) {
      console.error('Malformed OpenRouter API response:', data);
      return 'Sorry, I could not generate a response due to an unexpected server reply.';
    }
    const content = data.choices[0].message.content;
    
    // Format the response to ensure proper markdown rendering
    return content.replace(/\n/g, '\n\n');
  } catch (error: any) {
    console.error('OpenRouter API error:', error?.message || error);
    return `Sorry, the AI service returned an error: ${error?.message || 'Unknown error.'}`;
  }
};
