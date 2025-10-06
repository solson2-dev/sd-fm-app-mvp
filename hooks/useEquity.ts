import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CapTableEntry } from '@/lib/calculations/equity';
import type { FounderData, FundingRoundData, EquityMutationData, EquityQueryData } from '@/lib/types/database';

interface EquityData {
  capTable: CapTableEntry[];
  founders: FounderData[];
  esopPoolSize: number;
  fundingRounds: FundingRoundData[];
}

export function useEquity(scenarioId: string) {
  return useQuery({
    queryKey: ['equity', scenarioId],
    queryFn: async (): Promise<EquityData> => {
      const response = await fetch(`/api/equity?scenarioId=${scenarioId}`);
      if (!response.ok) throw new Error('Failed to fetch equity data');
      return response.json();
    },
  });
}

export function useUpdateEquity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EquityMutationData) => {
      const response = await fetch('/api/equity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update equity');
      return response.json();
    },
    // Optimistic update
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ['equity', newData.scenarioId] });
      const previousData = queryClient.getQueryData(['equity', newData.scenarioId]);

      queryClient.setQueryData(['equity', newData.scenarioId], (old: EquityQueryData | undefined) => ({
        ...old,
        capTable: old?.capTable || [],
        fundingRounds: old?.fundingRounds || [],
        founders: newData.founders,
        esopPoolSize: newData.esopPoolSize,
      }));

      return { previousData };
    },
    onError: (_err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['equity', variables.scenarioId], context.previousData);
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ['equity', variables.scenarioId] });
    },
  });
}
