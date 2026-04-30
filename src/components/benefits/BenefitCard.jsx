import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function BenefitCard({ benefit, isSelected, onToggle, readonly = false }) {
  const typeIcons = {
    health_insurance: '🏥',
    dental: '🦷',
    vision: '👁️',
    life_insurance: '💼',
    retirement: '📈',
    flexible_spending: '💰',
    gym_wellness: '🏋️',
    other: '✨'
  };

  return (
    <div className={`border-2 rounded-lg p-4 transition-all cursor-pointer ${
      isSelected 
        ? 'border-emerald-500 bg-emerald-50' 
        : 'border-slate-200 bg-white hover:border-slate-300'
    }`}
    onClick={() => !readonly && onToggle?.()} >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-2">
          <span className="text-2xl">{typeIcons[benefit.type] || '📋'}</span>
          <div>
            <h4 className="font-semibold text-slate-800">{benefit.name}</h4>
            {benefit.provider && (
              <p className="text-xs text-slate-400">{benefit.provider}</p>
            )}
          </div>
        </div>
        {!readonly && (
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
            isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
          }`}>
            {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
          </div>
        )}
      </div>

      {benefit.description && (
        <p className="text-sm text-slate-600 mb-3">{benefit.description}</p>
      )}

      <div className="space-y-2 text-xs">
        {benefit.coverage_levels?.length > 0 && (
          <div>
            <p className="text-slate-500 font-medium">Livelli copertura:</p>
            <p className="text-slate-600">{benefit.coverage_levels.join(', ')}</p>
          </div>
        )}

        <div className="flex gap-4 pt-2 border-t border-slate-100">
          {benefit.monthly_cost_employee !== undefined && (
            <div>
              <p className="text-slate-500">Costo dipendente</p>
              <p className="font-semibold text-slate-800">€{benefit.monthly_cost_employee}/mese</p>
            </div>
          )}
          {benefit.monthly_cost_company !== undefined && (
            <div>
              <p className="text-slate-500">Costo azienda</p>
              <p className="font-semibold text-slate-800">€{benefit.monthly_cost_company}/mese</p>
            </div>
          )}
        </div>
      </div>

      {benefit.is_mandatory && (
        <div className="mt-3 flex items-center gap-2 p-2 bg-orange-50 rounded text-xs text-orange-700">
          <AlertCircle className="w-3 h-3" />
          <span>Obbligatorio</span>
        </div>
      )}
    </div>
  );
}