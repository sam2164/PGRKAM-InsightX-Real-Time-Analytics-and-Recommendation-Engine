export default function Card({ className = "", ...props }) {
  return (
    <div
      className={
        "rounded-2xl shadow-lg p-6 bg-white/80 backdrop-blur " + className
      }
      {...props}
    />
  );
}