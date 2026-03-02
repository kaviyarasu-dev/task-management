import { useState, useMemo } from 'react';
import { MessageSquare, AlertCircle } from 'lucide-react';
import { useComments } from '../hooks/useComments';
import {
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
} from '../hooks/useCommentMutations';
import { useCommentRealtime } from '../hooks/useCommentRealtime';
import { CommentItem } from './CommentItem';
import { CommentForm } from './CommentForm';
import { CommentSkeleton } from './CommentSkeleton';
import type { Comment } from '../types/comment.types';

interface CommentListProps {
  taskId: string;
}

export function CommentList({ taskId }: CommentListProps) {
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  // Fetch comments
  const {
    data,
    isLoading,
    isError,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useComments(taskId);

  // Mutations
  const createComment = useCreateComment(taskId);
  const updateComment = useUpdateComment(taskId);
  const deleteComment = useDeleteComment(taskId);

  // Real-time updates
  useCommentRealtime(taskId);

  // Flatten paginated data
  const comments = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data]
  );

  const totalCount = data?.pages[0]?.total ?? 0;

  const handleCreateComment = (content: string) => {
    createComment.mutate({ content });
  };

  const handleUpdateComment = (content: string) => {
    if (!editingComment) return;

    updateComment.mutate(
      { commentId: editingComment._id, data: { content } },
      {
        onSuccess: () => setEditingComment(null),
      }
    );
  };

  const handleDeleteComment = (commentId: string) => {
    setDeletingCommentId(commentId);
    deleteComment.mutate(commentId, {
      onSettled: () => setDeletingCommentId(null),
    });
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <MessageSquare className="h-4 w-4" />
          Comments
        </div>
        <CommentSkeleton count={2} />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <MessageSquare className="h-4 w-4" />
          Comments
        </div>
        <div className="flex items-center gap-2 p-4 rounded-md bg-destructive/10 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">
            {error instanceof Error ? error.message : 'Failed to load comments'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <MessageSquare className="h-4 w-4" />
        Comments
        {totalCount > 0 && (
          <span className="text-muted-foreground">({totalCount})</span>
        )}
      </div>

      {/* Comment form (create new) */}
      {!editingComment && (
        <CommentForm
          taskId={taskId}
          onSubmit={handleCreateComment}
          isSubmitting={createComment.isPending}
        />
      )}

      {/* Comments list */}
      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment._id}>
              {editingComment?._id === comment._id ? (
                <CommentForm
                  taskId={taskId}
                  editingComment={editingComment}
                  onSubmit={handleUpdateComment}
                  onCancelEdit={handleCancelEdit}
                  isSubmitting={updateComment.isPending}
                />
              ) : (
                <CommentItem
                  comment={comment}
                  onEdit={setEditingComment}
                  onDelete={handleDeleteComment}
                  isDeleting={deletingCommentId === comment._id}
                />
              )}
            </div>
          ))}

          {/* Load more button */}
          {hasNextPage && (
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="w-full py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              {isFetchingNextPage ? 'Loading...' : 'Load more comments'}
            </button>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No comments yet. Be the first to comment!
        </p>
      )}
    </div>
  );
}
