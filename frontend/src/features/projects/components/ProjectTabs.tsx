import { CheckSquare, Users, Settings, History } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

type Tab = 'tasks' | 'members' | 'activity' | 'settings';

interface ProjectTabsProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  memberCount: number;
}

const tabs = [
  { id: 'tasks' as const, label: 'Tasks', icon: CheckSquare },
  { id: 'members' as const, label: 'Members', icon: Users },
  { id: 'activity' as const, label: 'Activity', icon: History },
  { id: 'settings' as const, label: 'Settings', icon: Settings },
];

export function ProjectTabs({ activeTab, onTabChange, memberCount }: ProjectTabsProps) {
  const getCount = (tabId: Tab): number | null => {
    switch (tabId) {
      case 'members':
        return memberCount;
      default:
        return null;
    }
  };

  return (
    <div className="border-b border-border">
      <nav className="-mb-px flex gap-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const count = getCount(tab.id);

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {count !== null && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
