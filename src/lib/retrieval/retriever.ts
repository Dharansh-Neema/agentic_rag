import { queryCollection, initializePinecone } from "../vectorstore/chromaStore";
import { ChatGoogleGenerativeAI  } from "@langchain/google-genai";
import { RunnableSequence } from "@langchain/core/runnables";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { GEMINI_API_KEY } from "../utils/env";

// Get relevant documents from Pinecone
export const retrieveRelevantDocuments = async (question: string, k: number = 4) => {
  // Make sure Pinecone is initialized
  await initializePinecone();
  
  // Query the collection
  const results = await queryCollection(question, k);
  
  // Format the results into documents
  if (results && results.matches && results.matches.length > 0) {
    const docs = results.matches.map((match: any) => {
      return {
        pageContent: match.metadata.text || "",
        metadata: match.metadata || {}
      };
    });
    return docs;
  }
  
  return [];
};

const createChatModel = () => {
  return new ChatGoogleGenerativeAI({
    apiKey: GEMINI_API_KEY,
    model: "gemini-2.0-flash-exp", // You can upgrade to GPT-4 if needed
    temperature: 0.2,
  });
};
const createPromptTemplate = () => {
  return PromptTemplate.fromTemplate(
    `Answer the question based on the following context:
    
    Context:
    {context}
    
    Question:
    {question}
    
    Answer the question in a comprehensive and helpful manner. If the answer is not in the context, 
    just say "I don't have enough information to answer this question." Don't make up answers.`
  );
};

/**
 * Create a RAG chain
 */
export const createRagChain = async () => {
  const model = createChatModel();
  const prompt = createPromptTemplate();
  const outputParser = new StringOutputParser();

  // Create a retrieval chain
  const chain = RunnableSequence.from([
    {
      context: async (input: { question: string }) => {
        const docs = await retrieveRelevantDocuments(input.question);
        return docs.map((doc: any) => doc.pageContent).join("\n\n");
      },
      question: (input: { question: string }) => input.question,
    },
    prompt,
    model,
    outputParser,
  ]);

  return chain;
};

export const queryRagChain = async (question: string): Promise<string> => {
  try {
    const chain = await createRagChain();
    const response = await chain.invoke({ question });
    return response;
  } catch (error) {
    console.error("Error querying RAG chain:", error);
    return "Sorry, an error occurred while processing your request.";
  }
};
