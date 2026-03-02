import { useEffect, useRef } from 'react';
import type { User } from '@/shared/types/entities.types';
import { UserAvatar } from './UserAvatar';
import { cn } from '@/shared/lib/utils';

interface MentionSuggestionsProps {
  query: string;
  users: User[];
  onSelect: (user: User) => void;
  onClose: () => void;
  position: { top: number; left: number };
  selectedIndex: number;
}

export function MentionSuggestions({
  query,
  users,
  onSelect,
  onClose,
  position,
  selectedIndex,
}: MentionSuggestionsProps) {
  const listRef = useRef<HTMLUListElement>(null);

  // Filter users based on query
  const filteredUsers = users.filter((user) => {
    const searchQuery = query.toLowerCase();
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const email = user.email.toLowerCase();
    return fullName.includes(searchQuery) || email.includes(searchQuery);
  });

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const selectedItem = listRef.current.children[selectedIndex] as HTMLElement;
      selectedItem?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (filteredUsers.length === 0) {
    return null;
  }

  return (
    <ul
      ref={listRef}
      className="absolute z-50 max-h-48 min-w-[200px] overflow-auto rounded-md border bg-popover p-1 shadow-md"
      style={{ top: position.top, left: position.left }}
      role="listbox"
    >
      {filteredUsers.map((user, index) => (
        <li
          key={user._id}
          role="option"
          aria-selected={index === selectedIndex}
          className={cn(
            'flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm',
            index === selectedIndex && 'bg-accent'
          )}
          onClick={() => onSelect(user)}
          onMouseEnter={() => {
            // Parent component can track hover index if needed
          }}
        >
          <UserAvatar
            firstName={user.firstName}
            lastName={user.lastName}
            size="sm"
          />
          <div className="flex flex-col">
            <span className="font-medium">
              {user.firstName} {user.lastName}
            </span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
