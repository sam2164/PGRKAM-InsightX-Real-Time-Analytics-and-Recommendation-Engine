import { NavLink } from "react-router-dom";

const navLinkClasses =
  "px-3 py-1.5 text-sm rounded-full transition-colors hover:bg-slate-200/80";

export default function NavBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo / Brand */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-slate-50 shadow-sm">
            IX
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">
              InsightX
            </span>
            <span className="text-xs text-slate-500">
              Job & skills assistant
            </span>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex items-center gap-1 text-sm">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `${navLinkClasses} ${
                isActive ? "bg-slate-900 text-slate-50" : "text-slate-700"
              }`
            }
          >
            Overview
          </NavLink>

          <NavLink
            to="/analytics"
            className={({ isActive }) =>
              `${navLinkClasses} ${
                isActive ? "bg-slate-900 text-slate-50" : "text-slate-700"
              }`
            }
          >
            Analytics
          </NavLink>

          <NavLink
            to="/jobs"
            className={({ isActive }) =>
              `${navLinkClasses} ${
                isActive ? "bg-slate-900 text-slate-50" : "text-slate-700"
              }`
            }
          >
            Jobs
          </NavLink>

          <NavLink
            to="/insights"
            className={({ isActive }) =>
              `${navLinkClasses} ${
                isActive ? "bg-slate-900 text-slate-50" : "text-slate-700"
              }`
            }
          >
            Insights
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `${navLinkClasses} ${
                isActive ? "bg-slate-900 text-slate-50" : "text-slate-700"
              }`
            }
          >
            Profile
          </NavLink>
        </nav>

        {/* Auth quick actions */}
        <div className="flex items-center gap-2">
          <NavLink
            to="/login"
            className="rounded-full px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            Log in
          </NavLink>
          <NavLink
            to="/register"
            className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-50 shadow-sm hover:bg-slate-800"
          >
            Sign up
          </NavLink>
        </div>
      </div>
    </header>
  );
}