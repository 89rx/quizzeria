'use client';

import { forwardRef, useState, useEffect } from 'react';
import { Button } from './ui/button';
import { PlusCircle, LayoutDashboard, MessageSquare, History, FileText } from 'lucide-react'; 

export type Chat = {
  id: string;
  created_at: string;
  title?: string | null; 
};

interface ChatHistoryProps {
  chats: Chat[];
  currentChatId: string | null;
  setCurrentChatId: (chatId: string | null) => void;
  onShowDashboard: () => void;
}

export const ChatHistory = forwardRef<HTMLDivElement, ChatHistoryProps>(({ chats, currentChatId, setCurrentChatId, onShowDashboard }, ref) => {
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const checkWidth = () => {
      setIsNarrow(window.innerWidth < 1024); // lg breakpoint
    };

    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  return (
    <div ref={ref} className="flex flex-col h-full bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200/60 p-4 shadow-sm">
      
      <div className="flex flex-col gap-3 border-b border-gray-200/60 pb-4">
        {isNarrow ? (
          // icons onyl
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <History className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-semibold text-gray-700">Chats</span>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={onShowDashboard}
                className="h-8 w-8 bg-amber-50 border-amber-200 hover:bg-amber-100"
              >
                <LayoutDashboard className="h-4 w-4 text-amber-600" />
              </Button>
              <Button 
                size="icon" 
                onClick={() => setCurrentChatId(null)}
                className="h-8 w-8 bg-blue-600 hover:bg-blue-700"
              >
                <PlusCircle className="h-4 w-4 text-white" />
              </Button>
            </div>
          </div>
        ) : (
          // full buns
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <h2 className="font-bold text-lg text-gray-800">Chat History</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onShowDashboard}
                className="flex-1 bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Progress
              </Button>
              <Button 
                size="sm" 
                onClick={() => setCurrentChatId(null)}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                New Chat
              </Button>
            </div>
          </div>
        )}
      </div>

      
      <div className="flex-1 overflow-y-auto mt-4 space-y-1">
        {chats.length > 0 ? (
          chats.map((chat) => (
            <Button
              key={chat.id}
              variant={currentChatId === chat.id ? 'secondary' : 'ghost'}
              className={cn(
                "w-full justify-start transition-all duration-200",
                isNarrow ? "px-2 min-h-8" : "px-3 min-h-10",
                currentChatId === chat.id 
                  ? "bg-blue-100 border border-blue-200 text-blue-800 hover:bg-blue-200" 
                  : "text-gray-700 hover:bg-gray-100/80 hover:text-gray-900"
              )}
              onClick={() => setCurrentChatId(chat.id)}
            >
              <div className={cn(
                "truncate text-left flex items-center gap-2",
                isNarrow ? "text-xs" : "text-sm"
              )}>
                {isNarrow && <MessageSquare className="h-3 w-3 flex-shrink-0" />}
                <span className="truncate">
                  {chat.title || `Chat ${new Date(chat.created_at).toLocaleDateString()}`}
                </span>
              </div>
            </Button>
          ))
        ) : (
          <div className={cn(
            "text-center text-muted-foreground mt-8 p-4 rounded-lg bg-gray-50/50 border border-gray-200/40",
            isNarrow ? "text-xs" : "text-sm"
          )}>
            <MessageSquare className="h-6 w-6 mx-auto mb-2 text-gray-400" />
            <p>No chats yet.</p>
            {!isNarrow && <p className="mt-1">Start a new chat to begin</p>}
          </div>
        )}
      </div>

      {!isNarrow && chats.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200/60">
          <div className="text-xs text-gray-500 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <FileText className="h-3 w-3" />
              <span>{chats.length} chat{chats.length > 1 ? 's' : ''}</span>
            </div>
            <div className="text-[10px] text-gray-400">
              Click to switch between chats
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

ChatHistory.displayName = 'ChatHistory';


function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}