import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { DiagramState } from '@/backend';

export function useSaveDiagramState() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, state }: { name: string; state: DiagramState }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.saveDiagramState(name, state);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagramState'] });
      queryClient.invalidateQueries({ queryKey: ['allDiagrams'] });
    },
  });
}
