'use client';

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Loader2, Upload } from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';

interface PDFViewerProps {
  file: File | null;
  isUploading: boolean;
}

export function PDFViewer({ file, isUploading }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="font-bold text-lg">Document Viewer</h2>
        {isUploading && <Loader2 className="h-5 w-5 animate-spin" />}
      </div>

      <div className="flex-1 overflow-y-auto">
        {file ? (
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(error) => alert(`Error loading PDF: ${error.message}`)}
            className="flex flex-col items-center p-4"
          >
            {Array.from(new Array(numPages || 0), (el, index) => (
              <Page
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                width={700}
                className="my-2 shadow-md"
              />
            ))}
          </Document>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Upload className="h-12 w-12 mb-4" />
            <p className="text-center">
              Upload a document to view it here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}