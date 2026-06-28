import React, { useState, useEffect } from 'react';
import { solveQuestion } from './services/geminiService';
import { HistoryItem, SolutionResponse, Language, User, AuthState } from './types';
import { InputSection } from './components/InputSection';
import { AnswerSection } from './components/AnswerSection';
import { HistorySidebar } from './components/HistorySidebar';
import { AuthForms } from './components/AuthForms';
import { AdminPanel } from './components/AdminPanel';
import { 
  auth, 
  getOrCreateUserProfile, 
  logoutUser, 
  saveSolutionToHistory, 
  subscribeToHistory 
} from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Menu, Sparkles, AlertCircle, LogOut, Settings } from 'lucide-react';

const ADMIN_EMAIL = "arshad2097@gmail.com";

const App: React.FC = () => {
  // Auth State
  const [authState, setAuthState] = useState<AuthState>({ user: null, isAuthenticated: false });
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState<'app' | 'admin'>('app');
  
  // App State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [solution, setSolution] = useState<SolutionResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [language, setLanguage] = useState<Language>('en');

  // Listen to Auth State
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await getOrCreateUserProfile(firebaseUser);
          setAuthState({ user: profile, isAuthenticated: true });
        } catch (e) {
          console.error("Error retrieving user profile:", e);
          setAuthState({ user: null, isAuthenticated: false });
        }
      } else {
        setAuthState({ user: null, isAuthenticated: false });
      }
      setAuthLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // Listen to User History real-time from Firestore
  useEffect(() => {
    if (!authState.isAuthenticated || !authState.user || authState.user.status !== 'approved' || !auth.currentUser) {
      setHistory([]);
      return;
    }

    const unsubscribeHistory = subscribeToHistory(
      auth.currentUser.uid,
      (updatedHistory) => {
        setHistory(updatedHistory);
      },
      (err) => {
        console.error("Error subscribing to history:", err);
      }
    );

    return () => unsubscribeHistory();
  }, [authState.isAuthenticated, authState.user]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      setAuthState({ user: null, isAuthenticated: false });
      setView('app');
      setSolution(null);
    } catch (e) {
      console.error("Logout error:", e);
    }
  };

  const handleSolve = async (text: string, image: File | null, audio: Blob | null) => {
    setLoading(true);
    setError(null);
    setSolution(null);
    setCurrentQuestion(text || (audio ? "Audio Question" : "Image Question"));

    try {
      const result = await solveQuestion(text, image, audio, language);
      setSolution(result);

      if (auth.currentUser) {
        await saveSolutionToHistory(
          auth.currentUser.uid,
          text || (audio ? "Audio Question" : (image ? "Image Question" : "Unknown Question")),
          result
        );
      }
    } catch (err: any) {
      console.error(err);
      setError(language === 'ur' ? "سوال حل کرنے میں ناکامی۔" : "Failed to solve the question.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setSolution(item.solution);
    setCurrentQuestion(item.question);
    setError(null);
    setView('app');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-slate-500 font-medium">Authenticating secured session...</p>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    return <AuthForms onLoginSuccess={(user) => setAuthState({ user, isAuthenticated: true })} adminCreds={{ email: ADMIN_EMAIL, pass: "" }} />;
  }

  if (authState.user?.status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-400 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-400 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        </div>

        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl border border-amber-200 shadow-sm animate-pulse">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Approval Pending</h2>
            <p className="text-slate-500 text-sm">Hi {authState.user?.name || 'there'}! Your account has been registered successfully. It is currently pending approval by the administrator.</p>
          </div>
          <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl text-xs text-amber-800 text-left">
            <strong>What happens next?</strong> Once approved, you will get complete access to the Anwar Ali Sehar Question Solver platform. Please check back soon or contact the administrator (arshad2097@gmail.com).
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition-all active:scale-95"
          >
            <LogOut size={18} />
            <span>Logout and Switch Account</span>
          </button>
        </div>
      </div>
    );
  }

  if (authState.user?.status === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-400 rounded-full blur-3xl animate-blob"></div>
        </div>

        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 text-red-500 rounded-2xl border border-red-200 shadow-sm">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Registration Rejected</h2>
            <p className="text-slate-500 text-sm">Your registration request has been rejected by the administrator.</p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition-all active:scale-95"
          >
            <LogOut size={18} />
            <span>Logout and Switch Account</span>
          </button>
        </div>
      </div>
    );
  }

  const isAdmin = authState.user?.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const isUrdu = language === 'ur';

  return (
    <div className={`min-h-screen relative bg-slate-50 overflow-hidden ${isUrdu ? 'font-[sans-serif]' : ''}`}>
      {/* Background Blobs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2.5 -ml-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all duration-200 active:scale-95"
            >
              <Menu size={24} />
            </button>
            
            <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => { setSolution(null); setError(null); setView('app'); }}>
              <div className="relative h-10 w-10">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center text-white shadow-sm font-bold">AS</div>
              </div>
              <div className="hidden sm:flex flex-col">
                 <h1 className="text-lg font-bold text-slate-800 leading-none">Anwar Ali Sehar</h1>
                 <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">Question Solver</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            {isAdmin && (
               <button 
                onClick={() => setView(view === 'admin' ? 'app' : 'admin')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${view === 'admin' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
               >
                 <Settings size={18} />
                 <span className="hidden md:inline">Admin Settings</span>
               </button>
            )}

            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button onClick={() => setLanguage('en')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${!isUrdu ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-50'}`}>ENG</button>
                <button onClick={() => setLanguage('ur')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${isUrdu ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-50'}`}>اردو</button>
            </div>

            <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Logout">
              <LogOut size={22} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <HistorySidebar 
          history={history} 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          onSelect={handleSelectHistory}
          language={language}
        />

        <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'md:ml-72' : ''} p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full`}>
          {view === 'admin' && isAdmin ? (
            <AdminPanel />
          ) : (
            <div className="space-y-12 pb-20">
              {!solution && !loading && (
                <div className="text-center py-12 animate-fade-in-up">
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/80 border border-slate-200 text-slate-600 text-sm font-medium mb-4 shadow-sm">
                    <Sparkles size={14} className="mr-2 text-emerald-500" />
                    Welcome, {authState.user?.name}
                  </div>
                  <h2 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight">
                    {isUrdu ? 'کسی بھی مضمون میں مہارت حاصل کریں' : 'Master any subject in seconds.'}
                  </h2>
                </div>
              )}

              {error && (
                <div className="max-w-3xl mx-auto bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl flex items-center justify-center animate-fade-in-up shadow-sm">
                  <AlertCircle className="mr-2" size={20} />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              <InputSection onSolve={handleSolve} isLoading={loading} language={language} />

              {solution && (
                <div className="animate-fade-in-up">
                   <AnswerSection solution={solution} language={language} />
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
