import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  subValue: string;
  icon: React.ReactNode;
  colorClass: string;
  change?: {
    value: string;
    isPositive: boolean;
    label: string;
  };
  progress?: number;
  description?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subValue,
  icon,
  colorClass,
  change,
  progress,
  description
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClass}`}>
          {icon}
        </div>
        {change && (
          <div className={`flex items-center text-xs font-semibold ${
            change.isPositive ? 'text-emerald-600' : 'text-rose-600'
          }`}>
            {change.isPositive ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
            {change.value}
          </div>
        )}
      </div>
      
      <h3 className="text-slate-500 text-sm font-medium mb-2">{title}</h3>
      
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-3xl font-bold text-slate-900">{value}</span>
        <span className="text-sm text-slate-400">{subValue}</span>
      </div>
      
      {change && (
        <p className="text-xs text-slate-400 mb-2">{change.label}</p>
      )}
      
      {progress !== undefined && (
        <div className="mb-2">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>目標達成率</span>
            <span className="font-semibold">{progress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${
                progress >= 100 ? 'bg-emerald-500' : progress >= 80 ? 'bg-blue-500' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}
      
      {description && (
        <p className="text-xs text-slate-500 mt-2">{description}</p>
      )}
    </div>
  );
};
