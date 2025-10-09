'use client';

import { useState, useEffect } from 'react';
import { useChat } from 'ai/react';
import { v4 as uuidv4 } from 'uuid';
import { ChatPanel } from '@/components/ChatPanel';
import { PDFViewer } from '@/components/PDFViewer';
import { ChatHistory, type Chat } from '@/components/ChatHistory';
import { supabase } from '@/lib/supabaseClient';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { QuizView } from '@/components/QuizView';
import { QuizResult } from '@/components/QuizResult';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DashboardView } from '@/components/DashboardView';

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [parentChatId, setParentChatId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [indexedDocs, setIndexedDocs] = useState<string[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<string>('all');
  const [sessionFiles, setSessionFiles] = useState<File[]>([]);
  const [fileToView, setFileToView] = useState<File | null>(null);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);

  type ViewMode = 'chat' | 'quiz' | 'result';
  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  const [quizData, setQuizData] = useState<any>(null);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);

  useEffect(() => {
    let storedUserId = localStorage.getItem('anonymousUserId');
    if (!storedUserId) {
      storedUserId = uuidv4();
      localStorage.setItem('anonymousUserId', storedUserId);
    }
    setUserId(storedUserId);
  }, []);

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
  
  const resetToChatView = () => {
    setViewMode('chat');
    setQuizData(null);
    setQuizResult(null);
  };
  
  const handleShowDashboard = () => {
    resetToChatView();
    setIsDashboardOpen(true);
  }

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
    resetToChatView();
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
    const isFirstUpload = indexedDocs.length === 0;

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
      
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!parentChatId) return;
    setIsGeneratingQuiz(true);
    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentChatId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate quiz.');
      }
      const data = await response.json();
      setQuizData(data);
      setViewMode('quiz');
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleSubmitQuiz = async (answers: Record<string, string>) => {
    setIsDashboardOpen(false);
    if (!quizData || !userId) return;
    setIsSubmittingQuiz(true);
    try {
      const response = await fetch('/api/submit-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: quizData.quizId, userAnswers: answers, userId: userId }),
      });
       if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit quiz.');
      }
      const data = await response.json();
      setQuizResult(data);
      setViewMode('result');
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  return (
    <main className="h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 p-4">
      <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg">
     
        <ResizablePanel defaultSize={25} minSize={16} maxSize={35} className="min-w-[200px]">
          <div className="h-full pr-2">
            <ChatHistory 
              chats={chats}
              currentChatId={parentChatId}
              setCurrentChatId={setParentChatId}
              onShowDashboard={handleShowDashboard}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-gray-300/50 hover:bg-gray-400/60 transition-colors" />

        <ResizablePanel defaultSize={37.5} minSize={30} className="min-w-[300px]">
          <div className="h-full px-2">
            {viewMode === 'chat' && <PDFViewer file={fileToView} isUploading={isUploading || isGeneratingQuiz} />}
            {viewMode === 'quiz' && quizData && <QuizView quizData={quizData} onSubmit={handleSubmitQuiz} isSubmitting={isSubmittingQuiz}/>}
            {viewMode === 'result' && quizResult && <QuizResult resultData={quizResult} onFinish={resetToChatView}/>}
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-gray-300/50 hover:bg-gray-400/60 transition-colors" />

      
        <ResizablePanel defaultSize={37.5} minSize={30} className="min-w-[300px]">
          <div className="h-full pl-2">
            <ChatPanel 
              messages={messages}
              input={input}
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmit}
              onFileSelectAndUpload={handleFileSelectAndUpload}
              chatId={parentChatId}
              isLoading={isLoading || isUploading || isGeneratingQuiz}
              indexedDocs={indexedDocs}
              indexedDocCount={indexedDocs.length}
              selectedDoc={selectedDoc}
              setSelectedDoc={setSelectedDoc}
              onGenerateQuiz={handleGenerateQuiz}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      <Dialog open={isDashboardOpen} onOpenChange={setIsDashboardOpen}>
        <DialogContent className="sm:max-w-2xl bg-white/95 backdrop-blur-sm">
            <DashboardView />
        </DialogContent>
      </Dialog>
    </main>
  );
}