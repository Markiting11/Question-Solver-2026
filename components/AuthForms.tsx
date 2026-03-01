
import React, { useState, useEffect } from 'react';
import { User, UserStatus } from '../types';
import { Mail, Lock, User as UserIcon, ArrowRight, ShieldCheck, Info } from 'lucide-react';

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

  const getUsers = (): User[] => {
    const users = localStorage.getItem('sqs_users');
    return users ? JSON.parse(users) : [];
  };

  const getSignupConfig = () => {
    const config = localStorage.getItem('sqs_config');
    return config ? JSON.parse(config) : { allowSignup: true };
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    // Check Hardcoded Admin
    if (email === adminCreds.email && password === adminCreds.pass) {
      const adminUser: User = {
        email: adminCreds.email,
        name: "Admin",
        role: "admin",
        status: "approved",
        createdAt: Date.now()
      };
      localStorage.setItem('sqs_session', JSON.stringify(adminUser));
      onLoginSuccess(adminUser);
      return;
    }

    // Check Registered Users
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      setError("Invalid email or password.");
    } else if (user.status === 'pending') {
      setInfo("Your account is pending approval by the Admin.");
    } else if (user.status === 'rejected') {
      setError("Your account request has been rejected.");
    } else {
      localStorage.setItem('sqs_session', JSON.stringify(user));
      onLoginSuccess(user);
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!getSignupConfig().allowSignup) {
      setError("Registration is currently disabled by the Admin.");
      return;
    }

    const users = getUsers();
    if (users.some(u => u.email === email)) {
      setError("An account with this email already exists.");
      return;
    }

    const newUser: User = {
      email,
      password,
      name,
      role: 'user',
      status: 'pending',
      createdAt: Date.now()
    };

    localStorage.setItem('sqs_users', JSON.stringify([...users, newUser]));
    setInfo("Account created! Waiting for Admin approval.");
    setMode('login');
    setEmail('');
    setPassword('');
    setName('');
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
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-2xl shadow-lg mb-4">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">{mode === 'login' ? 'Welcome Back' : 'Join Our Community'}</h2>
            <p className="text-slate-500 mt-2">{mode === 'login' ? 'Login to continue your learning' : 'Create an account to start solving'}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center text-red-700 text-sm">
              <AlertCircle size={18} className="mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {info && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center text-blue-700 text-sm">
              <Info size={18} className="mr-2 flex-shrink-0" />
              <span>{info}</span>
            </div>
          )}

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
                  onChange={e => setName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
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
                onChange={e => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
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
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transform transition hover:-translate-y-0.5 active:scale-95 flex items-center justify-center space-x-2"
            >
              <span>{mode === 'login' ? 'Login Now' : 'Create Account'}</span>
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500">
            {mode === 'login' ? (
              <p>Don't have an account? <button onClick={() => setMode('signup')} className="text-indigo-600 font-bold hover:underline">Request Signup</button></p>
            ) : (
              <p>Already have an account? <button onClick={() => setMode('login')} className="text-indigo-600 font-bold hover:underline">Login</button></p>
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
