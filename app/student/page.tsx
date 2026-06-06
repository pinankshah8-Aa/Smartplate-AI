"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, CheckCircle, XCircle, Clock, ThumbsUp, ThumbsDown, AlertTriangle, Leaf, CalendarCheck, TrendingDown, MessageSquare, Send, CalendarDays, AlertOctagon, Sparkles, Check, Lock, Utensils, ThumbsUpIcon, ThumbsDownIcon } from 'lucide-react';
import { toast } from 'sonner';
import QRCode from 'qrcode';

const WEEKLY_MENU = [
  { day: 'Mon', menu: 'Dal Makhani, Jeera Rice, Paneer Tikka, Roti, Salad' },
  { day: 'Tue', menu: 'Aloo Gobi, Chana Masala, Plain Rice, Roti, Raita' },
  { day: 'Wed', menu: 'Palak Paneer, Mix Veg, Pulao, Roti, Papad' },
  { day: 'Thu', menu: 'Rajma Chawal, Bhindi Masala, Roti, Salad' },
  { day: 'Fri', menu: 'Kadhai Paneer, Dal Tadka, Jeera Rice, Roti' },
  { day: 'Sat', menu: 'Pav Bhaji, Veg Biryani, Boondi Raita, Gulab Jamun' },
  { day: 'Sun', menu: 'Chole Bhature, Sweet Lassi, Salad' },
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

  const [activeTab, setActiveTab] = useState('Mon');
  const [cutoffTime, setCutoffTime] = useState('08:30');
  const [isTimeLocked, setIsTimeLocked] = useState(false);

  // Mock Waste Data from DB User object
  const [wasteRisk, setWasteRisk] = useState({ missedMeals: 0, isHighRisk: false });

  useEffect(() => {
    const storedUser = localStorage.getItem('smartplate_user');
    if (!storedUser) {
      router.push('/');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== 'student') {
      router.push('/');
      return;
    }
    setUser(parsedUser);
    
    setWasteRisk({
      missedMeals: parsedUser.missedMeals || 0,
      isHighRisk: (parsedUser.missedMeals || 0) >= 3
    });

    loadData(parsedUser.id);
  }, [router]);

  const formatTimeToAMPM = (time24: string) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${String(minutes).padStart(2, '0')} ${ampm}`;
  };

  const loadData = async (userId: string) => {
    try {
      // 1. Fetch cutoff time
      const resSettings = await fetch('/api/admin/settings');
      const dataSettings = await resSettings.json();
      if (dataSettings.success) {
        setCutoffTime(dataSettings.cutoffTime);
        checkLock(dataSettings.cutoffTime);
      }

      // 2. Fetch attendance
      const resAtt = await fetch(`/api/student/attendance?userId=${userId}`);
      const dataAtt = await resAtt.json();
      if (dataAtt.success) {
        setAttendance(dataAtt.attendance);
        setIsSubmitted(dataAtt.isSubmitted || false);
        setCollectedFood(dataAtt.collectedFood || false);
        if (dataAtt.attendance === 'going' && dataAtt.isSubmitted) generateQR();
      }
      // 3. Fetch Poll Stats
      const resPoll = await fetch('/api/student/poll/stats');
      const dataPoll = await resPoll.json();
      if (dataPoll.success) {
        setPollStats(dataPoll.stats);
      }
    } catch (e) {
      console.error(e);
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

  const generateQR = async () => {
    try {
      const url = await QRCode.toDataURL(user.id, {
        color: { dark: '#22c55e', light: '#ffffff' },
        margin: 2
      });
      setQrSrc(url);
    } catch (err) {
      console.error(err);
    }
  };

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
        toast.success(`Submitted Successfully!`);
        if (attendance === 'going') generateQR();
        else setQrSrc('');
      }
    } catch (e) {
      toast.error("Failed to submit attendance");
    }
  };

  const submitFeedback = async () => {
    if (!rating) return toast.error("Please select Like or Dislike");
    try {
      await fetch('/api/student/rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, menu: 'Paneer Butter Masala', rating, comment })
      });
      toast.success("Feedback submitted!");
      setRating(null);
      setComment('');
    } catch (e) {
      toast.error("Failed to submit rating");
    }
  };

  const submitPoll = async (voteToChange: boolean) => {
    try {
      await fetch('/api/student/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, menu: 'Paneer Butter Masala', voteToChange: voteToChange })
      });
      setPollVote(voteToChange);
      toast.success("Vote recorded successfully!");
      
      // Refetch stats
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

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  if (!user) return <div className="min-h-screen bg-background" />;

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <header className="bg-card border-b border-border px-6 py-4 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white">SmartPlate AI</h1>
            <p className="text-xs text-primary font-bold">Hello, {user.name}</p>
          </div>
          <button onClick={handleLogout} className="p-2 text-muted hover:text-white transition">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-8 space-y-6">
        
        {wasteRisk.isHighRisk && !collectedFood && attendance === 'going' && (
          <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1,y:0}} className="bg-danger/10 border border-danger p-4 rounded-2xl flex items-start gap-3 shadow-[0_0_15px_-3px_rgba(239,68,68,0.2)]">
            <AlertOctagon className="h-6 w-6 text-danger shrink-0 mt-0.5" />
            <div>
              <h3 className="text-danger font-bold text-sm">Food Waste Warning</h3>
              <p className="text-danger/80 text-xs mt-1">You failed to collect lunch for <strong>{wasteRisk.missedMeals} days</strong>. Please ensure you collect your meal today.</p>
            </div>
          </motion.div>
        )}

        {/* Personal Impact */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border border-border p-4 rounded-2xl flex flex-col items-center text-center shadow-lg">
            <Leaf className="h-6 w-6 text-primary mb-2" />
            <span className="text-2xl font-black text-white">450</span>
            <span className="text-[10px] text-muted uppercase font-bold tracking-wider mt-1">Eco Points</span>
          </div>
          <div className="bg-card border border-border p-4 rounded-2xl flex flex-col items-center text-center shadow-lg">
            <CalendarCheck className="h-6 w-6 text-info mb-2" />
            <span className="text-2xl font-black text-white">18</span>
            <span className="text-[10px] text-muted uppercase font-bold tracking-wider mt-1">Meals Eaten</span>
          </div>
          <div className="bg-card border border-border p-4 rounded-2xl flex flex-col items-center text-center shadow-lg">
            <TrendingDown className="h-6 w-6 text-warning mb-2" />
            <span className="text-2xl font-black text-white">2.5kg</span>
            <span className="text-[10px] text-muted uppercase font-bold tracking-wider mt-1">Waste Avoided</span>
          </div>
        </div>

        {/* Attendance Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-3xl p-8 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 p-4">
            <div className={`flex items-center gap-2 border px-3 py-1.5 rounded-full ${isLocked ? 'bg-danger/10 border-danger/30' : 'bg-background border-border'}`}>
              <Clock className={`h-4 w-4 ${isLocked ? 'text-danger' : 'text-warning'}`} />
              <span className={`text-xs font-bold ${isLocked ? 'text-danger' : 'text-muted'}`}>
                {isTimeLocked ? `Locked at ${formatTimeToAMPM(cutoffTime)}` : `Auto-locks at ${formatTimeToAMPM(cutoffTime)}`}
              </span>
            </div>
          </div>

          <h2 className="text-2xl font-black text-white mb-2 mt-4">Going to college tomorrow?</h2>
          <p className="text-muted text-sm mb-8">Help us predict exact food quantities and avoid wastage.</p>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => selectAttendance('going')}
              disabled={isLocked}
              className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-4 transition 
                ${attendance === 'going' ? 'border-primary bg-primary/10 shadow-[0_0_30px_-5px_rgba(34,197,94,0.3)]' : 'border-border bg-background'}
                ${isLocked && attendance !== 'going' ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50'}
              `}
            >
              <div className={`p-4 rounded-full ${attendance === 'going' ? 'bg-primary text-white' : 'bg-card border border-border text-muted'}`}>
                <CheckCircle className="h-8 w-8" />
              </div>
              <span className={`font-black text-lg ${attendance === 'going' ? 'text-primary' : 'text-white'}`}>Yes, Going</span>
            </button>
            
            <button 
              onClick={() => selectAttendance('not_going')}
              disabled={isLocked}
              className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-4 transition 
                ${attendance === 'not_going' ? 'border-danger bg-danger/10 shadow-[0_0_30px_-5px_rgba(239,68,68,0.2)]' : 'border-border bg-background'}
                ${isLocked && attendance !== 'not_going' ? 'opacity-50 cursor-not-allowed' : 'hover:border-danger/50'}
              `}
            >
              <div className={`p-4 rounded-full ${attendance === 'not_going' ? 'bg-danger text-white' : 'bg-card border border-border text-muted'}`}>
                <XCircle className="h-8 w-8" />
              </div>
              <span className={`font-black text-lg ${attendance === 'not_going' ? 'text-danger' : 'text-white'}`}>Not Going</span>
            </button>
          </div>

          <AnimatePresence>
            {!isSubmitted && attendance !== 'pending' && (
              <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }} className="mt-6">
                <button onClick={submitAttendance} className="w-full py-4 bg-primary text-white font-black rounded-xl text-lg flex items-center justify-center gap-2 hover:bg-primary-dark transition shadow-lg shadow-primary/30">
                  <Check className="h-6 w-6" /> Submit Attendance
                </button>
              </motion.div>
            )}
            {isSubmitted && (
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="mt-6 flex justify-center">
                <div className="flex items-center gap-2 px-6 py-3 bg-primary/10 border border-primary/20 rounded-full">
                  <Lock className="h-4 w-4 text-primary" />
                  <span className="text-primary font-bold text-sm">Submitted Successfully</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isSubmitted && attendance === 'going' && qrSrc && (
               <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-8 pt-8 border-t border-border flex flex-col items-center overflow-hidden">
                 <p className="text-sm font-bold text-muted uppercase tracking-wider mb-4">Your Lunch Verification QR</p>
                 <div className="bg-white p-2 rounded-xl shadow-2xl">
                   <img src={qrSrc} alt="Lunch QR" className="w-48 h-48" />
                 </div>
                 
                 {!collectedFood ? (
                   <div className="mt-6 flex items-center gap-2 text-warning font-bold">
                     <Clock className="h-5 w-5" /> Waiting for QR Scan
                   </div>
                 ) : (
                   <div className="mt-6 flex items-center gap-2 text-primary font-bold">
                     <CheckCircle className="h-5 w-5" /> Food Collected
                   </div>
                 )}
               </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Full Weekly Vegetarian Menu */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-xl">
           <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
             <CalendarDays className="h-4 w-4" /> Full Weekly Vegetarian Menu
           </h3>
           <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-4">
             {WEEKLY_MENU.map((item) => (
               <button 
                 key={item.day}
                 onClick={() => setActiveTab(item.day)}
                 className={`px-4 py-2 rounded-xl text-sm font-bold shrink-0 transition ${activeTab === item.day ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-background border border-border text-muted hover:text-white'}`}
               >
                 {item.day}
               </button>
             ))}
           </div>
           <div className="bg-background border border-border rounded-2xl p-6 min-h-[100px] flex items-center shadow-inner">
             <p className="text-lg text-white font-medium">
               {WEEKLY_MENU.find(m => m.day === activeTab)?.menu}
             </p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Majority Polling Card */}
          <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 shadow-xl flex flex-col">
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Majority Polling</h3>
            <p className="text-xs text-muted mb-4">Vote to change today's main course. If majority dislikes it, admin will be alerted.</p>
            
            {pollStats.changePercentage > 50 && pollStats.totalVotes > 2 && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} className="bg-warning/20 border border-warning/40 px-3 py-2 rounded-xl flex items-center gap-2 mb-4 shadow-[0_0_10px_-3px_rgba(234,179,8,0.3)]">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span className="text-warning text-xs font-bold">Majority wants change!</span>
              </motion.div>
            )}

            <div className="bg-card border border-border rounded-2xl p-5 shadow-inner mb-6 flex-1">
              <h4 className="text-xl font-black text-white text-center mb-1">Paneer Butter Masala</h4>
              <p className="text-xs text-center text-muted mb-4">Do you want to change this menu item?</p>
              
              {/* Progress Bar */}
              <div className="mb-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-1">
                  <span className="text-warning">Change It ({pollStats.changePercentage}%)</span>
                  <span className="text-primary">Keep It ({100 - pollStats.changePercentage}%)</span>
                </div>
                <div className="w-full bg-primary/20 rounded-full h-1.5 flex overflow-hidden">
                  <div 
                    style={{ width: `${pollStats.changePercentage}%` }} 
                    className="bg-warning h-full transition-all duration-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => submitPoll(true)}
                disabled={pollVote !== null}
                className={`flex-1 py-3 rounded-xl border flex justify-center items-center gap-2 font-bold transition text-sm ${pollVote === true ? 'bg-warning/20 border-warning text-warning shadow-[0_0_15px_-3px_rgba(234,179,8,0.3)]' : 'bg-background border-border text-muted hover:border-warning hover:text-warning'} ${pollVote !== null && pollVote !== true ? 'opacity-50' : ''}`}
              >
                Yes, Change it
              </button>
              <button 
                onClick={() => submitPoll(false)}
                disabled={pollVote !== null}
                className={`flex-1 py-3 rounded-xl border flex justify-center items-center gap-2 font-bold transition text-sm ${pollVote === false ? 'bg-primary/20 border-primary text-primary shadow-[0_0_15px_-3px_rgba(34,197,94,0.3)]' : 'bg-background border-border text-muted hover:border-primary hover:text-primary'} ${pollVote !== null && pollVote !== false ? 'opacity-50' : ''}`}
              >
                No, Keep it
              </button>
            </div>
          </div>

          {/* Redesigned Rating UI */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-xl flex flex-col">
            <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-4 border-b border-border pb-2">Rate Today's Menu</h3>
            
            <div className="flex gap-3 mb-4">
              <button onClick={() => setRating('up')} className={`flex-1 py-4 rounded-xl border-2 flex justify-center items-center gap-2 font-bold transition ${rating === 'up' ? 'bg-primary/20 border-primary text-primary shadow-[0_0_20px_-5px_rgba(34,197,94,0.3)]' : 'bg-background border-border text-muted hover:border-primary/50'}`}>
                <ThumbsUp className="h-6 w-6" /> Loved it
              </button>
              <button onClick={() => setRating('down')} className={`flex-1 py-4 rounded-xl border-2 flex justify-center items-center gap-2 font-bold transition ${rating === 'down' ? 'bg-danger/20 border-danger text-danger shadow-[0_0_20px_-5px_rgba(239,68,68,0.2)]' : 'bg-background border-border text-muted hover:border-danger/50'}`}>
                <ThumbsDown className="h-6 w-6" /> Disliked it
              </button>
            </div>
            
            <div className="relative mb-4">
              <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-muted" />
              <textarea 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Any suggestions? (e.g. Too spicy, need more paneer)" 
                className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-primary min-h-[80px]"
              />
            </div>
            
            <button onClick={submitFeedback} className="w-full py-3 bg-white text-background font-black rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-slate-200 transition mt-auto shadow-lg">
              Submit Feedback <Send className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tomorrow's AI Menu */}
        <div className="bg-gradient-to-br from-card to-background border border-primary/30 rounded-3xl p-6 relative overflow-hidden shadow-xl flex flex-col md:flex-row items-center gap-8">
           <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[60px]" />
           
           <div className="flex-1 relative z-10 w-full">
             <div className="flex items-center gap-2 mb-4 border-b border-border pb-4">
               <div className="p-1.5 bg-primary rounded-lg shadow-lg shadow-primary/30"><Sparkles className="h-4 w-4 text-white" /></div>
               <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Predicted Menu</h3>
               <span className="ml-auto px-2 py-1 bg-card border border-border rounded text-[10px] text-muted font-bold">Tomorrow</span>
             </div>
             
             <h4 className="text-3xl font-black text-white mb-1 leading-tight">Palak Paneer & Mix Veg</h4>
             <p className="text-sm text-primary font-medium mb-4">Replacing standard Aloo Matar</p>
             
             <div className="bg-background/80 backdrop-blur border border-border rounded-xl p-4 shadow-inner">
               <div className="flex justify-between items-center mb-2">
                 <span className="text-[10px] text-muted uppercase font-bold tracking-wider">AI Confidence</span>
                 <span className="text-xs font-black text-primary">92%</span>
               </div>
               <div className="w-full bg-card rounded-full h-1.5 mb-3">
                 <div className="bg-primary h-1.5 rounded-full w-[92%] shadow-[0_0_10px_0_rgba(34,197,94,0.5)]"></div>
               </div>
               <p className="text-xs text-muted leading-relaxed">
                 <strong>Reasoning:</strong> High student preference for Palak Paneer during mid-week. AI detected 30% lower attendance on Aloo Matar days historically.
               </p>
             </div>
           </div>
           
           <div className="w-full md:w-auto relative z-10">
             <button onClick={() => setShowEmergency(true)} className="w-full md:w-auto py-4 px-6 bg-background border border-border rounded-xl text-sm font-bold text-warning flex items-center justify-center gap-2 hover:bg-card transition shadow-sm">
               <AlertTriangle className="h-5 w-5" /> Request Emergency Change
             </button>
           </div>
        </div>

      </main>

      {/* Emergency Modal */}
      <AnimatePresence>
        {showEmergency && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-card border border-border p-6 rounded-3xl w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Emergency Request</h2>
                <button onClick={() => setShowEmergency(false)} className="p-1 text-muted hover:text-white rounded-full"><XCircle className="h-6 w-6" /></button>
              </div>
              <p className="text-sm text-muted mb-6">Need to change your attendance after the cutoff time? This requires Admin approval.</p>
              <textarea 
                value={emergencyReason}
                onChange={(e) => setEmergencyReason(e.target.value)}
                className="w-full bg-background border border-border rounded-xl p-4 text-sm text-white focus:outline-none focus:border-warning mb-6" 
                placeholder="Reason for change... (e.g. Going home due to family emergency)" 
                rows={4}
              ></textarea>
              <button 
                onClick={submitEmergency} 
                className="w-full py-3 bg-warning text-background rounded-xl text-sm font-black flex justify-center items-center gap-2 hover:bg-yellow-500 transition shadow-lg"
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
