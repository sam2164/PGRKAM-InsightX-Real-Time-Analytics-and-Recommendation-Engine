import { Routes, Route } from "react-router-dom";

import Home from "./pages/home.jsx";
import Analytics from "./pages/analytics.jsx";
import Jobs from "./pages/jobs.jsx";
import Insights from "./pages/insights.jsx";
import Profile from "./pages/profile.jsx";
import Login from "./pages/login.jsx";
import Register from "./pages/Register.jsx";

import NavBar from "./components/ui/NavBar.jsx";
import ChatbotPanel from "./components/ui/ChatbotPanel.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900">
      {/* Top navigation */}
      <NavBar />

      {/* Page content */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>

      {/* Floating chatbot – only shows on home page */}
      <ChatbotPanel />
    </div>
  );
}