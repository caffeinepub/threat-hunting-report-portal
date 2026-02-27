import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { DiagramState } from '../backend';

export function useSaveDiagramState() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, state }: { name: string; state: DiagramState }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveDiagramState(name, state);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allDiagrams'] });
      queryClient.invalidateQueries({ queryKey: ['diagramState'] });
    },
  });
}
