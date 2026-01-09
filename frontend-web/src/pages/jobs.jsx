// src/pages/Jobs.jsx
import React, { useEffect, useMemo, useState } from "react";
import CONFIG from "../config";

const API = CONFIG.API_BASE_URL;
const USER_ID = 1;

function getJobId(job) {
  return job?.job_id ?? job?.id;
}

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [jobsError, setJobsError] = useState("");

  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [sortKey, setSortKey] = useState("default");

  const [expandedJobId, setExpandedJobId] = useState(null);

  const [userSkillsText, setUserSkillsText] = useState(
    "excel, communication, ms office, punjabi"
  );
  const [gapLoading, setGapLoading] = useState(false);
  const [gapError, setGapError] = useState("");
  const [gapResult, setGapResult] = useState(null);
  const [gapJobId, setGapJobId] = useState(null);

  const [patterns, setPatterns] = useState(null);
  const [patternsError, setPatternsError] = useState("");

  const [applyJob, setApplyJob] = useState(null);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [applyError, setApplyError] = useState("");

  const trackEvent = (job, eventType) => {
    const jobId = getJobId(job);
    if (!jobId) return;

    fetch(`${API}/track-event/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: USER_ID,
        event_type: eventType,
        job_id: jobId,
        page: "/jobs",
        session_id:
          (window.crypto?.randomUUID?.()) || `session-${Date.now()}`,
      }),
    }).catch((err) => console.error("track-event failed:", err));
  };

  const parseSkillsFromText = (text) =>
    text
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

  useEffect(() => {
    async function loadJobs() {
      setLoadingJobs(true);
      setJobsError("");

      try {
        const res = await fetch(`${API}/jobs/list/`);
        const raw = await res.text();

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        let json = JSON.parse(raw);
        setJobs(json.jobs || []);
      } catch (e) {
        console.error("Jobs error:", e);
        setJobsError("Could not load jobs.");
      } finally {
        setLoadingJobs(false);
      }
    }

    loadJobs();
  }, []);

  const fetchOutcomePatterns = async () => {
    try {
      const res = await fetch(
        `${API}/analytics/outcome-patterns/?user_id=${USER_ID}`
      );
      const raw = await res.text();

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      let data = JSON.parse(raw);
      setPatterns(data);
      setPatternsError("");
    } catch (e) {
      console.error("Outcome patterns error:", e);
      setPatternsError("No success / failure history yet.");
    }
  };

  useEffect(() => {
    fetchOutcomePatterns();
  }, []);

  const runSkillGap = async (job) => {
    if (!job) return;

    const jobId = getJobId(job);
    if (!jobId) return;

    setGapJobId(jobId);
    setGapLoading(true);
    setGapError("");
    setGapResult(null);

    const userSkills = parseSkillsFromText(userSkillsText);

    try {
      const res = await fetch(`${API}/skill-gap/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: jobId,
          user_skills: userSkills,
        }),
      });

      const raw = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setGapResult(JSON.parse(raw));
    } catch (e) {
      console.error("Skill gap error:", e);
      setGapError("Could not analyze skills for this job.");
    } finally {
      setGapLoading(false);
    }
  };

  const handleApplyClick = (job) => {
    setApplyJob(job);
    setApplyMessage("");
    setApplyError("");
    trackEvent(job, "job_apply");
  };

  const handleApplyOutcome = async (outcome) => {
    if (!applyJob) return;

    const jobId = getJobId(applyJob);
    if (!jobId) return;

    setApplyLoading(true);
    setApplyError("");
    setApplyMessage("");

    try {
      const res = await fetch(`${API}/mark-application-outcome/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: USER_ID,
          job_id: jobId,
          outcome,
          failure_reason:
            outcome === "failure" ? "skills mismatch / employer decision" : "",
          session_id:
            (window.crypto?.randomUUID?.()) || `session-${Date.now()}`,
        }),
      });

      const raw = await res.text();
      const payload = raw ? JSON.parse(raw) : null;

      if (!res.ok) {
        setApplyError(payload?.error || `Server error (${res.status}).`);
        return;
      }

      await fetchOutcomePatterns();

      setApplyMessage(
        outcome === "success"
          ? "Application marked as ACCEPTED."
          : "Application marked as REJECTED."
      );
    } catch (e) {
      console.error("Apply outcome error:", e);
      setApplyError("Could not record application outcome.");
    } finally {
      setApplyLoading(false);
    }
  };

  const filteredJobs = useMemo(() => {
    let arr = [...jobs];

    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter((job) =>
        [
          job.title,
          job.company,
          job.location,
          job.description,
          job.skills,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    if (locationFilter.trim()) {
      const q = locationFilter.toLowerCase();
      arr = arr.filter((job) =>
        (job.location || "").toLowerCase().includes(q)
      );
    }

    if (sortKey === "title") arr.sort((a, b) => a.title.localeCompare(b.title));
    else if (sortKey === "company")
      arr.sort((a, b) => a.company.localeCompare(b.company));
    else if (sortKey === "location")
      arr.sort((a, b) => a.location.localeCompare(b.location));
    else if (sortKey === "newest")
      arr.sort((a, b) => getJobId(b) - getJobId(a));

    return arr;
  }, [jobs, search, locationFilter, sortKey]);

  const uniqueLocations = useMemo(() => {
    const setLoc = new Set();
    jobs.forEach((j) => j.location && setLoc.add(j.location));
    return [...setLoc].sort();
  }, [jobs]);

  const matchRatioDisplay = (jobId) => {
    if (!gapResult || gapJobId !== jobId) return "—";
    return typeof gapResult.match_ratio === "number"
      ? `${Math.round(gapResult.match_ratio)}%`
      : "—";
  };

  const progressWidth = (jobId) => {
    if (!gapResult || gapJobId !== jobId) return "0%";
    return `${Math.min(Math.max(gapResult.match_ratio, 0), 100)}%`;
  };

  return (
    <div className="relative space-y-6">
      {/* HEADER — snapshot removed */}
      <header className="flex flex-col gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.25em] text-cyan-400 uppercase">
            InsightX · Jobs
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-50 md:text-4xl">
            Explore roles and close your skill gaps.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400">
            Click “View details” to see full requirements and use the Skill Gap
            Assistant under each job.
          </p>
        </div>
      </header>

      {/* CONTROLS */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-1 flex-col gap-3 md:flex-row">
            <div className="flex-1">
              <label className="text-[11px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                Search
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, company, skills…"
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
              />
            </div>

            <div className="w-full md:w-52">
              <label className="text-[11px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                Location
              </label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100"
              >
                <option value="">All locations</option>
                {uniqueLocations.map((loc) => (
                  <option key={loc}>{loc}</option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-44">
              <label className="text-[11px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                Sort by
              </label>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100"
              >
                <option value="default">Default</option>
                <option value="newest">Newest first</option>
                <option value="title">Title</option>
                <option value="company">Company</option>
                <option value="location">Location</option>
              </select>
            </div>
          </div>

          <div className="mt-2 text-[11px] text-right text-slate-500 md:mt-0">
            Showing{" "}
            <span className="font-semibold text-slate-200">
              {filteredJobs.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-200">
              {jobs.length}
            </span>{" "}
            jobs
          </div>
        </div>
      </section>

      {/* JOB LIST */}
      <section className="space-y-3">
        {loadingJobs && (
          <p className="text-xs text-slate-400">Loading jobs…</p>
        )}

        {jobsError && <p className="text-xs text-rose-400">{jobsError}</p>}

        {!loadingJobs && !jobsError && filteredJobs.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-400">
            No jobs match your filters.
          </div>
        )}

        {!loadingJobs &&
          !jobsError &&
          filteredJobs.map((job) => {
            const jobId = getJobId(job);
            const expanded = expandedJobId === jobId;

            return (
              <JobCard
                key={jobId}
                job={job}
                expanded={expanded}
                onToggleExpand={() => {
                  const newExpanded = expanded ? null : jobId;
                  setExpandedJobId(newExpanded);
                  if (!expanded) trackEvent(job, "job_view");
                }}
                onRunSkillGap={() => {
                  runSkillGap(job);
                  if (!expanded) setExpandedJobId(jobId);
                }}
                gapLoading={gapLoading && gapJobId === jobId}
                gapError={gapJobId === jobId ? gapError : ""}
                gapResult={gapJobId === jobId ? gapResult : null}
                matchRatioDisplay={matchRatioDisplay(jobId)}
                progressWidth={progressWidth(jobId)}
                userSkillsText={userSkillsText}
                setUserSkillsText={setUserSkillsText}
                onApply={() => handleApplyClick(job)}
              />
            );
          })}
      </section>

      {/* APPLY OVERLAY */}
      {applyJob && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 px-3 pb-6 sm:items-center sm:px-0">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950/95 p-4 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Application outcome
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-50">
                  {applyJob.title}
                </p>
                <p className="text-[11px] text-slate-500">
                  {applyJob.company} · {applyJob.location}
                </p>
              </div>
              <button
                onClick={() => {
                  setApplyJob(null);
                  setApplyMessage("");
                  setApplyError("");
                  setApplyLoading(false);
                }}
                className="rounded-full border border-slate-700 bg-slate-900/80 px-2 py-1 text-[11px] text-slate-400 hover:border-rose-500 hover:text-rose-300"
              >
                Close
              </button>
            </div>

            <p className="mt-3 text-xs text-slate-300">
              Tell InsightX what happened with this application.
            </p>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                onClick={() => handleApplyOutcome("success")}
                disabled={applyLoading}
                className="flex-1 rounded-full bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
              >
                {applyLoading ? "Saving…" : "Mark as ACCEPTED"}
              </button>
              <button
                onClick={() => handleApplyOutcome("failure")}
                disabled={applyLoading}
                className="flex-1 rounded-full bg-rose-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-rose-400 disabled:opacity-60"
              >
                {applyLoading ? "Saving…" : "Mark as REJECTED"}
              </button>
            </div>

            <div className="mt-3 text-[11px]">
              {applyError && (
                <p className="text-rose-400">{applyError}</p>
              )}
              {applyMessage && (
                <p className="text-emerald-300">{applyMessage}</p>
              )}
              {!applyError && !applyMessage && (
                <p className="text-slate-500">
                  This only updates your analytics and recommendations.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------- */
/* JOB CARD COMPONENT */
/* ----------------------------------------- */

function JobCard({
  job,
  expanded,
  onToggleExpand,
  onRunSkillGap,
  gapLoading,
  gapError,
  gapResult,
  matchRatioDisplay,
  progressWidth,
  userSkillsText,
  setUserSkillsText,
  onApply,
}) {
  const skills =
    typeof job.skills === "string"
      ? job.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 p-4 hover:border-cyan-500/70 transition-colors">
      <div className="relative">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-50">{job.title}</p>
            <p className="text-xs text-slate-400">
              {job.company} · {job.location}
            </p>
            {job.description && (
              <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                {job.description}
              </p>
            )}

            {skills.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {skills.slice(0, 5).map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-slate-700 bg-slate-900/80 px-2 py-0.5 text-[11px] text-slate-300"
                  >
                    {skill}
                  </span>
                ))}
                {skills.length > 5 && (
                  <span className="text-[11px] text-slate-500">
                    +{skills.length - 5} more
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col items-stretch gap-2 md:w-40">
            <button
              onClick={onToggleExpand}
              className="w-full rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-100 hover:border-cyan-400 hover:text-cyan-300"
            >
              {expanded ? "Hide details" : "View details"}
            </button>

            <button
              onClick={onApply}
              className="w-full rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
            >
              Apply
            </button>
          </div>
        </div>

        {/* EXPANDED AREA */}
        {expanded && (
          <div className="mt-4 space-y-4 border-t border-slate-800 pt-4">
            {/* Job details */}
            <section className="space-y-2 text-xs text-slate-200">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Job details
              </h3>
              {job.description && (
                <div>
                  <p className="text-[11px] font-medium text-slate-300">
                    Role overview
                  </p>
                  <p className="mt-1 whitespace-pre-line text-slate-200">
                    {job.description}
                  </p>
                </div>
              )}
              {job.qualifications && (
                <div className="mt-2">
                  <p className="text-[11px] font-medium text-slate-300">
                    Qualifications
                  </p>
                  <p className="mt-1 whitespace-pre-line text-slate-200">
                    {job.qualifications}
                  </p>
                </div>
              )}
            </section>

            {/* SKILL GAP ASSISTANT */}
            <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Skill gap assistant
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Tell us your skills and see how well you match this role.
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    Match
                  </p>
                  <p className="mt-1 text-lg font-semibold text-emerald-400">
                    {gapLoading ? "…" : matchRatioDisplay}
                  </p>
                </div>
              </div>

              {/* progress bar */}
              <div className="mt-2 h-2 w-full rounded-full bg-slate-800">
                <div
                  className="h-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.7)]"
                  style={{ width: progressWidth }}
                />
              </div>

              {/* skills input */}
              <div className="mt-3">
                <label className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
                  Your current skills
                </label>
                <textarea
                  value={userSkillsText}
                  onChange={(e) => setUserSkillsText(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-100"
                  placeholder="Type skills separated by commas…"
                />
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <button
                  onClick={onRunSkillGap}
                  disabled={gapLoading}
                  className="rounded-full bg-cyan-500 px-3 py-1.5 text-[11px] font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
                >
                  {gapLoading ? "Analyzing…" : "Analyze skills for this job"}
                </button>
                <p className="text-[10px] text-slate-500">
                  Uses <code className="text-sky-300">/skill-gap/</code>.
                </p>
              </div>

              <div className="mt-2 max-h-24 overflow-auto pr-1 text-[11px] text-slate-200 space-y-1">
                {gapError && <p className="text-rose-400">{gapError}</p>}

                {gapLoading && !gapError && (
                  <p className="text-slate-400">
                    Comparing your skills with this job…
                  </p>
                )}

                {!gapLoading && gapResult && (
                  <>
                    {gapResult.matched_skills?.length > 0 && (
                      <p className="text-emerald-300">
                        Strong skills:{" "}
                        <span className="text-slate-100">
                          {gapResult.matched_skills.join(", ")}
                        </span>
                      </p>
                    )}
                    {gapResult.missing_skills?.length > 0 && (
                      <p className="text-amber-300">
                        Missing skills:{" "}
                        <span className="text-slate-100">
                          {gapResult.missing_skills.join(", ")}
                        </span>
                      </p>
                    )}
                    {gapResult.matched_skills?.length > 0 &&
                      gapResult.missing_skills?.length === 0 && (
                        <p className="text-emerald-400">
                          You already cover all skills for this role.
                        </p>
                      )}
                  </>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}