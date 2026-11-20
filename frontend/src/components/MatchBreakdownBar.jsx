import React from 'react';

const FACTORS = [
  { key: 'skill_fit', label: 'Skills', max: 30, color: 'bg-emerald-500' },
  { key: 'location_fit', label: 'Location', max: 20, color: 'bg-blue-500' },
  { key: 'availability_fit', label: 'Availability', max: 20, color: 'bg-indigo-500' },
  { key: 'interest_fit', label: 'Cause Fit', max: 10, color: 'bg-teal-500' },
  { key: 'experience_fit', label: 'Experience', max: 10, color: 'bg-[#F28C28]' },
  { key: 'willingness_fit', label: 'Eagerness', max: 10, color: 'bg-purple-500' },
];

export default function MatchBreakdownBar({ breakdown = {}, totalScore = 0 }) {
  return (
    <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
        <span>Match Breakdown</span>
        <span className="text-[#0F9D8A] font-bold">{totalScore} / 100 pts</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
        {FACTORS.map((f) => {
          const val = Number(breakdown[f.key] || 0);
          const pct = Math.min(100, Math.round((val / f.max) * 100));

          return (
            <div key={f.key} className="bg-white p-2 rounded-lg border border-slate-100 shadow-2xs">
              <div className="flex justify-between items-center text-[11px] mb-1">
                <span className="text-slate-600 font-medium">{f.label}</span>
                <span className="font-semibold text-slate-900">{val}/{f.max}</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${f.color}`}
                  style={{ width: `${pct}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

