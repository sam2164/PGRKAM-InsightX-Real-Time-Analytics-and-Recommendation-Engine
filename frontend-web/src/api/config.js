// src/config.js

// 🔹 Base URL for your Django backend
export const API_BASE_URL = "http://127.0.0.1:8000/api/insightx";

// (Optional) default export if some files use `import CONFIG from "../config"`
const CONFIG = {
  API_BASE_URL,
};

export default CONFIG;