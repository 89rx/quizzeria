
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface Question {
  id: string;
  question_text: string;
  question_type: 'MCQ' | 'SAQ';
  options?: string[];
}

interface QuizViewProps {
  quizData: { quizId: string; questions: Question[] };
  onSubmit: (answers: Record<string, string>) => void;
  isSubmitting: boolean;
}

export function QuizView({ quizData, onSubmit, isSubmitting }: QuizViewProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length !== quizData.questions.length) {
        alert("Please answer all questions before submitting.");
        return;
    }
    onSubmit(answers);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border p-6">
      <h2 className="text-2xl font-bold border-b pb-4 mb-6">Quiz Time!</h2>
      <div className="flex-1 overflow-y-auto space-y-8 pr-4">
        {quizData.questions.map((q, index) => (
          <div key={q.id}>
            <p className="font-semibold mb-3">{index + 1}. {q.question_text}</p>
            {q.question_type === 'MCQ' && q.options && (
              <RadioGroup onValueChange={(value: string) => handleAnswerChange(q.id, value)}>
                <div className="space-y-2">
                  {q.options.map((option, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`${q.id}-${i}`} />
                      <Label htmlFor={`${q.id}-${i}`}>{option}</Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}
            {q.question_type === 'SAQ' && (
              <Textarea
                placeholder="Your answer..."
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleAnswerChange(q.id, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-6 pt-4 border-t">
        <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
          {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : 'Submit Quiz'}
        </Button>
      </div>
    </div>
  );
}