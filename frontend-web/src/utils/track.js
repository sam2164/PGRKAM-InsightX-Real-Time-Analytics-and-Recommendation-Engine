// src/utils/track.js
import CONFIG from "../config";
const API = CONFIG.API_BASE_URL;

export async function track(event_type, payload = {}) {
  try {
    await fetch(`${API}/track/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type,
        user_id: 1,
        ...payload,
      }),
    });
  } catch (e) {
    console.error("Track error:", e);
  }
}