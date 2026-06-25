import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Sparkles } from 'lucide-react';

interface SplashProps {
  onComplete: () => void;
}

export default function Splash({ onComplete }: SplashProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onComplete();
          }, 400); // Small pause at 100%
          return 100;
        }
        return prev + 4;
      });
    }, 60);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-radial from-slate-900 via-slate-950 to-black text-white z-50">
      <div className="relative flex flex-col items-center max-w-sm px-6">
        {/* Animated Background Glow */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -z-10"
        />

        {/* Logo Icon with Shield & Sparkle */}
        <motion.div
          initial={{ scale: 0.3, opacity: 0, rotate: -45 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 15, stiffness: 100 }}
          className="relative p-6 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-3xl shadow-[0_0_50px_rgba(79,70,229,0.4)] border border-indigo-400/20 mb-8"
        >
          <Shield className="w-16 h-16 text-white stroke-[1.5]" />
          <motion.div
            animate={{
              scale: [0.8, 1.2, 0.8],
              rotate: [0, 90, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -top-1 -right-1 p-1 bg-amber-400 rounded-lg text-slate-950"
          >
            <Sparkles className="w-4 h-4 fill-amber-400" />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold font-sans tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent text-center"
        >
          Deadline Guardian AI
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm font-mono text-indigo-300/80 tracking-widest uppercase mt-2 text-center"
        >
          Intelligent Time Mastery
        </motion.p>

        {/* Progress Bar Container */}
        <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden mt-12 relative border border-slate-700/30">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Progress Text */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs font-mono text-slate-500 mt-3"
        >
          Initializing Guardian Core... {progress}%
        </motion.span>
      </div>
    </div>
  );
}
