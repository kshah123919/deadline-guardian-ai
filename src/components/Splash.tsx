import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Sparkles } from 'lucide-react';

interface SplashProps {
  onComplete: () => void;
  isDark?: boolean;
}

export default function Splash({ onComplete, isDark = false }: SplashProps) {
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
    <div className={`fixed inset-0 flex flex-col items-center justify-center z-50 transition-colors duration-300 ${
      isDark 
        ? 'bg-radial from-slate-900 via-slate-950 to-black text-white' 
        : 'bg-radial from-indigo-50/60 via-slate-50 to-white text-slate-900'
    }`}>
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
          className={`absolute w-64 h-64 rounded-full blur-3xl -z-10 ${
            isDark ? 'bg-indigo-500/20' : 'bg-indigo-500/10'
          }`}
        />

        {/* Logo Icon with Shield & Sparkle */}
        <motion.div
          initial={{ scale: 0.3, opacity: 0, rotate: -45 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 15, stiffness: 100 }}
          className={`relative p-6 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-3xl border border-indigo-400/20 mb-8 ${
            isDark ? 'shadow-[0_0_50px_rgba(79,70,229,0.4)]' : 'shadow-[0_10px_30px_rgba(79,70,229,0.2)]'
          }`}
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
          className={`text-3xl font-bold font-sans tracking-tight text-center bg-clip-text text-transparent bg-gradient-to-r ${
            isDark 
              ? 'from-white via-slate-100 to-indigo-200' 
              : 'from-slate-900 via-indigo-950 to-indigo-800'
          }`}
        >
          Deadline Guardian AI
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={`text-sm font-mono tracking-widest uppercase mt-2 text-center ${
            isDark ? 'text-indigo-300/80' : 'text-indigo-600/80 font-bold'
          }`}
        >
          Intelligent Time Mastery
        </motion.p>

        {/* Progress Bar Container */}
        <div className={`w-48 h-1 rounded-full overflow-hidden mt-12 relative border ${
          isDark ? 'bg-slate-800 border-slate-700/30' : 'bg-indigo-100 border-indigo-200/50'
        }`}>
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Progress Text */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`text-xs font-mono mt-3 ${
            isDark ? 'text-slate-500' : 'text-indigo-600/50 font-bold'
          }`}
        >
          Initializing Guardian Core... {progress}%
        </motion.span>
      </div>
    </div>
  );
}
