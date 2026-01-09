// src/App.jsx
import React, { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  useLocation,
} from "react-router-dom";

import Home from "./pages/home.jsx";
import Analytics from "./pages/Analytics.jsx";
import Jobs from "./pages/jobs.jsx";
import Insights from "./pages/insights.jsx";
import Profile from "./pages/profile.jsx";
import Login from "./pages/login.jsx";
import Register from "./pages/register.jsx";
import NotFound from "./pages/NotFound.jsx";

import ChatbotPanel from "./components/ui/ChatbotPanel.jsx";
import CONFIG from "./config";

const API = CONFIG.API_BASE_URL; // e.g. http://127.0.0.1:8000/api/insightx
const USER_ID = 1;

// -------------------------------------
// GLOBAL TRACK FUNCTION
// -------------------------------------
function track(event_type, extra = {}) {
  try {
    const sessionId =
      localStorage.getItem("ix_session_id") || crypto.randomUUID();
    localStorage.setItem("ix_session_id", sessionId);

    fetch(`${API}/track-event/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: USER_ID,
        event_type,
        page: window.location.pathname,
        session_id: sessionId,
        meta: {},
        ...extra,
      }),
    }).catch(() => {});
  } catch (e) {
    console.error("Global track error:", e);
  }
}

// -------------------------------------
// PAGE VIEW + PAGE DURATION
// -------------------------------------
function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    const sessionId =
      localStorage.getItem("ix_session_id") || crypto.randomUUID();
    localStorage.setItem("ix_session_id", sessionId);

    const startTime = Date.now();

    // page_view
    track("page_view", { page: location.pathname });

    // when route changes / unmount -> send duration
    return () => {
      const durationSec = Math.floor((Date.now() - startTime) / 1000);
      track("page_duration", {
        page: location.pathname,
        meta: { duration_seconds: durationSec },
      });
    };
  }, [location.pathname]);
}

// -------------------------------------
// SCROLL DEPTH
// -------------------------------------
function useScrollDepthTracking() {
  const location = useLocation();

  useEffect(() => {
    let maxScroll = 0;

    function onScroll() {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;

      if (docHeight <= 0) return;

      const percent = Math.round((scrollTop / docHeight) * 100);
      if (percent > maxScroll) maxScroll = percent;
    }

    function sendScroll() {
      track("scroll_depth", {
        page: location.pathname,
        meta: { scroll_percent: maxScroll },
      });
    }

    window.addEventListener("scroll", onScroll);
    window.addEventListener("beforeunload", sendScroll);

    return () => {
      sendScroll();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("beforeunload", sendScroll);
    };
  }, [location.pathname]);
}

// -------------------------------------
// SESSION DURATION
// -------------------------------------
function useSessionDurationTracking() {
  useEffect(() => {
    const sessionId =
      localStorage.getItem("ix_session_id") || crypto.randomUUID();
    localStorage.setItem("ix_session_id", sessionId);

    const startTime = Date.now();

    function sendDuration() {
      const durationSec = Math.floor((Date.now() - startTime) / 1000);

      track("session_duration", {
        meta: { duration_seconds: durationSec },
      });
    }

    window.addEventListener("beforeunload", sendDuration);

    return () => {
      window.removeEventListener("beforeunload", sendDuration);
    };
  }, []);
}

// -------------------------------------
// MAIN LAYOUT (ONLY ONE)
// -------------------------------------
function Layout() {
  const location = useLocation();

  usePageTracking();
  useScrollDepthTracking();
  useSessionDurationTracking();

  const [chatOpen, setChatOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    [
      "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
      "hover:bg-slate-800/70 hover:text-slate-50",
      isActive ? "bg-cyan-500/20 text-cyan-300" : "text-slate-300",
    ].join(" ");

  const onHome = location.pathname === "/";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50 flex flex-col">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/20">
              <span className="text-lg font-bold text-cyan-400">IX</span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-[0.25em] text-slate-400 uppercase">
                InsightX
              </div>
              <p className="text-xs text-slate-500">
                AI job &amp; skills assistant
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <NavLink to="/" className={linkClass} end>
              Dashboard
            </NavLink>
            <NavLink to="/analytics" className={linkClass}>
              Analytics
            </NavLink>
            <NavLink to="/jobs" className={linkClass}>
              Jobs
            </NavLink>
            <NavLink to="/insights" className={linkClass}>
              Insights
            </NavLink>
            <NavLink to="/profile" className={linkClass}>
              Profile
            </NavLink>
          </nav>

          <div className="flex items-center gap-3">
            <NavLink
              to="/login"
              className="rounded-full border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-cyan-400 hover:text-cyan-300"
            >
              Login
            </NavLink>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>

      {/* Chatbot only on home */}
      {onHome && (
        <>
          {!chatOpen && (
            <button
              onClick={() => setChatOpen(true)}
              className="fixed bottom-5 right-5 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500 shadow-lg hover:scale-105 transition"
            >
              💬
            </button>
          )}

          {chatOpen && (
            <div className="fixed inset-0 z-40 flex items-end justify-end bg-black/40 p-6">
              <div className="relative w-full max-w-md rounded-2xl bg-slate-900 p-4 border border-slate-700 shadow-xl">
                <button
                  onClick={() => setChatOpen(false)}
                  className="absolute top-3 right-3 text-xs bg-slate-800 px-2 py-1 rounded"
                >
                  ✕
                </button>
                <ChatbotPanel />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// -------------------------------------
// APP ROOT
// -------------------------------------
export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}