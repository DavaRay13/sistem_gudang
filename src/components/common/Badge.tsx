import React from 'react';
import { TransferRequestStatus, TransactionType } from '../../types';
import { getStatusBadgeConfig, getTransactionTypeBadge } from '../../utils/formatters';
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: TransferRequestStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const cfg = getStatusBadgeConfig(status);

  const sizeClasses = {
    sm: 'text-[10px] h-4 px-1.5',
    md: 'text-xs h-5 px-2.5',
    lg: 'text-sm h-6 px-3',
  }[size];

  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center gap-1.5 font-medium border ${cfg.bgClass} ${cfg.textClass} ${cfg.borderClass} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass}`} />
      {cfg.label}
    </Badge>
  );
};

interface TransactionBadgeProps {
  type: TransactionType;
}

export const TransactionBadge: React.FC<TransactionBadgeProps> = ({ type }) => {
  const cfg = getTransactionTypeBadge(type);
  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center text-xs font-semibold ${cfg.bgClass} ${cfg.textClass}`}
    >
      {cfg.label}
    </Badge>
  );
};
