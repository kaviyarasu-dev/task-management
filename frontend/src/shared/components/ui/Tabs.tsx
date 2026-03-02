import {
  createContext,
  useContext,
  useState,
  useId,
  type ReactNode,
  type KeyboardEvent,
} from 'react';
import { cn } from '@/shared/lib/utils';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (value: string) => void;
  baseId: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
}

interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}

function Tabs({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const baseId = useId();

  const activeTab = value ?? internalValue;
  const setActiveTab = (newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab, baseId }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: ReactNode;
  className?: string;
}

function TabsList({ children, className }: TabsListProps) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex h-10 items-center justify-start gap-1 rounded-lg bg-muted p-1',
        className
      )}
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

function TabsTrigger({ value, children, disabled, className }: TabsTriggerProps) {
  const { activeTab, setActiveTab, baseId } = useTabsContext();
  const isActive = activeTab === value;

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const tabList = event.currentTarget.parentElement;
    if (!tabList) return;

    const tabs = Array.from(
      tabList.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])')
    );
    const currentIndex = tabs.indexOf(event.currentTarget);

    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        newIndex = (currentIndex + 1) % tabs.length;
        break;
      case 'ArrowLeft':
        event.preventDefault();
        newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    const newTab = tabs[newIndex];
    newTab?.focus();
    const newValue = newTab?.getAttribute('data-value');
    if (newValue) {
      setActiveTab(newValue);
    }
  };

  return (
    <button
      role="tab"
      type="button"
      id={`${baseId}-tab-${value}`}
      data-value={value}
      aria-selected={isActive}
      aria-controls={`${baseId}-panel-${value}`}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      onClick={() => setActiveTab(value)}
      onKeyDown={handleKeyDown}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        'disabled:pointer-events-none disabled:opacity-50',
        isActive
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground',
        className
      )}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

function TabsContent({ value, children, className }: TabsContentProps) {
  const { activeTab, baseId } = useTabsContext();
  const isActive = activeTab === value;

  if (!isActive) return null;

  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      tabIndex={0}
      className={cn(
        'mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        className
      )}
    >
      {children}
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
export type { TabsProps };
