import { Users, FolderKanban, Clock } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { ReportTab } from '../types/report.types';

interface ReportTabsProps {
  activeTab: ReportTab;
  onTabChange: (tab: ReportTab) => void;
}

const tabs = [
  { id: 'team' as const, label: 'Team Performance', icon: Users },
  { id: 'projects' as const, label: 'Project Progress', icon: FolderKanban },
  { id: 'time' as const, label: 'Time Summary', icon: Clock },
];

export function ReportTabs({ activeTab, onTabChange }: ReportTabsProps) {
  return (
    <div className="border-b border-border">
      <nav className="-mb-px flex gap-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
