"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { motion } from "framer-motion";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-4 max-w-md w-full p-8 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50"
      >
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-500 mb-2">
          <AlertCircle size={24} aria-hidden="true" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Something went wrong!
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {error.message || "An unexpected error occurred while loading this page."}
          </p>
        </div>

        <button
          onClick={() => reset()}
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
          aria-label="Try again"
        >
          <RefreshCcw size={16} />
          Try again
        </button>
      </motion.div>
    </div>
  );
}
