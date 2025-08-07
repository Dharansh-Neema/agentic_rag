import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { PINECONE_API_KEY, PINECONE_ENVIRONMENT, GEMINI_API_KEY } from '@/lib/utils/env';

/**
 * Initialize Pinecone client
 */
export function initializePinecone() {
  return new Pinecone({
    apiKey: PINECONE_API_KEY
  });
}

/**
 * Query Pinecone vector store with a question
 * @param question The question to query with
 * @returns The relevant documents and their embeddings
 */
export async function queryPineconeVectorStore(question: string) {
  try {
    // Initialize the Pinecone client
    const pinecone = initializePinecone();
    
    // Get the index
    const index = pinecone.index('agentic-rag');
    
    // Generate embeddings for the query
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: GEMINI_API_KEY,
      modelName: "embedding-001",
    });
    
    const queryEmbedding = await embeddings.embedQuery(question);
    
    // Query the index
    const queryResponse = await index.query({
      vector: queryEmbedding,
      topK: 5,
      includeMetadata: true,
      includeValues: true,
    });
    
    // Format the results
    const documents = queryResponse.matches.map(match => ({
      pageContent: match.metadata?.text as string || '',
      metadata: {
        source: match.metadata?.source || '',
        chunk: match.metadata?.chunk || ''
      }
    }));
    
    return { documents, embeddings: queryEmbedding };
  } catch (error) {
    console.error('Error querying Pinecone:', error);
    return { documents: [], embeddings: [] };
  }
}
