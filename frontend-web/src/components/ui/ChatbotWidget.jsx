// src/components/ChatbotWidget.jsx
import { useState } from "react";

const API_BASE_URL = "http://127.0.0.1:8000/api/insightx/";

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Hi! I’m the InsightX assistant. Ask me about jobs, skills, or what to learn next.",
    },
  ]);
  const [loading, setLoading] = useState(false);

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { from: "user", text: userText }]);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}chatbot/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, language: "en" }),
      });

      if (!res.ok) {
        throw new Error("Chatbot API error");
      }

      const data = await res.json();
      const reply = data.reply || "This is a demo reply from the InsightX chatbot.";
      setMessages((prev) => [...prev, { from: "bot", text: reply }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text:
            "I couldn’t reach the backend chatbot service right now, but the UI is working correctly.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chatbot-root">
      {open && (
        <div className="chatbot-panel">
          <header className="chatbot-header">
            <div>
              <p className="chatbot-title">InsightX assistant</p>
              <p className="chatbot-subtitle">Ask about jobs, skills, or learning paths.</p>
            </div>
            <button className="chatbot-close" onClick={() => setOpen(false)}>
              ×
            </button>
          </header>

          <div className="chatbot-messages">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={
                  m.from === "user" ? "chat-line chat-user" : "chat-line chat-bot"
                }
              >
                {m.text}
              </div>
            ))}
            {loading && <div className="chat-line chat-bot">Thinking…</div>}
          </div>

          <form className="chatbot-input-row" onSubmit={handleSend}>
            <input
              className="chatbot-input"
              placeholder="Type your question…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button className="chatbot-send" type="submit">
              Send
            </button>
          </form>
        </div>
      )}

      <button className="chatbot-fab" onClick={() => setOpen((v) => !v)}>
        💬
      </button>
    </div>
  );
}