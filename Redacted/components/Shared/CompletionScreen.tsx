'use client';

import { useState, useEffect } from 'react';
import type { Task } from '@/types/mystery';
import { getSupabaseBrowserClient } from '@/lib/supabaseClient';

// Type definitions for Supabase inserts
interface SessionAnalyticsInsert {
  case_id: string;
  player_name: string;
  total_time_seconds: number;
  hints_used: number;
  tasks_completed: number;
  session_code: string | null;
}

interface SessionAnalyticsResponse extends SessionAnalyticsInsert {
  id: string;
  created_at: string;
}

interface TaskCompletionLogInsert {
  session_id: string;
  case_id: string;
  task_idx: number;
  time_spent_seconds: number;
  hints_used: number;
  attempts: number;
}

interface CaseFeedbackInsert {
  case_id: string;
  rating: number;
  comment: string | null;
  time_spent: number;
  hints_used: number;
  player_name: string;
  session_code: string | null;
}

interface CompletionScreenProps {
  tasks: Task[];
  completedRevelations: Task[];
  hintsUsed: number;
  timeElapsed: number;
  taskCompletionTimes: Array<{ idx: number; timeSpent: number; hintsUsed: number }>;
  locale: string;
  detectives: Array<{ id: string; name: string; color: string }>;
}

