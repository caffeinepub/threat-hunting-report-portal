import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { DiagramState } from '@/backend';

export function useSaveDiagramState() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (state: DiagramState) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.saveDiagramState(state);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagramState'] });
    },
  });
}
