import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';

export function useDeleteDiagramState() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (diagramId: bigint) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.deleteDiagramState(diagramId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allDiagrams'] });
    },
  });
}
