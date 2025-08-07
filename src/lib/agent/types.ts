/**
 * Types for the super agent implementation
 */

export type AgentState = {
  question: string;
  queryType: 'rag' | 'weather' | 'math' | 'general' | null;
  answer: string | null;
  ragResponse: string | null;
  weatherResponse: string | null;
  mathResponse: string | null;
  generalResponse: string | null;
  error: string | null;
  sessionId?: string | null;
};

export type QueryClassification = {
  type: 'rag' | 'weather' | 'math' | 'general';
  confidence: number;
  reasoning: string;
};
