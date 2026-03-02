/**
 * Comment author - minimal user info populated from backend
 */
export interface CommentAuthor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

/**
 * Mentioned user in a comment
 */
export interface CommentMention {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

/**
 * Comment entity returned from the API
 */
export interface Comment {
  _id: string;
  taskId: string;
  authorId: string;
  author: CommentAuthor;
  content: string;
  mentions: CommentMention[];
  editedAt?: string;
  parentId?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Data required to create a new comment
 */
export interface CreateCommentData {
  content: string;
  parentId?: string;
}

/**
 * Data required to update a comment
 */
export interface UpdateCommentData {
  content: string;
}

/**
 * Filters for listing comments
 */
export interface CommentFilters {
  parentId?: string | null;
  cursor?: string;
  limit?: number;
}
