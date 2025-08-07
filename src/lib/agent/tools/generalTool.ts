import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '../../utils/env';

/**
 * Tool for handling general queries that don't fit other categories
 * @param query The user's general query
 * @returns Response to the general query
 */
export async function handleGeneralQuery(query: string): Promise<string> {
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
      You are a helpful assistant. The user has asked a general question that doesn't
      require specific document knowledge, weather information, or mathematical calculations.
      Please respond to their query as accurately and helpfully as possible.
      
      User query: "${query}"
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Error handling general query:', error);
    return 'I apologize, but I encountered an error while processing your query. Please try again later.';
  }
}
