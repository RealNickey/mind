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
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] } },
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center p-6 sm:p-12 lg:p-24 bg-white dark:bg-[#050505] selection:bg-zinc-900 selection:text-white dark:selection:bg-white dark:selection:text-black">
      {/* Refined Background Texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />
      
      {/* Subtle Depth Orbs */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-zinc-100 dark:bg-zinc-900/50 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-zinc-100 dark:bg-zinc-900/50 blur-[150px]" />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-5xl flex flex-col items-center text-center space-y-16"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Badge */}
        <motion.div variants={itemVariants}>
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-zinc-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl shadow-sm ring-1 ring-black/5 dark:ring-white/5">
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              The Art of Archiving
            </span>
          </div>
        </motion.div>

        {/* Hero Headline */}
        <motion.div variants={itemVariants} className="space-y-8">
          <h1 className="text-6xl sm:text-7xl md:text-8xl font-semibold tracking-tight text-zinc-900 dark:text-white font-heading leading-[1.1]">
            Your mind,<br />
            <span className="italic opacity-50">distilled.</span>
          </h1>
          <p className="max-w-xl mx-auto text-base sm:text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed font-sans font-medium">
            A sanctuary for your thoughts, links, and discoveries. Powered by AI, designed for deep focus and effortless exploration.
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto">
          <Link
            href="/dashboard"
            className="group relative inline-flex items-center justify-center gap-3 px-10 py-4 text-sm font-bold uppercase tracking-widest text-white transition-all duration-500 ease-ui bg-zinc-900 dark:bg-white dark:text-zinc-900 rounded-xl hover:scale-105 active:scale-95 shadow-xl shadow-black/10 dark:shadow-white/10"
          >
            Enter mind
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/graph"
            className="group inline-flex items-center justify-center gap-3 px-10 py-4 text-sm font-bold uppercase tracking-widest transition-all duration-500 ease-ui bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:scale-105 active:scale-95 shadow-sm ring-1 ring-black/5 dark:ring-white/5"
          >
            Explore
          </Link>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full pt-16 sm:pt-24 text-left"
        >
          <FeatureCard 
            icon={<Brain className="w-5 h-5" />}
            title="Semantic"
            desc="AI understands the essence of your content, creating connections automatically."
          />
          <FeatureCard 
            icon={<Network className="w-5 h-5" />}
            title="Spatial"
            desc="Explore your knowledge on an infinite canvas that scales with your curiosity."
          />
          <FeatureCard 
            icon={<FolderArchive className="w-5 h-5" />}
            title="Eternal"
            desc="Your second brain, preserved and searchable through natural language forever."
          />
        </motion.div>
      </motion.div>
    </main>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="group relative flex flex-col items-start p-8 space-y-6 rounded-2xl bg-white/20 dark:bg-zinc-900/20 border border-zinc-200/30 dark:border-zinc-800/30 backdrop-blur-xl transition-all duration-500 hover:bg-white/40 dark:hover:bg-zinc-800/40 hover:-translate-y-1 ring-1 ring-black/5 dark:ring-white/5">
      <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 group-hover:scale-110 transition-transform duration-500">
        {icon}
      </div>
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100">
          {title}
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
          {desc}
        </p>
      </div>
    </div>
  );
}
