"use client";

import { motion } from "framer-motion";

export default function Loading() {
  return (
    <div className="w-full h-full min-h-[50vh] flex items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-950">
      <div className="flex flex-col items-center gap-6 max-w-sm w-full mx-auto" aria-busy="true" aria-live="polite">
        <motion.div 
          className="flex space-x-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {[0, 1, 2].map((dot) => (
            <motion.div
              key={dot}
              className="w-3 h-3 rounded-full bg-zinc-400 dark:bg-zinc-600"
              animate={{
                y: ["0%", "-50%", "0%"],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: dot * 0.15,
              }}
            />
          ))}
        </motion.div>
        
        <p className="sr-only">Loading content...</p>
        
        {/* Loading Skeletons for Layout/Items visual feedback */}
        <div className="w-full mt-8 opacity-50 flex flex-col gap-4 animate-pulse">
          <div className="h-24 w-full bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
          <div className="flex gap-4">
            <div className="h-32 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
            <div className="h-32 w-2/3 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
          </div>
          <div className="h-48 w-full bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
