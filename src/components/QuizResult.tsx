// src/components/QuizResult.tsx
'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Result {
  id: string;
  question_text: string;
  correct_answer: string;
  explanation: string;
}

interface QuizResultProps {
  resultData: {
    score: number;
    total: number;
    results: Result[];
    userAnswers: Record<string, string>;
  };
  onFinish: () => void;
}

export function QuizResult({ resultData, onFinish }: QuizResultProps) {
  return (
    <div className="flex flex-col h-full bg-white rounded-lg border p-6">
      <div className="border-b pb-4 mb-6 text-center">
        <h2 className="text-2xl font-bold">Quiz Results</h2>
        <p className="text-4xl font-bold mt-2 text-blue-600">
            {resultData.score} / {resultData.total}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto space-y-6 pr-4">
        {resultData.results.map((res, index) => {
            const userAnswer = resultData.userAnswers[res.id];
            const isCorrect = userAnswer?.toLowerCase() === res.correct_answer.toLowerCase();
            return (
                <div key={res.id}>
                    <p className="font-semibold">{index + 1}. {res.question_text}</p>
                    <div className={cn("flex items-start space-x-2 mt-2 p-2 rounded-md", isCorrect ? 'bg-green-50' : 'bg-red-50')}>
                       {isCorrect ? <CheckCircle2 className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" /> : <XCircle className="h-5 w-5 text-red-600 mt-1 flex-shrink-0" />}
                       <div>
                           <p className={cn("font-medium", isCorrect ? 'text-green-800' : 'text-red-800')}>Your answer: {userAnswer || "No answer"}</p>
                           {!isCorrect && <p className="text-sm font-medium text-gray-700">Correct answer: {res.correct_answer}</p>}
                       </div>
                    </div>
                    <div className="mt-2 p-2 bg-gray-50 rounded-md">
                        <p className="text-sm font-semibold text-gray-800">Explanation:</p>
                        <p className="text-sm text-gray-600">{res.explanation}</p>
                    </div>
                </div>
            )
        })}
      </div>
      <div className="mt-6 pt-4 border-t">
        <Button onClick={onFinish} className="w-full">
            Back to Chat
        </Button>
      </div>
    </div>
  );
}