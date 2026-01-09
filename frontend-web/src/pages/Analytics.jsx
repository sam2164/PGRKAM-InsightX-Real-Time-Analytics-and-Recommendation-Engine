// src/pages/Analytics.jsx
import React, { useEffect, useState } from "react";
import CONFIG from "../config";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area,
  LineChart,
  Line,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  Legend,
  LabelList,
} from "recharts";

const API = CONFIG.API_BASE_URL;
const USER_ID = 1;

// ---------- CLEAN LABELS ----------
const PAGE_LABELS = {
  "/": { label: "Homepage" },
  "/analytics": { label: "Analytics" },
  "/jobs": { label: "Jobs" },
  "/insights": { label: "Insights" },
  "/profile": { label: "Profile" },
  "/login": { label: "Login" },
  "/loign": { label: "Login" },
  "/loin": { label: "Login" },
};

function cleanPage(page) {
  if (!page) return "Unknown";
  const trimmed = page.trim();
  return PAGE_LABELS[trimmed]?.label || trimmed;
}

// ---------- COLORS ----------
const CHANNEL_COLORS = [
  "#22d3ee",
  "#a855f7",
  "#f97316",
  "#22c55e",
  "#e11d48",
  "#6366f1",
];

const DEMO_COLORS = [
  "#22d3ee",
  "#a855f7",
  "#22c55e",
  "#facc15",
  "#f97316",
  "#ec4899",
];

const BAR_PRIMARY = "#38bdf8";
const BAR_SECONDARY = "#a855f7";

function bucketAge(age) {
  const n = Number(age);
  if (!n || n < 0) return "Unknown";
  if (n < 18) return "<18";
  if (n <= 21) return "18–21";
  if (n <= 25) return "22–25";
  if (n <= 30) return "26–30";
  if (n <= 40) return "31–40";
  return "40+";
}

