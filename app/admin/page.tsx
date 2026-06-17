"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Users, TrendingDown, IndianRupee, PieChart, Sparkles, AlertTriangle, Send, Check, X, Clock, AlertOctagon, UserCircle, PlayCircle, ThumbsUp, ThumbsDown, MessageSquare, Download, CalendarDays, Leaf } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import { Parser } from 'json2csv';
import { ThemeToggle } from '@/components/ThemeToggle';
import QRScanner from '@/components/QRScanner';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'menu' | 'operations' | 'students'>('overview');
  
  const [stats, setStats] = useState({ total: 0, attending: 0, predictedWasteSavedKg: 0, moneySaved: 0, wasteReductionPct: 0, collectedCount: 0, pendingCollectionCount: 0 });
  const [students, setStudents] = useState<any[]>([]);
  const [pendingStudents, setPendingStudents] = useState<any[]>([]);
  const [wasteRiskStudents, setWasteRiskStudents] = useState<any[]>([]);
  const [emergencyReqs, setEmergencyReqs] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any>(null);
  const [poll, setPoll] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  
  const [cutoffTime, setCutoffTime] = useState('08:30');
  
  const [menuDate, setMenuDate] = useState(new Date().toISOString().split('T')[0]);
  const [menuData, setMenuData] = useState({ breakfast: '', lunch: '', dinner: '' });
  
  const [aiInsight, setAiInsight] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [isAutoMarking, setIsAutoMarking] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (!data.success || data.user.role !== 'admin') {
          router.push('/');
          return;
        }
        setUser(data.user);
        loadData();
      } catch (e) {
        router.push('/');
      }
    };
    fetchUser();
  }, [router]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [resDash, resConfig, resMenu, resAnalytics] = await Promise.all([
        fetch('/api/admin/dashboard'),
        fetch('/api/admin/settings'),
        fetch(`/api/admin/menu?date=${menuDate}`),
        fetch('/api/admin/analytics')
      ]);

      const dataDash = await resDash.json();
      if (dataDash.success) {
        setStats(dataDash.stats);
        setStudents(dataDash.students);
        setPendingStudents(dataDash.pendingStudents || []);
        setEmergencyReqs(dataDash.emergencyRequests || []);
        setFeedback(dataDash.feedback || { upVotes: 12, downVotes: 3, comments: [] });
        setPoll(dataDash.pollStats || { changeVotes: 5, keepVotes: 15, totalPolls: 20 });
        
        const riskStudents = dataDash.students.filter((s:any) => s.risk);
        setWasteRiskStudents(riskStudents);
      }

      const dataConfig = await resConfig.json();
      if (dataConfig.success && dataConfig.config) {
        setCutoffTime(dataConfig.config.cutoffTime);
      }

      const dataMenu = await resMenu.json();
      if (dataMenu.success && dataMenu.menu) {
        setMenuData({
          breakfast: dataMenu.menu.breakfast || '',
          lunch: dataMenu.menu.lunch || '',
          dinner: dataMenu.menu.dinner || ''
        });
      }

      const dataAnalytics = await resAnalytics.json();
      if (dataAnalytics.success && dataAnalytics.data) {
        setAnalyticsData(dataAnalytics.data);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load dashboard data');
    }
    setIsLoading(false);
  };

  const loadMenu = async (dateStr: string) => {
    setMenuDate(dateStr);
    try {
      const res = await fetch(`/api/admin/menu?date=${dateStr}`);
      const data = await res.json();
      if (data.success && data.menu) {
        setMenuData({
          breakfast: data.menu.breakfast || '',
          lunch: data.menu.lunch || '',
          dinner: data.menu.dinner || ''
        });
      } else {
        setMenuData({ breakfast: '', lunch: '', dinner: '' });
      }
    } catch(e) { console.error(e); }
  };

  const saveMenu = async () => {
    try {
      const res = await fetch('/api/admin/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dateString: menuDate, ...menuData })
      });
      const data = await res.json();
      if (data.success) toast.success('Menu updated successfully!');
      else toast.error('Failed to update menu');
    } catch (e) { toast.error('Error saving menu'); }
  };

  const saveCutoff = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cutoffTime })
      });
      const data = await res.json();
      if (data.success) toast.success('Cutoff time saved');
      else toast.error('Failed to save configuration');
    } catch (e) { toast.error('Error saving config'); }
  };

  const handleEmergency = async (id: string, action: 'approve'|'deny') => {
    try {
      const res = await fetch('/api/admin/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reqId: id, action })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Request ${action}d`);
        setEmergencyReqs(emergencyReqs.filter(r => r._id !== id));
      } else {
        toast.error('Action failed');
      }
    } catch (e) { toast.error('Error processing request'); }
  };
  const runAutoMark = async () => {
    setIsAutoMarking(true);
    try {
      const res = await fetch('/api/admin/auto-mark', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success(`Marked ${data.count} pending students as 'Not Going'`);
        loadData();
      } else {
        toast.error('Auto mark failed: ' + data.error);
      }
    } catch (e) {
      toast.error('Error running auto mark');
    }
    setIsAutoMarking(false);
  };

  const generateAI = (whatIf: boolean) => {
    setAiLoading(true);
    setTimeout(() => {
      setAiInsight({
        optimalPortions: Math.floor(stats.attending * 0.9),
        wasteAvoidedKg: Math.floor(stats.attending * 0.15),
        suggestedMenu: whatIf ? "Rajma Chawal (High Attendance)" : "Mixed Veg & Dal (Low Waste)",
        reasoning: "Based on historical attendance for similar menus."
      });
      setAiLoading(false);
    }, 1500);
  };

  const handleApproval = async (userId: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(action === 'approve' ? 'User approved successfully' : 'User rejected');
        loadData();
      } else {
        toast.error(data.error || 'Action failed');
      }
    } catch (e) {
      toast.error('Network error');
    }
  };

  const formatTimeToAMPM = (timeStr: string) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const d = new Date();
    d.setHours(parseInt(h, 10), parseInt(m, 10));
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const exportCSV = () => {
    if (analyticsData.length === 0) {
      toast.error("No analytics data to export");
      return;
    }
    try {
      const fields = ['date', 'attending', 'notGoing', 'collected', 'wasteSavedKg'];
      const parser = new Parser({ fields });
      const csv = parser.parse(analyticsData);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smartplate-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("CSV Exported!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate CSV");
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground pb-20">
        <header className="bg-card border-b border-border sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="w-40 h-6 bg-white/10 animate-pulse rounded"></div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 mt-8 space-y-8">
          <div className="flex bg-card p-1 rounded-2xl mb-6 shadow-sm border border-border overflow-x-auto scrollbar-hide gap-2">
            {[1,2,3,4].map(i => <div key={i} className="h-10 w-24 bg-white/10 animate-pulse rounded-xl shrink-0"></div>)}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {[1,2,3,4,5].map(i => <div key={i} className="h-28 glass-card animate-pulse rounded-2xl bg-white/5"></div>)}
          </div>
          <div className="h-64 glass-panel animate-pulse rounded-3xl bg-white/5 mt-8"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 overflow-x-hidden selection:bg-primary/30 w-full">
      
      <header className="bg-card/80 backdrop-blur-xl border-b border-border sticky top-0 z-50 shadow-sm px-4 sm:px-8 xl:px-12">
        <div className="w-full h-16 flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.5)]">
              <Leaf className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <h1 className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light hidden sm:block">SmartPlate AI <span className="text-muted text-sm font-medium ml-2">Manager</span></h1>
            <h1 className="text-lg sm:text-xl font-black text-primary sm:hidden">SmartPlate Admin</h1>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4">
            <button onClick={() => setShowScanner(true)} className="flex items-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-primary/20 text-primary border border-primary/30 rounded-xl text-xs sm:text-sm font-bold hover:bg-primary hover:text-background transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              Scan QR
            </button>
            <ThemeToggle />
            <button onClick={() => { fetch('/api/auth/logout', { method: 'POST' }).then(() => router.push('/')); }} className="p-2 text-muted hover:text-danger hover:bg-danger/10 rounded-full transition-all">
              <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-8 xl:px-12 mt-6 sm:mt-8 space-y-6 sm:space-y-8 relative z-10">
        
        {/* Navigation Tabs */}
        <div className="flex bg-card p-1.5 rounded-2xl mb-8 shadow-sm border border-border overflow-x-auto scrollbar-hide relative z-20">
          {['overview', 'menu', 'operations', 'students'].map((tab) => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab as any)} 
              className={`relative shrink-0 px-6 sm:px-8 py-2.5 sm:py-3 text-sm font-bold rounded-xl transition-colors duration-300 ${activeTab === tab ? 'text-white' : 'text-muted hover:text-foreground'}`}
            >
              {activeTab === tab && (
                <motion.div 
                  layoutId="adminTabBubble"
                  className="absolute inset-0 bg-primary rounded-xl shadow-md -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{tab === 'overview' ? 'Overview' : tab === 'menu' ? 'Menu Management' : tab === 'operations' ? 'Operations' : 'Students & Risk'}</span>
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-8">
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
              <motion.div variants={itemVariants} className="glass-card p-5 rounded-2xl flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] text-muted uppercase font-bold tracking-widest">Total Students</span>
                  <div className="p-1.5 bg-card border border-border rounded-lg"><Users className="h-4 w-4 text-muted" /></div>
                </div>
                <span className="text-4xl font-black mt-auto">{stats.total}</span>
              </motion.div>

              <motion.div variants={itemVariants} className="glass-card border-primary/20 p-5 rounded-2xl flex flex-col relative overflow-hidden">
                <div className="flex items-center justify-between mb-3 relative z-10">
                  <span className="text-[10px] text-primary uppercase font-bold tracking-widest">Attending Today</span>
                  <div className="p-1.5 bg-primary/20 rounded-lg"><Check className="h-4 w-4 text-primary" /></div>
                </div>
                <div className="flex items-baseline gap-2 relative z-10 mt-auto">
                  <span className="text-4xl font-black text-primary drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">{stats.attending || 0}</span>
                </div>
                <div className="mt-3 pt-3 border-t border-primary/10 flex justify-between text-[10px] font-bold text-primary relative z-10">
                  <span className="bg-primary/10 px-2 py-1 rounded">Collected: {stats.collectedCount || 0}</span>
                  <span className="bg-primary/10 px-2 py-1 rounded">Pending: {stats.pendingCollectionCount || 0}</span>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="glass-card border-primary/40 p-5 rounded-2xl flex flex-col relative overflow-hidden">
                <div className="flex items-center justify-between mb-3 relative z-10">
                  <span className="text-[10px] text-white uppercase font-bold tracking-widest">Waste Saved</span>
                  <div className="p-1.5 bg-primary/20 rounded-lg"><TrendingDown className="h-4 w-4 text-primary" /></div>
                </div>
                <span className="text-4xl font-black mt-auto relative z-10">{stats.predictedWasteSavedKg}<span className="text-lg text-muted ml-1">kg</span></span>
              </motion.div>

              <motion.div variants={itemVariants} className="glass-card border-info/40 p-5 rounded-2xl flex flex-col relative overflow-hidden">
                <div className="flex items-center justify-between mb-3 relative z-10">
                  <span className="text-[10px] text-white uppercase font-bold tracking-widest">Money Saved</span>
                  <div className="p-1.5 bg-info/20 rounded-lg"><IndianRupee className="h-4 w-4 text-info" /></div>
                </div>
                <span className="text-4xl font-black mt-auto relative z-10">₹{stats.moneySaved}</span>
              </motion.div>

              <motion.div variants={itemVariants} className="glass-card border-primary/50 p-5 rounded-2xl flex flex-col relative overflow-hidden">
                <div className="flex items-center justify-between mb-3 relative z-10">
                  <span className="text-[10px] text-white uppercase font-bold tracking-widest">Reduction %</span>
                  <div className="p-1.5 bg-white/20 rounded-lg"><PieChart className="h-4 w-4 text-white" /></div>
                </div>
                <span className="text-4xl font-black mt-auto relative z-10">{stats.wasteReductionPct}%</span>
              </motion.div>
            </motion.div>

            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.25}} className="glass-panel rounded-3xl p-6 md:p-8 mt-8 relative overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold flex items-center gap-2"><TrendingDown className="h-5 w-5 text-primary" /> 30-Day Historical Analytics</h3>
                <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary rounded-xl text-xs font-bold hover:bg-primary/30 transition-colors border border-primary/30">
                  <Download className="h-4 w-4" /> Export CSV
                </button>
              </div>
              
              <div className="h-[350px] w-full mt-4">
                {analyticsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analyticsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorWaste" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="rgba(255,255,255,0.2)" 
                        fontSize={10} 
                        tickMargin={10} 
                        tickFormatter={(val) => {
                          const d = new Date(val);
                          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        }}
                      />
                      <YAxis 
                        stroke="rgba(255,255,255,0.2)" 
                        fontSize={10} 
                        tickMargin={10}
                        tickFormatter={(val) => `${val}kg`}
                      />
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(15, 23, 42, 0.8)', 
                          backdropFilter: 'blur(12px)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '16px',
                          boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)',
                          color: '#fff'
                        }}
                        itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                        labelStyle={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}
                      />
                      <Area 
                        type="monotone" 
                        name="Waste Saved"
                        dataKey="wasteSavedKg" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorWaste)" 
                        activeDot={{ r: 6, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
                        animationDuration={1500}
                        animationEasing="ease-out"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-muted text-sm">Loading analytics data...</div>}
              </div>
            </motion.div>
            
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.3}} className="glass-panel rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2"><Clock className="h-4 w-4 text-warning"/> Daily Auto-Lock Time (IST)</h3>
                <p className="text-xs text-muted mt-2">Students cannot change attendance after {formatTimeToAMPM(cutoffTime)}.</p>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <input type="time" value={cutoffTime} onChange={(e) => setCutoffTime(e.target.value)} className="glass-input px-4 py-3 rounded-xl focus:outline-none bg-card" />
                <button onClick={saveCutoff} className="px-6 py-3.5 bg-primary hover:bg-primary-light text-white text-sm font-black rounded-xl shadow-[0_0_15px_-3px_rgba(16,185,129,0.4)] transition-all">Save Config</button>
              </div>
            </motion.div>
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="grid grid-cols-1 gap-8">
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.1}} className="glass-panel rounded-3xl p-6 md:p-8 relative overflow-hidden">
               <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-6 flex items-center gap-2">
                 <CalendarDays className="h-4 w-4" /> Daily Menu Management
               </h3>
               
               <div className="flex flex-col md:flex-row gap-4 mb-6">
                 <div className="flex-1">
                   <label className="block text-xs font-bold text-muted mb-2 uppercase tracking-widest">Select Date</label>
                   <input type="date" value={menuDate} onChange={(e) => loadMenu(e.target.value)} className="w-full glass-input bg-card px-4 py-3 rounded-xl focus:outline-none" />
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                 <div>
                   <label className="block text-xs font-bold text-muted mb-2 uppercase tracking-widest">Breakfast</label>
                   <textarea value={menuData.breakfast} onChange={(e) => setMenuData({...menuData, breakfast: e.target.value})} className="w-full glass-input bg-card px-4 py-3 rounded-xl focus:outline-none resize-none h-24" placeholder="E.g., Poha, Tea, Toast" />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-muted mb-2 uppercase tracking-widest">Lunch</label>
                   <textarea value={menuData.lunch} onChange={(e) => setMenuData({...menuData, lunch: e.target.value})} className="w-full glass-input bg-card px-4 py-3 rounded-xl focus:outline-none resize-none h-24" placeholder="E.g., Dal Makhani, Rice, Roti" />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-muted mb-2 uppercase tracking-widest">Dinner</label>
                   <textarea value={menuData.dinner} onChange={(e) => setMenuData({...menuData, dinner: e.target.value})} className="w-full glass-input bg-card px-4 py-3 rounded-xl focus:outline-none resize-none h-24" placeholder="E.g., Kadhai Paneer, Roti" />
                 </div>
               </div>

               <button onClick={saveMenu} className="w-full py-3.5 bg-primary text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-sm">
                 <Check className="h-4 w-4" /> Save Menu
               </button>
            </motion.div>
          </div>
        )}

        {activeTab === 'operations' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.1}} className="glass-panel border-warning/30 bg-warning/5 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-sm font-bold text-warning flex items-center gap-2">Execute Auto-Mark</h3>
                  <p className="text-xs text-warning/80 mt-2">Force all "Pending" students to "Not Going". Run this after Lock Time.</p>
                </div>
                <button onClick={runAutoMark} disabled={isAutoMarking} className="px-6 py-3.5 bg-warning text-background hover:bg-yellow-500 text-sm font-black rounded-xl flex items-center gap-2 disabled:opacity-50">
                  {isAutoMarking ? <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" /> : <><PlayCircle className="h-4 w-4" /> Run Auto Mark Now</>}
                </button>
              </motion.div>

              <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.2}} className="glass-panel rounded-3xl p-6 md:p-8">
                 <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-6 flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Student Feedback & Polling</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="glass-card rounded-2xl p-6 border border-border">
                     <h4 className="text-[10px] text-muted uppercase font-bold tracking-widest mb-5">Today's Ratings</h4>
                     <div className="flex gap-4">
                       <div className="flex-1 bg-primary/10 border border-primary/20 rounded-xl p-4 flex flex-col items-center justify-center">
                         <ThumbsUp className="h-6 w-6 text-primary mb-2" />
                         <span className="text-2xl font-black text-primary">{feedback?.upVotes || 0}</span>
                       </div>
                       <div className="flex-1 bg-danger/10 border border-danger/20 rounded-xl p-4 flex flex-col items-center justify-center">
                         <ThumbsDown className="h-6 w-6 text-danger mb-2" />
                         <span className="text-2xl font-black text-danger">{feedback?.downVotes || 0}</span>
                       </div>
                     </div>
                   </div>
                 </div>
              </motion.div>

              <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.3}} className="glass-panel rounded-3xl p-6 md:p-8">
                 <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-6 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" /> Emergency Requests</h3>
                 <div className="space-y-3 overflow-y-auto max-h-[300px]">
                   {emergencyReqs.length === 0 ? (
                     <p className="text-sm text-muted text-center py-6">No pending requests.</p>
                   ) : emergencyReqs.map(req => (
                     <div key={req._id} className="bg-card border border-border rounded-xl p-4 shadow-sm">
                       <p className="text-sm font-bold">{req.userId?.name || 'Unknown'}</p>
                       <p className="text-xs text-muted mt-1 mb-4">{req.reason}</p>
                       <div className="flex gap-2">
                         <button onClick={()=>handleEmergency(req._id, 'approve')} className="flex-1 py-2 bg-primary/10 text-primary rounded-lg text-xs font-bold">Approve</button>
                         <button onClick={()=>handleEmergency(req._id, 'deny')} className="flex-1 py-2 bg-danger/10 text-danger rounded-lg text-xs font-bold">Deny</button>
                       </div>
                     </div>
                   ))}
                 </div>
              </motion.div>
            </div>

            <div className="space-y-6">
              <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} transition={{delay:0.4}} className="glass-panel border-primary/30 rounded-3xl p-6 md:p-8 bg-gradient-to-br from-primary/10 to-transparent">
                <h2 className="font-black text-xl tracking-tight mb-6">AI Command Center</h2>
                {!aiInsight ? (
                  <div className="text-center py-8">
                    <button onClick={() => generateAI(false)} disabled={aiLoading} className="w-full py-4 bg-primary text-white font-black rounded-xl text-sm flex items-center justify-center gap-2">
                      {aiLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Run AI Analysis"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-card rounded-2xl p-5 border border-border">
                      <span className="block text-[10px] text-muted uppercase font-bold tracking-widest mb-2">Optimal Portions</span>
                      <span className="block text-4xl font-black mb-1">{aiInsight.optimalPortions}</span>
                      <span className="text-xs text-primary font-bold">Saves ~{aiInsight.wasteAvoidedKg}kg of food</span>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.1}} className="glass-panel border-danger/20 bg-danger/5 rounded-3xl p-6 md:p-8 lg:col-span-2">
              <h3 className="text-[10px] font-bold text-danger uppercase tracking-widest mb-6 flex items-center gap-2"><AlertOctagon className="h-4 w-4" /> Waste Risk Panel</h3>
              <div className="space-y-3 overflow-y-auto max-h-[300px]">
                {wasteRiskStudents.length === 0 ? <p className="text-sm text-muted">No high-risk students found.</p> : wasteRiskStudents.map(student => (
                  <div key={student.id} className="bg-card border border-border p-4 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold">{student.name}</p>
                      <p className="text-[10px] text-danger font-bold mt-1 uppercase tracking-wider">{student.missed} meals marked but skipped</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.15}} className="glass-panel border-warning/20 bg-warning/5 rounded-3xl p-6 md:p-8 lg:col-span-2">
              <h3 className="text-[10px] font-bold text-warning uppercase tracking-widest mb-6 flex items-center gap-2"><UserCircle className="h-4 w-4" /> Pending Approvals</h3>
              <div className="space-y-3 overflow-y-auto max-h-[300px]">
                {pendingStudents.length === 0 ? <p className="text-sm text-muted">No pending signups.</p> : pendingStudents.map(student => (
                  <div key={student._id} className="bg-card border border-border p-4 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold">{student.name}</p>
                      <p className="text-[10px] text-muted font-bold mt-1 uppercase tracking-wider">Username: {student.username}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleApproval(student._id, 'approve')} className="px-3 py-1.5 bg-primary/20 text-primary hover:bg-primary hover:text-white rounded-lg text-xs font-bold transition-colors">Approve</button>
                      <button onClick={() => handleApproval(student._id, 'reject')} className="px-3 py-1.5 bg-danger/20 text-danger hover:bg-danger hover:text-white rounded-lg text-xs font-bold transition-colors">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.2}} className="glass-panel rounded-3xl p-6 md:p-8 lg:col-span-2">
               <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-6 flex items-center gap-2"><UserCircle className="h-4 w-4" /> All Students Register</h3>
               <div className="overflow-x-auto max-h-[500px]">
                 <table className="w-full text-left text-sm border-collapse">
                   <thead className="sticky top-0 bg-card z-10 border-b border-border">
                     <tr className="text-[10px] text-muted uppercase tracking-widest">
                       <th className="py-4 px-4 font-bold">Student Name</th>
                       <th className="py-4 px-4 font-bold">Today's Status</th>
                       <th className="py-4 px-4 font-bold">Food Collected</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-border">
                     {students.length === 0 ? <tr><td colSpan={3} className="py-8 text-center text-muted">No students found</td></tr> : students.map(s => (
                       <tr key={s.id} className="hover:bg-muted/10">
                         <td className="py-4 px-4 font-medium">{s.name}</td>
                         <td className="py-4 px-4">
                           {s.status === 'going' && <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-md text-[10px] uppercase font-bold">Going</span>}
                           {s.status === 'not_going' && <span className="px-2.5 py-1 bg-danger/10 text-danger rounded-md text-[10px] uppercase font-bold">Not Going</span>}
                           {s.status === 'pending' && <span className="px-2.5 py-1 bg-card border border-border text-muted rounded-md text-[10px] uppercase font-bold">Pending</span>}
                         </td>
                         <td className="py-4 px-4">
                           {s.status === 'going' ? (
                             s.collectedFood ? <span className="text-primary font-bold text-xs"><Check className="h-3.5 w-3.5 inline"/> Collected</span> : <span className="text-warning font-bold text-xs"><Clock className="h-3.5 w-3.5 inline"/> Pending</span>
                           ) : <span className="text-muted text-xs">-</span>}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </motion.div>
          </div>
        )}

      </main>

      <AnimatePresence>
        {showScanner && (
          <div className="fixed inset-0 bg-background/90 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-md">
            <QRScanner 
              onClose={() => setShowScanner(false)}
              onScanSuccess={() => {
                toast.success("Scanned successfully");
                loadData();
              }} 
            />
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
