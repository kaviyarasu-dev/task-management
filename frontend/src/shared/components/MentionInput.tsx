import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react';
import type { User } from '@/shared/types/entities.types';
import { MentionSuggestions } from './MentionSuggestions';
import { cn } from '@/shared/lib/utils';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  users: User[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onSubmit?: () => void;
}

interface SuggestionState {
  isOpen: boolean;
  query: string;
  startPosition: number;
  position: { top: number; left: number };
}

export function MentionInput({
  value,
  onChange,
  users,
  placeholder = 'Type @ to mention someone...',
  className,
  disabled = false,
  onSubmit,
}: MentionInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [suggestion, setSuggestion] = useState<SuggestionState>({
    isOpen: false,
    query: '',
    startPosition: 0,
    position: { top: 0, left: 0 },
  });

  // Get filtered users for current query
  const filteredUsers = users.filter((user) => {
    const searchQuery = suggestion.query.toLowerCase();
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const email = user.email.toLowerCase();
    return fullName.includes(searchQuery) || email.includes(searchQuery);
  });

  // Calculate caret position for positioning the suggestions dropdown
  const getCaretPosition = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return { top: 0, left: 0 };

    // Create a hidden div to measure text position
    const div = document.createElement('div');
    const style = window.getComputedStyle(textarea);

    // Copy textarea styles to div
    const properties = [
      'fontFamily',
      'fontSize',
      'fontWeight',
      'lineHeight',
      'padding',
      'border',
      'boxSizing',
      'whiteSpace',
      'wordWrap',
      'wordBreak',
    ];
    properties.forEach((prop) => {
      div.style[prop as keyof CSSStyleDeclaration] =
        style[prop as keyof CSSStyleDeclaration];
    });

    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.width = `${textarea.clientWidth}px`;

    // Get text up to cursor
    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);

    // Replace newlines with <br> and add a span at cursor position
    div.innerHTML = textBeforeCursor.replace(/\n/g, '<br>') + '<span id="caret"></span>';

    document.body.appendChild(div);

    const caret = div.querySelector('#caret');
    const caretRect = caret?.getBoundingClientRect();
    const textareaRect = textarea.getBoundingClientRect();

    document.body.removeChild(div);

    if (!caretRect) return { top: 24, left: 0 };

    return {
      top: caretRect.top - textareaRect.top + 20,
      left: Math.min(caretRect.left - textareaRect.left, textarea.clientWidth - 220),
    };
  }, [value]);

  // Handle input change
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      const cursorPosition = e.target.selectionStart;

      onChange(newValue);

      // Check for @ mention trigger
      const textBeforeCursor = newValue.substring(0, cursorPosition);
      const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

      if (mentionMatch) {
        const position = getCaretPosition();
        setSuggestion({
          isOpen: true,
          query: mentionMatch[1],
          startPosition: cursorPosition - mentionMatch[0].length,
          position,
        });
        setSelectedIndex(0);
      } else {
        setSuggestion((prev) => ({ ...prev, isOpen: false }));
      }
    },
    [onChange, getCaretPosition]
  );

  // Handle user selection from suggestions
  const handleSelectUser = useCallback(
    (user: User) => {
      const mentionText = `@${user.firstName}${user.lastName} `;
      const before = value.substring(0, suggestion.startPosition);
      const after = value.substring(
        textareaRef.current?.selectionStart ?? suggestion.startPosition + suggestion.query.length + 1
      );

      const newValue = before + mentionText + after;
      onChange(newValue);

      setSuggestion((prev) => ({ ...prev, isOpen: false }));

      // Focus textarea and set cursor after mention
      setTimeout(() => {
        const newPosition = suggestion.startPosition + mentionText.length;
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(newPosition, newPosition);
      }, 0);
    },
    [value, suggestion.startPosition, suggestion.query.length, onChange]
  );

  // Handle keyboard navigation in suggestions
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (!suggestion.isOpen) {
        // Submit on Ctrl+Enter or Cmd+Enter
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && onSubmit) {
          e.preventDefault();
          onSubmit();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredUsers.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          if (filteredUsers[selectedIndex]) {
            handleSelectUser(filteredUsers[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setSuggestion((prev) => ({ ...prev, isOpen: false }));
          break;
      }
    },
    [suggestion.isOpen, filteredUsers, selectedIndex, handleSelectUser, onSubmit]
  );

  // Close suggestions on blur (with delay for click handling)
  const handleBlur = useCallback(() => {
    setTimeout(() => {
      setSuggestion((prev) => ({ ...prev, isOpen: false }));
    }, 150);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [value]);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'min-h-[80px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        rows={3}
      />
      {suggestion.isOpen && (
        <MentionSuggestions
          query={suggestion.query}
          users={users}
          onSelect={handleSelectUser}
          onClose={() => setSuggestion((prev) => ({ ...prev, isOpen: false }))}
          position={suggestion.position}
          selectedIndex={selectedIndex}
        />
      )}
    </div>
  );
}
