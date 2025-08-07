# Development Notes

## AI-Generated vs. Human Components

This project represents a collaborative effort between human design decisions and AI-assisted implementation. Here's a breakdown of the contributions:

### Human-Driven Components

- **Project Architecture**: The overall system architecture, including the decision to use a RAG-based approach with vector stores and LLMs, was human-designed.
- **Core Requirements**: The specification of features, such as document ingestion, query processing, and chat interface functionality.
- **Technology Selection**: Strategic choices of key technologies like Next.js, MongoDB, and the transition from ChromaDB to Pinecone.
- **API Design**: The structure and endpoints of the API were human-designed for optimal performance and usability.
- **Business Logic**: Critical business logic, especially around document processing and query routing.

### AI-Assisted Components

- **UI Implementation**: The chat interface components were enhanced with AI assistance for styling and responsiveness.
- **Code Refactoring**: AI helped optimize and refactor code for better performance and readability.
- **Documentation**: README and API documentation were generated with AI assistance.
- **Bug Fixes**: AI helped identify and resolve various bugs throughout development.
- **Testing**: Test cases and validation approaches were suggested by AI.

## Bugs Faced and Solutions

### 1. ChromaDB Integration Issues

**Problem**: ChromaDB client initialization failed with deprecated 'path' argument and missing/invalid URL errors.

**Solution**: Updated the initialization to use 'host', 'port', and 'ssl' parameters instead of 'path'. Eventually migrated to Pinecone for more reliable vector storage.

```typescript
// Before (problematic)
const client = new ChromaClient({ path: CHROMA_DB_PATH });

// After (fixed)
const client = new ChromaClient({ host: "localhost", port: 8000, ssl: false });
```

### 2. Embedding Function Compatibility

**Problem**: ChromaDB v3.x rejected the dummy embedding function and required a real embedding function for collection operations.

**Solution**: Implemented Google Gemini embeddings and pre-computed embeddings workflow for compatibility with remote/server ChromaDB.

```typescript
// Solution with pre-computed embeddings
const embeddings = await generateEmbeddings(documents);
await collection.add({
  ids: documents.map((_, i) => `id${i}`),
  embeddings: embeddings,
  metadatas: documents.map(doc => ({ source: doc.metadata.source })),
  documents: documents.map(doc => doc.pageContent),
});
```

### 3. Pinecone Metadata Formatting

**Problem**: Pinecone upsert operations failed because metadata fields contained complex objects that weren't string/number/boolean/array of strings.

**Solution**: Sanitized metadata before upsert to ensure only simple types were used.

```typescript
// Before (error)
const metadata = document.metadata; // Could contain complex objects

// After (fixed)
const metadata = {
  source: document.metadata.source,
  title: document.metadata.title || '',
  // Only include simple types
};
```

### 4. Environment Variable Conflicts

**Problem**: Dependency conflicts occurred due to incompatible dotenv versions.

**Solution**: Downgraded dotenv to ^16.4.5 and consolidated environment variable handling in a central env.ts utility.

### 5. Google Gemini Model Deprecation

**Problem**: Received 404 errors when using the deprecated "gemini-pro" model.

**Solution**: Updated all LLM and embedding calls to use "gemini-2.5-flash" instead.

```typescript
// Before (error)
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// After (fixed)
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
```

## Agent Architecture: Routing, Memory, and Context

### Query Routing

The super agent uses a classifier-based approach to route queries to the appropriate tool:

1. **Query Classification**: Each incoming query is analyzed by the query classifier using Google Gemini LLM to determine its type (weather, math, general knowledge, or document-specific).

```typescript
// Query classification logic
export async function classifyQuery(query: string): Promise<QueryType> {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Classify the following query into one of these categories:
  - weather: Questions about weather, temperature, forecast, etc.
  - math: Mathematical calculations, equations, etc.
  - general: General knowledge questions not related to specific documents
  - document: Questions about specific documents or content that would benefit from RAG
  
  Query: "${query}"
  
  Return ONLY the category name, nothing else.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim().toLowerCase();
  
  if (text.includes("weather")) return "weather";
  if (text.includes("math")) return "math";
  if (text.includes("document")) return "document";
  return "general";
}
```

2. **Tool Selection**: Based on the classification, the query is routed to:
   - Weather Tool: For weather-related queries (using OpenWeatherMap API)
   - Math Tool: For mathematical calculations
   - General Tool: For general knowledge questions
   - RAG Pipeline: For document-specific queries (using Pinecone vector store)

3. **Response Generation**: The selected tool processes the query and generates a response, which is then returned to the user.

### Memory Integration

The system uses MongoDB to store chat sessions and message history:

1. **Session Management**: Each chat conversation is stored as a session with a unique ID.
2. **Message History**: All messages (user and assistant) are stored with their content, role, and timestamp.
3. **Context Preservation**: When processing a query, the system retrieves the relevant session history to maintain context.

```typescript
// Retrieving chat history for context
const session = await ChatSession.findById(sessionId).populate('messages');
const history = session.messages.map(msg => ({
  role: msg.role,
  content: msg.content
}));
```

### Context Management

The RAG pipeline enhances responses with relevant document context:

1. **Document Retrieval**: When a query is classified as document-related, the system searches the Pinecone vector store for relevant document chunks.
2. **Context Augmentation**: The retrieved document chunks are added to the prompt sent to the LLM.
3. **Contextual Response**: The LLM generates a response based on both the query and the retrieved document context.

```typescript
// RAG pipeline with context augmentation
export async function queryWithRAG(query: string, history: Message[] = []): Promise<string> {
  // Get relevant documents from Pinecone
  const relevantDocs = await retrieveDocuments(query);
  
  // Format context from documents
  const context = relevantDocs.map(doc => doc.pageContent).join('\n\n');
  
  // Generate response with context
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
  const prompt = `You are a helpful assistant. Use the following context to answer the question.
  
  Context:
  ${context}
  
  Question: ${query}
  
  Answer:`;
  
  const result = await model.generateContent(prompt);
  return result.response.text();
}
```

This architecture allows the system to intelligently route queries to the most appropriate tool while maintaining conversation context and augmenting responses with relevant document knowledge.
