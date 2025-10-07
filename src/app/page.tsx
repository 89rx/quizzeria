'use client';

import { ChatPanel } from '@/components/ChatPanel';

export default function Home() {
  return (
    // min-h-screen ensures main covers the full viewport
    <main className="p-4 md:p-8 min-h-screen"> 
      {/* Set the container height and make it a vertical flex column */}
      <div className="mx-auto max-w-3xl space-y-4 flex flex-col h-[90vh]">
        
        {/* Header content does not use flex-1, so it takes only the height it needs */}
        <h1 className="text-2xl font-bold text-center">
          RAG Chat Application
        </h1>
        <p className="text-muted-foreground text-center">
          Ask a question about the PDF document.
        </p>

        {/* Chat Panel: The flex-1 ensures this div takes all available vertical space */}
        <div className="flex-1 min-h-0"> 
          {/* min-h-0 is a Tailwind/Flex trick to ensure the child can shrink and scroll */}
          <ChatPanel />
        </div>

        {/* PDF Viewer Placeholder */}
        <div className="h-40 flex items-center justify-center rounded-lg border">
          <span className="font-semibold">PDF Viewer Panel Placeholder</span>
        </div>
        
      </div>
    </main>
  );
}