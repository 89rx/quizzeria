'use client';

import { forwardRef, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Message } from 'ai/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Paperclip, Send, Loader2, GraduationCap, User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatPanelProps {
  messages: Message[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onFileSelectAndUpload: (files: File[]) => void;
  chatId: string | null;
  isLoading: boolean;
  indexedDocs: string[];
  indexedDocCount: number;
  selectedDoc: string;
  setSelectedDoc: (value: string) => void;
  onGenerateQuiz: () => void;
}

export const ChatPanel = forwardRef<HTMLDivElement, ChatPanelProps>(({ messages, input, handleInputChange, handleSubmit, onFileSelectAndUpload, chatId, isLoading, indexedDocs, indexedDocCount, selectedDoc, setSelectedDoc, onGenerateQuiz }, ref) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { 
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      
      
      const oversizedFiles = Array.from(files).filter(file => file.size > 3 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        alert(`Some files exceed the 3MB limit:\n${oversizedFiles.map(f => `• ${f.name} (${(f.size / 1024 / 1024).toFixed(1)}MB)`).join('\n')}\n\nPlease upload smaller PDF files.`);
        
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      // Check document limit
      if (indexedDocCount + files.length > 5) {
        alert(`You can only have a maximum of 5 documents per chat. You have already indexed ${indexedDocCount}.`);
        return;
      }

      onFileSelectAndUpload(Array.from(files));
      
      // Clear the input for future uploads
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const isInputDisabled = isLoading || !chatId;
  const isFileLimitReached = indexedDocCount >= 5;

  return (
    <div ref={ref} className="flex flex-col h-full bg-white rounded-lg border shadow-sm">
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex justify-between items-center">
        <h1 className="font-bold text-lg text-gray-800">Chat</h1>
        {chatId && indexedDocs.length > 0 && (
          <Select value={selectedDoc} onValueChange={setSelectedDoc}>
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Select a document" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Documents</SelectItem>
              {indexedDocs.map((docName) => (
                <SelectItem key={docName} value={docName}>{docName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50/50">
        <div className="flex flex-col gap-4">
          {!chatId && messages.length === 0 && (
            <div className="text-center text-muted-foreground mt-8 p-6 bg-white rounded-lg border">
              <Bot className="h-12 w-12 mx-auto mb-4 text-blue-500" />
              <p className="text-lg font-medium text-gray-700">Welcome to Study Assistant</p>
              <p className="text-sm text-gray-500 mt-2">Start a new chat and upload PDFs to begin learning</p>
              <div className="mt-4 text-xs text-gray-400 bg-blue-50 p-3 rounded border">
                <p><strong>Note:</strong> PDF files must be under 3MB</p>
              </div>
            </div>
          )}
          
          {messages.map((m) => (
            <div 
              key={m.id} 
              className={cn(
                'flex gap-3 p-4 rounded-lg max-w-[90%] transition-all duration-200',
                m.role === 'user' 
                  ? 'bg-blue-600 text-white self-end ml-auto' 
                  : 'bg-white border shadow-sm self-start'
              )}
            >
              <div className={cn(
                'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1',
                m.role === 'user' ? 'bg-blue-700' : 'bg-green-100 text-green-600'
              )}>
                {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              
              <div className="flex-1 min-w-0">
                {m.role === 'user' ? (
                  <div className="whitespace-pre-wrap break-words">{m.content}</div>
                ) : (
                  <div className="prose prose-sm max-w-none break-words">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="ml-4">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                        em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
                        code: ({ children }) => <code className="bg-gray-100 rounded px-1 py-0.5 text-sm">{children}</code>,
                        pre: ({ children }) => <pre className="bg-gray-100 rounded p-3 overflow-x-auto text-sm my-2">{children}</pre>,
                      }}
                    >
                      {m.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <div className="p-4 border-t bg-white">
        <form onSubmit={handleSubmit} className="w-full flex items-center gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="application/pdf" 
            className="hidden" 
            multiple 
            disabled={isFileLimitReached || isLoading} 
          />
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon" 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={isFileLimitReached || isLoading}
                  className="flex-shrink-0"
                >
                  {isLoading && !messages.length ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Paperclip className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Upload PDF files (max 3MB each)</p>
                {isFileLimitReached && (
                  <p className="text-red-500">Maximum of 5 documents reached</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Input 
            value={input} 
            onChange={handleInputChange} 
            placeholder={!chatId ? "Upload PDFs to start..." : "Ask a question about your documents..."} 
            disabled={isInputDisabled}
            className="flex-1"
          />
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon" 
                  onClick={onGenerateQuiz} 
                  disabled={!chatId || isLoading}
                  className="flex-shrink-0"
                >
                  <GraduationCap className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Generate Quiz from Documents</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button 
            type="submit" 
            disabled={isInputDisabled} 
            className="flex-shrink-0 bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
        
        
        <div className="mt-2 text-xs text-gray-500 text-center">
          <p>PDF files must be under 3MB • Max 5 documents per chat</p>
        </div>
      </div>
    </div>
  );
});

ChatPanel.displayName = 'ChatPanel';