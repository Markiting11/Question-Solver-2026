import React, { useState } from 'react';
import { User } from '../types';
import { ShieldCheck, Info, Sparkles } from 'lucide-react';
import { 
  signInWithGoogle, 
  getOrCreateUserProfile
} from '../services/firebase';

interface AuthFormsProps {
  onLoginSuccess: (user: User) => void;
  adminCreds: { email: string; pass: string };
}

export const AuthForms: React.FC<AuthFormsProps> = ({ onLoginSuccess }) => {
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      const firebaseUser = await signInWithGoogle();
      const profile = await getOrCreateUserProfile(firebaseUser);
      if (profile.status === 'pending') {
        setInfo("Your account has been registered! Admin approval is pending.");
      } else if (profile.status === 'rejected') {
        setError("Your account request was rejected by the Admin.");
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
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-2xl shadow-lg mb-4">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Anwar Ali Sehar</h2>
            <p className="text-slate-500 text-sm mt-1">Secured Question Solver Platform</p>
          </div>

          {/* Sandbox Info Banner */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-2">
            <div className="flex items-center font-bold text-amber-800 gap-1.5">
              <Sparkles size={14} className="text-amber-600" />
              <span>Sandbox Access Notice</span>
            </div>
            <p className="leading-relaxed">
              Since we are running in an AI Studio Starter Tier project, the **Email/Password** provider cannot be enabled due to administrator role constraints. 
            </p>
            <p className="leading-relaxed font-semibold">
              Please use the secure **Google Sign-In** button below to login or request registration immediately!
            </p>
            <div className="border-t border-amber-200/50 pt-2 text-[11px] text-amber-700 font-medium">
              سینڈ باکس کے قوانین کی وجہ سے، ای میل/پاس ورڈ لاگ ان غیر فعال ہے۔ براہ کرم لاگ ان یا سائن اپ کرنے کے لیے نیچے دیے گئے بٹن پر کلک کریں۔
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start text-red-700 text-sm">
              <AlertCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {info && (
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start text-blue-700 text-sm">
              <Info size={18} className="mr-2 mt-0.5 flex-shrink-0" />
              <span>{info}</span>
            </div>
          )}

          <div className="space-y-4 pt-2">
            {/* Google Sign-In Button */}
            <button 
              type="button"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 px-5 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-md shadow-indigo-100 hover:shadow-indigo-200 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              ) : (
                <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.87-4.53-5.2-4.53z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
              )}
              <span>{loading ? "Connecting..." : "Continue with Google"}</span>
            </button>
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
