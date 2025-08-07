'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ChatSidebar from '@/components/ChatSidebar';
import ChatInterface, { Message } from '@/components/ChatInterface';
import MobileMenu from '@/components/MobileMenu';

export default function ChatSession({ params }: { params: { id: string } }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(params.id);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const router = useRouter();

  // Load chat session data
  useEffect(() => {
    const fetchSession = async () => {
      try {
        setIsLoadingSession(true);
        const response = await fetch(`/api/chat-sessions/${params.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            router.push('/');
            return;
          }
          throw new Error('Failed to fetch session');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setSessionId(data.data._id);
          
          // Convert messages from the session
          const sessionMessages = data.data.messages.map((msg: any) => ({
            role: msg.role,
            content: msg.content
          }));
          
          setMessages(sessionMessages);
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('Error fetching chat session:', error);
        router.push('/');
      } finally {
        setIsLoadingSession(false);
      }
    };

    if (params.id) {
      fetchSession();
    }
  }, [params.id, router]);

  // Create a new chat session
  const handleNewChat = async () => {
    try {
      const response = await fetch('/api/chat-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Chat' }),
      });

      const data = await response.json();

      if (data.success) {
        // Navigate to the new chat session
        router.push(`/chat/${data.data._id}`);
      }
    } catch (error) {
      console.error('Error creating new chat session:', error);
    }
  };

  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !sessionId) return;
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: content,
          sessionId
        }),
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

  // Handle document ingestion
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

  if (isLoadingSession) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading chat session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:block">
        <ChatSidebar 
          activeSessionId={sessionId} 
          onNewChat={handleNewChat} 
        />
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 py-4 px-6 flex items-center justify-between">
          <div className="flex items-center">
            <MobileMenu 
              activeSessionId={sessionId} 
              onNewChat={handleNewChat} 
            />
            <h1 className="text-xl font-semibold text-gray-800 ml-2">Agentic RAG System</h1>
          </div>
          
          <div>
            <button 
              onClick={handleNewChat}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm"
            >
              New Chat
            </button>
          </div>
        </header>
        
        {/* Chat interface */}
        <div className="flex-1 overflow-hidden">
          <ChatInterface 
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            onIngestDocuments={handleIngestDocuments}
            isIngesting={isIngesting}
          />
        </div>
      </div>
    </div>
  );
}
