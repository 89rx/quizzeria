// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useChat } from 'ai/react';
import { ChatPanel } from '@/components/ChatPanel';
import { PDFViewer } from '@/components/PDFViewer';
import { ChatHistory, type Chat } from '@/components/ChatHistory';
import { supabase } from '@/lib/supabaseClient';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { messages, input, handleInputChange, handleSubmit, setMessages, isLoading } = useChat({
    api: '/api/chat',
    id: currentChatId ?? undefined,
    body: {
      chatId: currentChatId,
    },
  });

  useEffect(() => {
    const fetchChats = async () => {
      const { data, error } = await supabase.from('chats').select('*').order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching chats:', error);
      } else {
        setChats(data as Chat[]);
      }
    };
    fetchChats();
  }, []);
  
  useEffect(() => {
    setMessages([]);
  }, [currentChatId, setMessages]);

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    // Pass the current chat ID (or null if it's a new chat)
    if (currentChatId) {
      formData.append('chatId', currentChatId);
    }

    try {
      const response = await fetch('/api/ingest', { method: 'POST', body: formData });
      const result = await response.json();

      if (response.ok) {
        if (!currentChatId) {
          setCurrentChatId(result.chatId);
          setChats(prev => [{ id: result.chatId, created_at: new Date().toISOString() }, ...prev]);
        }
        alert("PDF Indexed Successfully!");
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="h-screen bg-gray-50">
      <ResizablePanelGroup direction="horizontal" className="h-full w-full">
        <ResizablePanel defaultSize={20} minSize={15}>
          <div className="p-4 h-full">
            <ChatHistory 
              chats={chats}
              currentChatId={currentChatId}
              setCurrentChatId={setCurrentChatId}
            />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={40} minSize={30}>
          <div className="p-4 h-full">
            <PDFViewer 
              file={file} 
              handleUpload={handleUpload}
              isUploading={isUploading} 
            />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={40} minSize={30}>
          <div className="p-4 h-full">
            <ChatPanel 
              messages={messages}
              input={input}
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmit}
              onFileSelect={setFile}
              chatId={currentChatId}
              isLoading={isLoading}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </main>
  );
}