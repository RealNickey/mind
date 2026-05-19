'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, Square, Volume2 } from 'lucide-react';
import SpeakTTS from 'speak-tts';
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface ReadingModeTTSProps {
  text: string;
  title?: string;
}

const MAX_SPOKEN_LENGTH = 14_000;

function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export function ReadingModeTTS({ text, title }: ReadingModeTTSProps) {
  const speechRef = useRef<SpeakTTS | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textToSpeak = useMemo(() => {
    const base = normalizeText(text);
    if (!base) {
      return '';
    }

    return base.slice(0, MAX_SPOKEN_LENGTH);
  }, [text]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const speech = new SpeakTTS();
    speechRef.current = speech;

    if (!speech.hasBrowserSupport()) {
      const timer = setTimeout(() => {
        setError('Text-to-speech is not supported in this browser.');
        setIsReady(false);
      }, 0);
      return () => {
        clearTimeout(timer);
        speechRef.current = null;
      };
    }

    let active = true;
    speech
      .init({
        lang: 'en-US',
        rate: 1,
        pitch: 1,
        splitSentences: true,
      })
      .then(() => {
        if (!active) {
          return;
        }

        setIsReady(true);
        setError(null);
      })
      .catch((initError) => {
        if (!active) {
          return;
        }

        setError(initError instanceof Error ? initError.message : String(initError));
      });

    return () => {
      active = false;
      speech.cancel();
      speechRef.current = null;
    };
  }, []);

  const startSpeaking = async () => {
    if (!speechRef.current || !textToSpeak) {
      return;
    }

    setError(null);
    setIsPaused(false);
    setIsSpeaking(true);

    try {
      await speechRef.current.speak({
        text: textToSpeak,
        queue: false,
        listeners: {
          onend: () => {
            setIsSpeaking(false);
            setIsPaused(false);
          },
          onerror: () => {
            setIsSpeaking(false);
            setIsPaused(false);
            setError('Speech synthesis failed while reading this item.');
          },
        },
      });
    } catch (speakError) {
      setIsSpeaking(false);
      setIsPaused(false);
      setError(speakError instanceof Error ? speakError.message : String(speakError));
    }
  };

  const togglePause = () => {
    if (!speechRef.current || !isSpeaking) {
      return;
    }

    if (isPaused) {
      speechRef.current.resume();
      setIsPaused(false);
    } else {
      speechRef.current.pause();
      setIsPaused(true);
    }
  };

  const stopSpeaking = () => {
    if (!speechRef.current) {
      return;
    }

    speechRef.current.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  if (!textToSpeak) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={isSpeaking ? togglePause : () => void startSpeaking()}
            disabled={!isReady}
            className="group inline-flex items-center gap-2 rounded-xl bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-150 ease-out hover:scale-[1.05] active:scale-[0.97] disabled:opacity-30 shadow-md ring-1 ring-black/5 dark:ring-white/5"
          >
            {isSpeaking && !isPaused ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}
            <span>{isSpeaking && !isPaused ? 'Pause' : isPaused ? 'Resume' : 'Listen'}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent>{title ? `Read "${title}" aloud` : 'Read aloud'}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={stopSpeaking}
            disabled={!isSpeaking}
            className="group inline-flex items-center gap-2 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all duration-150 ease-out hover:scale-[1.05] active:scale-[0.97] disabled:opacity-30 shadow-sm"
          >
            <Square className="h-3 w-3 fill-current" />
            <span>Stop</span>
          </button>
        </TooltipTrigger>
        <TooltipContent>Stop reading</TooltipContent>
      </Tooltip>

      <div className="flex items-center gap-2 ml-auto">
        <div className={`w-1.5 h-1.5 rounded-full ${isSpeaking ? (isPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse') : 'bg-zinc-300'}`} />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
          {error ? 'Error' : isSpeaking ? (isPaused ? 'Paused' : 'Reading') : 'Ready'}
        </span>
      </div>
    </div>
  );
}