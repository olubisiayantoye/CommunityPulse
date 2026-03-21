/**
 * Feedback Hooks - CommunityPulse
 * Reusable hooks for feedback operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feedbackApi } from '../lib/api';

// ===== FEEDBACK LIST HOOK =====
// Note: NO 'export' keyword here - exported at bottom only
function useFeedback(filters = {}) {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, fetchNextPage, hasNextPage } = useQuery({
    queryKey: ['feedback', filters],
    queryFn: ({ pageParam = 1 }) => feedbackApi.list({ ...filters, page: pageParam }),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination?.page < lastPage.pagination?.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1
  });

  const submitMutation = useMutation({
    mutationFn: feedbackApi.submit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => feedbackApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: feedbackApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
    }
  });

  return {
    feedback: data?.pages?.flatMap(p => p.feedback) || [],
    pagination: data?.pages?.[0]?.pagination,
    isLoading,
    isError,
    error,
    hasNextPage,
    fetchNextPage,
    submitFeedback: submitMutation.mutateAsync,
    isSubmitting: submitMutation.isPending,
    updateFeedback: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteFeedback: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending
  };
}

// ===== SINGLE FEEDBACK ITEM HOOK =====
function useFeedbackItem(id) {
  return useQuery({
    queryKey: ['feedback', id],
    queryFn: () => feedbackApi.get(id),
    enabled: !!id
  });
}

// ===== CATEGORIES HOOK =====
function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: feedbackApi.getCategories,
    staleTime: 1000 * 60 * 5
  });
}

// ===== VOTING HOOK =====
function useVoting() {
  const queryClient = useQueryClient();

  const voteMutation = useMutation({
    mutationFn: feedbackApi.vote,
    onSuccess: (_, { feedback_id }) => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      queryClient.invalidateQueries({ queryKey: ['feedback', feedback_id] });
    }
  });

  const removeVoteMutation = useMutation({
    mutationFn: feedbackApi.removeVote,
    onSuccess: (_, feedback_id) => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      queryClient.invalidateQueries({ queryKey: ['feedback', feedback_id] });
    }
  });

  const getUserVote = async (feedbackId) => {
    try {
      return await feedbackApi.getVote(feedbackId);
    } catch {
      return { vote: null };
    }
  };

  return {
    vote: voteMutation.mutateAsync,
    isVoting: voteMutation.isPending,
    removeVote: removeVoteMutation.mutateAsync,
    isRemovingVote: removeVoteMutation.isPending,
    getUserVote
  };
}

// ===== SINGLE EXPORT BLOCK AT BOTTOM =====
// Named exports (for import { useFeedback } from ...)
export {
  useFeedback,
  useFeedbackItem,
  useCategories,
  useVoting
};

// Default export (optional compatibility)
export default {
  useFeedback,
  useFeedbackItem,
  useCategories,
  useVoting
};