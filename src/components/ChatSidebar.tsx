import { useState, useEffect } from 'react';
import Link from 'next/link';

type ChatSession = {
  _id: string;
  title: string;
  updatedAt: string;
};

interface ChatSidebarProps {
  activeSessionId: string | null;
  onNewChat: () => void;
}

export default function ChatSidebar({ activeSessionId, onNewChat }: ChatSidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/chat-sessions');
        const data = await response.json();
        
        if (data.success) {
          setSessions(data.data);
        }
      } catch (error) {
        console.error('Error fetching chat sessions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm('Are you sure you want to delete this chat?')) {
      try {
        const response = await fetch(`/api/chat-sessions/${id}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          setSessions(sessions.filter(session => session._id !== id));
          
          // If the active session was deleted, redirect to home
          if (activeSessionId === id) {
            window.location.href = '/';
          }
        }
      } catch (error) {
        console.error('Error deleting chat session:', error);
      }
    }
  };

  return (
    <div className="bg-white border-r border-gray-200 w-64 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={onNewChat}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          New Chat
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="text-center py-4 text-gray-500">Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No chat history</div>
        ) : (
          <ul className="space-y-1">
            {sessions.map((session) => (
              <li key={session._id}>
                <Link 
                  href={`/chat/${session._id}`}
                  className={`flex items-center justify-between px-3 py-2 rounded-md ${
                    activeSessionId === session._id
                      ? 'bg-blue-100 text-blue-700'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="truncate flex-1">
                    {session.title}
                  </div>
                  <button
                    onClick={(e) => deleteSession(session._id, e)}
                    className="text-gray-400 hover:text-red-500 ml-2"
                    title="Delete chat"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          Agentic RAG System
        </div>
      </div>
    </div>
  );
}
