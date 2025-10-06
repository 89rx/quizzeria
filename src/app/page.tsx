'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setMessage('Please select a file first.');
      return;
    }

    setIsLoading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'File uploaded successfully!');
      } else {
        setMessage(data.error || 'An error occurred during upload.');
      }
    } catch (error) {
      console.error('Submission error:', error);
      setMessage('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg border bg-white p-8 shadow-md">
        <h1 className="mb-4 text-center text-2xl font-bold">
          Upload Your Coursebook
        </h1>
        <p className="mb-6 text-center text-sm text-gray-600">
          Upload a PDF to start generating quizzes.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input id="pdf" type="file" onChange={handleFileChange} />
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Uploading...' : 'Upload PDF'}
          </Button>
        </form>
        {message && (
          <p className="mt-4 text-center text-sm text-gray-700">{message}</p>
        )}
      </div>
    </main>
  );
}