"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Users, TrendingDown, IndianRupee, PieChart, Sparkles, AlertTriangle, Send, Check, X, Clock, AlertOctagon, UserCircle, PlayCircle, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { toast } from 'sonner';
import QRScanner from '@/components/QRScanner';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  
  // Data States
  const [stats, setStats] = useState({ total: 0, attending: 0, predictedWasteSavedKg: 0, moneySaved: 0, wasteReductionPct: 0, collectedCount: 0, pendingCollectionCount: 0 });
  const [students, setStudents] = useState<any[]>([]);
  const [wasteRiskStudents, setWasteRiskStudents] = useState<any[]>([]);
  const [emergencyReqs, setEmergencyReqs] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any>(null);
  const [poll, setPoll] = useState<any>(null);
  
  // Controls
  const [cutoffTime, setCutoffTime] = useState('08:30');
  const [whatIfInput, setWhatIfInput] = useState('');
  
  // AI State
  const [aiInsight, setAiInsight] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [isAutoMarking, setIsAutoMarking] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('smartplate_user');
    if (!storedUser) {
      router.push('/');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== 'admin') {
      router.push('/');
      return;
    }
    setUser(parsedUser);
    loadData();
  }, [router]);

  const formatTimeToAMPM = (time24: string) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${String(minutes).padStart(2, '0')} ${ampm}`;
  };

  const loadData = async () => {
    try {
      // 1. Fetch Dashboard Stats
      const resDash = await fetch('/api/admin/dashboard');
      const dataDash = await resDash.json();
      if (dataDash.success) {
        setStats(dataDash.stats);
        setStudents(dataDash.students);
        setWasteRiskStudents(dataDash.wasteRiskStudents);
      }

      // 2. Fetch Settings
      const resSettings = await fetch('/api/admin/settings');
      const dataSettings = await resSettings.json();
      if (dataSettings.success) setCutoffTime(dataSettings.cutoffTime);

      // 3. Fetch Emergency
      const resEmerg = await fetch('/api/admin/emergency');
      const dataEmerg = await resEmerg.json();
      if (dataEmerg.success) setEmergencyReqs(dataEmerg.requests);

      // 4. Fetch Feedback
      const resFb = await fetch('/api/admin/feedback');
      const dataFb = await resFb.json();
      if (dataFb.success) {
        setFeedback(dataFb.feedback);
        setPoll(dataFb.poll);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveCutoff = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cutoffTime })
      });
      if (res.ok) toast.success(`Lock time updated to ${formatTimeToAMPM(cutoffTime)} (IST)`);
    } catch (e) {
      toast.error("Failed to save settings");
    }
  };

  const handleEmergency = async (id: string, action: 'approve'|'deny') => {
    try {
      const res = await fetch('/api/admin/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: id, action })
      });
      if (res.ok) {
        setEmergencyReqs(prev => prev.filter(req => req._id !== id));
        toast.success(`Request ${action}d successfully`);
      }
    } catch (e) {
      toast.error("Failed to update request");
    }
  };

  const runAutoMark = async () => {
    setIsAutoMarking(true);
    try {
      const res = await fetch('/api/admin/auto-mark', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        loadData(); // refresh UI
      } else {
        toast.error("Auto-mark failed");
      }
    } catch (e) {
      toast.error("Failed to connect to server");
    } finally {
      setIsAutoMarking(false);
    }
  };

  const generateAI = async (isWhatIf = false) => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stats,
          menu: "Dal Tadka, Jeera Rice, Roti",
          sentiment: "40% negative due to repetition",
          whatIfQuery: isWhatIf ? whatIfInput : null
        })
      });
      const data = await res.json();
      if (data.success) {
        setAiInsight(data.data);
        toast.success(isWhatIf ? "What-If Simulated" : "AI Insights Generated");
        if (isWhatIf) setWhatIfInput('');
      } else {
        toast.error("AI Generation failed");
      }
    } catch (e) {
      toast.error("Failed to connect to AI");
    } finally {
      setAiLoading(false);
    }
  };

  const lineData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Attendance',
      data: [45, 42, 48, 50, 38, 20, stats.attending || 0],
      borderColor: '#22c55e',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  const barData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [{
      label: 'Savings (₹)',
      data: [1200, 1800, 1500, 2100 + stats.moneySaved],
      backgroundColor: '#3b82f6',
      borderRadius: 4
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } },
      x: { grid: { display: false }, ticks: { color: '#64748b' } }
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  if (!user) return <div className="min-h-screen bg-background" />;

  const isMajorityDislike = feedback && feedback.downVotes > feedback.upVotes && feedback.totalRatings > 2;
  const isChangeVoted = poll && poll.changeVotes > poll.keepVotes && poll.totalPolls > 2;

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <header className="bg-card border-b border-border px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary rounded shadow-lg shadow-primary/20"><Sparkles className="h-5 w-5 text-white" /></div>
            <h1 className="text-xl font-black text-white">SmartPlate Admin</h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowScanner(true)} className="px-4 py-2 bg-primary/20 text-primary hover:bg-primary hover:text-white border border-primary/50 font-bold rounded-xl text-sm transition shadow-lg shadow-primary/10">
              Open QR Scanner
            </button>
            <button onClick={handleLogout} className="p-2 text-muted hover:text-white transition">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8 space-y-8">
        
        {/* Prominent Top Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-card border border-border p-5 rounded-2xl flex flex-col shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-muted uppercase font-bold tracking-wider">Total Students</span>
              <Users className="h-4 w-4 text-muted" />
            </div>
            <span className="text-3xl font-black text-white">{stats.total}</span>
          </div>
          <div className="bg-primary/10 border border-primary/20 p-5 rounded-2xl flex flex-col shadow-[0_0_15px_-3px_rgba(34,197,94,0.15)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-primary uppercase font-bold tracking-wider">Attending Today</span>
              <Check className="h-4 w-4 text-primary" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-primary">{stats.attending || 0}</span>
              <span className="text-xs text-primary/80 font-bold mb-1">Total</span>
            </div>
            <div className="mt-2 pt-2 border-t border-primary/20 flex justify-between text-[10px] font-bold text-primary/80">
              <span>Collected: {stats.collectedCount || 0}</span>
              <span>Pending: {stats.pendingCollectionCount || 0}</span>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 border border-primary/40 p-5 rounded-2xl flex flex-col shadow-[0_0_20px_-3px_rgba(34,197,94,0.3)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-white uppercase font-bold tracking-wider">Waste Saved</span>
              <TrendingDown className="h-4 w-4 text-primary" />
            </div>
            <span className="text-3xl font-black text-white">{stats.predictedWasteSavedKg}<span className="text-lg">kg</span></span>
          </div>
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/40 p-5 rounded-2xl flex flex-col shadow-[0_0_20px_-3px_rgba(59,130,246,0.3)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-white uppercase font-bold tracking-wider">Money Saved</span>
              <IndianRupee className="h-4 w-4 text-blue-400" />
            </div>
            <span className="text-3xl font-black text-white">₹{stats.moneySaved}</span>
          </div>
          <div className="bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/50 p-5 rounded-2xl flex flex-col shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-white uppercase font-bold tracking-wider">Reduction %</span>
              <PieChart className="h-4 w-4 text-white" />
            </div>
            <span className="text-3xl font-black text-white">{stats.wasteReductionPct}%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Left Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Auto Lock & Controls */}
            <div className="bg-card border border-border rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2"><Clock className="h-4 w-4 text-warning"/> Daily Auto-Lock Time (IST)</h3>
                <p className="text-xs text-muted mt-1">Students cannot change attendance after {formatTimeToAMPM(cutoffTime)}.</p>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <input 
                  type="time" 
                  value={cutoffTime}
                  onChange={(e) => setCutoffTime(e.target.value)}
                  className="bg-background border border-border text-white px-4 py-3 rounded-xl focus:outline-none focus:border-primary shadow-inner"
                />
                <button onClick={saveCutoff} className="px-6 py-3 bg-primary hover:bg-primary-dark text-white text-sm font-black rounded-xl shadow-lg transition">Save IST Lock</button>
              </div>
            </div>

            {/* Auto-Mark Row */}
            <div className="bg-warning/10 border border-warning/30 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
              <div>
                <h3 className="text-sm font-bold text-warning flex items-center gap-2">Execute Auto-Mark</h3>
                <p className="text-xs text-warning/80 mt-1">Force all "Pending" students to "Not Going". Run this after Lock Time.</p>
              </div>
              <button 
                onClick={runAutoMark}
                disabled={isAutoMarking}
                className="px-6 py-3 bg-warning text-background hover:bg-yellow-500 text-sm font-black rounded-xl shadow-lg transition flex items-center gap-2 disabled:opacity-50"
              >
                {isAutoMarking ? <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" /> : <><PlayCircle className="h-4 w-4" /> Run Auto Mark Now</>}
              </button>
            </div>

            {/* Student Feedback & Polling */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-xl relative overflow-hidden">
               <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-6 flex items-center gap-2">
                 <MessageSquare className="h-4 w-4" /> Student Feedback & Polling
               </h3>

               {/* Alerts */}
               <div className="flex flex-col gap-3 mb-6">
                 {isMajorityDislike && (
                   <motion.div initial={{opacity:0}} animate={{opacity:1}} className="bg-danger/10 border border-danger/40 p-3 rounded-xl flex items-center gap-3 shadow-[0_0_15px_-3px_rgba(239,68,68,0.3)]">
                     <AlertOctagon className="h-5 w-5 text-danger" />
                     <span className="text-danger text-sm font-bold">Majority Dislike Alert: Today's menu is highly disliked.</span>
                   </motion.div>
                 )}
                 {isChangeVoted && (
                   <motion.div initial={{opacity:0}} animate={{opacity:1}} className="bg-warning/10 border border-warning/40 p-3 rounded-xl flex items-center gap-3 shadow-[0_0_15px_-3px_rgba(234,179,8,0.3)]">
                     <AlertTriangle className="h-5 w-5 text-warning" />
                     <span className="text-warning text-sm font-bold">Menu Change Requested: Students voted to change this item.</span>
                   </motion.div>
                 )}
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Rating Summary */}
                 <div className="bg-background border border-border rounded-2xl p-5">
                   <h4 className="text-xs text-muted uppercase font-bold tracking-wider mb-4">Today's Ratings</h4>
                   <div className="flex gap-4">
                     <div className="flex-1 bg-primary/10 border border-primary/20 rounded-xl p-4 text-center">
                       <ThumbsUp className="h-5 w-5 text-primary mx-auto mb-1" />
                       <span className="block text-2xl font-black text-primary">{feedback?.upVotes || 0}</span>
                     </div>
                     <div className="flex-1 bg-danger/10 border border-danger/20 rounded-xl p-4 text-center">
                       <ThumbsDown className="h-5 w-5 text-danger mx-auto mb-1" />
                       <span className="block text-2xl font-black text-danger">{feedback?.downVotes || 0}</span>
                     </div>
                   </div>
                 </div>

                 {/* Poll Summary */}
                 <div className="bg-background border border-border rounded-2xl p-5">
                   <h4 className="text-xs text-muted uppercase font-bold tracking-wider mb-4">Change Menu Poll</h4>
                   <div className="flex justify-between text-sm font-bold mb-2">
                     <span className="text-warning">Change It: {poll?.changeVotes || 0}</span>
                     <span className="text-primary">Keep It: {poll?.keepVotes || 0}</span>
                   </div>
                   <div className="w-full bg-primary/20 rounded-full h-2 flex overflow-hidden">
                     {poll?.totalPolls > 0 && (
                       <div 
                         style={{ width: `${(poll.changeVotes / poll.totalPolls) * 100}%` }} 
                         className="bg-warning h-full"
                       />
                     )}
                   </div>
                 </div>
               </div>

               {/* Comments */}
               <div className="mt-6">
                 <h4 className="text-xs text-muted uppercase font-bold tracking-wider mb-3">Recent Comments</h4>
                 <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                   {feedback?.comments?.length === 0 ? (
                     <p className="text-sm text-muted">No comments yet.</p>
                   ) : (
                     feedback?.comments?.map((c: any, i: number) => (
                       <div key={i} className="bg-background border border-border rounded-xl p-3 flex items-start gap-3">
                         <div className={`p-1.5 rounded-md shrink-0 ${c.rating === 'up' ? 'bg-primary/20 text-primary' : 'bg-danger/20 text-danger'}`}>
                           {c.rating === 'up' ? <ThumbsUp className="h-3 w-3" /> : <ThumbsDown className="h-3 w-3" />}
                         </div>
                         <div>
                           <p className="text-[10px] text-muted font-bold mb-0.5">{c.name}</p>
                           <p className="text-sm text-white">{c.comment}</p>
                         </div>
                       </div>
                     ))
                   )}
                 </div>
               </div>
            </div>

            {/* Waste Risk & Emergency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Waste Risk Students */}
              <div className="bg-danger/5 border border-danger/20 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col">
                <div className="absolute top-0 right-0 p-4 opacity-10"><AlertOctagon className="h-24 w-24 text-danger" /></div>
                <h3 className="text-sm font-bold text-danger uppercase tracking-wider mb-4 relative z-10 flex items-center gap-2"><AlertOctagon className="h-4 w-4" /> Waste Risk Panel</h3>
                <div className="space-y-3 relative z-10 overflow-y-auto max-h-[300px]">
                  {wasteRiskStudents.length === 0 ? (
                    <p className="text-sm text-muted">No high-risk students found.</p>
                  ) : (
                    wasteRiskStudents.map(student => (
                      <div key={student.id} className="bg-background/80 border border-border rounded-xl p-3 flex justify-between items-center shadow-sm">
                        <div>
                          <p className="text-sm font-bold text-white">{student.name}</p>
                          <p className="text-[10px] text-danger font-bold mt-0.5">{student.missed} meals marked but skipped</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Emergency Requests */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-xl flex flex-col">
                 <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                   <AlertTriangle className="h-4 w-4 text-warning" /> Emergency Requests
                 </h3>
                 <div className="space-y-3 overflow-y-auto max-h-[300px]">
                   <AnimatePresence>
                     {emergencyReqs.length === 0 ? (
                       <motion.p initial={{opacity:0}} animate={{opacity:1}} className="text-sm text-muted text-center py-6">No pending requests.</motion.p>
                     ) : (
                       emergencyReqs.map(req => (
                         <motion.div key={req._id} initial={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} className="bg-background border border-border rounded-xl p-4 overflow-hidden shadow-sm">
                           <p className="text-sm font-bold text-white">{req.userId?.name || 'Unknown'}</p>
                           <p className="text-xs text-muted mt-1 mb-4">{req.reason}</p>
                           <div className="flex gap-2">
                             <button onClick={()=>handleEmergency(req._id, 'approve')} className="flex-1 py-2 bg-primary/10 border border-primary/20 text-primary rounded-lg text-xs font-bold hover:bg-primary hover:text-white transition">Approve</button>
                             <button onClick={()=>handleEmergency(req._id, 'deny')} className="flex-1 py-2 bg-danger/10 border border-danger/20 text-danger rounded-lg text-xs font-bold hover:bg-danger hover:text-white transition">Deny</button>
                           </div>
                         </motion.div>
                       ))
                     )}
                   </AnimatePresence>
                 </div>
              </div>
            </div>

            {/* All Students List */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-xl">
               <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                 <UserCircle className="h-4 w-4" /> All Students Register
               </h3>
               <div className="overflow-x-auto max-h-[400px]">
                 <table className="w-full text-left text-sm">
                   <thead className="sticky top-0 bg-card z-10">
                     <tr className="border-b border-border text-muted">
                       <th className="py-3 font-bold">Student Name</th>
                       <th className="py-3 font-bold">Today's Status</th>
                       <th className="py-3 font-bold">Food Collected</th>
                       <th className="py-3 font-bold">Waste Risk</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-border">
                     {students.length === 0 ? (
                       <tr><td colSpan={4} className="py-6 text-center text-muted">No students found</td></tr>
                     ) : (
                       students.map(s => (
                         <tr key={s.id}>
                           <td className="py-4 text-white font-medium">{s.name}</td>
                           <td className="py-4">
                             {s.status === 'going' && <span className="px-2 py-1 bg-primary/10 text-primary border border-primary/20 rounded text-[10px] uppercase font-bold tracking-wider">Going</span>}
                             {s.status === 'not_going' && <span className="px-2 py-1 bg-danger/10 text-danger border border-danger/20 rounded text-[10px] uppercase font-bold tracking-wider">Not Going</span>}
                             {s.status === 'pending' && <span className="px-2 py-1 bg-background border border-border text-muted rounded text-[10px] uppercase font-bold tracking-wider">Pending</span>}
                           </td>
                           <td className="py-4">
                             {s.status === 'going' ? (
                               s.collectedFood ? 
                               <span className="text-primary font-bold text-xs flex items-center gap-1"><Check className="h-3 w-3"/> Collected</span> : 
                               <span className="text-warning font-bold text-xs flex items-center gap-1"><Clock className="h-3 w-3"/> Pending QR</span>
                             ) : <span className="text-muted text-xs">-</span>}
                           </td>
                           <td className="py-4">
                             {s.risk ? <span className="text-danger font-bold text-xs flex items-center gap-1"><AlertOctagon className="h-3 w-3"/> High Risk</span> : <span className="text-muted text-xs">Normal</span>}
                           </td>
                         </tr>
                       ))
                     )}
                   </tbody>
                 </table>
               </div>
            </div>

          </div>

          {/* Right Sidebar: AI Intelligence */}
          <div className="space-y-6">
            <motion.div className="bg-gradient-to-b from-card to-background border border-border rounded-3xl p-6 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
              
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="p-2 bg-primary rounded-xl"><Sparkles className="h-5 w-5 text-white" /></div>
                <div>
                  <h2 className="font-black text-lg text-white">AI Intelligence</h2>
                  <p className="text-xs text-primary font-bold">Powered by Gemini</p>
                </div>
              </div>

              {!aiInsight ? (
                <div className="text-center py-10 relative z-10">
                  <p className="text-sm text-muted mb-6">Analyze attendance, sentiment, and historical data to predict exact portions and optimize your vegetarian menu.</p>
                  <button 
                    onClick={() => generateAI(false)} 
                    disabled={aiLoading}
                    className="w-full py-4 bg-white text-background font-black rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-slate-200 transition disabled:opacity-70 shadow-xl"
                  >
                    {aiLoading ? <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" /> : "Run AI Prediction"}
                  </button>
                </div>
              ) : (
                <div className="space-y-6 relative z-10">
                  <div className="bg-background/80 backdrop-blur border border-border rounded-2xl p-4">
                    <span className="block text-[10px] text-muted uppercase font-bold tracking-wider mb-2">Optimal Portions</span>
                    <span className="block text-4xl font-black text-white">{aiInsight.optimalPortions}</span>
                    <span className="text-xs text-primary font-bold">Saves ~{aiInsight.wasteAvoidedKg}kg of food</span>
                  </div>

                  <div>
                    <span className="block text-[10px] text-muted uppercase font-bold tracking-wider mb-2">Pure Veg Menu Recommendation</span>
                    <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-white">{aiInsight.suggestedMenu}</h4>
                        <span className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded">{aiInsight.confidenceScore}% Match</span>
                      </div>
                      <p className="text-xs text-primary/80 leading-relaxed">{aiInsight.menuReason}</p>
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] text-muted uppercase font-bold tracking-wider mb-2">AI Analysis</span>
                    <p className="text-sm text-muted leading-relaxed bg-card p-3 rounded-xl border border-border">{aiInsight.analysis}</p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* What-If Simulator */}
            <div className="bg-gradient-to-br from-card to-background border border-border rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-[50px] pointer-events-none" />
              
              <h3 className="text-lg font-black text-white mb-2 flex items-center gap-2">
                What-If Simulator <span className="px-2 py-1 bg-primary/20 text-primary text-[10px] rounded font-bold uppercase tracking-wider shadow-sm">Beta</span>
              </h3>
              <p className="text-xs text-muted mb-6">Type a scenario below to generate instant, AI-driven insights for portion adjustments.</p>
              
              <textarea 
                value={whatIfInput}
                onChange={(e) => setWhatIfInput(e.target.value)}
                className="w-full bg-background border border-border rounded-2xl p-5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary mb-6 min-h-[120px] shadow-inner" 
                placeholder="e.g. What if there is a surprise college test tomorrow?" 
              ></textarea>
              
              <button 
                onClick={() => generateAI(true)}
                disabled={aiLoading || !whatIfInput}
                className="w-full py-4 bg-primary text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-primary-dark transition disabled:opacity-50 shadow-lg shadow-primary/20"
              >
                {aiLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Send className="h-4 w-4" /> Simulate Scenario</>}
              </button>
            </div>

          </div>

        </div>
      </main>

      <AnimatePresence>
        {showScanner && (
          <QRScanner 
            onClose={() => setShowScanner(false)} 
            onScanSuccess={() => loadData()} // Refresh admin stats on success
          />
        )}
      </AnimatePresence>

    </div>
  );
}
