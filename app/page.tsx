"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, User, ShieldAlert, ArrowRight, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');
  const [secretKey, setSecretKey] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const body = isLogin ? { username, password } : { username, password, name, role, secretKey };
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (data.success) {
        if (isLogin) {
          localStorage.setItem('smartplate_token', data.token);
          localStorage.setItem('smartplate_user', JSON.stringify(data.user));
          toast.success(`Welcome back, ${data.user.name}!`);
          router.push(data.user.role === 'admin' ? '/admin' : '/student');
        } else {
          toast.success("Account created successfully! Please log in.");
          setIsLogin(true);
          setPassword('');
        }
      } else {
        toast.error(data.error || "An error occurred");
      }
    } catch (e) {
      toast.error("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const autofill = (u: string, p: string) => {
    setIsLogin(true);
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Left Hero Section */}
      <div className="flex-1 bg-card border-r border-border p-12 flex flex-col justify-center relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-background to-background opacity-40 z-0"></div>
        
        <div className="relative z-10 max-w-lg mx-auto md:mx-0">
          <div className="flex items-center gap-2 mb-8">
            <div className="p-3 bg-primary rounded-xl shadow-lg shadow-primary/20">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">SmartPlate AI</span>
          </div>
          
          <h1 className="text-5xl font-black mb-6 leading-tight text-white">
            Predict. Vote. Save.
          </h1>
          <p className="text-xl text-primary font-bold mb-6">
            AI that stops PG food wastage. (100% Pure Veg)
          </p>
          <p className="text-muted text-lg mb-10 leading-relaxed">
            In a college PG, lunch is packed daily assuming full attendance. But many students skip college, leading to massive food waste. SmartPlate AI lets students mark attendance, vote on menus, and uses AI to predict exact food quantities needed.
          </p>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-background/50 border border-border p-4 rounded-2xl flex flex-col">
              <span className="block text-3xl font-black text-white mb-1">55</span>
              <span className="text-xs text-muted uppercase font-bold tracking-wider">Total Students</span>
            </div>
            <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl flex flex-col shadow-[0_0_15px_-3px_rgba(34,197,94,0.15)]">
              <span className="block text-3xl font-black text-primary mb-1">₹18k</span>
              <span className="text-xs text-primary uppercase font-bold tracking-wider">Monthly Savings Potential</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Login/Signup Section */}
      <div className="w-full md:w-[450px] bg-background p-12 flex flex-col justify-center border-t md:border-t-0 border-border z-10 overflow-y-auto">
        <h2 className="text-3xl font-bold text-white mb-2">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        <p className="text-muted mb-8 text-sm">
          {isLogin ? 'Please log in to your account or use the demo credentials.' : 'Sign up to start saving food.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <>
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-4 bg-card border border-border rounded-xl text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-4 py-4 bg-card border border-border rounded-xl text-sm text-white focus:outline-none focus:border-primary">
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {role === 'admin' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <label className="block text-xs font-bold text-warning uppercase tracking-wider mb-2">Admin Secret Key</label>
                  <input
                    type="password"
                    required
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    placeholder="Enter admin secret key"
                    className="w-full px-4 py-4 bg-warning/5 border border-warning/30 rounded-xl text-sm text-white focus:outline-none focus:border-warning"
                  />
                </motion.div>
              )}
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Username</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-xl text-sm text-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <ShieldAlert className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-xl text-sm text-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition disabled:opacity-70 shadow-lg shadow-primary/20"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>{isLogin ? 'Sign In' : 'Sign Up'} <ArrowRight className="h-4 w-4" /></>}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-primary font-bold hover:underline">
            {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
          </button>
        </div>

        {isLogin && (
          <div className="mt-10 pt-8 border-t border-border">
            <p className="text-xs text-muted text-center mb-4 uppercase font-bold tracking-wider">Demo Quick Access</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => autofill('student', 'student123')} className="p-3 text-xs bg-card border border-border rounded-xl text-slate-300 hover:border-primary hover:text-white font-semibold transition">
                Student Login
              </button>
              <button onClick={() => autofill('admin', 'admin123')} className="p-3 text-xs bg-card border border-border rounded-xl text-slate-300 hover:border-primary hover:text-white font-semibold transition">
                Admin Login
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
