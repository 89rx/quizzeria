// src/components/DashboardView.tsx
'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from '@/components/ui/progress';

interface ProgressData {
  topic: string;
  correct_attempts: number;
  total_attempts: number;
}

export function DashboardView() {
  const [progress, setProgress] = useState<ProgressData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/progress');
        const data = await response.json();
        setProgress(data);
      } catch (error) {
        console.error("Failed to fetch progress", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return <div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }
  
  if (progress.length === 0) {
      return (
          <div className="text-center h-96 flex flex-col justify-center items-center">
              <p className="text-lg font-medium">No Progress Yet</p>
              <p className="text-sm text-muted-foreground">Complete a quiz to start tracking your learning journey!</p>
          </div>
      )
  }

  const sortedProgress = [...progress].sort((a, b) => (b.correct_attempts / b.total_attempts) - (a.correct_attempts / a.total_attempts));

  return (
    <Card className="border-0 shadow-none">
        <CardHeader>
            <CardTitle>Your Progress Summary</CardTitle>
        </CardHeader>
        {/* ADDED max-h-[60vh] and overflow-y-auto FOR SCROLLING */}
        <CardContent className="max-h-[60vh] overflow-y-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[40%]">Topic</TableHead>
                        <TableHead>Mastery</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedProgress.map(p => {
                        const percentage = p.total_attempts > 0 ? Math.round((p.correct_attempts / p.total_attempts) * 100) : 0;
                        return (
                            <TableRow key={p.topic}>
                                <TableCell className="font-medium">{p.topic}</TableCell>
                                <TableCell>
                                    <Progress value={percentage} />
                                </TableCell>
                                <TableCell className="text-right">{p.correct_attempts} / {p.total_attempts}</TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
  );
}