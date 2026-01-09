import React from "react";

export default function Heatmap({ points = [] }) {
  // Minimal, no external libs. Just dots on a pseudo-map panel.
  return (
    <div className="w-full h-64 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 relative overflow-hidden">
      <div className="absolute top-3 left-4 text-white/80 text-sm">Punjab — Employment Density</div>
      <div className="absolute inset-0">
        {points.map((p, i) => (
          <div
            key={i}
            title={`${p.district}: ${p.value}`}
            className="absolute w-3 h-3 rounded-full bg-cyan-400/70"
            style={{
              left: `${10 + (i * 7) % 80}%`,
              top: `${20 + (i * 13) % 60}%`,
              boxShadow: "0 0 12px rgba(34,211,238,0.8)",
            }}
          />
        ))}
      </div>
    </div>
  );
}