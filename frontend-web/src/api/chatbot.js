// src/api/chatbot.js
import API_BASE_URL from "../config";

export async function sendChatMessage(message, language = "en") {
  const response = await fetch(`${API_BASE_URL}chatbot/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, language }),
  });

  return await response.json();
}