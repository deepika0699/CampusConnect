import React from 'react';
import { Card } from '../common/Card';
import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColorClass: string;
  iconBgClass: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  delay?: number;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  iconColorClass,
  iconBgClass,
  trend,
  delay = 0
}) => {
  return (
    <Card animate delay={delay} className="p-6 relative overflow-hidden flex flex-col justify-between h-36">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
          <span className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">{value}</span>
        </div>
        <div className={`p-3 rounded-2xl ${iconBgClass} ${iconColorClass}`}>
          <Icon className="h-5.5 w-5.5" />
        </div>
      </div>
      
      {trend && (
        <div className="flex items-center gap-2 text-xs">
          <span className={`font-bold px-1.5 py-0.5 rounded-md ${
            trend.isPositive 
              ? 'bg-emerald-50 text-emerald-600' 
              : 'bg-rose-50 text-rose-600'
          }`}>
            {trend.value}
          </span>
          <span className="text-slate-400 font-medium">{trend.label || 'vs last month'}</span>
        </div>
      )}
    </Card>
  );
};

export default StatCard;
