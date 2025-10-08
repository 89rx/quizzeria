// src/app/page.tsx
'use client';

import { useState } from 'react';
import { ChatPanel } from '@/components/ChatPanel';
import { PDFViewer } from '@/components/PDFViewer';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable" // Assuming you have this from ShadCN/UI

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'initial' | 'uploading' | 'success' | 'error'>('initial');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // This logic is now lifted up to the parent page component
  const handleUpload = async () => {
    if (!file) return;

    setUploadStatus('uploading');
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/ingest', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setUploadStatus('success');
        alert("PDF Indexed Successfully! You can now ask questions about it.");
      } else {
        const errorData = await response.json();
        setUploadError(`Upload Failed: ${errorData.error || response.statusText}`);
        setUploadStatus('error');
        alert(`Upload Failed: ${errorData.error || response.statusText}`);
      }
    } catch (err) {
      setUploadError('A network error occurred during upload.');
      setUploadStatus('error');
      alert('A network error occurred during upload.');
    }
  };


  return (
    <main className="h-screen bg-gray-50">
      <ResizablePanelGroup direction="horizontal" className="h-full w-full">
        <ResizablePanel defaultSize={50}>
          <div className="p-4 h-full">
            <PDFViewer 
              file={file} 
              handleUpload={handleUpload}
              isUploading={uploadStatus === 'uploading'} 
            />
          </div>
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        <ResizablePanel defaultSize={50}>
          <div className="p-4 h-full">
            <ChatPanel onFileSelect={setFile} />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </main>
  );
}