
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { type ChatMessage } from './types';
import { GEMINI_MODEL_NAME, SYSTEM_INSTRUCTION, DEFAULT_API_KEY_ERROR_MESSAGE, GENERIC_API_ERROR_MESSAGE, LOCAL_STORAGE_API_KEY_NAME } from './constants';
import { initializeChat, streamMessage } from './services/geminiService';
import { ChatInput } from './components/ChatInput';
import { MessageBubble } from './components/MessageBubble';
import { Header } from './components/Header';
import { LoadingSpinner } from './components/LoadingSpinner';
import { type Chat } from '@google/genai';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [isApiKeyNeeded, setIsApiKeyNeeded] = useState<boolean>(false);

  useEffect(() => {
    // Try process.env first (for local dev with tools like Vite that can inject it)
    let key = typeof process !== 'undefined' && process.env && process.env.API_KEY ? process.env.API_KEY : null;
    
    if (!key) {
      key = localStorage.getItem(LOCAL_STORAGE_API_KEY_NAME);
    }

    if (key) {
      setApiKey(key);
      setIsApiKeyNeeded(false);
      setError(null);
    } else {
      setIsApiKeyNeeded(true);
      setError(DEFAULT_API_KEY_ERROR_MESSAGE); // Show guidance to enter key
    }
  }, []);

  useEffect(() => {
    if (apiKey && !chatSession) {
      try {
        const newChat = initializeChat(apiKey, SYSTEM_INSTRUCTION);
        setChatSession(newChat);
        setError(null); // Clear previous errors like "API key needed"
      } catch (e) {
        console.error("Failed to initialize chat session:", e);
        setError("Failed to initialize chat session. Check API key and network.");
        // Potentially clear the bad API key from localStorage if initialization fails
        // localStorage.removeItem(LOCAL_STORAGE_API_KEY_NAME);
        // setApiKey(null);
        // setIsApiKeyNeeded(true);
      }
    }
  }, [apiKey, chatSession]);

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKeyInput.trim()) {
      localStorage.setItem(LOCAL_STORAGE_API_KEY_NAME, apiKeyInput.trim());
      setApiKey(apiKeyInput.trim());
      setIsApiKeyNeeded(false);
      setError(null); 
      // Chat will attempt to initialize via the useEffect watching `apiKey`
    } else {
      setError("API Key cannot be empty.");
    }
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = useCallback(async (inputText: string) => {
    if (!inputText.trim() || isLoading || !chatSession) {
      if (!apiKey) {
        setError(DEFAULT_API_KEY_ERROR_MESSAGE);
        setIsApiKeyNeeded(true); // Re-prompt if key somehow got unset
      } else if(!chatSession) {
         setError("Chat session not initialized. Please wait or refresh. If the problem persists, your API key might be invalid.");
      }
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      text: inputText,
      sender: 'user',
      timestamp: Date.now(),
    };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setIsLoading(true);
    setError(null);

    const aiMessageId = crypto.randomUUID();
    const aiMessagePlaceholder: ChatMessage = {
      id: aiMessageId,
      text: '',
      sender: 'ai',
      timestamp: Date.now(),
      isStreaming: true,
    };
    setMessages(prevMessages => [...prevMessages, aiMessagePlaceholder]);

    try {
      await streamMessage(
        chatSession,
        inputText,
        (chunkText) => {
          setMessages(prevMessages =>
            prevMessages.map(msg =>
              msg.id === aiMessageId ? { ...msg, text: msg.text + chunkText } : msg
            )
          );
        },
        () => { // onComplete
          setMessages(prevMessages =>
            prevMessages.map(msg =>
              msg.id === aiMessageId ? { ...msg, isStreaming: false } : msg
            )
          );
          setIsLoading(false);
        },
        (apiError) => { // onError
          console.error('API Error:', apiError);
          const errorMessage = apiError.message.includes("API key not valid") 
            ? "API key not valid. Please check your key and try again." 
            : GENERIC_API_ERROR_MESSAGE;
          setMessages(prevMessages =>
            prevMessages.map(msg =>
              msg.id === aiMessageId ? { ...msg, text: errorMessage, isStreaming: false, error: true } : msg
            )
          );
          setError(errorMessage);
          if (apiError.message.includes("API key not valid")) {
             localStorage.removeItem(LOCAL_STORAGE_API_KEY_NAME);
             setApiKey(null);
             setChatSession(null); // Reset chat session
             setIsApiKeyNeeded(true); // Prompt for key again
          }
          setIsLoading(false);
        }
      );
    } catch (e) {
      console.error('Failed to send message:', e);
       setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === aiMessageId ? { ...msg, text: GENERIC_API_ERROR_MESSAGE, isStreaming: false, error: true } : msg
        )
      );
      setError(GENERIC_API_ERROR_MESSAGE);
      setIsLoading(false);
    }
  }, [isLoading, chatSession, apiKey]);

  if (isApiKeyNeeded && !apiKey) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-slate-100 p-4">
        <Header />
        <div className="mt-8 p-6 bg-slate-800 rounded-lg shadow-xl w-full max-w-md">
          <h2 className="text-xl font-semibold text-center mb-4 text-indigo-400">Enter Gemini API Key</h2>
          <p className="text-sm text-slate-300 mb-4">
            To use this chatbot, please enter your Google Gemini API key. 
            You can obtain one from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">Google AI Studio</a>.
            Your API key will be stored locally in your browser.
          </p>
          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
          <form onSubmit={handleApiKeySubmit}>
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Enter your API Key"
              className="w-full p-3 mb-4 bg-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              aria-label="Gemini API Key"
            />
            <button
              type="submit"
              className="w-full p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors duration-150"
            >
              Save and Start Chatting
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100">
      <Header />
      {/* Display general errors if API key IS present but something else went wrong, and it's not an API key needed error */}
      {error && apiKey && !isApiKeyNeeded && (
        <div className="p-2 bg-yellow-500 text-black text-center text-sm">
          {error}
        </div>
      )}
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && messages.some(m => m.isStreaming) && (
           <div className="flex justify-start">
             <div className="bg-slate-700 p-3 rounded-lg max-w-xl flex items-center space-x-2">
                <LoadingSpinner />
                <span className="text-sm text-slate-400">AI is thinking...</span>
            </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading || !chatSession || !apiKey} />
    </div>
  );
};

export default App;
