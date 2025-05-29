
export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
  isStreaming?: boolean;
  error?: boolean;
}
