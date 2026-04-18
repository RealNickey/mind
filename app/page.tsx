"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ArrowRight, Brain, Network, Sparkles, FolderArchive } from "lucide-react";

export default function Home() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center p-6 sm:p-12 lg:p-24 bg-zinc-50 dark:bg-[#09090b]">
      {/* Abstract Background Shapes */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 dark:bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-500/10 dark:bg-purple-600/10 blur-[150px]" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-emerald-500/10 dark:bg-emerald-600/10 blur-[100px]" />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-5xl flex flex-col items-center text-center space-y-12"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Badge */}
        <motion.div variants={itemVariants}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium tracking-wide text-zinc-600 dark:text-zinc-300">
              Welcome to myMind Archiving
            </span>
          </div>
        </motion.div>

        {/* Hero Headline */}
        <motion.div variants={itemVariants} className="space-y-6">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-zinc-900 dark:text-white font-[family-name:var(--font-playfair)]">
            Your Second Brain,<br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              Visualized.
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed font-[family-name:var(--font-inter)]">
            Semantic search, AI-driven tagging, canvas exploration, and endless curiosity combined. Build your personal knowledge base effortlessly.
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-8">
          <Link
            href="/dashboard"
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-semibold text-white transition-all duration-300 ease-out bg-zinc-900 dark:bg-white dark:text-zinc-900 rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-100 dark:hover:scale-105 active:scale-95 shadow-[0_0_30px_-5px_var(--color-blue-500)]"
          >
            Enter your mind
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/graph"
            className="group inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-semibold transition-all duration-300 ease-out bg-white dark:bg-zinc-900/50 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:scale-105 active:scale-95 shadow-sm"
          >
            Explore Canvas
            <Network className="w-4 h-4 transition-colors group-hover:text-purple-500" />
          </Link>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-16 sm:pt-24 text-left"
        >
          <FeatureCard 
            icon={<Brain className="w-6 h-6 text-blue-500" />}
            title="AI-Powered"
            desc="Automatically extract semantic meaning, tags, and insights from every item."
          />
          <FeatureCard 
            icon={<Network className="w-6 h-6 text-purple-500" />}
            title="Infinite Graph"
            desc="Visualize the invisible threads connecting your ideas seamlessly."
          />
          <FeatureCard 
            icon={<FolderArchive className="w-6 h-6 text-emerald-500" />}
            title="Smart Archives"
            desc="Never lose a link, note, or file again with natural language search."
          />
        </motion.div>
      </motion.div>
    </main>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="group relative flex flex-col items-start p-6 space-y-4 rounded-3xl bg-white/40 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-xl transition-all duration-500 hover:bg-white/60 dark:hover:bg-zinc-800/60 hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/5 dark:hover:shadow-white/5">
      <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 group-hover:scale-110 transition-transform duration-500">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 font-[family-name:var(--font-inter)] tracking-tight">
        {title}
      </h3>
      <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed font-[family-name:var(--font-inter)] text-sm">
        {desc}
      </p>
    </div>
  );
}
