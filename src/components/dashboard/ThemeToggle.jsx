import { Sun, Moon } from "lucide-react";

export default function ThemeToggle({ isDark, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-14 h-7 rounded-full transition-colors duration-300 flex items-center px-1 ${
        isDark ? "bg-slate-600" : "bg-slate-200"
      }`}
    >
      <span className={`absolute transition-all duration-300 ${isDark ? "left-7" : "left-1"}`}>
        <span className={`w-5 h-5 rounded-full flex items-center justify-center shadow-md ${isDark ? "bg-slate-800" : "bg-white"}`}>
          {isDark ? <Moon className="w-3 h-3 text-blue-300" /> : <Sun className="w-3 h-3 text-yellow-500" />}
        </span>
      </span>
    </button>
  );
}