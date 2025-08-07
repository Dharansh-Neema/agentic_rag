'use client';

import Image from "next/image";
import { useState, FormEvent, useRef, useEffect } from 'react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMessage }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `Error: ${data.message || 'Something went wrong'}` 
        }]);
      }
    } catch (error) {
      console.error('Error querying the RAG system:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error while processing your request.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIngestDocuments = async (forceReindex: boolean = false) => {
    setIsIngesting(true);

    try {
      const response = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceReindex }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `Documents ingested successfully! Processed ${data.data?.documentsCount || 0} documents into ${data.data?.chunksCount || 0} chunks.` 
        }]);
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `Error ingesting documents: ${data.message || 'Something went wrong'}` 
        }]);
      }
    } catch (error) {
      console.error('Error ingesting documents:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error while ingesting documents.' 
      }]);
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-4 text-center text-gray-800 dark:text-gray-200">
          Agentic RAG System
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4">
          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => handleIngestDocuments(false)}
              disabled={isIngesting}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md disabled:bg-blue-300"
            >
              {isIngesting ? 'Ingesting...' : 'Ingest Documents'}
            </button>
            
            <button
              onClick={() => handleIngestDocuments(true)}
              disabled={isIngesting}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md disabled:bg-red-300"
            >
              {isIngesting ? 'Ingesting...' : 'Force Reindex'}
            </button>
          </div>
          
          <div className="border rounded-lg p-4 h-[500px] overflow-y-auto mb-4 bg-gray-50 dark:bg-gray-900">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 mt-40">
                <p>No messages yet. Start by ingesting documents and asking questions!</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`mb-4 p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-100 dark:bg-blue-900 ml-8'
                      : 'bg-gray-100 dark:bg-gray-800 mr-8'
                  }`}
                >
                  <div className="font-bold mb-1">
                    {message.role === 'user' ? 'You' : 'Assistant'}
                  </div>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="text-center text-gray-500 dark:text-gray-400 my-2">
                Thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              disabled={isLoading || isIngesting}
              className="flex-grow border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
            <button
              type="submit"
              disabled={isLoading || isIngesting || !input.trim()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md disabled:bg-blue-300"
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>

        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            RAG System with ChromaDB, Langchain, and LangGraph
          </p>
        </div>
      </div>
    </div>
  );
}
