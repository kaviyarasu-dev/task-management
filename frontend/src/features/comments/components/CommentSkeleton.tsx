interface CommentSkeletonProps {
  count?: number;
}

function SingleCommentSkeleton() {
  return (
    <div className="flex gap-3 animate-pulse">
      {/* Avatar */}
      <div className="h-8 w-8 rounded-full bg-muted flex-shrink-0" />

      {/* Content */}
      <div className="flex-1 space-y-2">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="h-3 w-16 rounded bg-muted" />
        </div>

        {/* Body */}
        <div className="space-y-1.5">
          <div className="h-3 w-full rounded bg-muted" />
          <div className="h-3 w-3/4 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

export function CommentSkeleton({ count = 3 }: CommentSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SingleCommentSkeleton key={i} />
      ))}
    </div>
  );
}
