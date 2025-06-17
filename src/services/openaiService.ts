
const OPENAI_API_KEY = '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';

export interface OpenAIResponse {
  content: string;
  isFromAI: boolean;
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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 200,
        temperature: 0.7,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response at the moment.",
      isFromAI: true
    };
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return {
      content: "I'm having trouble connecting to my AI service right now. Please try again later.",
      isFromAI: false
    };
  }
};
