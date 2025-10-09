import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { findBestMatch } from 'string-similarity';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { quizId, userAnswers, userId } = body;

    if (!quizId || !userAnswers || !userId) {
      return NextResponse.json({ error: 'quizId, userAnswers, and userId are required' }, { status: 400 });
    }

    const { data: userProgressTopics } = await supabase
        .from('user_progress')
        .select('topic')
        .eq('user_id', userId);
    
    const existingTopics = userProgressTopics?.map(t => t.topic) || [];

    const { data: correctQuestions, error: fetchError } = await supabase
      .from('questions')
      .select('id, correct_answer, question_type, topic')
      .eq('quiz_id', quizId);

    if (fetchError) throw new Error(`DB Error: ${fetchError.message}`);
    
    let score = 0;
    const topicUpdates = new Map<string, { correct: number, total: number }>();

    correctQuestions.forEach(question => {
      const userAnswer = userAnswers[question.id];
      const isCorrect = userAnswer?.toLowerCase() === question.correct_answer.toLowerCase();
      
      if (isCorrect) score++;

      if (question.topic) {
        let normalizedTopic = question.topic;
        if (existingTopics.length > 0) {
          const match = findBestMatch(question.topic, existingTopics);
          if (match.bestMatch.rating > 0.8) {
            normalizedTopic = match.bestMatch.target;
          }
        }
        
        const update = topicUpdates.get(normalizedTopic) || { correct: 0, total: 0 };
        update.total += 1;
        if (isCorrect) update.correct += 1;
        topicUpdates.set(normalizedTopic, update);
      }
    });

    const progressUpdatePromises = Array.from(topicUpdates.entries()).map(([topic, counts]) => {
      return supabase.rpc('update_user_progress_batch', {
        p_user_id: userId,
        p_topic: topic,
        p_correct_increment: counts.correct,
        p_total_increment: counts.total,
      });
    });

    await Promise.all(progressUpdatePromises);

    await supabase
      .from('user_attempts')
      .insert({ quiz_id: quizId, user_answers: userAnswers, score: score });

    const { data: fullQuizData, error: fullQuizError } = await supabase
      .from('questions')
      .select('*')
      .eq('quiz_id', quizId);
    
    if (fullQuizError) throw new Error(`DB Error on final fetch: ${fullQuizError.message}`);

    return NextResponse.json({
      score,
      total: correctQuestions.length,
      results: fullQuizData,
      userAnswers,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}