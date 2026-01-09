import API_BASE_URL from "../config";

export async function getRecommendations(userId, topN = 5) {
  const response = await fetch(
    `${API_BASE_URL}recommend/jobs/?user_id=${userId}&top_n=${topN}`
  );
  return await response.json();
}