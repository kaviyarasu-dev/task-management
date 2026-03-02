import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { cn } from '@/shared/lib/utils';
import type { User } from '@/shared/types/entities.types';

interface UserSelectProps {
  users: User[];
  value?: string | null;
  onChange: (userId: string | null) => void;
  placeholder?: string;
  allowClear?: boolean;
  disabled?: boolean;
  className?: string;
}

export function UserSelect({
  users,
  value,
  onChange,
  placeholder = 'Select user...',
  allowClear = true,
  disabled = false,
  className,
}: UserSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedUser = users.find((u) => u._id === value);
  const filteredUsers = users.filter(
    (u) =>
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (userId: string) => {
    onChange(userId);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm',
          'focus:outline-none focus:ring-2 focus:ring-primary/50',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        {selectedUser ? (
          <div className="flex items-center gap-2">
            <UserAvatar
              firstName={selectedUser.firstName}
              lastName={selectedUser.lastName}
              size="sm"
            />
            <span>
              {selectedUser.firstName} {selectedUser.lastName}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <div className="flex items-center gap-1">
          {allowClear && selectedUser && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded p-0.5 hover:bg-muted"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-background shadow-lg">
          <div className="p-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full rounded border border-border bg-background py-1.5 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">No users found</div>
            ) : (
              filteredUsers.map((user) => (
                <button
                  key={user._id}
                  type="button"
                  onClick={() => handleSelect(user._id)}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted',
                    value === user._id && 'bg-muted'
                  )}
                >
                  <UserAvatar firstName={user.firstName} lastName={user.lastName} size="sm" />
                  <div className="text-left">
                    <div className="font-medium">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
