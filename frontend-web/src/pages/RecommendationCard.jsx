export default function RecommendationCard({ job, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-left rounded-2xl border border-slate-200 bg-white/80 backdrop-blur p-4 hover:shadow-md transition"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">{job.title}</div>
          <div className="text-sm text-slate-600">{job.company}</div>
          {job.district && <div className="text-xs text-slate-500 mt-1">{job.district}</div>}
        </div>
        <div className="text-xs px-2 py-1 rounded bg-slate-900 text-white">Score</div>
      </div>
      {job.skills?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {job.skills.slice(0,4).map(s => (
            <span key={s.id} className="text-xs px-2 py-1 rounded bg-slate-100 border border-slate-200">
              {s.name}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}