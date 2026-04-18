'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, Square, Volume2 } from 'lucide-react';
import SpeakTTS from 'speak-tts';

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
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={isSpeaking ? togglePause : () => void startSpeaking()}
        disabled={!isReady}
        className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        title={title ? `Read \"${title}\" aloud` : 'Read aloud'}
      >
        {isSpeaking && !isPaused ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        {isSpeaking && !isPaused ? 'Pause' : isPaused ? 'Resume' : 'Listen'}
      </button>

      <button
        type="button"
        onClick={stopSpeaking}
        disabled={!isSpeaking}
        className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        title="Stop reading"
      >
        <Square className="h-3.5 w-3.5" />
        Stop
      </button>

      <span className="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
        <Volume2 className="h-3.5 w-3.5" />
        {error ? 'Unavailable' : isSpeaking ? (isPaused ? 'Paused' : 'Reading') : 'Ready'}
      </span>
    </div>
  );
}