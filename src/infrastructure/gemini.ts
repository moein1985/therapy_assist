import dotenv from 'dotenv';

dotenv.config();

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

export async function generateText(messages: AIMessage[]): Promise<AIResponse> {
  const apiKey = process.env.AVALAI_API_KEY;
  const model = process.env.AI_MODEL_NAME || 'gemini-1.5-pro';

  if (!apiKey) throw new Error('AVALAI_API_KEY is not set');

  // Using native fetch for AvalAI (OpenAI Compatible)
  const response = await fetch('https://api.avalai.ir/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages }),
  });

  if (!response.ok) {
    const txt = await response.text();
    throw new Error(`AI Request Failed: ${response.statusText} - ${txt}`);
  }

  const data: any = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0 };

  return { content, usage };
}