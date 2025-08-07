import { useState } from 'react';
import ChatSidebar from './ChatSidebar';

interface MobileMenuProps {
  activeSessionId: string | null;
  onNewChat: () => void;
}

export default function MobileMenu({ activeSessionId, onNewChat }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Menu Button */}
      <button
        onClick={toggleMenu}
        className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
        aria-label="Toggle menu"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Background overlay */}
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={toggleMenu}
            aria-hidden="true"
          ></div>

          {/* Sidebar */}
          <div className="fixed inset-y-0 left-0 flex z-50 max-w-xs w-full">
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
              {/* Close button */}
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  onClick={toggleMenu}
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                >
                  <span className="sr-only">Close sidebar</span>
                  <svg
                    className="h-6 w-6 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Sidebar content */}
              <ChatSidebar activeSessionId={activeSessionId} onNewChat={onNewChat} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
