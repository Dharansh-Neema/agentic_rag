import { Document } from "@langchain/core/documents";
import * as fs from 'fs';
import * as path from 'path';
import { GEMINI_API_KEY } from "../utils/env";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Pinecone, PineconeRecord } from "@pinecone-database/pinecone";

// Pinecone configuration
const PINECONE_INDEX_NAME = "documents";
const PINECONE_API_KEY = process.env.PINECONE_API_KEY || "";
const PINECONE_ENVIRONMENT = process.env.PINECONE_ENVIRONMENT || "";

// Initialize Pinecone client
let pineconeClient: Pinecone;
let pineconeIndex: any;



// Initialize Google Generative AI for embeddings
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });

// Generate embeddings using Google Generative AI
async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings = [];
  
  // Process in smaller batches to avoid rate limits
  const batchSize = 5;
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchPromises = batch.map(async (text) => {
      try {
        const result = await embeddingModel.embedContent(text);
        return result.embedding.values;
      } catch (error) {
        console.error(`Error generating embedding for text: ${error}`);
        // Return a zero vector as fallback (not ideal but prevents crashing)
        return new Array(768).fill(0); // Typical embedding dimension
      }
    });
    
    const batchEmbeddings = await Promise.all(batchPromises);
    embeddings.push(...batchEmbeddings);
  }
  
  return embeddings;
}

// Initialize Pinecone client and index
export const initializePinecone = async () => {
  try {
    // Initialize Pinecone client
    pineconeClient = new Pinecone({
      apiKey: PINECONE_API_KEY
    });
    
    // Check if index exists
    const indexList = await pineconeClient.listIndexes();
    const indexExists = indexList.indexes?.some(index => index.name === PINECONE_INDEX_NAME) || false;
    
    if (!indexExists) {
      // Create index if it doesn't exist
      console.log(`Creating new Pinecone index: ${PINECONE_INDEX_NAME}`);
      await pineconeClient.createIndex({
        name: PINECONE_INDEX_NAME,
        dimension: 768, // Gemini embedding dimension
        metric: 'cosine',
        spec: { serverless: { cloud: 'aws', region: 'us-east-1' } }
      });
      
      // Wait for index initialization
      console.log('Waiting for index initialization...');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
    
    // Get the index
    pineconeIndex = pineconeClient.index(PINECONE_INDEX_NAME);
    console.log(`Using Pinecone index: ${PINECONE_INDEX_NAME}`);
    
    return pineconeIndex;
  } catch (error) {
    console.error("Error initializing Pinecone:", error);
    throw error;
  }
};
// Add documents to Pinecone index
export const addDocumentsToCollection = async (documents: Document[]) => {
  try {
    if (!pineconeIndex) {
      await initializePinecone();
    }
    
    // Process documents in batches to avoid large request issues
    const batchSize = 10; // Smaller batch size for embedding generation
    let processedCount = 0;
    
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      const texts = batch.map(doc => doc.pageContent);
      
      // Generate embeddings for this batch
      console.log(`Generating embeddings for batch ${i/batchSize + 1} of ${Math.ceil(documents.length/batchSize)}`);
      const embeddings = await generateEmbeddings(texts);
      
      // Prepare vectors for upsert
      const vectors = batch.map((doc, idx) => {
        // Sanitize metadata to ensure only simple types are used
        const sanitizedMetadata: Record<string, string | number | boolean | string[]> = {
          text: doc.pageContent,
          source: doc.metadata.source || '',
          title: doc.metadata.title || '',
        };
        
        // Add any other simple metadata fields that might be available
        if (typeof doc.metadata.page === 'number') sanitizedMetadata.page = doc.metadata.page;
        if (typeof doc.metadata.chunk === 'number') sanitizedMetadata.chunk = doc.metadata.chunk;
        
        return {
          id: `doc_${processedCount + idx}`,
          values: embeddings[idx],
          metadata: sanitizedMetadata
        };
      });
      
      // Upsert vectors to Pinecone
      await pineconeIndex.upsert(vectors);
      
      processedCount += batch.length;
    }
    
    console.log(`Successfully added ${processedCount} documents to Pinecone index`);
  } catch (error) {
    console.error("Error adding documents to Pinecone index:", error);
    throw error;
  }
};

// Query documents from Pinecone index
export const queryCollection = async (queryText: string, nResults: number = 4) => {
  try {
    if (!pineconeIndex) {
      await initializePinecone();
    }

    console.log(`Generating embedding for query: "${queryText}"`);
    // Generate embedding for the query text
    const queryEmbedding = await generateEmbeddings([queryText]);
    
    console.log(`Querying Pinecone index with embedded query`);
    const results = await pineconeIndex.query({
      vector: queryEmbedding[0],
      topK: nResults,
      includeMetadata: true,
    });

    return results;
  } catch (error) {
    console.error("Error querying Pinecone index:", error);
    throw error;
  }
};

// Delete Pinecone index
export const deleteCollection = async () => {
  try {
    if (!pineconeClient) {
      pineconeClient = new Pinecone({
        apiKey: PINECONE_API_KEY
      });
    }

    const indexList = await pineconeClient.listIndexes();
    const indexExists = indexList.indexes?.some(index => index.name === PINECONE_INDEX_NAME) || false;
    
    if (indexExists) {
      await pineconeClient.deleteIndex(PINECONE_INDEX_NAME);
      console.log(`Deleted Pinecone index: ${PINECONE_INDEX_NAME}`);
    } else {
      console.log(`Pinecone index ${PINECONE_INDEX_NAME} does not exist, nothing to delete`);
    }
    pineconeIndex = null;
  } catch (error) {
    console.error("Error deleting Pinecone index:", error);
    throw error;
  }
};
