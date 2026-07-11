"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, CheckCircle, XCircle, Clock, ThumbsUp, ThumbsDown, AlertTriangle, Leaf, CalendarCheck, TrendingDown, MessageSquare, Send, CalendarDays, AlertOctagon, Sparkles, Check, Lock, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import { ThemeToggle } from '@/components/ThemeToggle';

const WEEKLY_MENU = [
  { day: 'Mon', breakfast: 'Poha, Jalebi, Tea', lunch: 'Dal Makhani, Jeera Rice, Paneer Tikka, Roti, Salad', dinner: 'Kadhai Paneer, Roti' },
  { day: 'Tue', breakfast: 'Aloo Paratha, Curd, Pickle', lunch: 'Aloo Gobi, Chana Masala, Plain Rice, Roti, Raita', dinner: 'Mix Veg, Dal Tadka, Roti' },
  { day: 'Wed', breakfast: 'Idli, Sambar, Coconut Chutney', lunch: 'Palak Paneer, Mix Veg, Pulao, Roti, Papad', dinner: 'Rajma Chawal, Salad' },
  { day: 'Thu', breakfast: 'Puri Sabzi, Halwa', lunch: 'Rajma Chawal, Bhindi Masala, Roti, Salad', dinner: 'Malai Kofta, Naan' },
  { day: 'Fri', breakfast: 'Upma, Tea, Biscuits', lunch: 'Kadhai Paneer, Dal Tadka, Jeera Rice, Roti', dinner: 'Chole Bhature, Sweet Lassi' },
  { day: 'Sat', breakfast: 'Masala Dosa, Sambar', lunch: 'Pav Bhaji, Veg Biryani, Boondi Raita, Gulab Jamun', dinner: 'Aloo Tikki, Chole' },
  { day: 'Sun', breakfast: 'Chole Bhature, Lassi', lunch: 'Paneer Butter Masala, Garlic Naan, Pulao, Salad', dinner: 'Dal Makhani, Jeera Rice' },
];

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  
  // States
  const [attendance, setAttendance] = useState<'pending'|'going'|'not_going'>('pending');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [collectedFood, setCollectedFood] = useState(false);
  const [qrSrc, setQrSrc] = useState('');
  
  const [showEmergency, setShowEmergency] = useState(false);
  const [emergencyReason, setEmergencyReason] = useState('');
  
  const [rating, setRating] = useState<'up'|'down'|null>(null);
  const [comment, setComment] = useState('');
  
  const [pollVote, setPollVote] = useState<boolean|null>(null);
  const [pollStats, setPollStats] = useState({ changeVotes: 0, keepVotes: 0, totalVotes: 0, changePercentage: 0 });

  const [activeDayTab, setActiveDayTab] = useState('Mon');
  const [activeTab, setActiveTab] = useState<'today' | 'menu' | 'community'>('today');
  const [cutoffTime, setCutoffTime] = useState('08:30');
  const [isTimeLocked, setIsTimeLocked] = useState(false);

  const [wasteRisk, setWasteRisk] = useState({ missedMeals: 0, isHighRisk: false });
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [weeklyMenu, setWeeklyMenu] = useState<{day: string, breakfast?: string, lunch?: string, dinner?: string}[]>(WEEKLY_MENU);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (!data.success || data.user.role !== 'student') {
          router.push('/');
          return;
        }
        setUser(data.user);
        setWasteRisk({
          missedMeals: data.user.missedMeals || 0,
          isHighRisk: (data.user.missedMeals || 0) >= 3
        });
        loadData(data.user.id);
      } catch (e) {
        router.push('/');
      }
    };
    fetchUser();
  }, [router]);

  const formatTimeToAMPM = (time24: string) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${String(minutes).padStart(2, '0')} ${ampm}`;
  };

  const loadData = async (userId: string) => {
    setIsLoading(true);
    try {
      const resSettings = await fetch('/api/admin/settings');
      const dataSettings = await resSettings.json();
      if (dataSettings.success) {
        setCutoffTime(dataSettings.cutoffTime);
        checkLock(dataSettings.cutoffTime);
      }

      const resAtt = await fetch(`/api/student/attendance?userId=${userId}`);
      const dataAtt = await resAtt.json();
      if (dataAtt.success) {
        setAttendance(dataAtt.attendance);
        setIsSubmitted(dataAtt.isSubmitted || false);
        setCollectedFood(dataAtt.collectedFood || false);
        if (dataAtt.attendance === 'going' && dataAtt.isSubmitted) generateQR(userId);
      }

      const resPoll = await fetch('/api/student/poll/stats');
      const dataPoll = await resPoll.json();
      if (dataPoll.success) {
        setPollStats(dataPoll.stats);
      }

      const resLeaderboard = await fetch('/api/student/leaderboard');
      const dataLeaderboard = await resLeaderboard.json();
      if (dataLeaderboard.success) {
        setLeaderboard(dataLeaderboard.leaderboard);
      }

      const resMenu = await fetch('/api/admin/menu');
      const dataMenu = await resMenu.json();
      if (dataMenu.success && dataMenu.menus && dataMenu.menus.length > 0) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const updatedMenu = [...WEEKLY_MENU];
        
        dataMenu.menus.forEach((m: any) => {
          const d = new Date(m.dateString);
          const dayStr = days[d.getDay()];
          const idx = updatedMenu.findIndex(w => w.day === dayStr);
          if (idx !== -1) {
            updatedMenu[idx] = {
              day: dayStr,
              breakfast: m.breakfast || '',
              lunch: m.lunch || '',
              dinner: m.dinner || ''
            };
          }
        });
        setWeeklyMenu(updatedMenu);
      }
      
      const todayStr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];
      setActiveDayTab(todayStr);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const checkLock = (cutoff: string) => {
    const [cutoffHours, cutoffMinutes] = cutoff.split(':').map(Number);
    const now = new Date();
    const utcOffset = now.getTimezoneOffset() * 60000;
    const istOffset = 5.5 * 60 * 60000; 
    const istDate = new Date(now.getTime() + utcOffset + istOffset);

    const currentHours = istDate.getHours();
    const currentMinutes = istDate.getMinutes();

    if (currentHours > cutoffHours || (currentHours === cutoffHours && currentMinutes >= cutoffMinutes)) {
      setIsTimeLocked(true);
    } else {
      setIsTimeLocked(false);
    }
  };

  const isLocked = isTimeLocked || isSubmitted;

  const generateQR = async (userId: string) => {
    try {
      const res = await fetch(`/api/student/qr-token?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        const url = await QRCode.toDataURL(data.token, {
          color: { dark: '#000000', light: '#ffffff' },
          margin: 2
        });
        setQrSrc(url);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (attendance === 'going' && isSubmitted && user) {
      generateQR(user.id); // initial fetch
      interval = setInterval(() => {
        generateQR(user.id);
      }, 55000); // refresh every 55s
    }
    return () => clearInterval(interval);
  }, [attendance, isSubmitted, user]);

  const selectAttendance = (status: 'going'|'not_going') => {
    if (isLocked) return;
    setAttendance(status);
  };

  const submitAttendance = async () => {
    if (attendance === 'pending') {
      return toast.error("Please select Going or Not Going first!");
    }
    try {
      const res = await fetch('/api/student/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, status: attendance, isSubmitted: true })
      });
      const data = await res.json();
      if (data.success) {
        setIsSubmitted(true);
        toast.success("Attendance locked!");
        if (attendance === 'going') generateQR(user.id);
      }
    } catch (e) {
      toast.error("Failed to submit attendance");
    }
  };

  const submitFeedback = async () => {
    if (!rating) return toast.error("Please select a rating");
    try {
      const res = await fetch('/api/student/rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, rating, comment })
      });
      if (res.ok) {
        toast.success("Feedback submitted!");
        setRating(null);
        setComment('');
      }
    } catch (e) {
      toast.error("Failed to submit feedback");
    }
  };

  const submitPoll = async (vote: boolean) => {
    try {
      const res = await fetch('/api/student/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, voteChange: vote })
      });
      const data = await res.json();
      if (data.success) {
        setPollVote(vote);
        toast.success("Vote recorded");
      }
      
      const resPoll = await fetch('/api/student/poll/stats');
      const dataPoll = await resPoll.json();
      if (dataPoll.success) setPollStats(dataPoll.stats);
    } catch (e) {
      toast.error("Failed to cast vote");
    }
  };

  const submitEmergency = async () => {
    if (!emergencyReason) return toast.error("Please enter a reason");
    try {
      await fetch('/api/student/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, reason: emergencyReason })
      });
      toast.success("Request sent to Admin");
      setShowEmergency(false);
      setEmergencyReason('');
    } catch (e) {
      toast.error("Failed to submit request");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.clear();
      router.push('/');
    } catch(e) {}
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-background text-foreground pb-24 relative overflow-hidden">
        <header className="glass-panel sticky top-0 z-40 border-b border-white/5 px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/5 rounded-xl animate-pulse" />
              <div className="space-y-2">
                <div className="w-32 h-4 bg-white/5 rounded animate-pulse" />
                <div className="w-20 h-2 bg-white/5 rounded animate-pulse" />
              </div>
            </div>
            <div className="w-8 h-8 bg-white/5 rounded-xl animate-pulse" />
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 mt-8 space-y-8">
          <div className="glass-card h-72 rounded-3xl animate-pulse bg-white/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card h-64 rounded-3xl animate-pulse bg-white/5 relative overflow-hidden" />
            <div className="glass-card h-64 rounded-3xl animate-pulse bg-white/5 relative overflow-hidden" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 overflow-x-hidden selection:bg-primary/30 w-full">
      
      {/* Background Animated Elements */}
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full mix-blend-screen blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-info/10 rounded-full mix-blend-screen blur-[120px] pointer-events-none" />

      <header className="glass-panel sticky top-0 z-40 border-b border-white/5 px-4 sm:px-8 xl:px-12 py-4">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary to-primary-dark rounded-xl border border-white/10 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-white leading-tight">SmartPlate AI</h1>
              <p className="text-[10px] text-primary-light font-bold tracking-wider uppercase">Student Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="text-sm text-muted hidden md:inline-block">Welcome, <strong className="text-white">{user.name}</strong></span>
            <ThemeToggle />
            <button onClick={handleLogout} className="p-2 bg-card border border-border rounded-xl text-muted hover:text-white hover:border-white/20 transition-all shadow-sm">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-8 xl:px-12 mt-6 sm:mt-8 space-y-6 sm:space-y-8 relative z-10">
        
        {/* Navigation Tabs */}
        <div className="flex bg-card p-1.5 rounded-2xl mb-8 shadow-sm border border-border overflow-x-auto scrollbar-hide relative z-20">
          {['today', 'menu', 'community'].map((tab) => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab as any)} 
              className={`relative flex-1 py-2.5 sm:py-3 text-sm font-bold rounded-xl transition-colors duration-300 ${activeTab === tab ? 'text-white' : 'text-muted hover:text-foreground'}`}
            >
              {activeTab === tab && (
                <motion.div 
                  layoutId="studentTabBubble"
                  className="absolute inset-0 bg-primary rounded-xl shadow-md -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{tab === 'today' ? 'Today' : tab === 'menu' ? 'Weekly Menu' : 'Community'}</span>
            </button>
          ))}
        </div>

        {activeTab === 'today' && wasteRisk.isHighRisk && !collectedFood && attendance === 'going' && (
          <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1,y:0}} className="glass-panel border-danger/30 bg-danger/5 p-4 rounded-2xl flex items-start gap-4 shadow-[0_0_20px_-5px_rgba(244,63,94,0.2)]">
            <div className="p-2 bg-danger/20 rounded-full flex-shrink-0">
              <AlertOctagon className="h-5 w-5 text-danger" />
            </div>
            <div>
              <h3 className="text-danger font-bold text-sm mb-1">Food Waste Warning</h3>
              <p className="text-danger/80 text-xs">You failed to collect lunch for <strong>{wasteRisk.missedMeals} days</strong>. Please ensure you collect your meal today to avoid account restrictions.</p>
            </div>
          </motion.div>
        )}

        {/* Personal Impact */}
        {activeTab === 'today' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
          <div className="glass-card p-6 rounded-3xl flex items-center gap-4 sm:flex-col sm:text-center sm:justify-center group">
            <div className="p-4 bg-primary/10 rounded-2xl group-hover:scale-110 transition-transform flex-shrink-0">
              <Leaf className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-3xl font-black text-white">450</div>
              <div className="text-[10px] text-muted uppercase font-bold tracking-widest mt-1">Eco Points</div>
            </div>
          </div>
          <div className="glass-card p-6 rounded-3xl flex items-center gap-4 sm:flex-col sm:text-center sm:justify-center group">
            <div className="p-4 bg-info/10 rounded-2xl group-hover:scale-110 transition-transform flex-shrink-0">
              <CalendarCheck className="h-6 w-6 text-info" />
            </div>
            <div>
              <div className="text-3xl font-black text-white">18</div>
              <div className="text-[10px] text-muted uppercase font-bold tracking-widest mt-1">Meals Eaten</div>
            </div>
          </div>
          <div className="glass-card p-6 rounded-3xl flex items-center gap-4 sm:flex-col sm:text-center sm:justify-center group">
            <div className="p-4 bg-warning/10 rounded-2xl group-hover:scale-110 transition-transform flex-shrink-0">
              <TrendingDown className="h-6 w-6 text-warning" />
            </div>
            <div>
              <div className="text-3xl font-black text-white">2.5<span className="text-lg">kg</span></div>
              <div className="text-[10px] text-muted uppercase font-bold tracking-widest mt-1">Waste Avoided</div>
            </div>
          </div>
          </motion.div>
        )}

        {/* Attendance Card */}
        {activeTab === 'today' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="glass-card rounded-3xl p-6 md:p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 pointer-events-none">
            <div className={`flex items-center gap-2 border px-3 py-1.5 rounded-full backdrop-blur-md ${isLocked ? 'bg-danger/10 border-danger/30' : 'bg-background/50 border-white/10'}`}>
              <Clock className={`h-4 w-4 ${isLocked ? 'text-danger' : 'text-warning'}`} />
              <span className={`text-[10px] uppercase tracking-wider font-bold ${isLocked ? 'text-danger' : 'text-muted'}`}>
                {isTimeLocked ? `Locked at ${formatTimeToAMPM(cutoffTime)}` : `Auto-locks at ${formatTimeToAMPM(cutoffTime)}`}
              </span>
            </div>
          </div>

          <h2 className="text-2xl md:text-3xl font-black text-white mb-2 mt-2">Meal required tomorrow?</h2>
          <p className="text-muted text-sm md:text-base mb-8 max-w-xl">Your choice directly impacts food preparation. Help us predict exact quantities and completely eliminate food waste.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => selectAttendance('going')}
              disabled={isLocked}
              className={`p-6 rounded-2xl border flex items-center justify-center gap-4 transition-all duration-300 transform active:scale-[0.98]
                ${attendance === 'going' ? 'border-primary bg-primary/10 shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]' : 'border-white/10 bg-background/40 hover:bg-card hover:border-white/20'}
                ${isLocked && attendance !== 'going' ? 'opacity-40 cursor-not-allowed filter grayscale' : ''}
              `}
            >
              <div className={`p-3 rounded-full transition-colors duration-300 ${attendance === 'going' ? 'bg-primary text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-card border border-white/10 text-muted'}`}>
                <CheckCircle className="h-6 w-6" />
              </div>
              <span className={`font-black text-lg ${attendance === 'going' ? 'text-primary drop-shadow-[0_2px_4px_rgba(16,185,129,0.4)]' : 'text-white'}`}>Yes, Required</span>
            </button>
            
            <button 
              onClick={() => selectAttendance('not_going')}
              disabled={isLocked}
              className={`p-6 rounded-2xl border flex items-center justify-center gap-4 transition-all duration-300 transform active:scale-[0.98]
                ${attendance === 'not_going' ? 'border-danger bg-danger/10 shadow-[0_0_30px_-5px_rgba(244,63,94,0.2)]' : 'border-white/10 bg-background/40 hover:bg-card hover:border-white/20'}
                ${isLocked && attendance !== 'not_going' ? 'opacity-40 cursor-not-allowed filter grayscale' : ''}
              `}
            >
              <div className={`p-3 rounded-full transition-colors duration-300 ${attendance === 'not_going' ? 'bg-danger text-white shadow-[0_0_15px_rgba(244,63,94,0.5)]' : 'bg-card border border-white/10 text-muted'}`}>
                <XCircle className="h-6 w-6" />
              </div>
              <span className={`font-black text-lg ${attendance === 'not_going' ? 'text-danger drop-shadow-[0_2px_4px_rgba(244,63,94,0.4)]' : 'text-white'}`}>Not Required</span>
            </button>
          </div>

          <AnimatePresence>
            {!isSubmitted && attendance !== 'pending' && (
              <motion.div initial={{ opacity:0, y:-10, height: 0 }} animate={{ opacity:1, y:0, height: 'auto' }} exit={{ opacity:0, y:-10, height: 0 }} className="mt-6">
                <button onClick={submitAttendance} className="w-full py-4 bg-primary text-white font-black rounded-xl text-base flex items-center justify-center gap-2 hover:bg-primary-light transition-all shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)] hover:shadow-[0_0_25px_-5px_rgba(16,185,129,0.6)] transform hover:-translate-y-0.5">
                  <Check className="h-5 w-5" /> Confirm Attendance
                </button>
              </motion.div>
            )}
            {isSubmitted && (
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="mt-6 flex justify-center">
                <div className="flex items-center gap-2 px-6 py-3 bg-primary/10 border border-primary/20 rounded-full shadow-sm">
                  <Lock className="h-4 w-4 text-primary" />
                  <span className="text-primary font-bold text-sm tracking-wide">Choice Locked Successfully</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isSubmitted && attendance === 'going' && qrSrc && (
               <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-8 pt-8 border-t border-white/10 flex flex-col items-center overflow-hidden">
                 <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-4">Your Lunch Verification QR</p>
                 <div className="bg-white p-3 rounded-2xl shadow-[0_10px_40px_-10px_rgba(16,185,129,0.3)] relative group">
                   <div className="absolute inset-0 border-2 border-primary/50 rounded-2xl scale-105 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 pointer-events-none" />
                   <img src={qrSrc} alt="Lunch QR" className="w-48 h-48 md:w-56 md:h-56" />
                 </div>
                 
                 {!collectedFood ? (
                   <div className="mt-6 flex items-center gap-2 text-warning font-bold bg-warning/10 px-4 py-2 rounded-full border border-warning/20">
                     <Clock className="h-4 w-4 animate-pulse" /> Waiting for QR Scan
                   </div>
                 ) : (
                   <div className="mt-6 flex items-center gap-2 text-primary font-bold bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
                     <CheckCircle className="h-4 w-4" /> Food Collected
                   </div>
                 )}
               </motion.div>
            )}
          </AnimatePresence>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Full Weekly Vegetarian Menu */}
          {activeTab === 'menu' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="glass-card rounded-3xl p-6 md:p-8 flex flex-col lg:col-span-2">
             <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
               <CalendarDays className="h-4 w-4 text-primary" /> Premium Weekly Menu Planner
             </h3>
             <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-6 -mx-2 px-2 border-b border-border">
               {weeklyMenu.map((item) => (
                 <button 
                   key={item.day}
                   onClick={() => setActiveDayTab(item.day)}
                   className={`px-6 py-3 rounded-xl text-sm font-bold shrink-0 transition-all duration-300 flex items-center justify-center min-w-[80px] ${activeDayTab === item.day ? 'bg-primary text-white shadow-[0_4px_15px_-3px_rgba(34,197,94,0.4)] scale-105 relative z-10' : 'bg-card border border-white/5 text-muted hover:text-white hover:border-white/20 hover:bg-background'}`}
                 >
                   {item.day}
                 </button>
               ))}
             </div>
             
             {(() => {
               const dayMenu = weeklyMenu.find(m => m.day === activeDayTab);
               if (!dayMenu || (!dayMenu.breakfast && !dayMenu.lunch && !dayMenu.dinner)) {
                 return (
                   <div className="bg-background border border-border border-dashed rounded-3xl p-10 flex flex-col items-center justify-center h-full opacity-60">
                     <CalendarCheck className="h-10 w-10 text-muted mb-3" />
                     <p className="text-muted font-bold text-sm">No menu planned for this day yet.</p>
                   </div>
                 );
               }

               return (
                 <div className="flex flex-col h-full">
                   <h4 className="text-sm font-black text-foreground mb-4 capitalize flex items-center gap-2">
                     <CalendarDays className="h-4 w-4 text-primary" /> {activeDayTab === 'Mon' ? 'Monday' : activeDayTab === 'Tue' ? 'Tuesday' : activeDayTab === 'Wed' ? 'Wednesday' : activeDayTab === 'Thu' ? 'Thursday' : activeDayTab === 'Fri' ? 'Friday' : activeDayTab === 'Sat' ? 'Saturday' : 'Sunday'} Meal Plan
                   </h4>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-auto">
                     {['breakfast', 'lunch', 'dinner'].map((mealType) => {
                       const mealStr = dayMenu[mealType as keyof typeof dayMenu] as string;
                       const items = mealStr ? mealStr.split(',').map(s => s.trim()).filter(Boolean) : [];
                       
                       let icon = <span className="text-xl">🌅</span>;
                       let subtitle = 'Morning Meal';
                       if (mealType === 'lunch') {
                         icon = <span className="text-xl">☀️</span>;
                         subtitle = 'Midday Meal';
                       }
                       if (mealType === 'dinner') {
                         icon = <span className="text-xl">🌙</span>;
                         subtitle = 'Evening Meal';
                       }

                     return (
                       <div key={mealType} className="glass-card bg-background/50 border border-border rounded-2xl p-5 flex flex-col hover:border-primary/30 transition-all">
                         <div className="flex items-center gap-3 mb-4 border-b border-border pb-3">
                           <div className="h-10 w-10 bg-card rounded-xl flex items-center justify-center shadow-inner">
                             {icon}
                           </div>
                           <div>
                             <h4 className="font-black text-sm uppercase tracking-widest text-foreground capitalize">{mealType}</h4>
                             <span className="text-[9px] text-muted font-bold uppercase tracking-widest block mt-0.5">{subtitle}</span>
                           </div>
                         </div>
                         
                         {items.length > 0 ? (
                           <div className="flex flex-wrap gap-2">
                             {items.map((item, idx) => (
                               <span key={idx} className="px-3 py-1.5 bg-card border border-border rounded-lg text-xs font-medium text-muted-foreground shadow-sm hover:text-foreground hover:border-primary/50 transition-colors">
                                 {item}
                               </span>
                             ))}
                           </div>
                         ) : (
                           <div className="flex-1 flex items-center justify-center opacity-50 py-6">
                             <p className="text-xs text-muted font-medium">Menu not set yet</p>
                           </div>
                         )}
                       </div>
                     );
                   })}
                   </div>
                 </div>
               );
             })()}
            </motion.div>
          )}

          {/* Majority Polling Card */}
          {activeTab === 'community' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="glass-card border-primary/20 rounded-3xl p-6 md:p-8 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[40px] pointer-events-none" />
            <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-2 relative z-10"><MessageSquare className="h-4 w-4" /> Democratic Polling</h3>
            <p className="text-xs text-muted mb-6 relative z-10">Vote to change today's main course. If majority dislikes it, admin will automatically be alerted.</p>
            
            <AnimatePresence>
              {pollStats.changePercentage > 50 && pollStats.totalVotes > 2 && (
                <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} className="bg-warning/10 border border-warning/30 px-4 py-3 rounded-xl flex items-center gap-3 mb-6 shadow-sm overflow-hidden">
                  <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
                  <span className="text-warning text-sm font-bold tracking-wide">Majority wants a change!</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-background/60 border border-white/5 rounded-2xl p-6 shadow-inner mb-6 relative z-10">
              <h4 className="text-xl font-black text-white text-center mb-1">Paneer Butter Masala</h4>
              <p className="text-[10px] uppercase tracking-wider text-center text-muted mb-6">Do you want to change this menu item?</p>
              
              {/* Progress Bar */}
              <div className="mb-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2">
                  <span className="text-warning flex items-center gap-1">Change It <span className="text-white/50">({pollStats.changePercentage}%)</span></span>
                  <span className="text-primary flex items-center gap-1"><span className="text-white/50">({100 - pollStats.changePercentage}%)</span> Keep It</span>
                </div>
                <div className="w-full bg-card rounded-full h-2 flex overflow-hidden border border-white/5">
                  <div 
                    style={{ width: `${pollStats.changePercentage}%` }} 
                    className="bg-gradient-to-r from-warning to-orange-400 h-full transition-all duration-700 ease-out"
                  />
                  <div 
                    style={{ width: `${100 - pollStats.changePercentage}%` }} 
                    className="bg-gradient-to-r from-primary to-primary-light h-full transition-all duration-700 ease-out"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-auto relative z-10">
              <button 
                onClick={() => submitPoll(true)}
                disabled={pollVote !== null}
                className={`flex-1 py-3.5 rounded-xl border flex justify-center items-center gap-2 font-bold transition-all duration-300 text-sm ${pollVote === true ? 'bg-warning/20 border-warning/50 text-warning shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)]' : 'bg-card border-white/10 text-muted hover:border-warning/50 hover:text-warning hover:bg-background'} ${pollVote !== null && pollVote !== true ? 'opacity-40 grayscale' : 'active:scale-95'}`}
              >
                Yes, Change it
              </button>
              <button 
                onClick={() => submitPoll(false)}
                disabled={pollVote !== null}
                className={`flex-1 py-3.5 rounded-xl border flex justify-center items-center gap-2 font-bold transition-all duration-300 text-sm ${pollVote === false ? 'bg-primary/20 border-primary/50 text-primary shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]' : 'bg-card border-white/10 text-muted hover:border-primary/50 hover:text-primary hover:bg-background'} ${pollVote !== null && pollVote !== false ? 'opacity-40 grayscale' : 'active:scale-95'}`}
              >
                No, Keep it
              </button>
            </div>
            </motion.div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tomorrow's AI Menu */}
          {activeTab === 'today' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="glass-panel border-primary/30 rounded-3xl p-6 md:p-8 relative overflow-hidden flex flex-col justify-between">
             <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-primary/20 rounded-full blur-[60px] pointer-events-none" />
             <div className="absolute bottom-[-10%] left-[-10%] w-40 h-40 bg-info/20 rounded-full blur-[50px] pointer-events-none" />
             
             <div className="relative z-10 w-full mb-6">
               <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-gradient-to-br from-primary to-primary-dark rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.4)]"><Sparkles className="h-4 w-4 text-white" /></div>
                 <div>
                   <h3 className="text-[10px] font-bold text-primary-light uppercase tracking-widest">AI Predicted Menu</h3>
                   <span className="text-xs text-muted font-medium">Tomorrow's optimization</span>
                 </div>
               </div>
               
               <h4 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 mb-2 leading-tight">Palak Paneer &<br/>Mix Veg</h4>
               <p className="text-sm text-primary font-medium mb-6 flex items-center gap-2"><ChevronRight className="h-4 w-4"/> Replacing standard Aloo Matar</p>
               
               <div className="glass-input rounded-2xl p-5 shadow-inner">
                 <div className="flex justify-between items-center mb-3">
                   <span className="text-[10px] text-muted uppercase font-bold tracking-widest flex items-center gap-1.5"><Sparkles className="h-3 w-3 text-primary"/> AI Confidence</span>
                   <span className="text-sm font-black text-primary">92%</span>
                 </div>
                 <div className="w-full bg-card rounded-full h-1.5 mb-4 border border-white/5 overflow-hidden">
                   <div className="bg-gradient-to-r from-primary-dark to-primary-light h-full w-[92%] shadow-[0_0_10px_rgba(16,185,129,0.8)] relative">
                     <div className="absolute inset-0 bg-white/20 animate-pulse" />
                   </div>
                 </div>
                 <p className="text-xs text-muted leading-relaxed">
                   <strong>Reasoning:</strong> High student preference for Palak Paneer during mid-week. AI detected 30% lower attendance on Aloo Matar days historically based on past 3 months of data.
                 </p>
               </div>
             </div>
             
             <div className="relative z-10 mt-auto">
               <button onClick={() => setShowEmergency(true)} className="w-full py-4 bg-card border border-white/10 hover:border-warning/30 hover:bg-warning/5 rounded-xl text-sm font-bold text-muted hover:text-warning flex items-center justify-center gap-2 transition-all duration-300 group">
                 <AlertTriangle className="h-4 w-4 group-hover:scale-110 transition-transform" /> Request Emergency Change
               </button>
             </div>
            </motion.div>
          )}

          {/* Redesigned Rating UI */}
          {activeTab === 'community' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }} className="glass-card rounded-3xl p-6 md:p-8 flex flex-col">
            <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-6 flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Rate Today's Menu</h3>
            
            <div className="flex gap-3 mb-6">
              <button onClick={() => setRating('up')} className={`flex-1 py-5 rounded-2xl border flex flex-col justify-center items-center gap-3 font-bold transition-all duration-300 ${rating === 'up' ? 'bg-primary/10 border-primary/50 text-primary shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]' : 'bg-background/40 border-white/10 text-muted hover:border-primary/30 hover:bg-card'}`}>
                <div className={`p-3 rounded-full ${rating === 'up' ? 'bg-primary/20' : 'bg-card'}`}><ThumbsUp className="h-6 w-6" /></div>
                <span className="text-sm">Loved it</span>
              </button>
              <button onClick={() => setRating('down')} className={`flex-1 py-5 rounded-2xl border flex flex-col justify-center items-center gap-3 font-bold transition-all duration-300 ${rating === 'down' ? 'bg-danger/10 border-danger/50 text-danger shadow-[0_0_20px_-5px_rgba(244,63,94,0.2)]' : 'bg-background/40 border-white/10 text-muted hover:border-danger/30 hover:bg-card'}`}>
                <div className={`p-3 rounded-full ${rating === 'down' ? 'bg-danger/20' : 'bg-card'}`}><ThumbsDown className="h-6 w-6" /></div>
                <span className="text-sm">Disliked it</span>
              </button>
            </div>
            
            <div className="relative mb-6 flex-1 flex flex-col">
              <MessageSquare className="absolute left-4 top-4 h-5 w-5 text-muted pointer-events-none" />
              <textarea 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Any suggestions? (e.g. Too spicy, need more paneer)" 
                className="w-full flex-1 glass-input rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:outline-none placeholder:text-muted/60 resize-none min-h-[100px]"
              />
            </div>
            
            <button onClick={submitFeedback} className="w-full py-4 bg-white hover:bg-slate-200 text-background font-black rounded-xl text-sm flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-[0.98]">
              Submit Feedback <Send className="h-4 w-4" />
            </button>
            </motion.div>
          )}
        </div>

        {/* Eco Leaderboard */}
        {activeTab === 'community' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="glass-card rounded-3xl p-6 md:p-8 mt-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 pointer-events-none">
            <Leaf className="h-24 w-24 text-primary/5 -rotate-12" />
          </div>
          <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Top Eco Warriors</h3>
          
          <motion.div 
            className="space-y-3"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.1 }
              }
            }}
          >
            {leaderboard.map((lbUser, index) => (
              <motion.div 
                key={index} 
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
                }}
                whileHover={{ scale: 1.02, x: 5 }}
                className="group flex items-center justify-between p-4 bg-background/40 rounded-2xl border border-white/5 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer relative overflow-hidden"
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex items-center gap-4 relative z-10">
                  {index === 0 && (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm bg-warning/20 text-warning shadow-[0_0_15px_rgba(245,158,11,0.5)] border border-warning/50">
                      🥇
                    </div>
                  )}
                  {index === 1 && (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm bg-slate-300/20 text-slate-300 border border-slate-300/50">
                      🥈
                    </div>
                  )}
                  {index === 2 && (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm bg-amber-700/20 text-amber-500 border border-amber-700/50">
                      🥉
                    </div>
                  )}
                  {index > 2 && (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs bg-white/5 text-muted">
                      {index + 1}
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors flex items-center gap-2">
                      {lbUser.name}
                      {index === 0 && <span className="text-[10px] bg-warning/20 text-warning px-2 py-0.5 rounded-full border border-warning/30 hidden sm:inline-block">The Savior</span>}
                      {index === 1 && <span className="text-[10px] bg-slate-300/20 text-slate-300 px-2 py-0.5 rounded-full border border-slate-300/30 hidden sm:inline-block">Waste Warrior</span>}
                      {index === 2 && <span className="text-[10px] bg-amber-700/20 text-amber-500 px-2 py-0.5 rounded-full border border-amber-700/30 hidden sm:inline-block">Eco Guardian</span>}
                    </h4>
                    <span className="text-[10px] text-muted uppercase tracking-widest">{lbUser.mealsEaten} meals • {lbUser.wasteAvoidedKg}kg saved</span>
                  </div>
                </div>
                <div className="text-right relative z-10">
                  <div className="text-lg font-black text-primary drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">{lbUser.ecoPoints}</div>
                  <div className="text-[10px] text-primary-light uppercase tracking-widest font-bold">Points</div>
                </div>
              </motion.div>
            ))}
            {leaderboard.length === 0 && (
              <p className="text-muted text-sm text-center py-4">No eco warriors yet. Be the first!</p>
            )}
          </motion.div>
          </motion.div>
        )}
      </main>

      {/* Emergency Modal */}
      <AnimatePresence>
        {showEmergency && (
          <div className="fixed inset-0 bg-background/80 z-50 flex items-center justify-center p-4 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="glass-panel border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-warning/10 rounded-full blur-[40px] pointer-events-none" />
              
              <div className="flex justify-between items-center mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-warning/20 rounded-xl text-warning"><AlertTriangle className="h-5 w-5" /></div>
                  <h2 className="text-xl font-bold text-white">Emergency Request</h2>
                </div>
                <button onClick={() => setShowEmergency(false)} className="p-2 text-muted hover:text-white bg-card rounded-full border border-white/5 transition-colors"><XCircle className="h-5 w-5" /></button>
              </div>
              
              <p className="text-sm text-muted mb-6 relative z-10 leading-relaxed">Need to change your attendance after the auto-lock time? This requires manual Admin approval.</p>
              
              <textarea 
                value={emergencyReason}
                onChange={(e) => setEmergencyReason(e.target.value)}
                className="w-full glass-input rounded-xl p-4 text-sm text-white focus:outline-none mb-6 relative z-10 resize-none placeholder:text-muted/60" 
                placeholder="Reason for change... (e.g. Going home due to family emergency)" 
                rows={4}
              ></textarea>
              
              <button 
                onClick={submitEmergency} 
                className="w-full py-4 bg-warning hover:bg-yellow-500 text-background rounded-xl text-sm font-black flex justify-center items-center gap-2 transition-all duration-300 shadow-[0_0_20px_-5px_rgba(245,158,11,0.4)] active:scale-[0.98] relative z-10"
              >
                Submit Request
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
