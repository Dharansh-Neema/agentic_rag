import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '../../utils/env';

/**
 * Tool for handling mathematical queries
 * @param query The user's math query
 * @returns Response to the math query with solution
 */
export async function handleMathQuery(query: string): Promise<string> {
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
      You are a mathematical problem solver. The user has asked a math-related question.
      Please solve the mathematical problem step by step, showing your work clearly.
      If the query isn't a well-formed math problem, try to interpret it as a math problem
      and solve it to the best of your ability.
      
      User query: "${query}"
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Error handling math query:', error);
    return 'I apologize, but I encountered an error while processing your math query. Please try again later.';
  }
}
