import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { IncomeStatement, CashFlowStatement, BalanceSheet } from '@/lib/calculations/financials';
import type { FinancialsMutationData } from '@/lib/types/database';

interface FinancialsData {
  incomeStatements: IncomeStatement[];
  cashFlows: CashFlowStatement[];
  balanceSheets: BalanceSheet[];
}

export function useFinancials(scenarioId: string, years: number = 10) {
  return useQuery({
    queryKey: ['financials', scenarioId, years],
    queryFn: async (): Promise<FinancialsData> => {
      const response = await fetch(`/api/financials?scenarioId=${scenarioId}&years=${years}`);
      if (!response.ok) throw new Error('Failed to fetch financials');
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpdateFinancials() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: FinancialsMutationData) => {
      const response = await fetch('/api/financials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update financials');
      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['financials', variables.scenarioId] });
    },
  });
}
