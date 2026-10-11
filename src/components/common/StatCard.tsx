import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'indigo' | 'emerald' | 'amber' | 'blue' | 'rose' | 'purple';
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'indigo',
  trend,
}) => {
  // Map to minimalist spot pastels
  const pastelStyles = {
    indigo: {
      bg: 'bg-[#F7F6F3] dark:bg-[#1E2025]',
      text: 'text-[#111111] dark:text-[#ECECED]',
      border: 'border-[#EAEAEA] dark:border-[#2B2D33]',
    },
    emerald: {
      bg: 'bg-[#EDF3EC] dark:bg-[#172B19]',
      text: 'text-[#346538] dark:text-[#96D99C]',
      border: 'border-[#D4E5D3] dark:border-[#223F25]',
    },
    amber: {
      bg: 'bg-[#FBF3DB] dark:bg-[#332A15]',
      text: 'text-[#956400] dark:text-[#E8CA65]',
      border: 'border-[#F4E3B4] dark:border-[#4D3F1E]',
    },
    blue: {
      bg: 'bg-[#E1F3FE] dark:bg-[#142838]',
      text: 'text-[#1F6C9F] dark:text-[#97D2FB]',
      border: 'border-[#C8E7FD] dark:border-[#1E3B52]',
    },
    rose: {
      bg: 'bg-[#FDEBEC] dark:bg-[#381B1B]',
      text: 'text-[#9F2F2D] dark:text-[#F8A4A4]',
      border: 'border-[#F8D2D4] dark:border-[#522525]',
    },
    purple: {
      bg: 'bg-[#F7F6F3] dark:bg-[#1E2025]',
      text: 'text-[#111111] dark:text-[#ECECED]',
      border: 'border-[#EAEAEA] dark:border-[#2B2D33]',
    },
  }[color];

  return (
    <div className="bg-white dark:bg-[#16171A] p-4 sm:p-5 rounded-xl border border-[#EAEAEA] dark:border-[#26282E] hover:border-[#D4D4D4] dark:hover:border-[#383A42] transition-colors flex flex-col justify-between">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium tracking-wide uppercase text-[#787774] dark:text-[#A1A09E] truncate">
          {title}
        </span>
        <div className={`p-1.5 rounded-lg border ${pastelStyles.bg} ${pastelStyles.text} ${pastelStyles.border} shrink-0`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>

      <div className="mt-3">
        <div className="text-2xl sm:text-3xl font-semibold font-mono tabular-nums text-[#111111] dark:text-[#ECECED] tracking-tight">
          {value}
        </div>
        {(subtitle || trend) && (
          <div className="mt-1 flex items-center justify-between text-[11px] text-[#787774] dark:text-[#A1A09E]">
            {subtitle && <span className="truncate">{subtitle}</span>}
            {trend && (
              <span className={`font-mono font-medium shrink-0 ${trend.isPositive ? 'text-[#346538] dark:text-[#96D99C]' : 'text-[#9F2F2D] dark:text-[#F8A4A4]'}`}>
                {trend.value}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
