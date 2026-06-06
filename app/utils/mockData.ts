// Type Definitions for SmartPlate AI

export interface EmergencyRequest {
  id: string;
  studentName: string;
  studentId: string;
  type: 'Cancel Meals' | 'Late Check-in' | 'Extra Portion';
  mealType: 'Breakfast' | 'Lunch' | 'Dinner';
  date: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Denied';
  timestamp: string;
}

export interface MenuRating {
  rating: 'up' | 'down';
  comment: string;
  timestamp: string;
}

export interface AttendanceState {
  attendingTomorrow: boolean;
  markedAt?: string;
}

// 7-day attendance trend
export const historicalAttendance = [
  { day: 'Mon', total: 55, attending: 48, wastedKg: 8.5 },
  { day: 'Tue', total: 55, attending: 51, wastedKg: 6.2 },
  { day: 'Wed', total: 55, attending: 44, wastedKg: 11.4 },
  { day: 'Thu', total: 55, attending: 49, wastedKg: 7.8 },
  { day: 'Fri', total: 55, attending: 53, wastedKg: 4.1 },
  { day: 'Sat', total: 55, attending: 32, wastedKg: 14.5 },
  { day: 'Sun', total: 55, attending: 28, wastedKg: 16.0 },
];

// Monthly savings trend (in INR)
export const monthlySavings = [
  { month: 'Jan', wasteSavedKg: 120, moneySavedINR: 6200 },
  { month: 'Feb', wasteSavedKg: 155, moneySavedINR: 8100 },
  { month: 'Mar', wasteSavedKg: 210, moneySavedINR: 11200 },
  { month: 'Apr', wasteSavedKg: 280, moneySavedINR: 15400 },
  { month: 'May', wasteSavedKg: 340, moneySavedINR: 18900 },
];

export const weeklyMenu = {
  Monday: 'Paneer Butter Masala & Roti',
  Tuesday: 'Dal Makhani & Basmati Rice',
  Wednesday: 'Aloo Gobi & Laccha Paratha',
  Thursday: 'Mixed Vegetable Curry & Steamed Rice',
  Friday: 'Chicken Biryani / Paneer Biryani',
  Saturday: 'Chole Bhature & Lassi',
  Sunday: 'Pav Bhaji & Kheer',
};

// Keys for localStorage
const EMERGENCY_REQ_KEY = 'smartplate_emergency_requests';
const ATTENDANCE_KEY = 'smartplate_attendance';
const RATINGS_KEY = 'smartplate_ratings';

const defaultEmergencyRequests: EmergencyRequest[] = [
  {
    id: 'req-1',
    studentName: 'Rahul Sharma',
    studentId: 'PG-2026-042',
    type: 'Cancel Meals',
    mealType: 'Lunch',
    date: 'Tomorrow',
    reason: 'Going home for the weekend',
    status: 'Pending',
    timestamp: '2026-06-06T09:30:00Z',
  },
  {
    id: 'req-2',
    studentName: 'Anjali Gupta',
    studentId: 'PG-2026-015',
    type: 'Late Check-in',
    mealType: 'Dinner',
    date: 'Tomorrow',
    reason: 'Lab experiment runs late until 9 PM',
    status: 'Approved',
    timestamp: '2026-06-06T08:15:00Z',
  },
  {
    id: 'req-3',
    studentName: 'Vikram Singh',
    studentId: 'PG-2026-033',
    type: 'Extra Portion',
    mealType: 'Lunch',
    date: 'Today',
    reason: 'Group study session in my room',
    status: 'Denied',
    timestamp: '2026-06-06T07:45:00Z',
  },
];

// Helper functions (client-side safe)
export function getEmergencyRequests(): EmergencyRequest[] {
  if (typeof window === 'undefined') return defaultEmergencyRequests;
  const data = localStorage.getItem(EMERGENCY_REQ_KEY);
  if (!data) {
    localStorage.setItem(EMERGENCY_REQ_KEY, JSON.stringify(defaultEmergencyRequests));
    return defaultEmergencyRequests;
  }
  return JSON.parse(data);
}

export function saveEmergencyRequests(requests: EmergencyRequest[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(EMERGENCY_REQ_KEY, JSON.stringify(requests));
}

export function addEmergencyRequest(req: Omit<EmergencyRequest, 'id' | 'status' | 'timestamp'>): EmergencyRequest {
  const requests = getEmergencyRequests();
  const newReq: EmergencyRequest = {
    ...req,
    id: `req-${Date.now()}`,
    status: 'Pending',
    timestamp: new Date().toISOString(),
  };
  requests.unshift(newReq);
  saveEmergencyRequests(requests);
  return newReq;
}

export function updateRequestStatus(id: string, status: 'Approved' | 'Denied'): EmergencyRequest[] {
  const requests = getEmergencyRequests();
  const updated = requests.map(r => r.id === id ? { ...r, status } : r);
  saveEmergencyRequests(updated);
  return updated;
}

export function getStudentAttendance(): AttendanceState {
  const defaultState: AttendanceState = { attendingTomorrow: true };
  if (typeof window === 'undefined') return defaultState;
  const data = localStorage.getItem(ATTENDANCE_KEY);
  return data ? JSON.parse(data) : defaultState;
}

export function saveStudentAttendance(attendingTomorrow: boolean): void {
  if (typeof window === 'undefined') return;
  const state: AttendanceState = {
    attendingTomorrow,
    markedAt: new Date().toISOString(),
  };
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(state));
}

export function getMenuRating(): MenuRating | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(RATINGS_KEY);
  return data ? JSON.parse(data) : null;
}

export function saveMenuRating(rating: 'up' | 'down', comment: string): void {
  if (typeof window === 'undefined') return;
  const data: MenuRating = {
    rating,
    comment,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem(RATINGS_KEY, JSON.stringify(data));
}
