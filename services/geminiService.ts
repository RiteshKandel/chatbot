
import { GoogleGenAI, type Chat, type GenerateContentResponse } from '@google/genai';
import { GEMINI_MODEL_NAME } from '../constants';

let ai: GoogleGenAI | null = null;
let currentApiKey: string | null = null; // Keep track of the key used for the current 'ai' instance

const getAiClient = (apiKey: string): GoogleGenAI => {
  // If no client exists, or if the provided apiKey is different from the one used for the current client
  if (!ai || currentApiKey !== apiKey) {
    // console.log("Initializing GoogleGenAI client with new API key."); // Optional: for debugging
    ai = new GoogleGenAI({ apiKey });
    currentApiKey = apiKey;
  }
  return ai;
};

export const initializeChat = (apiKey: string, systemInstruction?: string): Chat => {
  const client = getAiClient(apiKey); // Ensures client is using the correct apiKey
  const config: { systemInstruction?: string } = {};
  if (systemInstruction) {
    config.systemInstruction = systemInstruction;
  }
  
  return client.chats.create({
    model: GEMINI_MODEL_NAME,
    config: Object.keys(config).length > 0 ? config : undefined,
  });
};

export const streamMessage = async (
  chat: Chat,
  message: string,
  onChunk: (chunkText: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void
): Promise<void> => {
  try {
    const result = await chat.sendMessageStream({ message });
    for await (const chunk of result) { // chunk is GenerateContentResponse
      const textOutput = chunk.text; 
      
      if (typeof textOutput === 'string') {
        onChunk(textOutput);
      }
    }
    onComplete();
  } catch (e) {
    console.error("Error streaming message:", e);
    onError(e instanceof Error ? e : new Error('Unknown streaming error'));
  }
};
