import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '../utils/env';
import { QueryClassification } from './types';

/**
 * Classifies a query to determine the appropriate processing method
 * @param query The user's query
 * @returns Classification of the query type
 */
export async function classifyQuery(query: string): Promise<QueryClassification> {
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
      Analyze the following query and classify it into one of these categories:
      - "rag": If the query is asking about information that would be found in documents or knowledge base
      - "weather": If the query is asking about weather information
      - "math": If the query is asking to solve a mathematical problem
      - "general": If the query is a general question not fitting the above categories

      Query: "${query}"

      Respond in JSON format with the following structure:
      {
        "type": "rag" | "weather" | "math" | "general",
        "confidence": <number between 0 and 1>,
        "reasoning": "<brief explanation of why this classification was chosen>"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse classification response');
    }
    
    const classification = JSON.parse(jsonMatch[0]) as QueryClassification;
    return classification;
  } catch (error) {
    console.error('Error classifying query:', error);
    // Default to RAG if classification fails
    return {
      type: 'rag',
      confidence: 0.5,
      reasoning: 'Default classification due to error in classification process'
    };
  }
}
