import { useState } from "react";
import { FileText } from "lucide-react";
import ReportGenerator from "./ReportGenerator";

export default function ReportButton({ companyId, employeeId, userRole, label = "Genera Report" }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-colors"
      >
        <FileText className="w-4 h-4 text-blue-600" />
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div onClick={e => e.stopPropagation()}>
            <ReportGenerator
              companyId={companyId}
              employeeId={employeeId}
              userRole={userRole}
              onClose={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}