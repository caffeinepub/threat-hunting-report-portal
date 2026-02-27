import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import { NamedDiagram } from '../backend';

export function useGetAllDiagrams() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<NamedDiagram[]>({
    queryKey: ['allDiagrams'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllDiagrams();
    },
    enabled: !!actor && !actorFetching,
    refetchOnMount: true,
    staleTime: 0,
  });
}
