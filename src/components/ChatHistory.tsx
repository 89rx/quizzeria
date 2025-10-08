// src/components/ChatHistory.tsx
'use client';

import { PlusCircle } from 'lucide-react';
import { Button } from './ui/button';

// Define the shape of a chat object
export type Chat = {
  id: string;
  created_at: string;
};

interface ChatHistoryProps {
  chats: Chat[];
  currentChatId: string | null;
  setCurrentChatId: (chatId: string | null) => void;
}

export function ChatHistory({ chats, currentChatId, setCurrentChatId }: ChatHistoryProps) {
  return (
    <div className="flex flex-col h-full bg-white rounded-lg border p-4">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="font-bold text-lg">Chat History</h2>
        <Button size="sm" onClick={() => setCurrentChatId(null)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto mt-4 space-y-2">
        {chats.length > 0 ? (
          chats.map((chat) => (
            <Button
              key={chat.id}
              variant={currentChatId === chat.id ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setCurrentChatId(chat.id)}
            >
              <div className="truncate">
                Chat from {new Date(chat.created_at).toLocaleString()}
              </div>
            </Button>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center mt-4">No chats yet.</p>
        )}
      </div>
    </div>
  );
}