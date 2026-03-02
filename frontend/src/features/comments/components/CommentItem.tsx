import { useState } from 'react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { UserAvatar } from '@/shared/components/UserAvatar';
import { formatRelativeTime } from '@/shared/lib/utils';
import { useAuthStore } from '@/features/auth/stores/authStore';
import type { Comment } from '../types/comment.types';

interface CommentItemProps {
  comment: Comment;
  onEdit: (comment: Comment) => void;
  onDelete: (commentId: string) => void;
  isDeleting?: boolean;
}

export function CommentItem({
  comment,
  onEdit,
  onDelete,
  isDeleting = false,
}: CommentItemProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const user = useAuthStore((state) => state.user);

  const isAuthor = user?._id === comment.authorId;
  const isAdmin = user?.role === 'owner' || user?.role === 'admin';
  const canModify = isAuthor || isAdmin;

  const handleEdit = () => {
    setIsMenuOpen(false);
    onEdit(comment);
  };

  const handleDelete = () => {
    setIsMenuOpen(false);
    onDelete(comment._id);
  };

  // Render @mentions with highlighting
  const renderContent = (content: string) => {
    const mentionPattern = /@([\w.-]+)/g;
    const parts = content.split(mentionPattern);

    return parts.map((part, index) => {
      // Odd indices are the captured mention usernames
      if (index % 2 === 1) {
        return (
          <span key={index} className="text-primary font-medium">
            @{part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div
      className={`flex gap-3 ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
    >
      {/* Avatar */}
      <UserAvatar
        firstName={comment.author.firstName}
        lastName={comment.author.lastName}
        size="md"
        className="flex-shrink-0"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-medium text-sm text-foreground truncate">
              {comment.author.firstName} {comment.author.lastName}
            </span>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {formatRelativeTime(comment.createdAt)}
            </span>
            {comment.editedAt && (
              <span className="text-xs text-muted-foreground flex-shrink-0">
                (edited)
              </span>
            )}
          </div>

          {/* Actions menu */}
          {canModify && (
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                aria-label="Comment actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>

              {isMenuOpen && (
                <>
                  {/* Backdrop to close menu */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsMenuOpen(false)}
                  />

                  {/* Dropdown menu */}
                  <div className="absolute right-0 top-full mt-1 z-20 min-w-[120px] rounded-md border border-border bg-background shadow-md py-1">
                    <button
                      onClick={handleEdit}
                      className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-foreground hover:bg-muted"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-destructive hover:bg-muted"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Body */}
        <p className="text-sm text-foreground mt-1 whitespace-pre-wrap break-words">
          {renderContent(comment.content)}
        </p>
      </div>
    </div>
  );
}
