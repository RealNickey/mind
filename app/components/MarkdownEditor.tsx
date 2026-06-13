"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { Bold, Italic, Heading1, Heading2, List, Code, Quote, ImageIcon, LinkIcon } from "lucide-react";

// Dynamically import MDEditor to avoid SSR issues
const MarkdownPreview = dynamic(() => import("@uiw/react-markdown-preview"), {
  ssr: false,
});

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
}

export function MarkdownEditor({ value, onChange, onBlur, placeholder }: MarkdownEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [cursorPos, setCursorPos] = useState({ top: 0, left: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const commands = [
    { label: 'Heading 1', icon: <Heading1 size={14} />, syntax: '# ' },
    { label: 'Heading 2', icon: <Heading2 size={14} />, syntax: '## ' },
    { label: 'Bold', icon: <Bold size={14} />, syntax: '**bold**' },
    { label: 'Italic', icon: <Italic size={14} />, syntax: '*italic*' },
    { label: 'Bullet List', icon: <List size={14} />, syntax: '- ' },
    { label: 'Code Block', icon: <Code size={14} />, syntax: '```\n\n```' },
    { label: 'Quote', icon: <Quote size={14} />, syntax: '> ' },
  ];

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    onChange(text);

    // Check for slash command
    if (textareaRef.current) {
      const selectionStart = textareaRef.current.selectionStart;
      const textBeforeCursor = text.substring(0, selectionStart);

      // Simple slash detection (if last typed char is '/' and it's at start of line or after space)
      if (textBeforeCursor.endsWith('/') && (textBeforeCursor.length === 1 || textBeforeCursor.endsWith(' /') || textBeforeCursor.endsWith('\\n/'))) {
        // Calculate position for the menu
        const { selectionStart } = textareaRef.current;
        const textLines = textBeforeCursor.split('\\n');
        const currentLine = textLines.length;
        const currentLinePos = textLines[textLines.length - 1].length;

        // Very basic positioning logic
        setCursorPos({
          top: Math.min(currentLine * 20 + 10, 160),
          left: Math.min(currentLinePos * 8 + 10, 200)
        });
        setSlashMenuOpen(true);
      } else {
        setSlashMenuOpen(false);
      }
    }
  };

  const executeCommand = (syntax: string) => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;

    // Remove the slash that triggered the menu
    const textBeforeSlash = value.substring(0, start - 1);
    const textAfterSlash = value.substring(end);

    const newValue = textBeforeSlash + syntax + textAfterSlash;
    onChange(newValue);
    setSlashMenuOpen(false);

    // Set focus back
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        // Position cursor appropriately (this is simplistic)
        const newPos = start - 1 + syntax.length;
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape' && slashMenuOpen) {
      setSlashMenuOpen(false);
      e.stopPropagation();
    }
  };

  return (
    <div className="relative w-full flex-1 flex flex-col min-h-[140px] max-h-[220px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="flex items-center gap-1">
          <button
            className={`text-[10px] font-semibold px-2 py-1 rounded transition-colors ${!isPreview ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
            onClick={() => setIsPreview(false)}
          >
            Edit
          </button>
          <button
            className={`text-[10px] font-semibold px-2 py-1 rounded transition-colors ${isPreview ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
            onClick={() => setIsPreview(true)}
          >
            Preview
          </button>
        </div>
        <div className="text-[10px] text-zinc-400 font-medium">Type '/' for commands</div>
      </div>

      <div className="relative flex-1 overflow-auto bg-transparent">
        {isPreview ? (
          <div className="p-4 h-full overflow-y-auto" data-color-mode="light">
            {/* Force light or dark mode based on global app theme might be tricky, but we default to app styles where possible */}
             <div className="dark:hidden">
              <MarkdownPreview source={value || "*Nothing to preview*"} style={{ background: 'transparent' }} />
             </div>
             <div className="hidden dark:block">
              <MarkdownPreview source={value || "*Nothing to preview*"} style={{ background: 'transparent' }} data-color-mode="dark" />
             </div>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            className="w-full h-full p-4 text-xs text-zinc-800 dark:text-zinc-200 bg-transparent focus:outline-none resize-none font-sans"
            placeholder={placeholder || "Type here to add a note... Use Markdown!"}
            value={value}
            onChange={handleInput}
            onBlur={onBlur}
            onKeyDown={handleKeyDown}
          />
        )}

        {slashMenuOpen && !isPreview && (
          <div
            className="absolute z-10 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg rounded-lg py-1 text-sm overflow-hidden"
            style={{ top: cursorPos.top, left: cursorPos.left }}
          >
            <div className="px-2 py-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800">Formatting</div>
            <div className="max-h-48 overflow-y-auto">
              {commands.map((cmd, idx) => (
                <button
                  key={idx}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left text-xs text-zinc-700 dark:text-zinc-300 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    executeCommand(cmd.syntax);
                  }}
                >
                  <span className="text-zinc-400">{cmd.icon}</span>
                  {cmd.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
