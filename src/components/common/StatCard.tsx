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
  const accentStyles = {
    indigo: {
      iconBg: 'bg-gradient-to-br from-indigo-500/15 to-indigo-500/5 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
      pill: 'text-indigo-700 dark:text-indigo-300',
    },
    emerald: {
      iconBg: 'bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      pill: 'text-emerald-700 dark:text-emerald-300',
    },
    amber: {
      iconBg: 'bg-gradient-to-br from-amber-500/15 to-amber-500/5 text-amber-700 dark:text-amber-300 border-amber-500/30',
      pill: 'text-amber-700 dark:text-amber-300',
    },
    blue: {
      iconBg: 'bg-gradient-to-br from-sky-500/15 to-sky-500/5 text-sky-700 dark:text-sky-300 border-sky-500/30',
      pill: 'text-sky-700 dark:text-sky-300',
    },
    rose: {
      iconBg: 'bg-gradient-to-br from-rose-500/15 to-rose-500/5 text-rose-700 dark:text-rose-300 border-rose-500/30',
      pill: 'text-rose-700 dark:text-rose-300',
    },
    purple: {
      iconBg: 'bg-gradient-to-br from-purple-500/15 to-purple-500/5 text-purple-700 dark:text-purple-300 border-purple-500/30',
      pill: 'text-purple-700 dark:text-purple-300',
    },
  }[color];

  return (
    <Card className="bg-gradient-to-b from-card to-card/95 border-border/80 shadow-xs hover:border-foreground/25 hover:shadow-sm transition-all p-4 sm:p-5 flex flex-col justify-between">
      <CardContent className="p-0 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground truncate">
            {title}
          </span>
          <div className={`p-1.5 rounded-lg border ${accentStyles.iconBg} shrink-0`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-card-foreground tracking-tight">
            {value}
          </div>
          {(subtitle || trend) && (
            <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
              {subtitle && <span className="truncate">{subtitle}</span>}
              {trend && (
                <span className={`font-mono font-medium shrink-0 ${trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
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
