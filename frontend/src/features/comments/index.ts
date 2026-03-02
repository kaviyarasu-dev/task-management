// Types
export type {
  Comment,
  CommentAuthor,
  CommentMention,
  CreateCommentData,
  UpdateCommentData,
  CommentFilters,
} from './types/comment.types';

// Validators
export {
  createCommentSchema,
  updateCommentSchema,
  type CreateCommentInput,
  type UpdateCommentInput,
} from './validators/comment.validators';

// API
export { commentApi } from './services/commentApi';

// Hooks
export { useComments, commentKeys } from './hooks/useComments';
export {
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
} from './hooks/useCommentMutations';
export { useCommentRealtime } from './hooks/useCommentRealtime';

// Components
export { CommentList } from './components/CommentList';
export { CommentItem } from './components/CommentItem';
export { CommentForm } from './components/CommentForm';
export { CommentSkeleton } from './components/CommentSkeleton';
