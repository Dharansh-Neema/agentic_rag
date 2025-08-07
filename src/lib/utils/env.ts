import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const getEnv = (key: string, defaultValue: string = ''): string => {
  return process.env[key] || defaultValue;
};

// Environment variables for Gemini
export const GEMINI_API_KEY = getEnv('GEMINI_API_KEY');

// Environment variables for Pinecone
export const PINECONE_API_KEY = getEnv('PINECONE_API_KEY');
export const PINECONE_ENVIRONMENT = getEnv('PINECONE_ENVIRONMENT');
