import { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Sparkles, LogIn, Mail, Lock, CheckCircle2, ArrowRight } from 'lucide-react';
import { UserProfile } from '../types';
import { signInWithGoogle, signInAsGuest } from '../lib/firebase';

interface LoginProps {
  onLogin: (profile: UserProfile) => void;
  isDark: boolean;
}

export default function Login({ onLogin, isDark }: LoginProps) {
  const [email, setEmail] = useState('demo@deadlineguardian.ai');
  const [password, setPassword] = useState('••••••••');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGuestLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('[Login Component] Quick Access Demo Mode selected. Attempting Firebase Anonymous Sign-In...');
      const profile = await signInAsGuest();
      console.log('[Login Component] Anonymous Sign-In succeeded, profile loaded:', profile);
      onLogin(profile);
    } catch (err: any) {
      console.error('[Login Component] Failed to authenticate anonymously:', err);
      setError(`Guest Login failed. Details: ${err.message || err.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const profile = await signInWithGoogle();
      onLogin(profile);
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        console.warn('Google login popup closed or cancelled by user:', err);
      } else {
        console.error('Google login error:', err);
      }

      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-In popup closed or blocked. Because this preview runs in a sandboxed iframe, your browser or extension might have blocked the popup. To sign in securely, please open the application in a new tab using the icon in the top right, or allow popups and cookies for this site.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError('Only one sign-in popup can be opened at a time.');
      } else {
        setError(err.message || 'Failed to authenticate with Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  const features = [
    'Dynamic schedule optimization',
    'Intelligent priority matrix mapping',
    'Real-time deadline proximity protection',
    'Contextual LLM-based work breakdown',
  ];

  return (
    <div className="min-h-screen flex items-center justify-center transition-colors duration-300 p-4 md:p-8 bg-theme-bg text-theme-primary">
      {/* Background Ornaments */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 backdrop-blur-xl border rounded-3xl overflow-hidden shadow-2xl p-6 md:p-10 bg-theme-card/40 border-theme-border">
        
        {/* Left Side: Brand Marketing & Product Intro */}
        <div className="lg:col-span-7 flex flex-col justify-between p-4 md:p-6">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2.5 bg-indigo-600 rounded-xl text-white">
                <Shield className="w-6 h-6 stroke-[1.5]" />
              </div>
              <span className={`text-xl font-bold font-sans tracking-tight ${
                isDark 
                  ? 'text-white' 
                  : 'bg-gradient-to-r from-slate-900 to-indigo-900 bg-clip-text text-transparent'
              }`}>
                Deadline Guardian AI
              </span>
            </div>

            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-3xl md:text-4xl font-bold tracking-tight leading-tight font-sans text-theme-primary"
            >
              Defend your deadlines. <br />
              <span className="text-indigo-600 dark:text-indigo-400">Master your productivity.</span>
            </motion.h2>

            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-sm md:text-base text-theme-secondary mt-4 leading-relaxed max-w-md"
            >
              Align your schedule, predict schedule blockages, and collaborate with our advanced AI productivity agent to stay consistently ahead.
            </motion.p>

            <div className="mt-8 space-y-3">
              {features.map((feature, i) => (
                <motion.div 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  key={i} 
                  className="flex items-center gap-2 text-theme-secondary text-sm"
                >
                  <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" />
                  <span>{feature}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-theme-border">
            <div className="flex items-center gap-3 text-xs text-theme-muted">
              <span className="p-1.5 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 rounded-lg">
                <Sparkles className="w-4 h-4" />
              </span>
              <span>Trusted by team leads, engineers, and product builders worldwide.</span>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form Interface */}
        <div className="lg:col-span-5 flex flex-col justify-center border rounded-2xl p-6 md:p-8 shadow-sm bg-theme-card/85 border-theme-border">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-theme-primary">Welcome Back</h3>
            <p className="text-xs text-theme-muted mt-1">Access your guardian dashboard to start tracking</p>
          </div>

          {error && (
            <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-500 font-medium leading-normal">
              {error}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleGuestLogin(); }} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-medium text-theme-secondary uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-theme-bg border-theme-border text-theme-primary placeholder-theme-muted"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-theme-secondary uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-theme-bg border-theme-border text-theme-primary placeholder-theme-muted"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="text-right">
              <a href="#" className="text-xs text-indigo-500 hover:underline">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white py-3 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Log in with Account</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-theme-border" />
            </div>
            <span className="relative px-3 text-xs text-theme-muted bg-theme-bg font-mono">
              OR PREFER
            </span>
          </div>

          {/* Social Sign-In */}
          <div className="space-y-3">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              type="button"
              className="w-full flex items-center justify-center gap-2 py-2.5 border rounded-xl text-xs font-semibold cursor-pointer active:scale-[0.98] transition-all border-theme-border bg-theme-bg hover:bg-theme-card text-theme-primary disabled:opacity-50"
            >
              <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 0, 0)">
                  <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.58h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.48C21.68,11.83 21.56,11.4 21.35,11.1z" fill="#4285F4" />
                  <path d="M12,20.58c2.59,0 4.77,-0.86 6.36,-2.3l-3.3,-2.58c-0.91,0.61 -2.08,0.98 -3.06,0.98 -2.36,0 -4.36,-1.59 -5.07,-3.72H3.45v2.66C5.07,18.79 8.35,20.58 12,20.58z" fill="#34A853" />
                  <path d="M6.93,12.96c-0.18,-0.54 -0.28,-1.12 -0.28,-1.71s0.1,-1.17 0.28,-1.71V6.88H3.45C2.84,8.1 2.5,9.47 2.5,10.92s0.34,2.82 0.95,4.04l3.48,-2.66z" fill="#FBBC05" />
                  <path d="M12,6.5c1.41,0 2.68,0.49 3.68,1.44l2.76,-2.76C16.77,3.52 14.59,2.5 12,2.5 8.35,2.5 5.07,4.29 3.45,7.95l3.48,2.66C7.64,8.09 9.64,6.5 12,6.5z" fill="#EA4335" />
                </g>
              </svg>
              <span>Continue with Google</span>
            </button>

            <button
              onClick={handleGuestLogin}
              disabled={loading}
              type="button"
              className="w-full flex items-center justify-center gap-1 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 py-2.5 rounded-xl text-xs font-semibold active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              <span>Quick Access Demo Mode</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
