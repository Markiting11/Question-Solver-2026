import React, { useState, useEffect } from 'react';
import { User, UserStatus } from '../types';
import { Mail, Lock, User as UserIcon, ArrowRight, ShieldCheck, Info } from 'lucide-react';
import { 
  signInWithGoogle, 
  registerWithEmailPassword, 
  loginWithEmailPassword,
  fetchPlatformConfig,
  getOrCreateUserProfile
} from '../services/firebase';

interface AuthFormsProps {
  onLoginSuccess: (user: User) => void;
  adminCreds: { email: string; pass: string };
}

export const AuthForms: React.FC<AuthFormsProps> = ({ onLoginSuccess, adminCreds }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [allowSignup, setAllowSignup] = useState(true);

  useEffect(() => {
    fetchPlatformConfig()
      .then(cfg => setAllowSignup(cfg.allowSignup))
      .catch(err => console.error("Config fetch error:", err));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      const profile = await loginWithEmailPassword(email, password);
      if (profile.status === 'pending') {
        setInfo("Your account is pending approval by the Admin.");
      } else if (profile.status === 'rejected') {
        setError("Your account request has been rejected.");
      } else {
        onLoginSuccess(profile);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError("Email/Password login is disabled. Please use Google Sign-In or enable Email/Password provider in the Firebase Console.");
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError("Invalid email or password.");
      } else {
        setError(err.message || "Failed to sign in.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    if (!allowSignup) {
      setError("Registration is currently disabled by the Admin.");
      setLoading(false);
      return;
    }

    try {
      const profile = await registerWithEmailPassword(email, password, name);
      if (profile.status === 'pending') {
        setInfo("Account request submitted! Waiting for Admin approval.");
        setMode('login');
        setEmail('');
        setPassword('');
        setName('');
      } else {
        onLoginSuccess(profile);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError("Email/Password signup is disabled. Please use Google Sign-In or enable Email/Password provider in the Firebase Console.");
      } else if (err.code === 'auth/email-already-in-use') {
        setError("An account with this email already exists.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password must be at least 6 characters.");
      } else {
        setError(err.message || "Failed to create account.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      const firebaseUser = await signInWithGoogle();
      const profile = await getOrCreateUserProfile(firebaseUser);
      if (profile.status === 'pending') {
        setInfo("Your account is pending approval by the Admin.");
      } else if (profile.status === 'rejected') {
        setError("Your account request has been rejected.");
      } else {
        onLoginSuccess(profile);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Google Sign-In failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-400 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-400 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
      </div>

      <div className="w-full max-w-md animate-fade-in-up">
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-2xl shadow-lg mb-4">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">{mode === 'login' ? 'Welcome Back' : 'Join Our Community'}</h2>
            <p className="text-slate-500 mt-2">{mode === 'login' ? 'Login to continue your learning' : 'Create an account to start solving'}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start text-red-700 text-sm">
              <AlertCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {info && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start text-blue-700 text-sm">
              <Info size={18} className="mr-2 mt-0.5 flex-shrink-0" />
              <span>{info}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Google Sign-In Button */}
            <button 
              type="button"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.87-4.53-5.2-4.53z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center my-6">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="px-3 text-xs text-slate-400 font-bold uppercase">Or use Email</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-4">
              {mode === 'signup' && (
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <UserIcon size={18} />
                  </div>
                  <input 
                    required
                    type="text" 
                    value={name}
                    disabled={loading}
                    onChange={e => setName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all disabled:opacity-50"
                  />
                </div>
              )}

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <Mail size={18} />
                </div>
                <input 
                  required
                  type="email" 
                  value={email}
                  disabled={loading}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all disabled:opacity-50"
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input 
                  required
                  type="password" 
                  value={password}
                  disabled={loading}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all disabled:opacity-50"
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transform transition hover:-translate-y-0.5 active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <span>{loading ? 'Please wait...' : (mode === 'login' ? 'Login Now' : 'Create Account')}</span>
                <ArrowRight size={18} />
              </button>
            </form>
          </div>

          <div className="mt-8 text-center text-sm text-slate-500">
            {mode === 'login' ? (
              <p>Don't have an account? <button disabled={loading} onClick={() => setMode('signup')} className="text-indigo-600 font-bold hover:underline disabled:opacity-50">Request Signup</button></p>
            ) : (
              <p>Already have an account? <button disabled={loading} onClick={() => setMode('login')} className="text-indigo-600 font-bold hover:underline disabled:opacity-50">Login</button></p>
            )}
          </div>
        </div>

        <div className="mt-8 text-center opacity-50 text-xs text-slate-400 font-medium tracking-widest uppercase">
          Anwar Ali Sehar • Secured Learning
        </div>
      </div>
    </div>
  );
};

const AlertCircle = ({ size, className }: { size: number, className?: string }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
);
