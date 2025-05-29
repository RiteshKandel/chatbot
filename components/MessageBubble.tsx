
import React from 'react';
import { type ChatMessage } from '../types';
import { LoadingSpinner } from './LoadingSpinner';

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  const bubbleClasses = isUser
    ? 'bg-blue-600 text-white ml-auto'
    : 'bg-slate-700 text-slate-100';
  
  const formattedTimestamp = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`p-3 rounded-lg max-w-xl lg:max-w-2xl shadow ${bubbleClasses}`}>
        {message.error && (
            <div className="text-red-300 font-semibold mb-1">Error</div>
        )}
        <p className="whitespace-pre-wrap break-words">
            {message.text}
            {message.isStreaming && !message.text && <LoadingSpinner size="sm" />}
        </p>
        <div className={`text-xs mt-1 ${isUser ? 'text-blue-200 text-right' : 'text-slate-400'}`}>
          {formattedTimestamp} {message.isStreaming && !message.error ? ' (streaming...)' : ''}
        </div>
      </div>
    </div>
  );
};
