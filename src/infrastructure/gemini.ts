// src/infrastructure/gemini.ts

import dotenv from 'dotenv';

dotenv.config();

// Use native fetch to call AvalAI (https://docs.avalai.ir/fa/quickstart)
export async function generateText(prompt: string): Promise<string> {
  const apiKey = process.env.AVALAI_API_KEY;
  const model = process.env.AI_MODEL_NAME || 'gemini-2.5-pro';

  if (!apiKey) {
    throw new Error('AVALAI_API_KEY is not set in the environment');
  }

  const url = 'https://api.avalai.ir/v1/chat/completions';

  const body = JSON.stringify({
    model,
    messages: [{ role: 'user', content: prompt }],
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`AvalAI request failed: ${res.status} ${res.statusText} ${txt}`);
  }

  const data: any = await res.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Invalid response from AvalAI: missing choices[0].message.content');
  }

  return content;
}
