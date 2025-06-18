const OPENROUTER_API_KEY = 'ssk-or-v1-97be50eed83735c96f335a82dc4c75f736830d6628f0a7e61dca937b6988d9de';

export interface OpenAIResponse {
  content: string;
  isFromAI: boolean;
  confidence?: number;
}

export const generateAIResponse = async (
  message: string, 
  chatbotName: string,
  conversationHistory: Array<{role: 'user' | 'assistant', content: string}> = []
): Promise<OpenAIResponse> => {
  try {
    const systemPrompt = `You are ${chatbotName}, a helpful AI assistant. Provide concise, helpful responses. Keep your answers under 150 words and maintain a friendly, professional tone.`;
    
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversationHistory.slice(-6), // Keep last 6 messages for context
      { role: 'user' as const, content: message }
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'AI Chatbot Platform',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-r1-0528:free',
        messages,
        max_tokens: 200,
        temperature: 0.7,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response at the moment.",
      isFromAI: true,
      confidence: data.choices[0]?.message?.confidence
    };
  } catch (error) {
    console.error('OpenRouter API Error:', error);
    return {
      content: "I'm having trouble connecting to my AI service right now. Please try again later.",
      isFromAI: false
    };
  }
};
