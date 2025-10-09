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
  const [chats, setChats] = useState<Chat[]>([]);
  const [parentChatId, setParentChatId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [indexedDocs, setIndexedDocs] = useState<string[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<string>('all');
  const [sessionFiles, setSessionFiles] = useState<File[]>([]);
  const [fileToView, setFileToView] = useState<File | null>(null);

  const { messages, input, handleInputChange, handleSubmit, setMessages, isLoading } = useChat({
    api: '/api/chat',
    id: parentChatId ?? undefined,
    body: {
      parentChatId: parentChatId,
      selectedDoc: selectedDoc,
    },
  });

  useEffect(() => {
    const fetchChats = async () => {
      const { data, error } = await supabase.from('chats').select('*').order('created_at', { ascending: false });
      if (error) console.error('Error fetching chats:', error);
      else setChats(data as Chat[]);
    };
    fetchChats();
  }, []);
  
  useEffect(() => {
    const fetchDocsForChat = async () => {
      if (parentChatId) {
        const { data, error } = await supabase
          .from('documents')
          .select('metadata->>source')
          .like('chat_id', `${parentChatId}_%`);

        if (error) {
          console.error('Error fetching documents for chat:', error);
        } else {
          const sources = data.map(item => (item as any).source);
          setIndexedDocs([...new Set(sources)]);
        }
      } else {
        setIndexedDocs([]);
        setSessionFiles([]);
        setFileToView(null);
      }
    };
    
    fetchDocsForChat();
    setMessages([]);
    setSelectedDoc('all');
  }, [parentChatId, setMessages]);

  useEffect(() => {
    if (selectedDoc === 'all') {
      setFileToView(sessionFiles[0] || null);
    } else {
      const file = sessionFiles.find(f => f.name === selectedDoc);
      setFileToView(file || null);
    }
  }, [selectedDoc, sessionFiles]);

  const handleFileSelectAndUpload = async (files: File[]) => {
    setIsUploading(true);
    let currentParentId = parentChatId;

    // --- START OF FIX: Check if this is the first upload for the chat ---
    const isFirstUpload = indexedDocs.length === 0;
    // --- END OF FIX ---

    try {
      if (!currentParentId) {
        const { data, error } = await supabase.from('chats').insert({}).select('id').single();
        if (error) throw new Error(`Could not create new chat: ${error.message}`);
        currentParentId = data.id;
        setParentChatId(currentParentId);
        setChats(prev => [{ id: currentParentId!, created_at: new Date().toISOString(), title: 'Generating title...' }, ...prev]);
      }
      
      const newFileNames: string[] = [];
      
      for (const file of files) {
        setSessionFiles(prev => [...prev, file]);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('parentChatId', currentParentId!);
        const response = await fetch('/api/ingest', { method: 'POST', body: formData });
        if (!response.ok) throw new Error(`Failed to index ${file.name}`);
        newFileNames.push(file.name);
      }
      
      setIndexedDocs(prev => [...new Set([...prev, ...newFileNames])]);
      
      // --- START OF FIX: Only generate a title on the first upload ---
      if (isFirstUpload) {
        const titleResponse = await fetch('/api/generate-title', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatId: currentParentId })
        });

        if (titleResponse.ok) {
          const { title } = await titleResponse.json();
          if (title) {
            setChats(prev => prev.map(chat => chat.id === currentParentId ? { ...chat, title: title } : chat));
          }
        }
      }
      // --- END OF FIX ---
      
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
              currentChatId={parentChatId}
              setCurrentChatId={setParentChatId}
            />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={40} minSize={30}>
          <div className="p-4 h-full">
            <PDFViewer file={fileToView} isUploading={isUploading} />
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
              onFileSelectAndUpload={handleFileSelectAndUpload}
              chatId={parentChatId}
              isLoading={isLoading || isUploading}
              indexedDocs={indexedDocs}
              indexedDocCount={indexedDocs.length}
              selectedDoc={selectedDoc}
              setSelectedDoc={setSelectedDoc}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </main>
  );
}