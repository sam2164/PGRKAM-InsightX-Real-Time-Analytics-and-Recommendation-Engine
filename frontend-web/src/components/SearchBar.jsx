import React from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg ${isActive ? "bg-brand-600 text-white" : "text-slate-700 hover:bg-brand-100"}`;

  return (
    <header className="sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <div className="glass rounded-2xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-bold tracking-tight text-brand-800 text-xl">
            PGRKAM <span className="text-brand-600">InsightX</span>
          </Link>
          <nav className="flex items-center gap-2">
            <NavLink to="/" className={linkClass}>Home</NavLink>
            <NavLink to="/jobs" className={linkClass}>Jobs</NavLink>
            {user ? (
              <>
                <NavLink to="/profile" className={linkClass}>Profile</NavLink>
                <button onClick={logout} className="px-3 py-2 rounded-lg bg-slate-800 text-white">
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={linkClass}>Login</NavLink>
                <NavLink to="/register" className={linkClass}>Register</NavLink>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}