export default function CompletionScreen({
  tasks,
  completedRevelations,
  hintsUsed,
  timeElapsed,
  taskCompletionTimes,
  locale,
  detectives,
}: CompletionScreenProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [analyticsSubmitted, setAnalyticsSubmitted] = useState(false);
  const [avgStats, setAvgStats] = useState<{ avgTime: number; avgHints: number } | null>(null);

  // Fetch average stats
  useEffect(() => {
    const fetchAvgStats = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase
          .from('session_analytics')
          .select('total_time_seconds, hints_used')
          .eq('case_id', 'silent-harbour');
        
        if (data && data.length > 0) {
          const avgTime = Math.floor(data.reduce((sum, s) => sum + s.total_time_seconds, 0) / data.length);
          const avgHints = Math.floor(data.reduce((sum, s) => sum + s.hints_used, 0) / data.length);
          setAvgStats({ avgTime, avgHints });
        }
      } catch (error) {
        console.error('Failed to fetch avg stats:', error);
      }
    };
    fetchAvgStats();
  }, []);

  // Submit analytics data automatically when component mounts
  useEffect(() => {
    const submitAnalytics = async () => {
      if (analyticsSubmitted) return;
      
      try {
        const supabase = getSupabaseBrowserClient();
        
        // Insert session analytics
        const insertData: SessionAnalyticsInsert = {
          case_id: 'silent-harbour',
          player_name: detectives[0]?.name || 'Anonymous',
          total_time_seconds: timeElapsed,
          hints_used: hintsUsed,
          tasks_completed: completedRevelations.length,
          session_code: null,
        };
        const { data: sessionData, error: sessionError } = await supabase
          .from('session_analytics')
          .insert(insertData)
          .select()
          .single();

        if (sessionError) throw sessionError;
        const typedSession = sessionData as unknown as SessionAnalyticsResponse;

        // Insert task completion logs
        if (typedSession && taskCompletionTimes.length > 0) {
          const taskLogs: TaskCompletionLogInsert[] = taskCompletionTimes.map(task => ({
            session_id: typedSession.id,
            case_id: 'silent-harbour',
            task_idx: task.idx,
            time_spent_seconds: task.timeSpent,
            hints_used: task.hintsUsed,
            attempts: 1,
          }));

          const { error: taskError } = await supabase
            .from('task_completion_log')
            .insert(taskLogs);

          if (taskError) throw taskError;
        }

        setAnalyticsSubmitted(true);
        console.log('Analytics submitted successfully');
      } catch (error) {
        console.error('Failed to submit analytics:', error);
      }
    };

    submitAnalytics();
  }, [analyticsSubmitted, detectives, timeElapsed, hintsUsed, completedRevelations.length, taskCompletionTimes]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleSubmitFeedback = async () => {
    if (rating === 0) return;
    
    setSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      
      // Also update the session_analytics with rating and comment
      const { error: updateError } = await supabase
        .from('session_analytics')
        .update({
          rating,
          comment: comment.trim() || null,
        })
        .eq('case_id', 'silent-harbour')
        .eq('player_name', detectives[0]?.name || 'Anonymous')
        .order('created_at', { ascending: false })
        .limit(1);

      if (updateError) console.error('Failed to update session with rating:', updateError);

      // Also insert legacy feedback for compatibility
      const feedbackData: CaseFeedbackInsert = {
        case_id: 'silent-harbour',
        rating,
        comment: comment.trim() || null,
        time_spent: timeElapsed,
        hints_used: hintsUsed,
        player_name: detectives[0]?.name || 'Anonymous',
        session_code: null,
      };
      const { error } = await supabase.from('case_feedback').insert(feedbackData);
      
      if (error) throw error;
      setSubmitted(true);
      setTimeout(() => setShowFeedback(false), 2000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const caseTitle = locale === 'no' ? 'Silent Harbour (demo)' : 'Silent Harbour (demo)';
  const labels = {
    solved: locale === 'no' ? 'GRATULERER!' : 'CONGRATULATIONS!',
    subtitle: locale === 'no' ? 'Gjengingspersonen er tatt' : 'The perpetrator has been caught',
    timeSpent: locale === 'no' ? 'Tid brukt' : 'Time spent',
    hintsUsed: locale === 'no' ? 'Hint brukt' : 'Hints used',
    investigators: locale === 'no' ? 'Etterforsker' : 'Investigators',
    suspect: locale === 'no' ? 'Mistenkt' : 'Suspect',
    culprit: locale === 'no' ? 'Lina Haugen' : 'Lina Haugen',
    allTasks: locale === 'no' ? 'Alle oppgaver løst' : 'All tasks solved',
    excellent: locale === 'no' ? 'Utmerket etterforsking!' : 'Excellent investigative work!',
    giveFeedback: locale === 'no' ? 'Gi tilbakemelding' : 'Give feedback',
    rateCase: locale === 'no' ? 'Hvordan likte du dette caset?' : 'How did you like this case?',
    optional: locale === 'no' ? 'Valgfritt' : 'Optional',
    commentPlaceholder: locale === 'no' ? 'Legg til en kommentar...' : 'Add a comment...',
    submit: locale === 'no' ? 'Send inn' : 'Submit',
    thankYou: locale === 'no' ? 'Takk for tilbakemeldingen!' : 'Thank you for your feedback!',
    backToHome: locale === 'no' ? 'Tilbake til startside' : 'Back to home',
  };

  const finalTask = completedRevelations[completedRevelations.length - 1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in overflow-auto">
      <div className="relative w-11/12 max-w-3xl my-8 bg-gradient-to-b from-[#0a0b0e] to-[#14161a] border-2 border-[#e8b84d] rounded-lg p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block text-6xl mb-3">🎯</div>
          <h1 className="text-3xl font-bold text-[#e8b84d] mb-2">{labels.solved}</h1>
          <p className="text-lg text-[#d0d0d0] font-semibold">{labels.subtitle}</p>
          <p className="text-sm text-[#888888] mt-2">{caseTitle}</p>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#e8b84d]/30 to-transparent mb-8" />

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-8">
          {/* Time */}
          <div className="rounded-md bg-[#14161a]/50 border border-[#e8b84d]/20 p-4 text-center">
            <p className="text-xs text-[#888888] uppercase tracking-wide mb-1">⏱️ {labels.timeSpent}</p>
            <p className="text-lg font-bold text-[#e8b84d]">{formatTime(Math.max(timeElapsed, 0))}</p>
            {avgStats && (
              <p className="text-xs text-[#888888] mt-1">Snitt: {formatTime(avgStats.avgTime)}</p>
            )}
          </div>

          {/* Hints */}
          <div className="rounded-md bg-[#14161a]/50 border border-[#e8b84d]/20 p-4 text-center">
            <p className="text-xs text-[#888888] uppercase tracking-wide mb-1">💡 {labels.hintsUsed}</p>
            <p className="text-lg font-bold text-[#e8b84d]">{hintsUsed}</p>
            {avgStats && (
              <p className="text-xs text-[#888888] mt-1">Snitt: {avgStats.avgHints}</p>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#e8b84d]/30 to-transparent mb-8" />

        {/* Case Summary */}
        {finalTask && (
          <div className="rounded-md bg-[#14161a]/50 border border-[#e8b84d]/20 p-5 mb-8">
            <p className="text-xs text-[#888888] uppercase tracking-wide mb-3">📋 Avsluttende avdekning</p>
            <p className="text-sm text-[#d0d0d0] leading-relaxed whitespace-pre-wrap">
              {finalTask.revelation?.split('\n\n')[0] || finalTask.revelation}
            </p>
          </div>
        )}

        {/* Investigators */}
        {detectives.length > 0 && (
          <div className="mb-8">
            <p className="text-xs text-[#888888] uppercase tracking-wide mb-4">👥 {labels.investigators}</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {detectives.map((detective) => (
                <div
                  key={detective.id}
                  className="rounded-md border border-white/10 px-3 py-2 flex items-center gap-2"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: detective.color }}
                  />
                  <span className="text-sm text-[#d0d0d0] truncate">{detective.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#e8b84d]/30 to-transparent mb-8" />

        {/* Feedback Section */}
        {!showFeedback && !submitted ? (
          <div className="text-center mb-8">
            <button
              onClick={() => setShowFeedback(true)}
              className="text-sm text-[#888888] hover:text-[#e8b84d] transition-colors underline"
            >
              {labels.giveFeedback}
            </button>
          </div>
        ) : submitted ? (
          <div className="rounded-md bg-[#14161a]/50 border border-[#e8b84d]/20 p-5 mb-8">
            <p className="text-center text-[#e8b84d] text-sm">✓ {labels.thankYou}</p>
          </div>
        ) : (
          <div className="rounded-md bg-[#14161a]/50 border border-[#e8b84d]/20 p-5 mb-8">
            <p className="text-xs text-[#888888] uppercase tracking-wide mb-4">{labels.rateCase}</p>
            
            {/* Star Rating with hover */}
            <div 
              className="flex justify-center gap-2 mb-4"
              onMouseLeave={() => setHoverRating(0)}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  className="text-3xl transition-all hover:scale-110"
                >
                  <span className={star <= (hoverRating || rating) ? 'text-[#e8b84d]' : 'text-[#888888]/30'}>
                    ★
                  </span>
                </button>
              ))}
            </div>

                {/* Comment */}
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={labels.commentPlaceholder}
                  className="w-full rounded bg-black/30 border border-white/10 px-3 py-2 text-sm text-[#d0d0d0] placeholder:text-[#888888]/50 focus:border-[#e8b84d]/40 focus:outline-none resize-none mb-4"
                  rows={3}
                />

            {/* Submit */}
            <div className="flex gap-2">
              <button
                onClick={handleSubmitFeedback}
                disabled={rating === 0 || submitting}
                className="flex-1 px-4 py-2 bg-[#e8b84d] text-[#0a0b0e] font-semibold text-sm rounded hover:bg-[#f5c96a] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '...' : labels.submit}
              </button>
              <button
                onClick={() => setShowFeedback(false)}
                className="px-4 py-2 text-[#888888] text-sm hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="text-center">
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-[#e8b84d] text-[#0a0b0e] font-bold rounded hover:bg-[#f5c96a] transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            {labels.backToHome}
          </button>
        </div>
      </div>
    </div>
  );
}
