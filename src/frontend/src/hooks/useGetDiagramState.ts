import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { DiagramState } from '@/backend';

export function useGetDiagramState() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<DiagramState | null>({
    queryKey: ['diagramState'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getDiagramState();
    },
    enabled: !!actor && !actorFetching,
  });
}
