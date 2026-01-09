// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import CONFIG from "../config";

const API = CONFIG.API_BASE_URL; // e.g. "http://127.0.0.1:8000/api/insightx"
const USER_ID = 1;

const parseSkills = (raw) =>
  (raw || "")
    .split(/[,\n]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

export default function Home() {
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState("");

  const [recs, setRecs] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [recsError, setRecsError] = useState("");

  const [selectedJob, setSelectedJob] = useState(null);
  const [gap, setGap] = useState(null);
  const [gapLoading, setGapLoading] = useState(false);

  // success / failure rates from analytics_overview
  const [successRate, setSuccessRate] = useState(0);
  const [failureRate, setFailureRate] = useState(0);
  const [rateError, setRateError] = useState("");

  // roadmap state
  const [roadmapSteps, setRoadmapSteps] = useState([]);
  const [showRoadmap, setShowRoadmap] = useState(false);

  // form state – user enters their skills here
  const [skillsInput, setSkillsInput] = useState(
    "excel, communication, ms office, punjabi"
  );

  // ---------- Capture acquisition channel from URL (FIRST TOUCH) ----------
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const channel = params.get("channel"); // e.g. ?channel=Instagram

      if (channel) {
        fetch(`${API}/capture-source-channel/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: USER_ID, channel }),
        }).catch((err) =>
          console.error("Channel capture error (frontend):", err)
        );
      }
    } catch (e) {
      console.error("Channel capture useEffect error:", e);
    }
  }, []);

  // ---------- helper: send events to backend ----------
  const trackJobEvent = (job, eventType) => {
    if (!job || !job.job_id) return;

    fetch(`${API}/track-event/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: USER_ID,
        event_type: eventType, // "job_view" or "job_apply"
        job_id: job.job_id,
        page: window.location.pathname,
        session_id: crypto.randomUUID(),
      }),
    }).catch((err) => console.error("track-event failed:", err));
  };

  // ---------- Load dashboard stats (from /user/stats/) ----------
  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch(`${API}/user/stats/?user_id=${USER_ID}`);
        const text = await res.text();

        if (!res.ok) {
          console.error("Stats HTTP error:", res.status, text);
          throw new Error(`HTTP ${res.status}`);
        }

        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error("Stats JSON parse error:", e, "raw:", text);
          throw new Error("Invalid JSON from backend for stats");
        }

        setStats(data);
        setStatsError("");
      } catch (e) {
        console.error("Stats error", e);
        setStatsError("Could not load stats.");
      }
    }
    loadStats();
  }, []);

  // ---------- Load success / failure rate from analytics_overview ----------
  useEffect(() => {
    async function loadRates() {
      try {
        const res = await fetch(
          `${API}/analytics/overview/?user_id=${USER_ID}`
        );
        const text = await res.text();
        if (!res.ok) {
          console.error("Analytics overview HTTP error:", res.status, text);
          setRateError("Could not load success/failure rates.");
          return;
        }
        let json;
        try {
          json = JSON.parse(text);
        } catch (e) {
          console.error("Analytics overview JSON parse error:", e, "raw:", text);
          setRateError("Bad analytics data.");
          return;
        }
        setSuccessRate(json.success_rate || 0);
        setFailureRate(json.failure_rate || 0);
        setRateError("");
      } catch (e) {
        console.error("Analytics overview fetch error:", e);
        setRateError("Could not load success/failure rates.");
      }
    }
    loadRates();
  }, []);

  // ---------- Skill gap analyzer ----------
  const runSkillGap = async (job, overrideSkills) => {
    if (!job) return;
    setSelectedJob(job);
    setGapLoading(true);
    setGap(null);
    setShowRoadmap(false);
    setRoadmapSteps([]);

    const skills = overrideSkills || parseSkills(skillsInput);

    try {
      const res = await fetch(`${API}/skill-gap/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: job.job_id,
          user_skills: skills,
        }),
      });

      const text = await res.text();

      if (!res.ok) {
        console.error("Skill gap HTTP error:", res.status, text);
        throw new Error(`HTTP ${res.status}`);
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Skill gap JSON parse error:", e, "raw:", text);
        throw new Error("Invalid JSON from backend for skill gap");
      }

      setGap(data);
    } catch (e) {
      console.error("Skill gap error", e);
    } finally {
      setGapLoading(false);
    }
  };

  // ---------- Load recommendations on button click ----------
  const handleGetRecommendations = async (e) => {
    e.preventDefault();

    const parsedSkills = parseSkills(skillsInput);
    setLoadingRecs(true);
    setRecs([]);
    setSelectedJob(null);
    setGap(null);
    setShowRoadmap(false);
    setRoadmapSteps([]);
    setRecsError("");

    try {
      const skillsParam = encodeURIComponent(parsedSkills.join(","));

      const res = await fetch(
        `${API}/recommend/jobs/?skills=${skillsParam}&top_n=5`
      );
      const text = await res.text();

      if (!res.ok) {
        console.error("Recs HTTP error:", res.status, text);
        throw new Error(`HTTP ${res.status}`);
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Recs JSON parse error:", e, "raw:", text);
        throw new Error("Invalid JSON from backend for recs");
      }

      const results = data.results || [];
      setRecs(results);
      setLoadingRecs(false);

      // run skill-gap for the first recommended job using the skills from the form
      if (results.length > 0) {
        runSkillGap(results[0], parsedSkills);
      }
    } catch (err) {
      console.error("Rec error", err);
      setRecsError("Could not load recommendations.");
      setLoadingRecs(false);
    }
  };

  // ---------- Build roadmap from gap ----------
  const buildRoadmapFromGap = (gapData, job) => {
    if (!gapData) return [];

    const missing = gapData.missing_skills || [];
    const matched = gapData.matched_skills || [];

    const steps = [];
    let week = 1;

    if (missing.length === 0 && matched.length === 0) {
      return [
        "You already match all listed skills. Use this time to apply and practice interview preparation.",
      ];
    }

    if (missing.length > 0) {
      const coreMissing = missing.slice(0, 3);
      steps.push(
        `Week ${week}: Get basics of ${coreMissing.join(
          ", "
        )}. Watch 2–3 short tutorials for each skill and write 1–2 pages of notes.`
      );
      steps.push(
        `Week ${week}: Practice ${coreMissing.join(
          ", "
        )} with small tasks: e.g. mini projects, exercises, or mock scenarios relevant to "${
          job?.title || "this role"
        }".`
      );
      week++;
    }

    if (missing.length > 3) {
      const extraMissing = missing.slice(3);
      steps.push(
        `Week ${week}: Add secondary skills: ${extraMissing.join(
          ", "
        )}. Spend at least 1 hour per day doing hands-on practice.`
      );
    }

    if (matched.length > 0) {
      steps.push(
        `Week ${week}: Keep your strong skills fresh: ${matched.join(
          ", "
        )}. Do 1–2 real-world tasks (or sample projects) that show these strengths on your resume.`
      );
    }

    steps.push(
      `End of Week ${week}: Update your resume and PGRKAM profile to highlight new skills and projects, then re-run the skill gap check for "${
        job?.title || "this role"
      }".`
    );

    return steps;
  };

  // ---------- Handle "View training roadmap" ----------
  const handleViewRoadmap = () => {
    if (!gap || !selectedJob) return;
    const steps = buildRoadmapFromGap(gap, selectedJob);
    setRoadmapSteps(steps);
    setShowRoadmap(true);
  };

  // ---------- Rotate to next job ----------
  const handleChangeRole = () => {
    if (!recs.length) return;
    const idx = recs.findIndex((j) => j.job_id === selectedJob?.job_id);
    const next = recs[(idx + 1) % recs.length];
    const skills = parseSkills(skillsInput);
    runSkillGap(next, skills);
  };

  // ---------- Preset skills helper ----------
  const handlePresetSkills = (preset) => {
    setSkillsInput(preset);
  };

  const matchRatioDisplay =
    gap && typeof gap.match_ratio === "number"
      ? `${Math.round(gap.match_ratio)}%`
      : selectedJob
      ? "Calculating…"
      : "—";

  const progressWidth =
    gap && typeof gap.match_ratio === "number"
      ? `${Math.min(Math.max(gap.match_ratio, 0), 100)}%`
      : "0%";

  const totalMatched = stats?.matched_jobs ?? 0;
  const totalApps = stats?.applications ?? 0;

  return (
    <div className="space-y-8">
      {/* HERO / TITLE ROW */}
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.25em] text-cyan-400 uppercase">
            InsightX · Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-50 md:text-4xl">
            Plan your next move with InsightX.
          </h1>
          <p className="mt-3 max-w-xl text-sm text-slate-400">
            Enter your skills, get AI job recommendations, then analyze your
            skill gaps and training roadmap across the PGRKAM ecosystem.
          </p>

          {/* small advanced-looking step strip */}
          <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-slate-300">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/70 px-3 py-1 border border-slate-700/80">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              1 · Describe your skills
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/70 px-3 py-1 border border-slate-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              2 · Review AI matches
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/70 px-3 py-1 border border-slate-800">
              <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400" />
              3 · Close skill gaps
            </span>
          </div>
        </div>

        {/* subtle "session snapshot" on right, not big cards */}
        <div className="mt-1 flex flex-col items-start md:items-end gap-1 text-[11px] text-slate-300">
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Live session · AI recommender ready
          </span>
          <span className="text-slate-400">
            Matched jobs:{" "}
            <span className="font-semibold text-slate-100">
              {totalMatched}
            </span>{" "}
            · Applications:{" "}
            <span className="font-semibold text-slate-100">{totalApps}</span>
          </span>
          <span className="text-slate-400">
            Outcome so far:{" "}
            <span className="text-emerald-300">
              {successRate.toFixed(1)}% success
            </span>{" "}
            ·{" "}
            <span className="text-rose-300">
              {failureRate.toFixed(1)}% failure
            </span>
          </span>
        </div>
      </section>

      {/* MAIN GRID: left (form + recs) / right (gap analyzer) */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* LEFT: Form + AI recommendations */}
        <div className="lg:col-span-2 space-y-4">
          {/* FORM + INLINE STATS */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-fuchsia-500/10" />
            <div className="relative space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold tracking-[0.25em] text-slate-300 uppercase">
                    Describe your skills
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    The more specific you are, the better the match. Include
                    tools, domains and languages (for example:{" "}
                    <span className="text-slate-200">
                      excel, tally, communication, customer support
                    </span>
                    ).
                  </p>
                </div>

                {/* compact status */}
                <div className="hidden sm:flex flex-col items-end gap-1 text-[10px] text-slate-300">
                  {statsError || rateError ? (
                    <span className="text-rose-300">
                      {statsError || rateError}
                    </span>
                  ) : (
                    <>
                      <span>
                        Matched jobs:{" "}
                        <span className="font-semibold text-slate-100">
                          {totalMatched}
                        </span>
                      </span>
                      <span>
                        Success:{" "}
                        <span className="text-emerald-300">
                          {successRate.toFixed(1)}%
                        </span>{" "}
                        · Failure:{" "}
                        <span className="text-rose-300">
                          {failureRate.toFixed(1)}%
                        </span>
                      </span>
                    </>
                  )}
                </div>
              </div>

              <form className="space-y-3" onSubmit={handleGetRecommendations}>
                <textarea
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-2 text-xs text-slate-100 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/60"
                  rows={3}
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  placeholder="e.g. excel, python, data analysis, communication"
                />

                {/* Preset skill chips */}
                <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
                  <span className="text-slate-500 mr-1">Quick presets:</span>
                  <button
                    type="button"
                    onClick={() =>
                      handlePresetSkills(
                        "excel, ms office, communication, data entry"
                      )
                    }
                    className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 hover:border-cyan-400 hover:text-cyan-300"
                  >
                    Office + admin
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handlePresetSkills(
                        "python, data analysis, excel, sql, visualization"
                      )
                    }
                    className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 hover:border-cyan-400 hover:text-cyan-300"
                  >
                    Data / analytics
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handlePresetSkills(
                        "customer service, communication, problem solving, crm"
                      )
                    }
                    className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 hover:border-cyan-400 hover:text-cyan-300"
                  >
                    Support roles
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-full bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
                    disabled={loadingRecs}
                  >
                    {loadingRecs
                      ? "Getting recommendations…"
                      : "Get recommendations"}
                  </button>
                  <p className="text-[11px] text-slate-500">
                    InsightX uses only skill text and job data – no sensitive
                    personal details.
                  </p>
                </div>
              </form>
            </div>
          </div>

          {/* RECOMMENDATIONS LIST */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-[0.25em] text-slate-400 uppercase">
                AI recommendations
              </h2>
              <span className="rounded-full bg-slate-900/80 px-2 py-1 text-[11px] text-slate-400 border border-slate-800">
                Powered by /recommend/jobs
              </span>
            </div>

            {loadingRecs && (
              <p className="text-xs text-slate-400">
                Loading personalized recommendations…
              </p>
            )}

            {recsError && !loadingRecs && (
              <p className="text-xs text-rose-400">{recsError}</p>
            )}

            {!loadingRecs && !recsError && recs.length === 0 && (
              <JobRecCard
                rank={0}
                title="No recommendations yet"
                location="Fill the form above and click Get recommendations"
                match="—"
                tags={["Waiting for input", "Engine is ready"]}
              />
            )}

            {!loadingRecs &&
              !recsError &&
              recs.slice(0, 3).map((job, idx) => (
                <JobRecCard
                  key={job.job_id}
                  rank={idx + 1}
                  job={job}
                  title={job.title}
                  location={job.location || "Punjab, IN"}
                  match={`${Math.round((job.score || 0) * 100)}%`}
                  accent={
                    idx === 0
                      ? "from-pink-500 to-fuchsia-500"
                      : idx === 1
                      ? "from-cyan-400 to-sky-500"
                      : "from-violet-400 to-emerald-500"
                  }
                  tags={[
                    "Based on your skills",
                    job.company || "Employer",
                    ...(job.recommended_skills || []).slice(0, 2),
                  ]}
                  onAnalyze={(job) => {
                    trackJobEvent(job, "job_view");
                    const skills = parseSkills(skillsInput);
                    runSkillGap(job, skills);
                  }}
                />
              ))}
          </div>
        </div>

        {/* RIGHT: Skill gap analyzer + roadmap */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold tracking-[0.25em] text-slate-400 uppercase">
            Skill gap analyzer
          </h2>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-[0.18em]">
                  Match ratio
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-50">
                  {matchRatioDisplay}
                </p>
                {selectedJob && (
                  <p className="mt-1 text-[11px] text-slate-500">
                    Role:{" "}
                    <span className="font-semibold text-slate-300">
                      {selectedJob.title}
                    </span>
                  </p>
                )}
              </div>
              <button
                className="rounded-full bg-slate-800 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-700 disabled:opacity-50"
                onClick={handleChangeRole}
                disabled={!recs.length}
              >
                Change role
              </button>
            </div>

            {/* progress bar + legend */}
            <div className="space-y-2">
              <div className="h-2 w-full rounded-full bg-slate-800">
                <div
                  className="h-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.7)]"
                  style={{ width: progressWidth }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0%</span>
                <span>Better match →</span>
              </div>
            </div>

            <ul className="space-y-2 text-xs">
              {gapLoading && (
                <SkillItem>Analyzing skills for this role…</SkillItem>
              )}

              {!gapLoading && gap?.matched_skills?.length > 0 && (
                <SkillItem ok>
                  Strong skills: {gap.matched_skills.join(", ")}
                </SkillItem>
              )}

              {!gapLoading && gap?.missing_skills?.length > 0 && (
                <SkillItem>
                  Missing skills: {gap.missing_skills.join(", ")}
                </SkillItem>
              )}

              {!gapLoading &&
                gap &&
                (!gap.matched_skills?.length &&
                  !gap.missing_skills?.length) && (
                  <SkillItem ok>
                    You already match all listed skills for this job.
                  </SkillItem>
                )}
            </ul>

            <button
              className="mt-2 w-full rounded-full bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
              onClick={handleViewRoadmap}
              disabled={!gap || !selectedJob}
            >
              View training roadmap
            </button>
          </div>

          {/* Roadmap panel */}
          {showRoadmap && roadmapSteps.length > 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">
                    2-week roadmap
                  </p>
                  {selectedJob && (
                    <p className="mt-1 text-[11px] text-slate-500">
                      Target role:{" "}
                      <span className="font-semibold text-slate-200">
                        {selectedJob.title}
                      </span>
                    </p>
                  )}
                </div>
                <button
                  className="text-[11px] text-slate-400 hover:text-slate-100"
                  onClick={() => setShowRoadmap(false)}
                >
                  ✕
                </button>
              </div>
              <ol className="mt-1 list-decimal space-y-1 pl-4 text-xs text-slate-200">
                {roadmapSteps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

/* ---------- small presentational components ---------- */

function JobRecCard({
  rank,
  title,
  location,
  match,
  accent = "from-pink-500 to-fuchsia-500",
  tags,
  job,
  onAnalyze,
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${accent} opacity-10`}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            {rank ? (
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900/90 text-[11px] font-semibold text-slate-200 border border-slate-700">
                {rank}
              </span>
            ) : null}
            <p className="text-sm font-semibold text-slate-50">{title}</p>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">{location}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags?.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-900/80 px-2 py-0.5 text-[11px] text-slate-300 border border-slate-800"
              >
                {tag}
              </span>
            ))}
          </div>
          {onAnalyze && (
            <button
              className="mt-4 rounded-full bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-slate-100 border border-slate-700 hover:border-cyan-400 hover:text-cyan-300"
              onClick={() => onAnalyze(job)}
            >
              Analyze skill gaps
            </button>
          )}
        </div>
        <div className="flex flex-col items-end">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            Match score
          </p>
          <p className="mt-1 text-xl font-bold text-emerald-400">{match}</p>
        </div>
      </div>
    </div>
  );
}

function SkillItem({ children, ok }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-[2px] text-xs">{ok ? "" : ""}</span>
      <span className="text-slate-300">{children}</span>
    </li>
  );
}