"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function MetricCard({ title, value, hint, icon: Icon, tintClass = "bg-slate-100 text-slate-700" }) {
  return (
    <Card className="rounded-[28px] border-slate-200 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm text-slate-500">{title}</div>
            <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</div>
            <div className="mt-2 text-sm text-slate-500">{hint}</div>
          </div>
          <div className={`rounded-2xl p-3 ${tintClass}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function InfoBlock({ title, description, children }) {
  return (
    <Card className="rounded-[28px] border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-slate-900">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function SimpleTable({ columns, rows }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <div
        className="grid bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
      >
        {columns.map((col) => <div key={col}>{col}</div>)}
      </div>
      {rows.map((row, idx) => (
        <div
          key={idx}
          className="grid items-center border-t border-slate-100 px-4 py-3 text-sm text-slate-700"
          style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
        >
          {row.map((cell, i) => <div key={i}>{cell}</div>)}
        </div>
      ))}
    </div>
  );
}

export function StatusPill({ children, className = "bg-slate-100 text-slate-700" }) {
  return <Badge className={`rounded-full ${className}`}>{children}</Badge>;
}
