import API_BASE_URL from "../config";

export async function getSkillGap(jobId, userSkills) {
  const response = await fetch(`${API_BASE_URL}skill-gap/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      job_id: jobId,
      user_skills: userSkills
    })
  });

  return await response.json();
}