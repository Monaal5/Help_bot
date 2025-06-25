interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
  }>;
}

// DeepSeek API key
const DEEPSEEK_API_KEY = 'sk-15c1f889c5114f169c58136ac374abb4';

const getDeepSeekKey = (): string => {
  return DEEPSEEK_API_KEY;
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

export const generateDeepSeekResponse = async (
  messages: DeepSeekMessage[],
  apiKey?: string
): Promise<string> => {
  // Use the provided key or default
  const key = apiKey || DEEPSEEK_API_KEY;

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
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
        presence_penalty: 0.6,
        frequency_penalty: 0.3,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
        console.error('DeepSeek API error response:', errorText);
      } catch (e) {
        console.error('DeepSeek API error: Could not read error body', e);
      }
      throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    if ('error' in data) {
      console.error('DeepSeek API error:', data.error);
      return `Sorry, the AI service returned an error: ${data.error.message || 'Unknown error.'}`;
    }
    if (!data || !Array.isArray(data.choices) || data.choices.length === 0 || !data.choices[0]?.message?.content) {
      console.error('Malformed DeepSeek API response:', data);
      return 'Sorry, I could not generate a response due to an unexpected server reply.';
    }
    const content = data.choices[0].message.content;
    
    // Format the response to ensure proper markdown rendering
    return content.replace(/\n/g, '\n\n');
  } catch (error: any) {
    console.error('DeepSeek API error:', error?.message || error);
    return `Sorry, the AI service returned an error: ${error?.message || 'Unknown error.'}`;
  }
};
