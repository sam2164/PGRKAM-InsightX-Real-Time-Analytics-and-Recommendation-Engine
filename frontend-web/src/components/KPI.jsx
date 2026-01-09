// src/components/KPI.jsx
export default function KPI({ label, value, delta }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
      <div className={`text-xs ${delta?.startsWith("+") ? "text-green-600" : "text-red-600"}`}>{delta}</div>
    </div>
  );
}