'use client';

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Loader2, Upload, FileText } from 'lucide-react';

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
    <div className="flex flex-col h-full bg-white rounded-lg border shadow-sm">
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex justify-between items-center">
        <h2 className="font-bold text-lg text-gray-800">Document Viewer</h2>
        <div className="flex items-center gap-2">
          {file && numPages && (
            <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded border">
              {numPages} page{numPages > 1 ? 's' : ''}
            </span>
          )}
          {isUploading && <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50/30">
        {file ? (
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(error) => alert(`Error loading PDF: ${error.message}`)}
            loading={
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            }
            className="flex flex-col items-center p-4"
          >
            {Array.from(new Array(numPages || 0), (el, index) => (
              <div key={`page_${index + 1}`} className="mb-6 last:mb-0">
                <div className="text-xs text-gray-500 mb-2 text-center">
                  Page {index + 1} of {numPages}
                </div>
                <Page
                  pageNumber={index + 1}
                  width={Math.min(700, window.innerWidth * 0.8)}
                  className="shadow-lg border rounded"
                  loading={
                    <div className="flex items-center justify-center h-96">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    </div>
                  }
                />
              </div>
            ))}
          </Document>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
            <FileText className="h-16 w-16 mb-4 text-gray-400" />
            <p className="text-lg font-medium text-gray-600 mb-2">No Document Selected</p>
            <p className="text-sm text-center text-gray-500 max-w-md">
              Upload a PDF document to view it here. The document will be displayed alongside the chat for easy reference.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}