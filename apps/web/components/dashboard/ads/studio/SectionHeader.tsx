'use client';

import { ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { cn } from '../../../../lib/utils';

interface SectionHeaderProps {
  step: number;
  label: string;
  isComplete: boolean;
  isActive: boolean;
  isExpanded: boolean;
  summary?: string;
  onToggle: () => void;
}

export function SectionHeader({ step, label, isComplete, isActive, isExpanded, summary, onToggle }: SectionHeaderProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left",
        isActive && !isExpanded
          ? 'bg-brand-red/5 border border-brand-red/20'
          : isExpanded
            ? 'bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5'
            : 'hover:bg-gray-50 dark:hover:bg-white/[0.03] border border-transparent'
      )}
    >
      <div className={cn(
        "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 transition-colors",
        isComplete
          ? 'bg-emerald-500 text-white'
          : isActive
            ? 'bg-brand-red text-white'
            : 'bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400'
      )}>
        {isComplete ? <CheckCircle2 size={14} /> : step}
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-xs font-black uppercase tracking-wider",
          isActive ? 'text-brand-black dark:text-white' : 'text-gray-500 dark:text-gray-400'
        )}>
          {label}
        </p>
        {summary && !isExpanded && (
          <p className="text-[10px] text-gray-400 mt-0.5 truncate">{summary}</p>
        )}
      </div>

      <div className="text-gray-400 flex-shrink-0">
        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </div>
    </button>
  );
}
