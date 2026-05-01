/**
 * Quick Attendance Button - Mobile Optimized
 * Grande tasto touch per timbratura veloce
 */
import { useState } from 'react';
import { LogIn, LogOut, Coffee, Loader } from 'lucide-react';
import { cn } from '@/lib/utils';

const TYPES = {
  check_in: { label: 'Entrata', icon: LogIn, color: 'bg-emerald-600 hover:bg-emerald-700', textColor: 'text-white' },
  check_out: { label: 'Uscita', icon: LogOut, color: 'bg-slate-600 hover:bg-slate-700', textColor: 'text-white' },
  break_start: { label: 'Pausa', icon: Coffee, color: 'bg-orange-600 hover:bg-orange-700', textColor: 'text-white' },
  break_end: { label: 'Torna', icon: Coffee, color: 'bg-blue-600 hover:bg-blue-700', textColor: 'text-white' },
};

export default function QuickAttendanceButton({ type, onClick, disabled, loading }) {
  const cfg = TYPES[type];
  const Icon = cfg.icon;

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'flex flex-col items-center justify-center gap-2 px-6 py-8 rounded-2xl font-bold text-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
        cfg.color,
        cfg.textColor
      )}
    >
      {loading ? (
        <Loader className="w-8 h-8 animate-spin" />
      ) : (
        <Icon className="w-8 h-8" />
      )}
      <span>{cfg.label}</span>
    </button>
  );
}