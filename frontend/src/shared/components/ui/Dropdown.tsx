import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useId,
  type ReactNode,
  type KeyboardEvent,
} from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useKeyboardNavigation } from '@/shared/hooks/useKeyboardNavigation';

interface DropdownItem {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
  onClick?: () => void;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

function Dropdown({ trigger, items, align = 'left', className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const triggerId = useId();

  const enabledItems = items.filter((item) => !item.disabled);

  const handleSelect = useCallback(
    (index: number) => {
      const item = enabledItems[index];
      if (item?.onClick) {
        item.onClick();
        setIsOpen(false);
      }
    },
    [enabledItems]
  );

  const { activeIndex, setActiveIndex, handleKeyDown, resetActiveIndex } =
    useKeyboardNavigation({
      itemCount: enabledItems.length,
      onSelect: handleSelect,
      onEscape: () => setIsOpen(false),
      loop: true,
    });

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Reset active index when opening
  useEffect(() => {
    if (isOpen) {
      resetActiveIndex();
    }
  }, [isOpen, resetActiveIndex]);

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(true);
    }
  };

  const getEnabledIndex = (item: DropdownItem) => {
    return enabledItems.findIndex((i) => i.id === item.id);
  };

  return (
    <div ref={dropdownRef} className={cn('relative inline-block', className)}>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleTriggerKeyDown}
        className="inline-flex items-center"
      >
        {trigger}
      </button>

      {isOpen && (
        <div
          id={menuId}
          role="menu"
          aria-labelledby={triggerId}
          className={cn(
            'absolute z-50 mt-1 min-w-[160px] rounded-md border border-border bg-background py-1 shadow-lg',
            'animate-in fade-in-0 zoom-in-95',
            align === 'right' ? 'right-0' : 'left-0'
          )}
          onKeyDown={handleKeyDown}
        >
          {items.map((item) => {
            const enabledIndex = getEnabledIndex(item);
            const isActive = enabledIndex === activeIndex && !item.disabled;

            return (
              <button
                key={item.id}
                role="menuitem"
                type="button"
                disabled={item.disabled}
                tabIndex={isActive ? 0 : -1}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                  'focus:outline-none',
                  item.disabled
                    ? 'cursor-not-allowed opacity-50'
                    : 'cursor-pointer',
                  item.danger
                    ? 'text-destructive hover:bg-destructive/10'
                    : 'hover:bg-muted',
                  isActive && 'bg-muted'
                )}
                onClick={() => {
                  if (!item.disabled && item.onClick) {
                    item.onClick();
                    setIsOpen(false);
                  }
                }}
                onMouseEnter={() => {
                  if (!item.disabled) {
                    setActiveIndex(enabledIndex);
                  }
                }}
              >
                {item.icon && (
                  <span className="h-4 w-4 shrink-0" aria-hidden="true">
                    {item.icon}
                  </span>
                )}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface DropdownButtonProps {
  children: ReactNode;
  items: DropdownItem[];
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function DropdownButton({
  children,
  items,
  variant = 'secondary',
  size = 'md',
  className,
}: DropdownButtonProps) {
  const sizeClasses = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  };

  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'border border-border bg-background hover:bg-muted',
    ghost: 'hover:bg-muted',
  };

  return (
    <Dropdown
      items={items}
      trigger={
        <span
          className={cn(
            'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
            sizeClasses[size],
            variantClasses[variant],
            className
          )}
        >
          {children}
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </span>
      }
    />
  );
}

export { Dropdown, DropdownButton };
export type { DropdownProps, DropdownItem };
