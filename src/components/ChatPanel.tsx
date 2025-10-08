// src/components/ChatPanel.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useRef, useEffect, Dispatch, SetStateAction } from 'react';
import { Paperclip, Send } from 'lucide-react';
import type { Message } from 'ai/react';

interface ChatPanelProps {
  messages: Message[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onFileSelect: Dispatch<SetStateAction<File | null>>;
  chatId: string | null;
  isLoading: boolean;
}

export function ChatPanel({ messages, input, handleInputChange, handleSubmit, onFileSelect, chatId, isLoading }: ChatPanelProps) {
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
  
  const isInputDisabled = isLoading || !chatId;

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border">
      <div className="p-4 border-b">
        <h1 className="font-bold text-lg">Chat</h1>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex flex-col gap-4">
          {!chatId && messages.length === 0 && (
            <div className="text-center text-muted-foreground mt-8">
              <p>Please start a new chat or select an existing one.</p>
              <p className='text-sm'>To begin, upload a PDF.</p>
            </div>
          )}
          {messages.map((m) => (
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
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="w-full flex items-center gap-2">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="application/pdf" className="hidden" />
          
          <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
            <Paperclip className="h-5 w-5" />
          </Button>

          <Input
            value={input}
            onChange={handleInputChange}
            placeholder={!chatId ? "Upload a PDF to start..." : "Ask a question..."}
            disabled={isInputDisabled}
          />
          <Button type="submit" disabled={isInputDisabled}>
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}