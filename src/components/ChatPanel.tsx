'use client';

// V2 Import: Use the correct path for Vercel AI SDK v2
import { useChat } from 'ai/react'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useRef, useEffect } from 'react';

export function ChatPanel() {
  // V2 Syntax: Defaults to /api/chat. 
  // We explicitly set it just to be safe, though not strictly required in V2.
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/chat',
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    // h-full works now because Tailwind is correctly installed (V3)
    <div className="flex flex-col h-full bg-white rounded-lg border"> 
      <div className="p-4 border-b">
        <h1 className="font-bold text-lg">Chat</h1>
      </div>

      {/* The scrolling container */}
      <div className="flex-1 p-4 overflow-y-auto h-full"> 
        <div className="flex flex-col gap-4">
          {messages.length > 0 ? (
            messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  // Ensure proper rendering of streaming text and size control
                  'p-3 rounded-lg text-sm whitespace-pre-wrap max-w-[80%]',
                  m.role === 'user' 
                    ? 'bg-primary text-primary-foreground self-end' 
                    : 'bg-muted self-start' 
                )}
              >
                {m.content}
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">Ask a question to get started.</p>
          )}
          {/* Scroll reference */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="w-full flex gap-2">
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