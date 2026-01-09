// src/pages/profile.jsx
import React, { useEffect, useState } from "react";
import CONFIG from "../config";

const API = CONFIG.API_BASE_URL; // e.g. "http://127.0.0.1:8000/api/insightx"
const USER_ID = 1;

export default function Profile() {
  const [form, setForm] = useState({
    source_channel: "",
    age: "",
    gender: "",
    education_level: "",
    district: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setErrMsg("");
      setFieldErrors({});
      setOkMsg("");

      try {
        const res = await fetch(
          `${API}/user/profile-analytics/?user_id=${USER_ID}`
        );
        const text = await res.text();

        if (!res.ok) {
          console.error("Profile analytics HTTP error:", res.status, text);
          throw new Error(`HTTP ${res.status}`);
        }

        let json;
        try {
          json = JSON.parse(text);
        } catch (e) {
          console.error("Profile JSON parse error:", e, "raw:", text);
          throw new Error("Invalid JSON from backend for profile analytics");
        }

        setForm({
          source_channel: json.source_channel || "",
          age: json.age ?? "",
          gender: json.gender || "",
          education_level: json.education_level || "",
          district: json.district || "",
        });
      } catch (e) {
        console.error("Profile load error", e);
        setErrMsg("Unable to load your profile analytics.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setErrMsg("");
    setOkMsg("");
    setFieldErrors({});

    const payload = {
      user_id: USER_ID,
      source_channel: form.source_channel,
      age: form.age === "" ? null : form.age,
      gender: form.gender,
      education_level: form.education_level,
      district: form.district,
    };

    try {
      const res = await fetch(`${API}/user/profile-analytics/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      if (!res.ok) {
        console.error("Profile save HTTP error:", res.status, text);
        let json;
        try {
          json = JSON.parse(text);
        } catch (e) {
          throw new Error("Invalid JSON error from profile save");
        }

        if (json.errors) {
          setFieldErrors(json.errors);
        }
        setErrMsg(json.message || "Unable to save profile.");
        return;
      }

      let json = {};
      try {
        json = JSON.parse(text);
      } catch {
        // ignore
      }

      setOkMsg("Profile saved successfully.");
    } catch (e) {
      console.error("Profile save error", e);
      setErrMsg("Unable to save profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold tracking-[0.25em] text-cyan-400 uppercase">
          InsightX · User profile analytics
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-50 md:text-4xl">
          Understand who is using PGRKAM.
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-400">
          Capture acquisition channels and demographics so you can segment your
          dashboards and reporting.
        </p>
      </header>

      {errMsg && (
        <div className="rounded-xl border border-rose-500/50 bg-rose-950/40 px-4 py-3 text-sm text-rose-100">
          {errMsg}
        </div>
      )}

      {okMsg && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-100">
          {okMsg}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-300">
          Loading profile analytics…
        </div>
      ) : (
        <form
          onSubmit={handleSave}
          className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-4"
        >
          {/* Source channel */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Where did you first hear about PGRKAM?{" "}
              <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              name="source_channel"
              value={form.source_channel}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-50 outline-none focus:border-cyan-500"
              placeholder="WhatsApp, College, Facebook, Job Fair..."
            />
            {fieldErrors.source_channel && (
              <p className="mt-1 text-xs text-rose-400">
                {fieldErrors.source_channel}
              </p>
            )}
          </div>

          {/* Age + gender row */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Age <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                name="age"
                value={form.age}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-50 outline-none focus:border-cyan-500"
                min={15}
                max={80}
              />
              {fieldErrors.age && (
                <p className="mt-1 text-xs text-rose-400">
                  {fieldErrors.age}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Gender <span className="text-rose-400">*</span>
              </label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-50 outline-none focus:border-cyan-500"
              >
                <option value="">Select…</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
              {fieldErrors.gender && (
                <p className="mt-1 text-xs text-rose-400">
                  {fieldErrors.gender}
                </p>
              )}
            </div>
          </div>

          {/* Education */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Highest education level <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              name="education_level"
              value={form.education_level}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-50 outline-none focus:border-cyan-500"
              placeholder="B.Com, Diploma, 12th pass, etc."
            />
            {fieldErrors.education_level && (
              <p className="mt-1 text-xs text-rose-400">
                {fieldErrors.education_level}
              </p>
            )}
          </div>

          {/* District */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              District <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              name="district"
              value={form.district}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-50 outline-none focus:border-cyan-500"
              placeholder="E.g. Chennai, Coimbatore, Madurai"
            />
            {fieldErrors.district && (
              <p className="mt-1 text-xs text-rose-400">
                {fieldErrors.district}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save profile"}
            </button>
            <p className="text-[11px] text-slate-500">
              This data powers your analytics and Power BI exports.
            </p>
          </div>
        </form>
      )}
    </div>
  );
}