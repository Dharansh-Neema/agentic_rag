# Agentic RAG System

A Next.js application that combines Retrieval-Augmented Generation (RAG) with an intelligent agent system to provide context-aware responses to user queries. The system uses Pinecone for vector storage, Google Gemini for embeddings and LLM capabilities, and MongoDB for chat session management.

## Features

- **Super Agent Query Routing**: Intelligently routes queries to specialized tools or RAG pipeline
- **Document Ingestion**: Process and vectorize documents for knowledge retrieval
- **Chat Interface**: Professional UI with conversation history and session management
- **Specialized Tools**: Weather, math, and general knowledge tools
- **Vector Search**: Semantic search using Pinecone and Google Gemini embeddings

## Architecture

```
┌─────────────────┐     ┌───────────────────┐     ┌────────────────┐
│                 │     │                   │     │                │
│  Chat Interface │────▶│  Super Agent     │────▶│  Weather Tool  │
│                 │     │  Query Router    │     │                │
└─────────────────┘     │                   │     └────────────────┘
                        │                   │     ┌────────────────┐
                        │                   │────▶│  Math Tool     │
                        │                   │     │                │
                        │                   │     └────────────────┘
                        │                   │     ┌────────────────┐
                        │                   │────▶│  General Tool  │
                        │                   │     │                │
                        │                   │     └────────────────┘
                        │                   │     ┌────────────────┐
                        │                   │────▶│  RAG Pipeline  │
                        │                   │     │  (Pinecone)    │
                        └───────────────────┘     └────────────────┘
```

## Setup

### Prerequisites

- Node.js 18+ and npm/yarn
- MongoDB instance (local or Atlas)
- Pinecone account
- Google Gemini API key
- OpenWeatherMap API key

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/agentic_rag.git
cd agentic_rag
```

2. Install dependencies

```bash
npm install
# or
yarn install
```

3. Create a `.env` file based on the provided `env.sample`

```bash
cp env.sample .env
```

4. Fill in your API keys and configuration in the `.env` file

```
# Gemini API key for embeddings and LLM
GEMINI_API_KEY=your_gemini_api_key_here

# Pinecone API key and environment
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=your_pinecone_environment_here

# MongoDB connection URI (for chat sessions)
MONGODB_URI=mongodb://localhost:27017/agentic_rag

# OpenWeatherMap API key (for weather tool)
OPENWEATHER_API_KEY=your_openweathermap_api_key_here
```

5. Start the development server

```bash
npm run dev
# or
yarn dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Document Ingestion

1. Place your markdown documents in the `data` folder
2. Click the "Ingest Documents" button in the UI
3. Wait for the ingestion process to complete

### API Endpoints

#### Ingest Documents

```bash
curl -X POST http://localhost:3000/api/ingest
```

#### Query the System

```bash
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is markdown?", "sessionId": "optional-session-id"}'
```

#### Create a Chat Session

```bash
curl -X POST http://localhost:3000/api/chat-sessions \
  -H "Content-Type: application/json" \
  -d '{"title": "New Chat"}'
```

#### Add Message to Chat Session

```bash
curl -X POST http://localhost:3000/api/chat-sessions/SESSION_ID/messages \
  -H "Content-Type: application/json" \
  -d '{"content": "Tell me about markdown", "role": "user"}'
```

## Agent Flow

1. User submits a query through the chat interface
2. The query is sent to the super agent query router
3. The query classifier determines the appropriate tool:
   - Weather-related queries → Weather tool (using OpenWeatherMap API)
   - Math-related queries → Math tool
   - General knowledge queries → General tool
   - Document-specific queries → RAG pipeline with Pinecone
4. The selected tool processes the query and returns a response
5. The response is displayed in the chat interface and stored in the session history

## License

MIT
