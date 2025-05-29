
import React, { useState } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isLoading) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-slate-800 border-t border-slate-700 flex items-center space-x-3">
      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={isLoading ? "AI is responding..." : "Type your message..."}
        className="flex-grow p-3 bg-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-700"
        rows={1}
        disabled={isLoading}
        style={{ minHeight: '44px', maxHeight: '150px' }} // Control height
      />
      <button
        type="submit"
        disabled={isLoading || !inputText.trim()}
        className="p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors duration-150"
        aria-label="Send message"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path d="M3.105 3.105a.75.75 0 01.96-.02l13.027 7.237a.75.75 0 010 1.356L4.065 18.917a.75.75 0 01-1.145-.678V3.923c0-.34.18-.652.485-.818z" />
        </svg>
      </button>
    </form>
  );
};
