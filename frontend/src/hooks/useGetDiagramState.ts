import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { NamedDiagram } from '@/backend';

export function useGetDiagramState(id: bigint) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<NamedDiagram | null>({
    queryKey: ['diagramState', id.toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getDiagramStateById(id);
    },
    enabled: !!actor && !actorFetching,
  });
}
