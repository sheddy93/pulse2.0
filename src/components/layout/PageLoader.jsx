export default function PageLoader({ color = "blue" }) {
  const c = { blue: "border-blue-600", violet: "border-violet-600", green: "border-emerald-600", red: "border-red-600" };
  return (
    <div className="flex h-screen items-center justify-center">
      <div className={`w-8 h-8 border-4 border-t-transparent rounded-full animate-spin ${c[color] || c.blue}`} />
    </div>
  );
}