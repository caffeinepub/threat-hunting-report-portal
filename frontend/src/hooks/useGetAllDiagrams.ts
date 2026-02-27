import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { NamedDiagram } from '@/backend';

export function useGetAllDiagrams() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<NamedDiagram[]>({
    queryKey: ['allDiagrams'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAllDiagrams();
    },
    enabled: !!actor && !actorFetching,
  });
}
