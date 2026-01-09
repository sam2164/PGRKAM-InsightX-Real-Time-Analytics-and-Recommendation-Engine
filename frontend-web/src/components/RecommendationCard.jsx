export default function RecommendationCard({ role, score, skills, location }) {
  const tier =
    score >= 85 ? 'bg-emerald-500' :
    score >= 70 ? 'bg-sky-500' :
    score >= 55 ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <div className="rounded-2xl bg-white/70 p-5 shadow-glass backdrop-blur transition hover:shadow-[0_12px_40px_rgba(31,38,135,0.18)] dark:bg-white/10">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-extrabold">{role}</h4>
        <span className={`rounded-full px-2 py-1 text-xs font-black text-white ${tier}`}>{score}</span>
      </div>
      <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{location}</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {skills.map((s) => (
          <span key={s} className="rounded-full bg-white/80 px-2 py-1 text-xs font-semibold shadow dark:bg-white/10">{s}</span>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <button className="rounded-xl bg-gradient-to-r from-brand-500 to-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow hover:brightness-110">View</button>
        <button className="rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-sm font-semibold shadow-sm hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/20">Save</button>
      </div>
    </div>
  );
}