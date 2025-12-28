// src/infrastructure/gemini.ts

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set in the .env file');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model: GenerativeModel = genAI.getGenerativeModel({ model: 'gemini-pro' });

export async function generateText(prompt: string): Promise<string> {
  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating text from Gemini AI:', error);
    throw new Error('Failed to generate text from AI.');
  }
}
