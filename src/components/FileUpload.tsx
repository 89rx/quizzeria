'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Loader2, X } from 'lucide-react';

// Define the component's state
type UploadState = 'initial' | 'uploading' | 'success' | 'error';

export function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadState>('initial');
  const [error, setError] = useState<string | null>(null);

  // Function to handle the file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      if (selectedFile.type !== 'application/pdf') {
        setError('Only PDF files are allowed.');
        setFile(null);
      } else {
        setFile(selectedFile);
        setError(null);
        setUploadStatus('initial'); // Reset status when a new file is selected
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      'application/pdf': ['.pdf'],
    },
  });

  // Function to handle file submission to the /api/ingest route
  const handleUpload = async () => {
    if (!file) return;

    setUploadStatus('uploading');
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // FIX: The fetch request now correctly points to your ingest API route
      const response = await fetch('/api/ingest', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setUploadStatus('success');
        // You can optionally clear the file after a delay to show the success state
        setTimeout(() => {
          setFile(null);
          setUploadStatus('initial');
        }, 2000); 
        // Logic to refresh chat list or context would go here
      } else {
        const errorData = await response.json();
        setError(`Upload Failed: ${errorData.error || response.statusText}`);
        setUploadStatus('error');
      }
    } catch (err) {
      setError('A network error occurred.');
      setUploadStatus('error');
    }
  };
  
  return (
    <div className="flex flex-col space-y-4 w-full max-w-md">
      {/* Dropzone Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50/50' : 'border-gray-300 hover:border-gray-500'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-8 w-8 text-gray-500 mb-2" />
        <p className="text-sm text-gray-700">
          {isDragActive ? "Drop the PDF here..." : "Drag 'n' drop a PDF here, or click to select"}
        </p>
      </div>

      {/* File Preview and Status */}
      {file && (
        <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
          <div className="flex items-center space-x-2 overflow-hidden">
            <FileText className="h-5 w-5 text-indigo-500 flex-shrink-0" />
            <span className="text-sm font-medium truncate">{file.name}</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setFile(null)}
            disabled={uploadStatus === 'uploading'}
          >
            <X className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      )}

      {/* Upload Button and Progress */}
      <Button
        onClick={handleUpload}
        disabled={!file || uploadStatus === 'uploading'}
        className="w-full"
      >
        {uploadStatus === 'uploading' ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Indexing PDF...
          </>
        ) : uploadStatus === 'success' ? (
            'Indexed Successfully!'
        ) : (
            'Upload and Index PDF'
        )}
      </Button>

      {/* Status Message */}
      {error && (
        <p className="text-sm text-center text-red-500">
            {error}
        </p>
      )}
    </div>
  );
}