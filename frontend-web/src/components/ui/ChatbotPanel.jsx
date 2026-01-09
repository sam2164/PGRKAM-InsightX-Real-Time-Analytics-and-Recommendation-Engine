// src/components/ui/ChatbotPanel.jsx
import React, { useState } from "react";
import CONFIG from "../../config";

const API = CONFIG.API_BASE_URL;

export default function ChatbotPanel() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;
    setLoading(true);
    setReply("");

    try {
      const res = await fetch(`${API}/chatbot/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, language: "en" }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setReply(data.reply || "No reply.");
    } catch (e) {
      console.error(e);
      setReply("Error talking to chatbot.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-80 rounded-2xl border border-slate-800 bg-slate-950/90 p-4 shadow-xl">
      <p className="text-xs font-semibold tracking-[0.25em] text-slate-400 uppercase">
        Assistant
      </p>
      <p className="mt-1 text-sm text-slate-200">Ask InsightX anything.</p>

      <div className="mt-3 space-y-2 text-xs text-slate-300">
        {reply ? (
          <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-2">
            {reply}
          </div>
        ) : (
          <p className="text-slate-500 text-xs">
            Try: &quot;Summarize my top skill gaps.&quot;
          </p>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          className="flex-1 rounded-lg border border-slate-700 bg-slate-900/80 px-2 py-1 text-xs text-slate-100 outline-none"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a question…"
        />
        <button
          className="rounded-lg bg-cyan-500 px-3 py-1 text-xs font-semibold text-slate-950 disabled:opacity-60"
          onClick={sendMessage}
          disabled={loading}
        >
          {loading ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}