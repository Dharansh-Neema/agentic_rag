import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import * as fs from 'fs';
import * as path from 'path';

// Define paths
const dataDir = path.resolve(process.cwd(), 'data');

/**
 * Load documents from a directory
 */
export const loadDocuments = async (): Promise<Document[]> => {
  try {
    // Check if directory exists
    if (!fs.existsSync(dataDir)) {
      console.error(`Directory not found: ${dataDir}`);
      return [];
    }
    
    // Create a loader for markdown files
    const loader = new DirectoryLoader(dataDir, {
      ".md": (path) => new TextLoader(path),
    });
    
    // Load all documents
    const docs = await loader.load();
    console.log(`Loaded ${docs.length} documents from ${dataDir}`);
    
    return docs;
  } catch (error) {
    console.error('Error loading documents:', error);
    return [];
  }
};

/**
 * Split documents into chunks
 */
export const splitDocuments = async (documents: Document[]): Promise<Document[]> => {
  try {
    // Create a text splitter
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    
    // Split documents into chunks
    const docChunks = await textSplitter.splitDocuments(documents);
    console.log(`Split documents into ${docChunks.length} chunks`);
    
    return docChunks;
  } catch (error) {
    console.error('Error splitting documents:', error);
    return [];
  }
};