function buildDemographicsFromRows(rows) {
  const genderMap = {};
  const eduMap = {};
  const distMap = {};
  const ageMap = {};

  rows.forEach((r) => {
    const g = r.gender?.trim() || "Unknown";
    const edu = r.education_level?.trim() || "Unknown";
    const dist = r.district?.trim() || "Unknown";
    const ageBucket = bucketAge(r.age);

    genderMap[g] = (genderMap[g] || 0) + 1;
    eduMap[edu] = (eduMap[edu] || 0) + 1;
    distMap[dist] = (distMap[dist] || 0) + 1;
    ageMap[ageBucket] = (ageMap[ageBucket] || 0) + 1;
  });

  const objToArr = (obj, key) =>
    Object.entries(obj).map(([k, v]) => ({ [key]: k, count: v }));

  return {
    gender: objToArr(genderMap, "gender"),
    education_level: objToArr(eduMap, "education_level"),
    district: objToArr(distMap, "district"),
    age: objToArr(ageMap, "bucket"),
  };
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [demoRows, setDemoRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  // top cards stats (from /user/stats/)
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState("");

  // ---------- LOAD USER STATS ----------
  useEffect(() => {
    async function loadStats() {
      try {
        setStatsError("");
        const res = await fetch(`${API}/user/stats/?user_id=${USER_ID}`);
        const text = await res.text();

        if (!res.ok) {
          console.error("Stats HTTP error:", res.status, text);
          throw new Error(`HTTP ${res.status}`);
        }

        let json;
        try {
          json = JSON.parse(text);
        } catch (e) {
          console.error("Stats JSON parse error:", e, "raw:", text);
          throw new Error("Invalid JSON from backend for stats");
        }

        setStats(json);
      } catch (e) {
        console.error("Stats error", e);
        setStatsError("Could not load stats.");
      }
    }

    loadStats();
  }, []);

  // ---------- LOAD ANALYTICS OVERVIEW + DEMOGRAPHICS ----------
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setErrMsg("");

        // MAIN ANALYTICS OVERVIEW
        const res = await fetch(`${API}/analytics/overview/?user_id=${USER_ID}`);
        const text = await res.text();
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        let overview = JSON.parse(text);

        // DEMOGRAPHICS HISTORY (raw rows)
        let rows = [];
        try {
          const res2 = await fetch(`${API}/analytics/demographics-history/`);
          const raw = await res2.text();
          if (res2.ok) {
            const json = JSON.parse(raw);
            rows = json.rows || [];
          }
        } catch (e) {
          console.error("Demographics fetch error", e);
        }

        setDemoRows(rows);

        let demographics = overview.demographics || {};
        const agg = buildDemographicsFromRows(rows);

        demographics = {
          gender: demographics.gender?.length ? demographics.gender : agg.gender,
          education_level: demographics.education_level?.length
            ? demographics.education_level
            : agg.education_level,
          district: demographics.district?.length
            ? demographics.district
            : agg.district,
          age: demographics.age?.length ? demographics.age : agg.age,
        };

        setData({ ...overview, demographics });
      } catch (e) {
        console.error(e);
        setErrMsg("Unable to load analytics.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ---------- DERIVED ----------
  const appsPerDay = data?.applications_per_day || [];
  const totalApps = appsPerDay.reduce((s, d) => s + (d.count || 0), 0);

  const channels = (data?.channels || []).map((c) => ({
    source_channel: c.source_channel || c.channel || "Unknown",
    count: c.count || 0,
  }));

  const companies = data?.top_companies || [];
  const locations = data?.top_locations || [];
  const demographics = data?.demographics || {};
  const genderRaw = demographics.gender || [];
  const eduData = demographics.education_level || [];
  const districtData = demographics.district || [];
  const ageRaw = demographics.age || [];

  const pageViews = data?.page_views || [];
  const totalPV = pageViews.reduce((s, p) => s + (p.count || 0), 0);

  const successRate = data?.success_rate ?? 0;
  const failureRate = data?.failure_rate ?? 0;

  // applications: last 30 days (clean + cumulative for advanced look)
  const baseApps = appsPerDay.filter((d) => d.count > 0).slice(-30);
  let running = 0;
  const appsChart = baseApps.map((d) => {
    running += d.count || 0;
    return { ...d, cumulative: running };
  });

  // --- transform for advanced charts ---

  // gender for radial: use "value" key (still using count)
  const genderData = genderRaw.map((g, idx) => ({
    ...g,
    value: g.count,
    fill: DEMO_COLORS[idx % DEMO_COLORS.length],
  }));

  // age for line chart: keep a stable order
  const ageOrder = ["<18", "18–21", "22–25", "26–30", "31–40", "40+", "Unknown"];
  const ageMap = Object.fromEntries(ageRaw.map((a) => [a.bucket, a.count]));
  const ageData = ageOrder
    .filter((bucket) => ageMap[bucket] !== undefined)
    .map((bucket) => ({ bucket, count: ageMap[bucket] }));

  // top districts (table style)
  const topDistricts = [...districtData]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // success vs failure donut
  const outcomeData = [
    {
      name: "Success",
      value: Number(successRate.toFixed(1)),
      color: "#22c55e",
    },
    {
      name: "Failure",
      value: Number(failureRate.toFixed(1)),
      color: "#f97316",
    },
  ];

  // ---------- UI ----------
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <header>
        <p className="text-xs font-semibold tracking-[0.25em] text-cyan-400 uppercase">
          InsightX · Analytics
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-50 md:text-4xl">
          Understand how users move through PGRKAM.
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-400">
          A Mixpanel-style view of channels, behavior, demographics and outcomes
          — each metric visualized differently so you can explain insights to
          reviewers clearly.
        </p>
      </header>

      {/* ERRORS */}
      {errMsg && (
        <div className="rounded-xl border border-rose-500/50 bg-rose-950/40 px-4 py-3 text-sm text-rose-100">
          {errMsg}
        </div>
      )}

      {/* LOADING */}
      {loading && !errMsg && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-300">
          Loading analytics…
        </div>
      )}

      {/* MAIN CONTENT */}
      {!loading && data && (
        <>
          {/* ===================================== */}
          {/*           TOP SUMMARY CARDS           */}
          {/* ===================================== */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <MetricCard
              label="Matched jobs"
              value={stats?.matched_jobs ?? 0}
              sub={
                statsError
                  ? statsError
                  : "Jobs you have interacted with / viewed"
              }
              accent="from-fuchsia-500 to-pink-500"
            />
            <MetricCard
              label="Applications"
              value={stats?.applications ?? 0}
              sub={statsError ? statsError : "Tracked via job apply events"}
              accent="from-amber-400 to-orange-500"
            />
            <MetricCard
              label="Success rate"
              value={`${successRate.toFixed(1)}%`}
              sub="Share of applications marked as successful"
              accent="from-emerald-500 to-cyan-500"
            />
            <MetricCard
              label="Failure rate"
              value={`${failureRate.toFixed(1)}%`}
              sub="Applications marked as rejected / unsuccessful"
              accent="from-rose-500 to-orange-500"
            />
          </section>

          {/* OUTCOME DONUT */}
          <section className="mt-2 grid gap-4 lg:grid-cols-3">
            <OutcomeDonutCard outcomeData={outcomeData} totalApps={totalApps} />

            {/* ===================================== */}
            {/*     APPLICATION TREND + CHANNELS      */}
            {/* ===================================== */}
            <div className="lg:col-span-2 grid gap-4 xl:grid-cols-2">
              {/* AREA CHART – APPLICATIONS OVER TIME */}
              <div className="xl:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                <h2 className="text-xs font-semibold tracking-[0.25em] text-slate-400 uppercase">
                  Applications over time
                </h2>
                <p className="mt-1 text-[11px] text-slate-500">
                  Area chart (daily count) + line (cumulative) for the last 30
                  days.
                </p>
                <div className="mt-4 h-60">
                  {appsChart.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      Not enough applications yet to plot.
                    </p>
                  ) : (
                    <ResponsiveContainer width="100%" height={230}>
                      <AreaChart data={appsChart}>
                        <defs>
                          <linearGradient
                            id="appsArea"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor={BAR_PRIMARY}
                              stopOpacity={0.95}
                            />
                            <stop
                              offset="100%"
                              stopColor={BAR_SECONDARY}
                              stopOpacity={0.1}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: "#9ca3af" }}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "#9ca3af" }}
                          allowDecimals={false}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#020617",
                            border: "1px solid #1f2937",
                          }}
                          labelStyle={{ fontSize: 11 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke={BAR_PRIMARY}
                          strokeWidth={2}
                          fill="url(#appsArea)"
                          dot={{ r: 3, strokeWidth: 1, stroke: "#e5e7eb" }}
                          isAnimationActive={true}
                        />
                        <Line
                          type="monotone"
                          dataKey="cumulative"
                          stroke="#f97316"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={true}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* CHANNELS + EXTRA METRICS */}
          <section className="grid gap-4 xl:grid-cols-3 mt-4">
            {/* DONUT – ACQUISITION CHANNELS */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <h2 className="text-xs font-semibold tracking-[0.25em] text-slate-400 uppercase">
                Acquisition channels
              </h2>
              <p className="mt-1 text-[11px] text-slate-500">
                Where users first spotted the PGRKAM advertisement.
              </p>

              <div className="mt-4 h-60">
                {!channels.length ? (
                  <p className="text-xs text-slate-500">
                    No channel data captured yet.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={230}>
                    <PieChart>
                      <Pie
                        data={channels}
                        dataKey="count"
                        nameKey="source_channel"
                        innerRadius={45}
                        outerRadius={80}
                        paddingAngle={4}
                        stroke="#020617"
                        isAnimationActive={true}
                      >
                        {channels.map((c, i) => (
                          <Cell
                            key={i}
                            fill={CHANNEL_COLORS[i % CHANNEL_COLORS.length]}
                          />
                        ))}
                        <LabelList
                          dataKey="count"
                          position="outside"
                          style={{ fontSize: 10, fill: "#e5e7eb" }}
                        />
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "#020617",
                          border: "1px solid #1f2937",
                        }}
                        labelStyle={{ fontSize: 11 }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        align="center"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 10, color: "#9ca3af" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* SMALL EXTRA SUMMARY */}
            <div className="xl:col-span-2 grid gap-4 md:grid-cols-2">
              <MetricCard
                label="Total page views"
                value={totalPV}
                sub="Across all screens (page_view events)"
                accent="from-cyan-500 to-emerald-400"
              />
              <MetricCard
                label="Unique districts"
                value={districtData.length}
                sub="Coverage across regions"
                accent="from-indigo-500 to-sky-500"
              />
            </div>
          </section>

          {/* ===================================== */}
          {/*              DEMOGRAPHICS             */}
          {/* ===================================== */}
          <section className="grid gap-4 xl:grid-cols-4 mt-4">
            {/* RADIAL – GENDER */}
            <GenderRadialCard data={genderData} />

            {/* BAR – EDUCATION */}
            <DemoBarCard
              title="Education levels"
              data={eduData}
              keyName="education_level"
              gradientId="eduG"
              from="#a855f7"
              to="#22d3ee"
            />

            {/* LINE – AGE DISTRIBUTION */}
            <AgeLineCard data={ageData} />

            {/* TABLE – TOP DISTRICTS */}
            <DistrictTableCard data={topDistricts} />
          </section>

          {/* ===================================== */}
          {/*     TOP COMPANIES / TOP LOCATIONS     */}
          {/* ===================================== */}
          <section className="grid gap-4 lg:grid-cols-2 mt-4">
            <HorizontalBarCard
              title="Top companies by engagement"
              data={companies}
              keyName="company"
              gradientId="companyG"
              from="#6366f1"
              to="#22d3ee"
            />

            <HorizontalBarCard
              title="Top locations by engagement"
              data={locations}
              keyName="location"
              gradientId="locG"
              from="#f97316"
              to="#e11d48"
            />
          </section>

          {/* ===================================== */}
          {/*             PAGE VIEW ANALYTICS       */}
          {/* ===================================== */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 mt-4">
            <h2 className="text-xs font-semibold tracking-[0.25em] text-slate-400 uppercase">
              Page view analytics
            </h2>
            <p className="mt-1 text-[11px] text-slate-500">
              Which screens are most frequently used in the PGRKAM interface.
            </p>

            <div className="mt-4 h-64">
              {!pageViews.length ? (
                <p className="text-xs text-slate-500">
                  No page-view data recorded yet.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart
                    data={pageViews}
                    layout="vertical"
                    margin={{ left: 120, right: 10 }}
                  >
                    <defs>
                      <linearGradient id="pageG" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#22d3ee" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10, fill: "#9ca3af" }}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="page"
                      tickFormatter={cleanPage}
                      tick={{ fontSize: 11, fill: "#e5e7eb" }}
                      width={110}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#020617",
                        border: "1px solid #1f2937",
                      }}
                      labelFormatter={(value) => cleanPage(value)}
                    />
                    <Bar
                      dataKey="count"
                      fill="url(#pageG)"
                      radius={6}
                      isAnimationActive={true}
                    >
                      <LabelList
                        dataKey="count"
                        position="right"
                        style={{ fontSize: 10, fill: "#e5e7eb" }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */

function MetricCard({ label, value, sub, accent }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent} opacity-20`}
      />
      <div className="relative">
        <p className="text-[11px] font-semibold tracking-[0.24em] text-slate-400 uppercase">
          {label}
        </p>
        <p className="mt-2 text-2xl font-bold text-slate-50">{value}</p>
        <p className="mt-1 text-xs text-slate-400">{sub}</p>
      </div>
    </div>
  );
}

/* OUTCOME – DONUT (SUCCESS VS FAILURE) */
function OutcomeDonutCard({ outcomeData, totalApps }) {
  const nonZero = outcomeData.filter((o) => o.value > 0);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
      <h2 className="text-xs font-semibold tracking-[0.25em] text-slate-400 uppercase">
        Outcome breakdown
      </h2>
      <p className="mt-1 text-[11px] text-slate-500">
        Donut view of success vs failure across all recorded applications.
      </p>
      <div className="mt-3 flex items-center gap-4">
        <div className="h-40 w-40">
          {!nonZero.length ? (
            <div className="flex h-full items-center justify-center text-[11px] text-slate-500">
              No outcome data yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={nonZero}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={4}
                  stroke="#020617"
                  isAnimationActive={true}
                >
                  {nonZero.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#020617",
                    border: "1px solid #1f2937",
                  }}
                  labelStyle={{ fontSize: 11 }}
                  formatter={(val, name) => [`${val}%`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="flex-1 space-y-1 text-xs text-slate-300">
          <p>
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 mr-2" />
            Success:{" "}
            <span className="font-semibold">
              {outcomeData[0].value.toFixed(1)}%
            </span>
          </p>
          <p>
            <span className="inline-block h-2 w-2 rounded-full bg-amber-400 mr-2" />
            Failure:{" "}
            <span className="font-semibold">
              {outcomeData[1].value.toFixed(1)}%
            </span>
          </p>
          <p className="mt-2 text-[11px] text-slate-500">
            Total applications recorded:{" "}
            <span className="font-semibold text-slate-200">{totalApps}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

/* GENDER – RADIAL BAR */
function GenderRadialCard({ data }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
      <h2 className="text-xs font-semibold tracking-[0.25em] text-slate-400 uppercase">
        Gender distribution
      </h2>
      <p className="mt-1 text-[11px] text-slate-500">
        Radial bar chart showing how different genders are represented.
      </p>
      <div className="mt-4 h-56">
        {!data.length ? (
          <p className="text-xs text-slate-500">No data available.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <RadialBarChart
              innerRadius="20%"
              outerRadius="90%"
              data={data}
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis
                type="number"
                domain={[0, Math.max(...data.map((d) => d.value || d.count))]}
                tick={false}
              />
              <RadialBar
                minAngle={5}
                background
                clockWise
                dataKey="value"
                cornerRadius={8}
                isAnimationActive={true}
              />
              <Legend
                iconSize={8}
                layout="vertical"
                verticalAlign="middle"
                align="right"
                wrapperStyle={{ fontSize: 10, color: "#e5e7eb" }}
              />
              <Tooltip
                contentStyle={{
                  background: "#020617",
                  border: "1px solid #1f2937",
                }}
                labelStyle={{ fontSize: 11 }}
                formatter={(val, name) => [val, name]}
              />
            </RadialBarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

/* EDUCATION – VERTICAL BAR */
function DemoBarCard({ title, data, keyName, gradientId, from, to }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
      <h2 className="text-xs font-semibold tracking-[0.25em] text-slate-400 uppercase">
        {title}
      </h2>
      <div className="mt-4 h-56">
        {!data.length ? (
          <p className="text-xs text-slate-500">No data available.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={from} />
                  <stop offset="100%" stopColor={to} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey={keyName}
                tick={{ fontSize: 10, fill: "#9ca3af" }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#020617",
                  border: "1px solid #1f2937",
                }}
                labelStyle={{ fontSize: 11 }}
              />
              <Bar
                dataKey="count"
                fill={`url(#${gradientId})`}
                radius={6}
                isAnimationActive={true}
              >
                <LabelList
                  dataKey="count"
                  position="top"
                  style={{ fontSize: 10, fill: "#e5e7eb" }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

/* AGE – LINE CHART */
function AgeLineCard({ data }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
      <h2 className="text-xs font-semibold tracking-[0.25em] text-slate-400 uppercase">
        Age distribution
      </h2>
      <div className="mt-4 h-56">
        {!data.length ? (
          <p className="text-xs text-slate-500">No data available.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="bucket"
                tick={{ fontSize: 10, fill: "#9ca3af" }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#020617",
                  border: "1px solid #1f2937",
                }}
                labelStyle={{ fontSize: 11 }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ r: 3, strokeWidth: 1, stroke: "#e5e7eb" }}
                activeDot={{ r: 5 }}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

/* DISTRICTS – MINI TABLE */
function DistrictTableCard({ data }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
      <h2 className="text-xs font-semibold tracking-[0.25em] text-slate-400 uppercase">
        Top districts
      </h2>
      <p className="mt-1 text-[11px] text-slate-500">
        Simple table view to quickly talk about reach across districts.
      </p>
      <div className="mt-3 max-h-48 overflow-auto text-xs">
        {!data.length ? (
          <p className="text-xs text-slate-500">No data available.</p>
        ) : (
          <table className="w-full border-separate border-spacing-y-1">
            <thead>
              <tr className="text-slate-400">
                <th className="text-left font-medium">District</th>
                <th className="text-right font-medium">Users</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.district}>
                  <td className="rounded-l-lg bg-slate-950/60 px-2 py-1">
                    {row.district || "Unknown"}
                  </td>
                  <td className="rounded-r-lg bg-slate-950/60 px-2 py-1 text-right">
                    {row.count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* TOP COMPANIES / LOCATIONS – HORIZONTAL BAR */
function HorizontalBarCard({ title, data, keyName, gradientId, from, to }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
      <h2 className="text-xs font-semibold tracking-[0.25em] text-slate-400 uppercase">
        {title}
      </h2>

      <div className="mt-4 h-60">
        {!data.length ? (
          <p className="text-xs text-slate-500">No data available.</p>
        ) : (
          <ResponsiveContainer width="100%" height={230}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 90, right: 10 }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={from} />
                  <stop offset="100%" stopColor={to} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: "#9ca3af" }}
              />
              <YAxis
                type="category"
                dataKey={keyName}
                tick={{ fontSize: 11, fill: "#e5e7eb" }}
                width={90}
              />
              <Tooltip
                contentStyle={{
                  background: "#020617",
                  border: "1px solid #1f2937",
                }}
                labelStyle={{ fontSize: 11 }}
              />
              <Bar
                dataKey="count"
                fill={`url(#${gradientId})`}
                radius={6}
                isAnimationActive={true}
              >
                <LabelList
                  dataKey="count"
                  position="right"
                  style={{ fontSize: 10, fill: "#e5e7eb" }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}