declare module 'link-check' {
  export interface LinkCheckResult {
    link: string;
    status: 'alive' | 'dead';
    statusCode: number;
    err: Error | string | null;
  }

  export interface LinkCheckOptions {
    anchors?: string[];
    baseUrl?: string;
    timeout?: string;
    user_agent?: string;
    aliveStatusCodes?: Array<number | RegExp>;
    headers?: Record<string, string>;
    retryOn429?: boolean;
    retryCount?: number;
    fallbackRetryDelay?: string;
  }

  export type LinkCheckCallback = (error: Error | null, result: LinkCheckResult) => void;

  const linkCheck: (
    link: string,
    options: LinkCheckOptions | LinkCheckCallback,
    callback?: LinkCheckCallback
  ) => void;

  export default linkCheck;
}

declare module 'speak-tts' {
  export interface SpeakTTSInitConfig {
    listeners?: Record<string, (event: unknown) => void>;
    splitSentences?: boolean;
    lang?: string;
    volume?: number;
    rate?: number;
    pitch?: number;
    voice?: string | SpeechSynthesisVoice;
  }

  export interface SpeakTTSInitResult {
    voices: SpeechSynthesisVoice[];
    lang?: string;
    voice?: SpeechSynthesisVoice;
    volume?: number;
    rate?: number;
    pitch?: number;
    splitSentences?: boolean;
    browserSupport: boolean;
  }

  export interface SpeakTTSUtteranceResult {
    utterances: SpeechSynthesisUtterance[];
    lastUtterance: SpeechSynthesisUtterance;
  }

  export interface SpeakTTSOptions {
    text: string;
    listeners?: Record<string, (event: unknown) => void>;
    queue?: boolean;
  }

  export default class SpeakTTS {
    constructor();
    init(config?: SpeakTTSInitConfig): Promise<SpeakTTSInitResult>;
    hasBrowserSupport(): boolean;
    setVoice(voice: string | SpeechSynthesisVoice): void;
    setLanguage(lang: string): void;
    setVolume(volume: number): void;
    setRate(rate: number): void;
    setPitch(pitch: number): void;
    setSplitSentences(splitSentences: boolean): void;
    speak(options: SpeakTTSOptions): Promise<SpeakTTSUtteranceResult>;
    pending(): boolean;
    paused(): boolean;
    speaking(): boolean;
    pause(): void;
    resume(): void;
    cancel(): void;
  }
}

declare module 'html-to-text' {
  export interface HtmlToTextSelector {
    selector: string;
    format?: string;
    options?: Record<string, unknown>;
  }

  export interface HtmlToTextOptions {
    wordwrap?: number | null;
    preserveNewlines?: boolean;
    uppercaseHeadings?: boolean;
    selectors?: HtmlToTextSelector[];
  }

  export function convert(html: string, options?: HtmlToTextOptions): string;
}