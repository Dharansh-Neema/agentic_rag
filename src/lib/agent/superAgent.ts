import { AgentState } from './types';
import { classifyQuery } from './queryClassifier';
import { handleWeatherQuery } from './tools/weatherTool';
import { handleMathQuery } from './tools/mathTool';
import { handleGeneralQuery } from './tools/generalTool';
import { queryPineconeVectorStore } from '../vectorstore/pineconeStore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '../utils/env';

/**
 * Process a user query using the super agent workflow
 * This is a simplified implementation that doesn't rely on LangGraph
 * but achieves the same functionality
 */
export async function processSuperAgentQuery(question: string, sessionId?: string): Promise<string> {
  try {
    console.log('Processing query with super agent:', question);
    
    // Step 1: Classify the query
    const queryType = await classifyQuery(question);
    console.log('Query classified as:', queryType);
    
    // Step 2: Route to specialized tool if applicable
    if (queryType.type === 'weather') {
      console.log('Routing to weather tool');
      return await handleWeatherQuery(question);
    }
    
    if (queryType.type === 'math') {
      console.log('Routing to math tool');
      return await handleMathQuery(question);
    }
    
    if (queryType.type === 'general') {
      console.log('Routing to general tool');
      return await handleGeneralQuery(question);
    }
    
    // Step 3: Handle RAG query for all other types
    console.log('Handling as RAG query');
    const result = await queryPineconeVectorStore(question);
    
    // Extract documents from the result
    const { documents } = result;
    
    if (!documents || documents.length === 0) {
      console.log('No relevant documents found, falling back to general tool');
      return await handleGeneralQuery(question);
    }
    
    // Generate a response using the retrieved documents
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const context = documents.map((doc) => `Document: ${doc.pageContent}`).join('\n\n');
    const prompt = `You are an AI assistant answering questions based on the provided documents. 
      Use the information from these documents to answer the question. 
      If the documents don't contain relevant information, say so and provide a general response.
      
      Documents:
      ${context}
      
      Question: ${question}
      
      Answer:`;
    
    const genResult = await model.generateContent(prompt);
    return genResult.response.text();
    
  } catch (error) {
    console.error('Error in super agent workflow:', error);
    return `I encountered an error while processing your query: ${error instanceof Error ? error.message : String(error)}`;
  }
}
