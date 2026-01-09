export default function Button({ className = "", ...props }) {
  return (
    <button
      className={
        "inline-flex items-center justify-center rounded-xl px-4 py-2 font-medium " +
        "bg-slate-900 text-white hover:bg-slate-800 active:scale-[.98] transition " +
        className
      }
      {...props}
    />
  );
}