"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { 
  ChefHat, LogOut, Calendar, Award, QrCode, ThumbsUp, ThumbsDown, 
  Send, AlertTriangle, CheckCircle, Clock, X, AlertCircle, Sparkles
} from 'lucide-react';
import { 
  getStudentAttendance, saveStudentAttendance, 
  getMenuRating, saveMenuRating, addEmergencyRequest
} from '../utils/mockData';

export default function StudentDashboard() {
  const router = useRouter();

  // Auth Guard
  useEffect(() => {
    const role = localStorage.getItem('smartplate_user_role');
    if (role !== 'student') {
      router.push('/');
    }
  }, [router]);

  // States
  const [attending, setAttending] = useState(true);
  const [isLockedSimulated, setIsLockedSimulated] = useState(false);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [markedTime, setMarkedTime] = useState<string | null>(null);

  // Voting state
  const [liked, setLiked] = useState<'up' | 'down' | null>(null);
  const [comment, setComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // QR Code state
  const [qrUrl, setQrUrl] = useState('');

  // Emergency request modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reqType, setReqType] = useState<'Cancel Meals' | 'Late Check-in' | 'Extra Portion'>('Cancel Meals');
  const [mealType, setMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner'>('Lunch');
  const [reqDate, setReqDate] = useState('Tomorrow');
  const [reason, setReason] = useState('');
  const [emergencySubmitted, setEmergencySubmitted] = useState(false);

  // Initialize values from localStorage
  useEffect(() => {
    Promise.resolve().then(() => {
      // Attendance
      const attState = getStudentAttendance();
      setAttending(attState.attendingTomorrow);
      if (attState.markedAt) {
        setAttendanceMarked(true);
        setMarkedTime(new Date(attState.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }

      // Feedback
      const ratingState = getMenuRating();
      if (ratingState) {
        setLiked(ratingState.rating);
        setComment(ratingState.comment);
        setFeedbackSubmitted(true);
      }
    });

    // QR Code Generation
    QRCode.toDataURL(JSON.stringify({
      studentId: 'PG-2026-042',
      name: 'Rahul Sharma',
      date: new Date().toISOString().split('T')[0],
      verified: true
    }), {
      color: {
        dark: '#22c55e', // Vibrant green
        light: '#0f172a'  // Dark background slate-900
      },
      width: 180,
      margin: 1
    })
    .then(url => setQrUrl(url))
    .catch(err => console.error(err));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('smartplate_user_role');
    localStorage.removeItem('smartplate_username');
    router.push('/');
  };

  const handleAttendanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedSimulated) return;
    saveStudentAttendance(attending);
    setAttendanceMarked(true);
    setMarkedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liked) return;
    saveMenuRating(liked, comment);
    setFeedbackSubmitted(true);
  };

  const handleEmergencySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addEmergencyRequest({
      studentName: 'Rahul Sharma',
      studentId: 'PG-2026-042',
      type: reqType,
      mealType: mealType,
      date: reqDate,
      reason: reason,
    });
    setEmergencySubmitted(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setEmergencySubmitted(false);
      setReason('');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#090d16] pb-12">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-950 border border-slate-800 rounded-xl">
              <ChefHat className="h-6 w-6 text-[#22c55e]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">SmartPlate AI</h1>
              <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Student Panel</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold text-white">Rahul Sharma</span>
              <span className="text-xs text-slate-400">Room B-204 | PG-2026-042</span>
            </div>
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

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        
        {/* Banner Alert for hackathon simulation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-amber-950/40 border border-amber-800/40 rounded-xl text-amber-400">
              <Clock className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">Attendance Lock-In Simulation</p>
              <p className="text-xs text-slate-400">Mess attendance auto-locks at 8:30 AM daily for food preparation planning.</p>
            </div>
          </div>
          <button
            onClick={() => setIsLockedSimulated(!isLockedSimulated)}
            className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all duration-300 ${
              isLockedSimulated 
                ? 'bg-amber-950/40 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/10' 
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-[#22c55e]'
            }`}
          >
            {isLockedSimulated ? '🔒 Locked (Simulating Past 8:30 AM)' : '🔓 Open (Simulating Before 8:30 AM)'}
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLUMN 1: Attendance Marking & QR Pass */}
          <div className="space-y-6">
            
            {/* Attendance Marking Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden transition-all duration-300 hover:border-slate-700">
              <div className="absolute top-0 right-0 p-4">
                <Calendar className="h-5 w-5 text-slate-500" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">Tomorrow&apos;s Attendance</h2>
              <p className="text-xs text-slate-400 mb-6">Let the mess staff know if you&apos;ll eat tomorrow to optimize raw food quantities.</p>

              <form onSubmit={handleAttendanceSubmit} className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                  <div>
                    <span className="text-sm font-semibold block text-white">Mess Meals Tomorrow</span>
                    <span className="text-[10px] text-slate-500">Includes Breakfast, Lunch & Dinner</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={attending}
                      disabled={isLockedSimulated}
                      onChange={(e) => setAttending(e.target.checked)}
                    />
                    <div className="w-14 h-7 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#22c55e] peer-checked:after:bg-slate-950 peer-checked:after:border-transparent"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Current Status:</span>
                  <span className={`font-bold px-2 py-0.5 rounded-full ${
                    attending 
                      ? 'bg-emerald-950/40 border border-emerald-800/40 text-[#22c55e]' 
                      : 'bg-red-950/40 border border-red-800/40 text-red-400'
                  }`}>
                    {attending ? '✅ Attending' : '❌ Opted Out'}
                  </span>
                </div>

                {isLockedSimulated ? (
                  <div className="flex items-center gap-2 p-3 bg-red-950/20 border border-red-900/30 rounded-xl text-red-400 text-xs">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Attendance is locked. You cannot modify your status for tomorrow.</span>
                  </div>
                ) : (
                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl text-xs font-semibold bg-[#22c55e] text-slate-950 hover:bg-[#16a34a] transition duration-200"
                  >
                    Submit Attendance Choice
                  </button>
                )}
              </form>

              {attendanceMarked && (
                <div className="mt-4 flex items-center gap-2 text-xs text-[#22c55e] bg-emerald-950/10 p-3 border border-emerald-900/30 rounded-xl">
                  <CheckCircle className="h-4 w-4" />
                  <span>Marked successfully at {markedTime || 'recently'}</span>
                </div>
              )}
            </div>

            {/* QR Pass Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center transition-all duration-300 hover:border-slate-700">
              <div className="w-full flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Lunch Pass QR</h2>
                <QrCode className="h-5 w-5 text-slate-500" />
              </div>
              <p className="text-xs text-slate-400 text-center mb-6">Scan this QR code at the mess counter to verify your lunch attendance and portion size.</p>
              
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl pulse-glow-border relative flex items-center justify-center">
                {qrUrl ? (
                  <img src={qrUrl} alt="Lunch Verification QR" className="w-[160px] h-[160px]" />
                ) : (
                  <div className="w-[160px] h-[160px] flex items-center justify-center text-xs text-slate-500">Generating QR...</div>
                )}
              </div>

              <div className="mt-5 text-center space-y-1">
                <p className="text-xs font-bold text-[#22c55e]">Status: Active Today</p>
                <p className="text-[10px] text-slate-500">Meal: Lunch | Verified: No</p>
              </div>
            </div>

          </div>

          {/* COLUMN 2: Today's Menu Rating & Emergency Requests */}
          <div className="space-y-6">
            
            {/* Today's Menu Rating Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 transition-all duration-300 hover:border-slate-700">
              <h2 className="text-lg font-bold text-white mb-2">Today&apos;s Menu Feedback</h2>
              <p className="text-xs text-slate-400 mb-6">Rate today&apos;s recipe. Mess staff will adapt spice and quantities based on ratings.</p>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl mb-6">
                <span className="text-[10px] text-[#22c55e] font-bold uppercase tracking-wider">Today&apos;s Special Meal</span>
                <p className="text-base font-bold text-white">Chicken Biryani / Paneer Biryani</p>
                <p className="text-xs text-slate-500 mt-1">Served at: 12:30 PM - 2:30 PM</p>
              </div>

              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <div className="flex gap-4">
                  <button
                    type="button"
                    disabled={feedbackSubmitted}
                    onClick={() => setLiked('up')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all duration-200 ${
                      liked === 'up' 
                        ? 'bg-emerald-950/40 border-[#22c55e] text-[#22c55e]' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    Good
                  </button>
                  <button
                    type="button"
                    disabled={feedbackSubmitted}
                    onClick={() => setLiked('down')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all duration-200 ${
                      liked === 'down' 
                        ? 'bg-red-950/40 border-red-500 text-red-400' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <ThumbsDown className="h-4 w-4" />
                    Average/Bad
                  </button>
                </div>

                <textarea
                  value={comment}
                  disabled={feedbackSubmitted}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share feedback on portion size, spices, or cooking..."
                  className="w-full p-3 h-24 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 placeholder-slate-600 focus:outline-none focus:border-[#22c55e] text-xs resize-none"
                />

                {!feedbackSubmitted ? (
                  <button
                    type="submit"
                    disabled={!liked}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold bg-[#22c55e] text-slate-950 hover:bg-[#16a34a] disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Submit Review
                  </button>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-xl text-[#22c55e] text-xs">
                    <CheckCircle className="h-4.5 w-4.5" />
                    <span>Feedback saved! AI will parse reviews for sentiment score.</span>
                  </div>
                )}
              </form>
            </div>

            {/* Emergency Request Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 transition-all duration-300 hover:border-slate-700">
              <h2 className="text-lg font-bold text-white mb-2">Emergency Change</h2>
              <p className="text-xs text-slate-400 mb-6">Need to cancel a meal at short notice or check in late? Log a request for admin approval.</p>

              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold bg-slate-950 border border-slate-800 hover:border-red-500/40 text-slate-300 hover:text-white transition duration-200"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                Submit Emergency Request
              </button>
            </div>

          </div>

          {/* COLUMN 3: Preview & Mess Insights */}
          <div className="space-y-6">
            
            {/* Tomorrow's Menu Preview */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 transition-all duration-300 hover:border-slate-700">
              <h2 className="text-lg font-bold text-white mb-2">Tomorrow&apos;s Preview</h2>
              <p className="text-xs text-slate-400 mb-4">A sneak peek of tomorrow&apos;s meals.</p>

              <div className="space-y-4">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Scheduled Dish</span>
                  <p className="text-sm font-bold text-white">Chole Bhature & Sweet Lassi</p>
                  <p className="text-[10px] text-slate-400 mt-1">Calorie estimate: ~680 kcal</p>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs text-[#22c55e] font-semibold">
                    <Sparkles className="h-4 w-4" />
                    <span>SmartPlate AI Insights</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Based on historical Saturday attendance data (average 32/55 students), the AI recommends preparing 35 portions of Chole Bhature to minimize waste.
                  </p>
                </div>
              </div>
            </div>

            {/* Impact Tracking Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 transition-all duration-300 hover:border-slate-700 relative overflow-hidden">
              <div className="absolute top-[-30%] right-[-10%] w-40 h-40 bg-[#22c55e]/5 rounded-full filter blur-2xl pointer-events-none" />
              
              <h2 className="text-lg font-bold text-white mb-2">Your Impact</h2>
              <p className="text-xs text-slate-400 mb-6">Your personal savings statistics this month.</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-2xl text-center">
                  <span className="text-2xl font-black text-[#22c55e] block">24 / 28</span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Meals Checked In</span>
                </div>
                <div className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-2xl text-center">
                  <span className="text-2xl font-black text-[#22c55e] block">2.8 kg</span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Food Waste Saved</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-slate-950/40 border border-slate-850 rounded-2xl flex items-center gap-3">
                <Award className="h-8 w-8 text-[#22c55e] shrink-0" />
                <div>
                  <p className="text-xs font-bold text-white">Green Plate Badge Level 2</p>
                  <p className="text-[10px] text-slate-500">You are in the top 15% of mess savers!</p>
                </div>
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* Emergency Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-500 hover:text-white bg-slate-950 border border-slate-800 hover:border-slate-700 transition"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">New Emergency Request</h3>
            <p className="text-xs text-slate-400 mb-6">File a short notice change. The Mess Admin will process this request shortly.</p>

            {emergencySubmitted ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-3">
                <div className="p-3 bg-emerald-950/40 border border-emerald-500 rounded-full text-[#22c55e]">
                  <CheckCircle className="h-8 w-8 animate-bounce" />
                </div>
                <p className="text-sm font-bold text-white">Request Submitted Successfully</p>
                <p className="text-xs text-slate-400">Syncing with Admin database...</p>
              </div>
            ) : (
              <form onSubmit={handleEmergencySubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Request Type</label>
                  <select
                    value={reqType}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setReqType(e.target.value as 'Cancel Meals' | 'Late Check-in' | 'Extra Portion')}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#22c55e]"
                  >
                    <option value="Cancel Meals">Cancel Meals (Opt-out)</option>
                    <option value="Late Check-in">Late Check-in (Keep portion warm)</option>
                    <option value="Extra Portion">Extra Portion Request</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Meal Type</label>
                    <select
                      value={mealType}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMealType(e.target.value as 'Breakfast' | 'Lunch' | 'Dinner')}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#22c55e]"
                    >
                      <option value="Breakfast">Breakfast</option>
                      <option value="Lunch">Lunch</option>
                      <option value="Dinner">Dinner</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Date</label>
                    <select
                      value={reqDate}
                      onChange={(e) => setReqDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#22c55e]"
                    >
                      <option value="Today">Today</option>
                      <option value="Tomorrow">Tomorrow</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Reason</label>
                  <textarea
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Provide a valid explanation (e.g. traveling, classes delayed)..."
                    className="w-full p-3 h-20 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-[#22c55e] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl text-xs font-semibold bg-[#22c55e] text-slate-950 hover:bg-[#16a34a] transition duration-200"
                >
                  Submit Emergency Request
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
