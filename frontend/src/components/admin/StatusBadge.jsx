/**
 * Status Badge Component - CommunityPulse
 */

import { cn } from '../../lib/utils';
import { Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const statusConfig = {
  pending: { 
    label: 'Pending', 
    icon: Clock, 
    class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' 
  },
  in_progress: { 
    label: 'In Progress', 
    icon: AlertCircle, 
    class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' 
  },
  resolved: { 
    label: 'Resolved', 
    icon: CheckCircle, 
    class: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
  },
  dismissed: { 
    label: 'Dismissed', 
    icon: XCircle, 
    class: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400' 
  }
};

export function StatusBadge({ status, className }) {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
      config.class,
      className
    )}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}