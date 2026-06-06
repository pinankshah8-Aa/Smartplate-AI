"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChefHat, LogOut, Users, Trash2, IndianRupee, Sparkles, 
  HelpCircle, RefreshCw, Check, X, AlertCircle, Bell, ArrowRight,
  TrendingDown, TrendingUp, BarChart3, MessageSquare
} from 'lucide-react';
import { 
  getEmergencyRequests, updateRequestStatus, EmergencyRequest,
  getStudentAttendance, getMenuRating, historicalAttendance, monthlySavings
} from '../utils/mockData';

// ChartJS setup
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AIInsights {
  predictedPortions: number;
  estimatedWasteKg: number;
  costSavingsINR: number;
  wasteReductionPercent: number;
  menuSuggestions: string[];
  generalInsight: string;
  isMock?: boolean;
}

interface WhatIfResponse {
  wasteImpactKg: number;
  costImpactINR: number;
  adjustmentSuggestion: string;
  scenarioSummary: string;
  isMock?: boolean;
}

export default function AdminDashboard() {
  const router = useRouter();

  // Auth Guard
  useEffect(() => {
    const role = localStorage.getItem('smartplate_user_role');
    if (role !== 'admin') {
      router.push('/');
    }
  }, [router]);

  // States
  const [mounted, setMounted] = useState(false);
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [attendingTomorrowCount, setAttendingTomorrowCount] = useState(48);
  const [thumbsUpCount, setThumbsUpCount] = useState(36);
  const [thumbsDownCount, setThumbsDownCount] = useState(12);
  const [feedbackComments, setFeedbackComments] = useState<Array<{name: string, comment: string, rating: 'up' | 'down'}>>([
    { name: "Amit Kumar", comment: "The Biryani spice level was perfect today, but rice was slightly dry.", rating: "up" },
    { name: "Pooja Hegde", comment: "A bit too greasy. Portions are too large, please reduce rice portion.", rating: "down" },
    { name: "Rohit Sharma", comment: "Delicious! Love the Friday special Biryani.", rating: "up" }
  ]);

  // AI insights states
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  // What-If Simulator states
  const [whatIfQuery, setWhatIfQuery] = useState('');
  const [whatIfResponse, setWhatIfResponse] = useState<WhatIfResponse | null>(null);
  const [whatIfLoading, setWhatIfLoading] = useState(false);

  // Notification state
  const [notification, setNotification] = useState<string | null>(null);

  const loadDashboardState = () => {
    // Sync emergency requests
    setRequests(getEmergencyRequests());

    // Sync student tomorrow attendance
    const studentAtt = getStudentAttendance();
    // Default attendance is 48. If student opt-out, reduce it by 1.
    setAttendingTomorrowCount(studentAtt.attendingTomorrow ? 48 : 47);

    // Sync student feedback rating
    const studentRating = getMenuRating();
    if (studentRating) {
      if (studentRating.rating === 'up') {
        setThumbsUpCount(37);
        setThumbsDownCount(12);
      } else {
        setThumbsUpCount(36);
        setThumbsDownCount(13);
      }

      // Append student review to comments list if not already there
      const studentComment = studentRating.comment.trim();
      const commentExists = feedbackComments.some(c => c.name === "Rahul Sharma");
      if (studentComment && !commentExists) {
        setFeedbackComments(prev => [
          { name: "Rahul Sharma (You)", comment: studentComment, rating: studentRating.rating },
          ...prev
        ]);
      }
    }
  };

  const fetchInsights = async () => {
    setAiLoading(true);
    setAiError('');
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_insights' })
      });
      const data = await response.json();
      if (response.ok) {
        setAiInsights(data);
      } else {
        setAiError(data.error || 'Failed to fetch insights');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setAiError(`Network error while getting insights: ${errorMessage}`);
    } finally {
      setAiLoading(false);
    }
  };

  // Load and sync data
  useEffect(() => {
    Promise.resolve().then(() => {
      setMounted(true);
      fetchInsights();
      loadDashboardState();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleWhatIfSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatIfQuery.trim()) return;
    setWhatIfLoading(true);
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'what_if', query: whatIfQuery })
      });
      const data = await response.json();
      if (response.ok) {
        setWhatIfResponse(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWhatIfLoading(false);
    }
  };

  const handleRequestAction = (id: string, status: 'Approved' | 'Denied') => {
    const updated = updateRequestStatus(id, status);
    setRequests(updated);
    showToast(`Request was ${status.toLowerCase()} successfully.`);

    // If request type is Cancel Meals and status is approved, we reduce attendance count
    const approvedRequest = updated.find(r => r.id === id);
    if (approvedRequest && approvedRequest.type === 'Cancel Meals' && status === 'Approved') {
      setAttendingTomorrowCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('smartplate_user_role');
    localStorage.removeItem('smartplate_username');
    router.push('/');
  };

  const handleSendReminder = () => {
    const missingAttendance = 55 - attendingTomorrowCount - 1; // excluding opted out
    showToast(`🔔 Daily reminder notification pushed to ${Math.max(3, missingAttendance)} students!`);
  };

  const showToast = (message: string) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  // Chart Data definitions
  const attendanceChartData = {
    labels: historicalAttendance.map(d => d.day),
    datasets: [
      {
        label: 'PG Students Registered',
        data: historicalAttendance.map(d => d.total),
        borderColor: '#475569',
        borderDash: [5, 5],
        backgroundColor: 'transparent',
        pointRadius: 0,
      },
      {
        label: 'Attending Count',
        data: historicalAttendance.map(d => d.attending),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#22c55e',
        pointBorderColor: '#090d16',
        pointHoverRadius: 6,
      }
    ]
  };

  const savingsChartData = {
    labels: monthlySavings.map(s => s.month),
    datasets: [
      {
        label: 'Savings (₹)',
        data: monthlySavings.map(s => s.moneySavedINR),
        backgroundColor: '#22c55e',
        hoverBackgroundColor: '#16a34a',
        borderRadius: 8,
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#090d16] pb-12 relative">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 p-4 bg-slate-900 border border-[#22c55e] text-white rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-in">
          <div className="p-1.5 bg-emerald-950/50 rounded-xl text-[#22c55e]">
            <Check className="h-4 w-4" />
          </div>
          <p className="text-xs font-semibold">{notification}</p>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-950 border border-slate-800 rounded-xl">
              <ChefHat className="h-6 w-6 text-[#22c55e]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">SmartPlate AI</h1>
              <p className="text-[10px] text-[#22c55e] font-bold tracking-wider uppercase">Mess Administrator</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSendReminder}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-[#22c55e] bg-emerald-950/20 border border-emerald-800/40 hover:bg-emerald-950/40 rounded-lg transition duration-200"
            >
              <Bell className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Send Reminder</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-400 hover:text-white bg-slate-950 border border-slate-800 hover:border-red-500/50 hover:bg-red-950/20 rounded-lg transition duration-200"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        
        {/* TOP STATS CARD GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex items-center gap-4 transition duration-300 hover:border-slate-700">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-slate-400">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase">Total Registered Students</span>
              <p className="text-3xl font-black text-white">55</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Assigned to PG Hostel Wing B</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex items-center gap-4 transition duration-300 hover:border-[#22c55e]/50">
            <div className="p-4 bg-emerald-950/40 border border-emerald-900/30 rounded-2xl text-[#22c55e]">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] text-[#22c55e] font-bold uppercase tracking-wider">Tomorrow&apos;s Attendance</span>
              <p className="text-3xl font-black text-white">{attendingTomorrowCount} <span className="text-sm font-semibold text-slate-400">/ 55</span></p>
              <p className="text-[10px] text-slate-400 mt-0.5">Dynamic update based on choices</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex items-center gap-4 transition duration-300 hover:border-slate-700">
            <div className="p-4 bg-emerald-950/40 border border-slate-800 rounded-2xl text-emerald-400">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase">Estimated Waste Saved</span>
              <p className="text-3xl font-black text-[#22c55e]">
                {aiInsights ? `${(aiInsights.wasteReductionPercent * 0.15).toFixed(1)} kg` : 'Calculating...'}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">This week vs baseline preparation</p>
            </div>
          </div>
        </div>

        {/* SECTION: AI INSIGHTS PANEL (THE HIGHLIGHT) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 relative overflow-hidden transition-all duration-300 hover:border-emerald-500/20">
          {/* Neon gradient mesh behind */}
          <div className="absolute top-0 right-0 w-[30%] h-[100%] bg-gradient-to-l from-[#22c55e]/5 to-transparent pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-950/40 border border-[#22c55e]/30 rounded-xl text-[#22c55e]">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-white tracking-wide">AI Food waste Insights</h2>
                <p className="text-xs text-slate-400">Real-time optimization predictions from Gemini API</p>
              </div>
            </div>

            <button
              onClick={fetchInsights}
              disabled={aiLoading}
              className="self-start sm:self-center flex items-center gap-2 px-3 py-2 text-xs font-bold bg-slate-950 border border-slate-800 hover:border-[#22c55e] text-slate-300 hover:text-white rounded-xl transition duration-200"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${aiLoading ? 'animate-spin text-[#22c55e]' : ''}`} />
              Update AI Parameters
            </button>
          </div>

          {aiLoading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-4 border-[#22c55e] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400 font-medium">Prompting Gemini to analyze trends...</p>
            </div>
          ) : aiError ? (
            <div className="flex items-center gap-3 p-4 bg-red-950/20 border border-red-900/30 rounded-2xl text-red-400 text-xs">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{aiError}</span>
            </div>
          ) : aiInsights ? (
            <div className="space-y-6">
              
              {/* Warnings / Fallback messages */}
              {aiInsights.isMock && (
                <div className="flex items-center justify-between gap-2.5 p-3 rounded-2xl bg-amber-950/30 border border-amber-800/40 text-amber-400 text-xs">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4.5 w-4.5" />
                    <span>Using simulated AI logic. To query live, add a `GEMINI_API_KEY` to your local env.</span>
                  </div>
                  <span className="text-[10px] font-bold bg-amber-950 px-2 py-0.5 rounded-full border border-amber-900">DEMO MODE</span>
                </div>
              )}

              {/* AI Key parameters metrics grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-2xl text-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Portion Preparation Target</span>
                  <span className="text-2xl font-black text-white">{aiInsights.predictedPortions} portions</span>
                  <span className="text-[10px] text-slate-400 block mt-1">Recommended baseline is 55</span>
                </div>
                <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-2xl text-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Expected Plate Waste</span>
                  <span className="text-2xl font-black text-red-400">{aiInsights.estimatedWasteKg} kg</span>
                  <span className="text-[10px] text-slate-400 block mt-1">Reduction from ~12 kg baseline</span>
                </div>
                <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-2xl text-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Projected Cost Savings</span>
                  <span className="text-2xl font-black text-[#22c55e] flex items-center justify-center gap-0.5">
                    <IndianRupee className="h-4 w-4 shrink-0" />
                    {aiInsights.costSavingsINR}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">Based on saved raw ingredients</span>
                </div>
                <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-2xl text-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Waste Reduction %</span>
                  <span className="text-2xl font-black text-[#22c55e] flex items-center justify-center gap-0.5">
                    <TrendingDown className="h-5 w-5 shrink-0" />
                    {aiInsights.wasteReductionPercent}%
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">Highly Optimized operation</span>
                </div>
              </div>

              {/* Suggestions and general insights summary */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-slate-800/80">
                <div className="lg:col-span-2 space-y-3">
                  <h3 className="text-sm font-bold text-white">Recommended Action Plan</h3>
                  <ul className="space-y-2.5">
                    {aiInsights.menuSuggestions.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-950/40 text-[#22c55e] text-[9px] font-bold border border-[#22c55e]/20">
                          {idx + 1}
                        </span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 bg-slate-950/50 border border-slate-850 rounded-2xl space-y-2">
                  <h3 className="text-xs font-bold text-[#22c55e] tracking-wider uppercase">Strategic Summary</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {aiInsights.generalInsight}
                  </p>
                </div>
              </div>

            </div>
          ) : null}
        </div>

        {/* SECTION: WHAT-IF SIMULATOR & EMERGENCY TABLE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* What-If Simulator Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 transition duration-300 hover:border-slate-700 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="p-1.5 bg-emerald-950/40 border border-slate-800 rounded-xl text-emerald-400">
                  <HelpCircle className="h-4.5 w-4.5" />
                </span>
                <h2 className="text-lg font-bold text-white">AI What-If Simulator</h2>
              </div>
              <p className="text-xs text-slate-400 mb-6">Test hypothetical scenarios (e.g. replacing ingredients, weather changes, or college event attendance drops) to analyze waste impact.</p>

              <form onSubmit={handleWhatIfSubmit} className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={whatIfQuery}
                    onChange={(e) => setWhatIfQuery(e.target.value)}
                    placeholder="E.g. What if we substitute rice with millets or 15 students leave early?"
                    className="flex-1 p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#22c55e]"
                  />
                  <button
                    type="submit"
                    disabled={whatIfLoading}
                    className="px-4 py-3 bg-[#22c55e] hover:bg-[#16a34a] text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 disabled:opacity-50 transition duration-200 shrink-0"
                  >
                    {whatIfLoading ? (
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        Ask AI
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Show What-If simulator predictions */}
              {whatIfResponse && (
                <div className="mt-6 p-4 bg-slate-950/80 border border-slate-800/80 rounded-2xl space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Simulator Projection</span>
                    {whatIfResponse.isMock && (
                      <span className="text-[9px] font-bold text-amber-500 bg-amber-950/40 border border-amber-900/40 px-2 py-0.5 rounded-full">SIMULATION</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase font-bold block mb-0.5">Wastage Impact</span>
                      <span className={`text-base font-black ${whatIfResponse.wasteImpactKg <= 0 ? 'text-[#22c55e]' : 'text-red-400'}`}>
                        {whatIfResponse.wasteImpactKg <= 0 ? '' : '+'}{whatIfResponse.wasteImpactKg} kg
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase font-bold block mb-0.5">Financial Impact</span>
                      <span className={`text-base font-black ${whatIfResponse.costImpactINR >= 0 ? 'text-[#22c55e]' : 'text-red-400'}`}>
                        {whatIfResponse.costImpactINR >= 0 ? '+' : ''}₹{whatIfResponse.costImpactINR}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">Staff Action Guideline</span>
                    <p className="text-xs text-white font-medium">{whatIfResponse.adjustmentSuggestion}</p>
                  </div>

                  <div className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-900 pt-2">
                    {whatIfResponse.scenarioSummary}
                  </div>
                </div>
              )}
            </div>
            {!whatIfResponse && (
              <div className="mt-6 border border-dashed border-slate-800 p-8 rounded-2xl text-center text-xs text-slate-500">
                Submit a scenario above to compute AI projections.
              </div>
            )}
          </div>

          {/* Emergency Requests Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 transition duration-300 hover:border-slate-700 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-400">
                    <AlertCircle className="h-4.5 w-4.5" />
                  </span>
                  <h2 className="text-lg font-bold text-white">Emergency Request Panel</h2>
                </div>
                <span className="text-xs text-[#22c55e] font-semibold bg-emerald-950/20 border border-emerald-900/30 px-2 py-0.5 rounded-full">
                  {requests.filter(r => r.status === 'Pending').length} Pending
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-6">Manage student-initiated meal cancellations and late dining check-ins.</p>

              <div className="overflow-x-auto">
                {requests.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8">No emergency requests registered.</p>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-2.5 font-bold">Student</th>
                        <th className="py-2.5 font-bold">Request</th>
                        <th className="py-2.5 font-bold">Meal/Date</th>
                        <th className="py-2.5 font-bold text-center">Status</th>
                        <th className="py-2.5 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {requests.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-950/20 transition-all">
                          <td className="py-3 pr-2">
                            <p className="font-semibold text-white">{req.studentName}</p>
                            <p className="text-[10px] text-slate-500">{req.studentId}</p>
                          </td>
                          <td className="py-3 pr-2">
                            <span className="font-medium text-slate-300">{req.type}</span>
                            <p className="text-[10px] text-slate-500 truncate max-w-[120px]" title={req.reason}>{req.reason}</p>
                          </td>
                          <td className="py-3 pr-2">
                            <p className="text-slate-300">{req.mealType}</p>
                            <p className="text-[10px] text-slate-500">{req.date}</p>
                          </td>
                          <td className="py-3 text-center pr-2">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                              req.status === 'Approved' 
                                ? 'bg-emerald-950/40 border-emerald-900/30 text-[#22c55e]' 
                                : req.status === 'Denied' 
                                  ? 'bg-red-950/40 border-red-900/30 text-red-400' 
                                  : 'bg-amber-950/40 border-amber-900/30 text-amber-400'
                            }`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            {req.status === 'Pending' ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleRequestAction(req.id, 'Approved')}
                                  className="p-1 rounded-lg bg-emerald-950/50 border border-emerald-900/40 text-[#22c55e] hover:bg-emerald-500 hover:text-slate-950 transition"
                                  title="Approve"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleRequestAction(req.id, 'Denied')}
                                  className="p-1 rounded-lg bg-red-950/50 border border-red-900/40 text-red-400 hover:bg-red-500 hover:text-slate-950 transition"
                                  title="Deny"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-600 font-bold">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* SECTION: VISUALIZATIONS CHARTS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Weekly Attendance Trend Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:col-span-2 transition duration-300 hover:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-400">
                  <TrendingUp className="h-4.5 w-4.5" />
                </span>
                <h2 className="text-lg font-bold text-white">7-Day Attendance Trend</h2>
              </div>
              <span className="text-[10px] text-slate-500">Weekly baseline preparation: 55</span>
            </div>

            <div className="h-[250px] flex items-center justify-center">
              {mounted ? (
                <Line 
                  data={attendanceChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                        labels: { color: '#94a3b8', font: { size: 10 } }
                      },
                      tooltip: {
                        backgroundColor: '#111827',
                        borderColor: '#1e293b',
                        borderWidth: 1,
                        bodyColor: '#f8fafc',
                        titleColor: '#22c55e',
                      }
                    },
                    scales: {
                      x: { grid: { color: 'rgba(30, 41, 59, 0.3)' }, ticks: { color: '#94a3b8' } },
                      y: { grid: { color: 'rgba(30, 41, 59, 0.3)' }, ticks: { color: '#94a3b8' }, min: 0, max: 60 }
                    }
                  }} 
                />
              ) : (
                <p className="text-xs text-slate-500">Loading charts...</p>
              )}
            </div>
          </div>

          {/* Monthly Cost Savings Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 transition duration-300 hover:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-400">
                  <BarChart3 className="h-4.5 w-4.5" />
                </span>
                <h2 className="text-lg font-bold text-white">Cumulative savings</h2>
              </div>
              <span className="text-[10px] text-slate-500">In Indian Rupees (₹)</span>
            </div>

            <div className="h-[250px] flex items-center justify-center">
              {mounted ? (
                <Bar 
                  data={savingsChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: '#111827',
                        borderColor: '#1e293b',
                        borderWidth: 1,
                        bodyColor: '#f8fafc',
                        callbacks: {
                          label: function(context) { return ` Savings: ₹${context.raw}`; }
                        }
                      }
                    },
                    scales: {
                      x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
                      y: { grid: { color: 'rgba(30, 41, 59, 0.3)' }, ticks: { color: '#94a3b8' } }
                    }
                  }} 
                />
              ) : (
                <p className="text-xs text-slate-500">Loading charts...</p>
              )}
            </div>
          </div>

        </div>

        {/* FEEDBACK CORNER */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 transition duration-300 hover:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-400">
                <MessageSquare className="h-4.5 w-4.5" />
              </span>
              <h2 className="text-lg font-bold text-white">Student Voting & Comments</h2>
            </div>
            
            <div className="flex gap-4 text-xs font-semibold">
              <span className="text-[#22c55e] bg-emerald-950/20 border border-emerald-900/30 px-2.5 py-1 rounded-xl">
                👍 {thumbsUpCount} Good
              </span>
              <span className="text-red-400 bg-red-950/20 border border-red-900/30 px-2.5 py-1 rounded-xl">
                👎 {thumbsDownCount} Average
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {feedbackComments.map((comment, index) => (
              <div key={index} className="p-4 bg-slate-950 border border-slate-850 rounded-2xl flex flex-col justify-between space-y-3 relative">
                <span className={`absolute top-4 right-4 text-xs font-bold px-1.5 py-0.5 rounded-full border ${
                  comment.rating === 'up' 
                    ? 'bg-emerald-950/30 border-emerald-900/40 text-[#22c55e]' 
                    : 'bg-red-950/30 border-red-900/40 text-red-400'
                }`}>
                  {comment.rating === 'up' ? 'Good' : 'Avg/Bad'}
                </span>
                
                <div>
                  <span className="text-xs font-bold text-white block mb-1">{comment.name}</span>
                  <p className="text-xs text-slate-400 leading-relaxed font-normal">&quot;{comment.comment}&quot;</p>
                </div>

                <span className="text-[9px] text-slate-600 block mt-2 text-right">Submitted today</span>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
