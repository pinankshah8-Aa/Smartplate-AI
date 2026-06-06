"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChefHat, GraduationCap, Lock, ShieldAlert, User, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      if (role === 'student' && username === 'student' && password === 'student123') {
        localStorage.setItem('smartplate_user_role', 'student');
        localStorage.setItem('smartplate_username', 'student');
        router.push('/student');
      } else if (role === 'admin' && username === 'admin' && password === 'admin123') {
        localStorage.setItem('smartplate_user_role', 'admin');
        localStorage.setItem('smartplate_username', 'admin');
        router.push('/admin');
      } else {
        setError('Invalid credentials. Please use the credentials provided in the helper boxes.');
        setIsLoading(false);
      }
    }, 800);
  };

  const fillCredentials = (type: 'student' | 'admin') => {
    setRole(type);
    if (type === 'student') {
      setUsername('student');
      setPassword('student123');
    } else {
      setUsername('admin');
      setPassword('admin123');
    }
    setError('');
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-[#090d16] py-12">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#22c55e]/5 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#22c55e]/5 rounded-full filter blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md space-y-8 z-10">
        
        {/* Logo and Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl pulse-glow-border">
            <ChefHat className="h-12 w-12 text-[#22c55e]" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-[#22c55e] bg-clip-text text-transparent sm:text-5xl">
            SmartPlate AI
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-xs mx-auto">
            Stop PG Food Wastage with Intelligence
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          {/* Role Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800/80">
            <button
              onClick={() => { setRole('student'); setError(''); }}
              className={`flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                role === 'student'
                  ? 'bg-[#22c55e] text-slate-950 font-bold shadow-lg shadow-[#22c55e]/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              Student
            </button>
            <button
              onClick={() => { setRole('admin'); setError(''); }}
              className={`flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                role === 'admin'
                  ? 'bg-[#22c55e] text-slate-950 font-bold shadow-lg shadow-[#22c55e]/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <User className="h-4 w-4" />
              Admin Mess
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Username / Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={`Enter ${role} username`}
                  className="block w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e] transition duration-200 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e] transition duration-200 text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-400 text-xs">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold bg-[#22c55e] text-slate-950 hover:bg-[#16a34a] focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Login as {role === 'student' ? 'Student' : 'Admin'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Credential Helpers */}
          <div className="pt-4 border-t border-slate-800/60 space-y-3">
            <p className="text-center text-xs text-slate-500 font-medium">
              Demo Credentials (Click to Auto-fill)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('student')}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-[#22c55e]/50 hover:bg-slate-950/80 transition duration-200 text-left"
              >
                <span className="text-[10px] text-slate-400 font-bold uppercase">Student Demo</span>
                <span className="text-xs text-[#22c55e] font-semibold">student / student123</span>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('admin')}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-[#22c55e]/50 hover:bg-slate-950/80 transition duration-200 text-left"
              >
                <span className="text-[10px] text-slate-400 font-bold uppercase">Admin Demo</span>
                <span className="text-xs text-[#22c55e] font-semibold">admin / admin123</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-600">
          SmartPlate AI © {new Date().getFullYear()} • Engineered for Sustainable Campus Messes
        </p>

      </div>
    </div>
  );
}
