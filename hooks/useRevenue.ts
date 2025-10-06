import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { RevenueMetrics, RevenueAssumptions } from '@/lib/calculations/revenue';

interface RevenueData {
  projections: RevenueMetrics[];
  assumptions: RevenueAssumptions;
}

export function useRevenue(scenarioId: string, years: number = 10) {
  return useQuery({
    queryKey: ['revenue', scenarioId, years],
    queryFn: async (): Promise<RevenueData> => {
      const response = await fetch(`/api/revenue?scenarioId=${scenarioId}&years=${years}`);
      if (!response.ok) throw new Error('Failed to fetch revenue data');
      return response.json();
    },
  });
}

export function useUpdateRevenue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { scenarioId: string; assumptions: Partial<RevenueAssumptions> }) => {
      const response = await fetch('/api/revenue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update revenue');
      return response.json();
    },
    // Optimistic update
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ['revenue', newData.scenarioId] });
      const previousData = queryClient.getQueryData(['revenue', newData.scenarioId]);

      queryClient.setQueryData(['revenue', newData.scenarioId], (old: any) => ({
        ...old,
        assumptions: { ...old?.assumptions, ...newData.assumptions },
      }));

      return { previousData };
    },
    onError: (_err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['revenue', variables.scenarioId], context.previousData);
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ['revenue', variables.scenarioId] });
      // Also invalidate financials since revenue affects them
      queryClient.invalidateQueries({ queryKey: ['financials', variables.scenarioId] });
    },
  });
}
