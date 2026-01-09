export default function ThemeToggle() {
  return (
    <button
      type="button"
      title="Toggle theme"
      className="ml-1 rounded-xl border border-black/10 bg-white/70 px-3 py-2 shadow-sm hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/20"
      onClick={() => document.documentElement.classList.toggle('dark')}
    >
      🌙
    </button>
  );
}