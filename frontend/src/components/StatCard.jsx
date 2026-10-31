import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'teal', badge }) {
  const colorMap = {
    teal: {
      bg: 'bg-teal-50',
      text: 'text-teal-700',
      border: 'border-teal-100',
      accent: 'bg-teal-500',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-100',
      accent: 'bg-emerald-500',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-100',
      accent: 'bg-amber-500',
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-100',
      accent: 'bg-rose-500',
    },
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-100',
      accent: 'bg-blue-500',
    },
    slate: {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
      accent: 'bg-slate-500',
    },
  };

  const scheme = colorMap[color] || colorMap.teal;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-shadow p-5 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{value}</div>
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg ${scheme.bg} ${scheme.text}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>{subtitle}</span>
        {badge && (
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${scheme.bg} ${scheme.text}`}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

