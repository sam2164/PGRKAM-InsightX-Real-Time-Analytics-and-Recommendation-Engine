export default function Heatmap({ data = [] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.value || 0)) || 1;
  return (
    <div className="grid grid-cols-3 gap-2">
      {data.map(item => {
        const v = Math.max(0, Math.min(1, item.value || 0));
        const bg = `rgba(99,102,241,${0.15 + 0.6*v})`;
        return (
          <div key={item.name} className="rounded-lg p-3 border border-black/5"
               style={{ backgroundColor: bg }}>
            <div className="text-sm font-semibold">{item.name}</div>
            <div className="text-xs text-slate-700 dark:text-slate-300">intensity {(v*100).toFixed(0)}%</div>
          </div>
        );
      })}
    </div>
  );
}