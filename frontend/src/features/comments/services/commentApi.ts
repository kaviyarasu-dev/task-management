import { api } from '@/shared/lib/axios';
import type { ApiResponse, PaginatedResponse } from '@/shared/types/api.types';
import type {
  Comment,
  CreateCommentData,
  UpdateCommentData,
  CommentFilters,
} from '../types/comment.types';

export const commentApi = {
  /**
   * Get comments for a task with pagination
   */
  listByTask: async (
    taskId: string,
    filters: CommentFilters = {}
  ): Promise<PaginatedResponse<Comment>> => {
    const params = new URLSearchParams();
    if (filters.parentId !== undefined) {
      params.append('parentId', filters.parentId ?? '');
    }
    if (filters.cursor) params.append('cursor', filters.cursor);
    if (filters.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const url = `/tasks/${taskId}/comments${queryString ? `?${queryString}` : ''}`;
    const response = await api.get<PaginatedResponse<Comment>>(url);
    return response.data;
  },

  /**
   * Get a single comment by ID
   */
  getById: async (commentId: string): Promise<ApiResponse<Comment>> => {
    const response = await api.get<ApiResponse<Comment>>(`/comments/${commentId}`);
    return response.data;
  },

  /**
   * Create a new comment on a task
   */
  create: async (
    taskId: string,
    data: CreateCommentData
  ): Promise<ApiResponse<Comment>> => {
    const response = await api.post<ApiResponse<Comment>>(
      `/tasks/${taskId}/comments`,
      data
    );
    return response.data;
  },

  /**
   * Update an existing comment
   */
  update: async (
    commentId: string,
    data: UpdateCommentData
  ): Promise<ApiResponse<Comment>> => {
    const response = await api.patch<ApiResponse<Comment>>(
      `/comments/${commentId}`,
      data
    );
    return response.data;
  },

  /**
   * Delete a comment (soft delete)
   */
  delete: async (commentId: string): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/comments/${commentId}`);
    return response.data;
  },
};
