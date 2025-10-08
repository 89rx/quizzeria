// src/components/ChatPanel.tsx
'use client';

import { useChat } from 'ai/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useRef, useEffect, Dispatch, SetStateAction } from 'react'; // Import Dispatch and SetStateAction
import { Paperclip } from 'lucide-react';

// CORRECTED PROP TYPE DEFINITION
interface ChatPanelProps {
  onFileSelect: Dispatch<SetStateAction<File | null>>;
}

export function ChatPanel({ onFileSelect }: ChatPanelProps) {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/chat',
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border">
      <div className="p-4 border-b">
        <h1 className="font-bold text-lg">Chat</h1>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex flex-col gap-4">
          {messages.length > 0 ? (
            messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  'p-3 rounded-lg text-sm whitespace-pre-wrap max-w-[80%]',
                  m.role === 'user'
                    ? 'bg-blue-600 text-white self-end'
                    : 'bg-gray-100 self-start'
                )}
              >
                {m.content}
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">Ask a question to get started.</p>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="w-full flex items-center gap-2">
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="application/pdf"
            className="hidden"
          />

          {/* Attach Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-5 w-5" />
          </Button>

          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask a question about the PDF..."
          />
          <Button type="submit">Send</Button>
        </form>
      </div>
    </div>
  );
}