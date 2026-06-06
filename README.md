# SmartPlate AI 🍽️✨
**Predict. Vote. Save. AI that stops PG food wastage.**

In a college PG where students live together, lunch is packed and sent to college daily assuming full attendance. However, many students skip college, leading to massive food wastage at the college counter. Students staying back in the PG cannot eat others' allocated food, and fixed menus (like repetitive Chicken Biryani) are often disliked, causing even more waste. 

SmartPlate AI is an intelligent food waste reduction system that solves this by combining attendance intent, menu voting, and Google Gemini AI predictions to cook exactly what is needed.

---

## 🛑 The Core Problem
- **Blind Cooking:** PG owners cook based on total headcount (e.g., 55 students), not actual college attendance.
- **Wasted Money & Food:** If 10 students skip college, 10 meals are wasted at ₹50/meal = ₹500 daily loss.
- **Menu Fatigue:** Fixed menus result in high waste when students dislike the food but have no way to request a change.

## 💡 The SmartPlate AI Solution
1. **Attendance Locking:** Students mark if they are going to college tomorrow. The system auto-locks at 8:30 AM.
2. **Menu Voting:** Students upvote/downvote the menu, providing real-time sentiment analysis.
3. **QR Verification:** Students who are "Going" receive a QR code. This prevents duplicate meals and tracks exact consumption.
4. **Gemini AI Predictive Engine:** The Admin dashboard uses Google Gemini to analyze attendance and sentiment, predicting the exact number of portions to cook and suggesting menu alternatives to minimize waste.

## 🚀 Hackathon Pitch (Key Differentiators)
- **Immediate ROI:** PG owners can see exact ₹ saved and kg of food waste avoided in real-time.
- **AI What-If Simulator:** Admins can ask the AI "What if it rains tomorrow?" to instantly adjust portion sizing based on external factors.
- **Frictionless UX:** Gorgeous dark mode, one-click voting, and instant QR generation.

## 🛠 Architecture & Tech Stack
- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS v4 (Deep Dark Theme + #22c55e Accent)
- **Animations:** Framer Motion
- **Charts:** Chart.js + `react-chartjs-2`
- **QR Generation:** `qrcode` library
- **AI Engine:** Google Gemini (`@google/generative-ai`)
- **State Management:** LocalStorage (for MVP speed and reliability)

### Architecture Diagram Flow
1. **Student** -> Submits Attendance & Vote (Stored in LocalState) -> Generates QR Code.
2. **Admin** -> Views Dashboard (Reads LocalState + Mock Data) -> Triggers AI Prediction.
3. **Gemini API** -> Analyzes (Attendance + Sentiment + What-If Queries) -> Returns JSON.
4. **Admin Dashboard** -> Displays Optimal Portions, Suggested Menus, and Waste Savings.

## ⚙️ How to Run Locally

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env.local` file at the root:
   ```env
   # Optional: For AI predictions. If omitted, a deterministic mock fallback is used.
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. **Run the Application**
   ```bash
   npm run dev
   ```

4. **Access the App**
   Open [http://localhost:3000](http://localhost:3000)

## 🔑 Demo Credentials

- **Student:** `student` / `student123`
- **Admin:** `admin` / `admin123`
