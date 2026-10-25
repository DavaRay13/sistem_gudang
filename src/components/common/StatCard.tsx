import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

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
  const pastelStyles = {
    indigo: {
      bg: 'bg-muted text-foreground border-border',
    },
    emerald: {
      bg: 'bg-[#EDF3EC] text-[#346538] border-[#D4E5D3] dark:bg-[#172B19] dark:text-[#96D99C] dark:border-[#223F25]',
    },
    amber: {
      bg: 'bg-[#FBF3DB] text-[#956400] border-[#F4E3B4] dark:bg-[#332A15] dark:text-[#E8CA65] dark:border-[#4D3F1E]',
    },
    blue: {
      bg: 'bg-[#E1F3FE] text-[#1F6C9F] border-[#C8E7FD] dark:bg-[#142838] dark:text-[#97D2FB] dark:border-[#1E3B52]',
    },
    rose: {
      bg: 'bg-[#FDEBEC] text-[#9F2F2D] border-[#F8D2D4] dark:bg-[#381B1B] dark:text-[#F8A4A4] dark:border-[#522525]',
    },
    purple: {
      bg: 'bg-muted text-foreground border-border',
    },
  }[color];

  return (
    <Card className="hover:border-foreground/20 transition-all p-4 sm:p-5 flex flex-col justify-between shadow-xs">
      <CardContent className="p-0 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground truncate">
            {title}
          </span>
          <div className={`p-1.5 rounded-lg border ${pastelStyles.bg} shrink-0`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-semibold font-mono tabular-nums text-foreground tracking-tight">
            {value}
          </div>
          {(subtitle || trend) && (
            <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
              {subtitle && <span className="truncate">{subtitle}</span>}
              {trend && (
                <span className={`font-mono font-medium shrink-0 ${trend.isPositive ? 'text-[#346538] dark:text-[#96D99C]' : 'text-[#9F2F2D] dark:text-[#F8A4A4]'}`}>
                  {trend.value}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
