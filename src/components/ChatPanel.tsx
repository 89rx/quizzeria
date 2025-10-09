'use client';

// 1. Import `forwardRef` from React
import { forwardRef, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Message } from 'ai/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Paperclip, Send, Loader2, GraduationCap } from 'lucide-react';
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

// 2. Wrap the component definition in `forwardRef`
export const ChatPanel = forwardRef<HTMLDivElement, ChatPanelProps>(({ messages, input, handleInputChange, handleSubmit, onFileSelectAndUpload, chatId, isLoading, indexedDocs, indexedDocCount, selectedDoc, setSelectedDoc, onGenerateQuiz }, ref) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      if (indexedDocCount + files.length > 5) {
        alert(`You can only have a maximum of 5 documents per chat. You have already indexed ${indexedDocCount}.`);
        return;
      }
      onFileSelectAndUpload(Array.from(files));
    }
  };
  
  const isInputDisabled = isLoading || !chatId;
  const isFileLimitReached = indexedDocCount >= 5;

  return (
    // 3. Attach the forwarded `ref` to the main div element
    <div ref={ref} className="flex flex-col h-full bg-white rounded-lg border">
      <div className="p-4 border-b flex justify-between items-center">
        <h1 className="font-bold text-lg">Chat</h1>
        {chatId && indexedDocs.length > 0 && (
          <Select value={selectedDoc} onValueChange={setSelectedDoc}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select a document" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Documents</SelectItem>
              {indexedDocs.map((docName) => (<SelectItem key={docName} value={docName}>{docName}</SelectItem>))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
         <div className="flex flex-col gap-4">
          {!chatId && messages.length === 0 && (
            <div className="text-center text-muted-foreground mt-8">
              <p>Please start a new chat or select an existing one.</p>
              <p className='text-sm'>To begin, upload one or more PDFs.</p>
            </div>
          )}
          {messages.map((m) => ( <div key={m.id} className={cn( 'p-3 rounded-lg text-sm whitespace-pre-wrap max-w-[80%]', m.role === 'user' ? 'bg-blue-600 text-white self-end' : 'bg-gray-100 self-start' )}>{m.content}</div>))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="w-full flex items-center gap-2">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="application/pdf" className="hidden" multiple disabled={isFileLimitReached || isLoading} />
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isFileLimitReached || isLoading}>
                  {isLoading && !messages.length ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              {isFileLimitReached && ( <TooltipContent><p>Maximum of 5 documents per chat reached.</p></TooltipContent> )}
            </Tooltip>
          </TooltipProvider>

          <Input value={input} onChange={handleInputChange} placeholder={!chatId ? "Upload PDFs to start..." : "Ask a question..."} disabled={isInputDisabled} />
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="ghost" size="icon" onClick={onGenerateQuiz} disabled={!chatId || isLoading}>
                  <GraduationCap className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Generate Quiz from Documents</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button type="submit" disabled={isInputDisabled}><Send className="h-5 w-5" /></Button>
        </form>
      </div>
    </div>
  );
});

ChatPanel.displayName = 'ChatPanel';