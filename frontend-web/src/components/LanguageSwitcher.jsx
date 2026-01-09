import { useState } from 'react';

const LANGS = {
  en: { label: 'EN' },
  pa: { label: 'PA' }, // Punjabi
  hi: { label: 'HI' }, // Hindi
};

export default function LanguageSwitcher() {
  const [lang, setLang] = useState('en');

  return (
    <div className="ml-1 flex items-center">
      <select
        aria-label="Language"
        className="rounded-xl border border-black/10 bg-white/80 px-2 py-2 text-sm font-semibold shadow-sm hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/20"
        value={lang}
        onChange={(e) => setLang(e.target.value)}
      >
        {Object.entries(LANGS).map(([k, v]) => (
          <option key={k} value={k}>{v.label}</option>
        ))}
      </select>
    </div>
  );
}