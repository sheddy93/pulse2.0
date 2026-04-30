"use client";

import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { OperationalAssistantAvatar } from "@/components/ui/operational-assistant-avatar";

export function AssistantInsightPanel({ headline = "Assistente Operativo PulseHR", summary = "", priorities = [], tone = "violet" }) {
  const toneMap = {
    violet: "border-violet-200 bg-violet-50",
    blue: "border-blue-200 bg-blue-50",
    emerald: "border-emerald-200 bg-emerald-50",
    amber: "border-amber-200 bg-amber-50",
  };

  return (
    <Card className={`rounded-[28px] shadow-sm ${toneMap[tone] || toneMap.violet}`}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <OperationalAssistantAvatar size="sm" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Sparkles className="h-4 w-4 text-violet-600" />
              {headline}
            </div>
            {summary ? <p className="mt-2 text-sm text-slate-700">{summary}</p> : null}
            {priorities?.length ? (
              <ul className="mt-3 space-y-1 text-sm text-slate-600">
                {priorities.map((item, idx) => <li key={idx}>• {item}</li>)}
              </ul>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AssistantInsightPanel;
