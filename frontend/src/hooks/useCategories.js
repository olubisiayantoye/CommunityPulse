import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feedbackApi } from '../lib/api';

export function useCategories() {
  const queryClient = useQueryClient();

  const {  categories, isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: feedbackApi.getCategories
  });

  const createMutation = useMutation({
    mutationFn: feedbackApi.categories.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => feedbackApi.categories.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: feedbackApi.categories.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });

  return {
    categories,
    isLoading,
    error,
    createCategory: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateCategory: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteCategory: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending
  };
}