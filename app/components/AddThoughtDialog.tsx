"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Image, Video, Link, FileText, Upload, Loader2, Sparkles } from "lucide-react";
import type { CreateItemPayload } from "@/app/lib/api-client/items";

interface AddThoughtDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateItemPayload) => Promise<void>;
}

interface FilePreview {
  dataUrl: string;
  name: string;
  size: number;
  type: string;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function AddThoughtDialog({ isOpen, onClose, onSave }: AddThoughtDialogProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // File state
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [detectedUrl, setDetectedUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 150);
      // Reset state
      setTitle("");
      setContent("");
      setFilePreview(null);
      setDetectedUrl(null);
      setError(null);
      setIsSaving(false);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSaving) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  // Handle dropped files or pasted files
  const handleFiles = async (files: FileList | File[]) => {
    const file = files[0];
    if (!file) return;

    // Limit file size to 10MB to prevent browser lockup
    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit.");
      return;
    }

    try {
      const dataUrl = await readFileAsDataURL(file);
      setFilePreview({
        dataUrl,
        name: file.name,
        size: file.size,
        type: file.type,
      });
      setError(null);
      
      // Auto fill title if empty
      if (!title) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "");
        setTitle(cleanName);
      }
    } catch (err) {
      console.error("Error reading file:", err);
      setError("Failed to process the selected file.");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFiles(e.dataTransfer.files);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    let hasFile = false;
    
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === "file") {
          const file = items[i].getAsFile();
          if (file) {
            hasFile = true;
            e.preventDefault();
            await handleFiles([file]);
            break;
          }
        }
      }
    }
    
    if (!hasFile) {
      const pastedText = e.clipboardData?.getData("text") || "";
      const trimmed = pastedText.trim();
      const isUrl = /^https?:\/\/[^\s]+$/i.test(trimmed);
      if (isUrl) {
        setDetectedUrl(trimmed);
        if (!title) {
          setTitle(trimmed);
        }
      }
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    
    // Check if the current typed content is a single URL
    const trimmed = val.trim();
    const isUrl = /^https?:\/\/[^\s]+$/i.test(trimmed);
    if (isUrl) {
      setDetectedUrl(trimmed);
    } else if (detectedUrl && !trimmed.includes(detectedUrl)) {
      setDetectedUrl(null);
    }
  };

  const handleSave = async () => {
    const trimmedContent = content.trim();
    const trimmedTitle = title.trim();
    
    if (!trimmedContent && !filePreview && !detectedUrl) {
      setError("Please write something or add content first.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      let payload: CreateItemPayload = {};

      if (filePreview) {
        const isImage = filePreview.type.startsWith("image/");
        const isVideo = filePreview.type.startsWith("video/");
        
        payload = {
          title: trimmedTitle || filePreview.name,
          description: trimmedContent || undefined,
          type: isImage ? "image" : isVideo ? "video" : "note",
          ...(isImage && { imageUrl: filePreview.dataUrl }),
          ...(isVideo && { sourceUrl: filePreview.dataUrl }),
          ...(!isImage && !isVideo && { content: filePreview.dataUrl }) // Fallback for other file types
        };
      } else if (detectedUrl) {
        payload = {
          title: trimmedTitle || detectedUrl,
          description: trimmedContent !== detectedUrl ? trimmedContent : undefined,
          sourceUrl: detectedUrl,
        };
      } else {
        // Normal text note
        payload = {
          title: trimmedTitle || trimmedContent.slice(0, 80),
          description: trimmedContent.length > 80 ? trimmedContent.slice(0, 280) : undefined,
          content: trimmedContent,
          type: "note",
        };
      }

      await onSave(payload);
      onClose();
    } catch (err: any) {
      console.error("Save failed:", err);
      setError(err?.message || "An error occurred while saving your thought.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      void handleSave();
    }
  };

  const clearFile = () => {
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop blur with overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zinc-950/60 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Premium Glassmorphic Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: "spring", stiffness: 350, damping: 26 }}
            className="relative w-full max-w-xl overflow-hidden shadow-2xl z-10"
            style={{
              borderRadius: "24px 8px 24px 8px",
              background: "rgba(255, 255, 255, 0.45)",
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
              border: "1.5px solid rgba(255, 255, 255, 0.35)",
              boxShadow: "0 20px 50px -12px rgba(0, 0, 0, 0.12)",
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Custom dark mode background styles */}
            <style>{`
              .dark [role="dialog"] {
                background: rgba(20, 20, 20, 0.6) !important;
                border-color: rgba(255, 255, 255, 0.08) !important;
                box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.5) !important;
              }
            `}</style>
            
            <div role="dialog" aria-modal="true" className="p-6 md:p-8 flex flex-col gap-6">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-200/40 dark:border-zinc-800/40 pb-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 font-heading flex items-center gap-2">
                    <Sparkles size={18} className="text-amber-500 animate-pulse" /> Add to your mind
                  </h2>
                  <span className="font-accent text-lg text-amber-600 dark:text-yellow-500/80 select-none">
                    pasted content is auto-detected
                  </span>
                </div>
                
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 transition-all duration-150 active-sink cursor-pointer"
                  disabled={isSaving}
                  aria-label="Close dialog"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Error display */}
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50/50 dark:border-red-950/50 dark:bg-red-950/20 px-4 py-2.5 text-xs text-red-600 dark:text-red-300">
                  {error}
                </div>
              )}

              {/* Form Input fields */}
              <div className="flex flex-col gap-4">
                
                {/* Title (Optional) */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="title-input" className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Title <span className="text-zinc-400 dark:text-zinc-500 lowercase">(optional)</span>
                  </label>
                  <input
                    id="title-input"
                    type="text"
                    placeholder={filePreview ? filePreview.name : detectedUrl ? "Pasted Link" : "Give it a title..."}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60 bg-white/20 dark:bg-zinc-950/20 focus:bg-white/40 dark:focus:bg-zinc-950/40 text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all duration-200"
                    disabled={isSaving}
                  />
                </div>

                {/* Content text area */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="thought-input" className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Thought & Notes
                  </label>
                  <textarea
                    id="thought-input"
                    ref={textareaRef}
                    placeholder="Paste links, drag & drop files, or write notes..."
                    value={content}
                    onChange={handleTextareaChange}
                    onPaste={handlePaste}
                    onKeyDown={handleKeyDown}
                    className="w-full min-h-[120px] max-h-[220px] text-xs px-3.5 py-3 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60 bg-white/20 dark:bg-zinc-950/20 focus:bg-white/40 dark:focus:bg-zinc-950/40 text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all duration-200 font-sans"
                    disabled={isSaving}
                  />
                </div>

                {/* Previews / Drop zone area */}
                <div className="mt-1">
                  {filePreview ? (
                    /* Attached File Preview container */
                    <div className="relative rounded-xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800 bg-white/10 dark:bg-zinc-950/10 p-3 flex flex-col gap-3">
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          {filePreview.type.startsWith("image/") ? (
                            <Image size={15} className="text-pink-500 shrink-0" />
                          ) : filePreview.type.startsWith("video/") ? (
                            <Video size={15} className="text-red-500 shrink-0" />
                          ) : (
                            <FileText size={15} className="text-zinc-500 shrink-0" />
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 truncate pr-4">
                              {filePreview.name}
                            </span>
                            <span className="text-[9px] text-zinc-400 dark:text-zinc-500">
                              {formatBytes(filePreview.size)} • {filePreview.type}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={clearFile}
                          className="text-[10px] text-zinc-500 hover:text-red-600 transition-colors px-2 py-1 rounded bg-zinc-200/40 dark:bg-zinc-800/40 cursor-pointer"
                          disabled={isSaving}
                        >
                          Clear
                        </button>
                      </div>

                      {/* File rendering preview */}
                      <div className="w-full flex justify-center bg-black/5 dark:bg-black/30 rounded-lg overflow-hidden max-h-[160px]">
                        {filePreview.type.startsWith("image/") ? (
                          <img
                            src={filePreview.dataUrl}
                            alt="Attachment preview"
                            className="object-contain w-full h-auto max-h-[160px]"
                          />
                        ) : filePreview.type.startsWith("video/") ? (
                          <video
                            src={filePreview.dataUrl}
                            controls
                            className="w-full h-auto max-h-[160px] object-contain"
                          />
                        ) : (
                          <div className="p-8 flex items-center justify-center gap-2 text-zinc-400 font-mono text-xs">
                            <FileText size={20} />
                            <span>Preview not supported</span>
                          </div>
                        )}
                      </div>

                    </div>
                  ) : detectedUrl ? (
                    /* Link preview indicator */
                    <div className="flex items-center gap-2 rounded-lg border border-amber-200/40 dark:border-amber-950/20 bg-amber-500/5 px-3 py-2 text-[10px] text-amber-700 dark:text-amber-400 font-mono">
                      <Link size={12} className="shrink-0 animate-pulse" />
                      <span className="truncate">URL Detected: {detectedUrl}</span>
                    </div>
                  ) : (
                    /* General Drag & Drop zone */
                    <div
                      className={`group border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isDragging
                          ? "border-amber-500 bg-amber-500/5"
                          : "border-zinc-200/40 hover:border-amber-500/60 bg-white/5 hover:bg-white/10 dark:border-zinc-800/40 dark:hover:border-amber-500/30"
                      }`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={(e) => handleFiles(e.target.files ? Array.from(e.target.files) : [])}
                        disabled={isSaving}
                      />
                      <Upload size={16} className={`text-zinc-400 group-hover:text-amber-500 group-hover:scale-110 transition-all ${isDragging ? "text-amber-500 animate-bounce" : ""}`} />
                      <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                        Drag & Drop or click to add files
                      </span>
                      <span className="text-[9px] text-zinc-400 dark:text-zinc-500">
                        Supports images and videos (Max 10MB)
                      </span>
                    </div>
                  )}
                </div>

              </div>

              {/* Bottom Actions Row */}
              <div className="flex items-center justify-between border-t border-zinc-200/40 dark:border-zinc-800/40 pt-4 mt-2">
                <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                  Press <kbd className="border border-current rounded px-1 text-[9px] font-bold">Ctrl+Enter</kbd> to save
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-full text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>

                  <button
                    onClick={() => void handleSave()}
                    disabled={isSaving}
                    className="relative px-5 py-2 rounded-full text-xs font-bold text-white shadow-md transition-all active-sink cursor-pointer overflow-hidden group/btn flex items-center justify-center gap-2"
                    style={{
                      background: "linear-gradient(135deg, #ffb03a 0%, #ff7c00 100%)",
                    }}
                  >
                    <span className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                    {isSaving ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Add to Mind</span>
                    )}
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
