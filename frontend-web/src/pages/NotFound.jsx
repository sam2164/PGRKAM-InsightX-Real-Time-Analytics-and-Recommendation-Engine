// src/pages/NotFound.jsx
import { Link } from "react-router-dom";
export default function NotFound() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-slate-600">We couldn’t find that page.</p>
      <Link to="/" className="mt-4 inline-block underline">Go home</Link>
    </div>
  );
}