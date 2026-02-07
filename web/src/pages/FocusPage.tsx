import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { focusApi, flowersApi, type FlowerTask } from '@/services/api';
import { Button } from '@/components/ui/button';
import { useUser } from '@/contexts/UserContext';

interface FocusTimerProps {
  timeLeft: number;
  formatTime: (s: number) => string;
  progress: number;
  reason: string;
  onInterrupt: () => void;
}

function FocusTimer({ timeLeft, formatTime, progress, reason, onInterrupt }: FocusTimerProps) {
  return (
    <div className="relative z-10 text-center">
      <div className="relative w-64 h-64 mx-auto mb-8">
        <svg className="w-full h-full -rotate-90">
          <circle cx="128" cy="128" r="120" fill="none" stroke="#E5E2DB" strokeWidth="8" />
          <circle
            cx="128" cy="128" r="120" fill="none" stroke="#8B9A7D" strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 120}
            strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-5xl font-bold text-charcoal">
            {formatTime(timeLeft)}
          </span>
          <span className="text-sm text-stone mt-2">Focusing</span>
        </div>
      </div>
      <p className="text-lg text-charcoal mb-8">{reason}</p>
      <Button variant="outline" onClick={onInterrupt}>Give Up</Button>
    </div>
  );
}

interface CompletedViewProps {
  flowerUrl: string | null;
  task: FlowerTask | null;
  onGenerate: () => void;
  onRetry: () => void;
  onGoHome: () => void;
}

const STATUS_TEXT: Record<string, string> = {
  pending: 'Pending...',
  generating: 'Generating flower image...',
  uploading: 'Uploading image...',
  minting: 'Minting NFT...',
  completed: 'Generation Completed!',
  failed: 'Generation Failed',
};

function CompletedView({ flowerUrl, task, onGenerate, onRetry, onGoHome }: CompletedViewProps) {
  const isProcessing = task && ['pending', 'generating', 'uploading', 'minting'].includes(task.status);

  return (
    <div className="relative z-10 text-center animate-fade-in">
      <div className="text-6xl mb-6 animate-float">🎉</div>
      <h2 className="font-display text-2xl font-bold text-charcoal mb-2">
        Focus Completed!
      </h2>
      <p className="text-stone mb-8">Awesome! You did it.</p>

      {flowerUrl ? (
        <div className="mb-8">
          <img
            src={flowerUrl}
            alt="Generated flower"
            className="w-48 h-48 mx-auto rounded-2xl object-cover shadow-lg"
          />
          <p className="text-sm text-stone mt-4">Your unique flower has been generated</p>
        </div>
      ) : task ? (
        <div className="mb-8">
          <p className="text-lg text-charcoal mb-4">{STATUS_TEXT[task.status]}</p>
          {isProcessing && (
            <div className="w-48 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-sage animate-pulse rounded-full" style={{ width: '60%' }} />
            </div>
          )}
          {task.status === 'failed' && (
            <div className="mt-4">
              <p className="text-sm text-red-500 mb-4">{task.error}</p>
              <Button variant="coral" onClick={onRetry}>Retry</Button>
            </div>
          )}
        </div>
      ) : (
        <Button
          variant="coral"
          size="lg"
          className="mb-4"
          onClick={onGenerate}
        >
          Generate Flower NFT
        </Button>
      )}

      <div>
        <Button variant="ghost" onClick={onGoHome}>Back to Home</Button>
      </div>
    </div>
  );
}

interface FocusState {
  sessionId: string;
  duration: number;
  reason: string;
}

export function FocusPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshUser } = useUser();
  const state = location.state as FocusState | null;

  const [timeLeft, setTimeLeft] = useState(state?.duration || 1500);
  const [isCompleted, setIsCompleted] = useState(false);
  const [task, setTask] = useState<FlowerTask | null>(null);
  const [flowerUrl, setFlowerUrl] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const [isFailed, setIsFailed] = useState(false);

  useEffect(() => {
    if (!state?.sessionId) {
      navigate('/', { replace: true });
    }
  }, [state, navigate]);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden' && !isCompleted && !isFailed && state?.sessionId) {
        try {
          await focusApi.interrupt(state.sessionId);
          setIsFailed(true);
        } catch (error) {
          console.error('Interrupt error:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isCompleted, isFailed, state?.sessionId]);

  useEffect(() => {
    if (timeLeft <= 0 || isCompleted || isFailed) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isCompleted, isFailed]);

  useEffect(() => {
    if (timeLeft === 0 && !isCompleted && !isFailed && state?.sessionId) {
      handleComplete();
    }
  }, [timeLeft, isCompleted, isFailed, state?.sessionId]);

  const handleComplete = async () => {
    if (!state?.sessionId) return;
    try {
      await focusApi.complete(state.sessionId);
      await refreshUser();
      setIsCompleted(true);
    } catch (error) {
      console.error('Complete error:', error);
    }
  };

  const handleInterrupt = async () => {
    if (!state?.sessionId) return;
    try {
      await focusApi.interrupt(state.sessionId);
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Interrupt error:', error);
    }
  };

  const handleGenerate = async () => {
    if (!state?.sessionId) return;

    try {
      const result = await flowersApi.generate(state.sessionId);
      if (result.taskId) {
        startPolling(result.taskId);
      }
    } catch (error) {
      console.error('Generate error:', error);
      alert('Generation failed, please retry');
    }
  };

  const startPolling = (taskId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);

    const poll = async () => {
      try {
        const result = await flowersApi.getTask(taskId);
        setTask(result.task);

        if (result.task.status === 'completed' && result.task.flower?.imageUrl) {
          setFlowerUrl(result.task.flower.imageUrl);
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (result.task.status === 'failed') {
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch (error) {
        console.error('Poll error:', error);
      }
    };

    poll();
    pollRef.current = setInterval(poll, 2000);
  };

  const handleRetry = async () => {
    if (!task?.id) return;
    try {
      await flowersApi.retryTask(task.id);
      startPolling(task.id);
    } catch (error) {
      console.error('Retry error:', error);
    }
  };

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = state ? (1 - timeLeft / state.duration) * 100 : 0;

  if (!state) return null;

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-sage/5 rounded-full blur-3xl animate-breathe" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-coral/5 rounded-full blur-3xl animate-breathe" style={{ animationDelay: '2s' }} />
      </div>

      {isFailed ? (
        <div className="relative z-10 text-center animate-fade-in">
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className="font-display text-2xl font-bold text-charcoal mb-2">
            Failed to focus
          </h2>
          <p className="text-stone mb-8">Focus session interrupted because you left the page.</p>
          <Button variant="ghost" onClick={() => navigate('/', { replace: true })}>Back to Home</Button>
        </div>
      ) : !isCompleted ? (
        <FocusTimer
          timeLeft={timeLeft}
          formatTime={formatTime}
          progress={progress}
          reason={state.reason}
          onInterrupt={handleInterrupt}
        />
      ) : (
        <CompletedView
          flowerUrl={flowerUrl}
          task={task}
          onGenerate={handleGenerate}
          onRetry={handleRetry}
          onGoHome={() => navigate('/', { replace: true })}
        />
      )}
    </div>
  );
}
