import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Report } from '@/backend';

export function useGetAllReports() {
  const { actor, isFetching } = useActor();

  return useQuery<Report[]>({
    queryKey: ['reports'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllReports();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetReport(id: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Report>({
    queryKey: ['report', id.toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.getReport(id);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveReport() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      author: string;
      executiveSummary: string;
      threatActorNames: string[];
      threatActorDescriptions: string[];
      mitreTechniques: string[];
      iocs: string[];
      findings: string[];
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.saveReport(
        data.title,
        data.author,
        data.executiveSummary,
        data.threatActorNames,
        data.threatActorDescriptions,
        data.mitreTechniques,
        data.iocs,
        data.findings
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useDeleteReport() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.deleteReport(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}
