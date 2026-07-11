"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, User, ShieldAlert, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Manual validation to avoid silent HTML5 block on mobile
    if (!username.trim() || !password.trim()) {
      toast.error("Please fill in your username and password");
      return;
    }
    if (!isLogin && !name.trim()) {
      toast.error("Please provide your full name");
      return;
    }
    if (!isLogin && !institutionName.trim()) {
      toast.error("Please provide your institution name");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const body = isLogin ? { username, password } : { username, password, name, institutionName };
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true'
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (data.success) {
        if (isLogin) {
          toast.success(`Welcome back, ${data.user.name}!`);
          router.push(data.user.role === 'student' ? '/student' : '/admin');
        } else {
          toast.success("Account created successfully! Logging you in...");
          // Auto-login after sign up
          const loginRes = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Bypass-Tunnel-Reminder': 'true'
            },
            body: JSON.stringify({ username, password })
          });
          const loginData = await loginRes.json();
          if (loginData.success) {
            router.push(loginData.user.role === 'student' ? '/student' : '/admin');
          } else {
            setIsLogin(true);
            setPassword('');
          }
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

  // Animation variants
  const containerVariants: any = {
    hidden: { opacity: 1 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };
  
  const itemVariants: any = {
    hidden: { y: 20, opacity: 1 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row relative overflow-x-hidden selection:bg-primary/30 w-full">
      
      {/* Animated Background Elements */}
      <div className="absolute top-0 left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full mix-blend-screen filter blur-[120px] animate-blob z-0" />
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-info/20 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-2000 z-0" />
      <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] bg-primary/10 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-4000 z-0" />

      <div className="w-full max-w-[1920px] mx-auto flex flex-col md:flex-row relative z-10 flex-1">
        {/* Left Hero Section */}
        <div className="flex-1 p-6 sm:p-10 md:p-16 flex flex-col justify-center relative z-10">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-lg mx-auto md:mx-0 lg:ml-12 xl:ml-24"
          >
            <motion.div variants={itemVariants} className="flex items-center gap-3 mb-10">
              <div className="relative">
                <div className="absolute inset-0 bg-primary blur-md opacity-50 rounded-xl" />
                <div className="relative p-3 bg-gradient-to-br from-primary to-primary-dark rounded-xl border border-white/20">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
              </div>
              <span className="text-3xl font-black tracking-tight text-white drop-shadow-md">SmartPlate AI</span>
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="text-5xl md:text-6xl font-black mb-6 leading-[1.1] text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/60">
              Predict.<br/>Vote.<br/><span className="text-primary drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">Save.</span>
            </motion.h1>
            
            <motion.p variants={itemVariants} className="text-xl text-primary-light font-medium mb-6">
              AI that stops PG food wastage. (100% Pure Veg)
            </motion.p>
            
            <motion.p variants={itemVariants} className="text-muted text-lg mb-10 leading-relaxed max-w-md">
              In hostels and PGs, meals are prepared assuming full attendance. But many students skip meals, leading to massive food waste. SmartPlate AI lets students mark attendance, vote on menus, and uses AI to predict exact food quantities needed.
            </motion.p>

            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 max-w-sm">
              <div className="glass-panel p-5 rounded-2xl flex flex-col relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="block text-4xl font-black text-white mb-1 drop-shadow-sm">55</span>
                <span className="text-[10px] text-muted uppercase font-bold tracking-widest">Total Students</span>
              </div>
              <div className="glass-panel border-primary/30 bg-primary/5 p-5 rounded-2xl flex flex-col relative overflow-hidden group shadow-[0_0_20px_-5px_rgba(16,185,129,0.2)]">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="block text-4xl font-black text-primary mb-1 drop-shadow-[0_2px_4px_rgba(16,185,129,0.3)]">₹18k</span>
                <span className="text-[10px] text-primary uppercase font-bold tracking-widest">Monthly Savings</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Right Login/Signup Section */}
        <div className="w-full md:w-[500px] xl:w-[600px] p-6 sm:p-10 md:p-12 flex flex-col justify-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass-panel p-6 sm:p-8 md:p-10 rounded-3xl w-full max-w-md mx-auto shadow-2xl relative"
          >
            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            <p className="text-muted mb-8 text-sm">
              {isLogin ? 'Log in to your account or use the demo credentials below.' : 'Sign up to start saving food today.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="popLayout">
                {!isLogin && (
                  <motion.div 
                    initial={{ opacity: 1, height: 'auto' }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div>
                      <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name"
                        className="w-full px-4 py-3.5 glass-input rounded-xl text-sm text-white placeholder:text-muted/60"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-1.5 ml-1">College / Institution Name</label>
                      <input
                        type="text"
                        value={institutionName}
                        onChange={(e) => setInstitutionName(e.target.value)}
                        placeholder="e.g., Global Hostel, City PG"
                        className="w-full px-4 py-3.5 glass-input rounded-xl text-sm text-white placeholder:text-muted/60"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-1.5 ml-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full px-4 py-3.5 glass-input rounded-xl text-sm text-white placeholder:text-muted/60"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-1.5 ml-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-4 py-3.5 glass-input rounded-xl text-sm text-white placeholder:text-muted/60"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-primary hover:bg-primary-light text-background font-black rounded-xl mt-6 shadow-[0_0_20px_-5px_rgba(16,185,129,0.5)] transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" /> : <>{isLogin ? 'Sign In' : 'Sign Up'} <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-xs text-muted">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-primary font-bold hover:underline transition-all">
                  {isLogin ? 'Sign Up' : 'Log In'}
                </button>
              </p>
            </div>

        </motion.div>
      </div>
      </div>
    </div>
  );
}
