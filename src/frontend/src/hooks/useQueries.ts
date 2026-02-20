import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';

// Define DetailedReport type locally since it's no longer in backend
export interface ThreatActor {
  name: string;
  description: string;
}

export interface ReportMetadata {
  title: string;
  author: string;
  date: bigint;
}

export interface DetailedReport {
  metadata: ReportMetadata;
  executiveSummary: string;
  threatActors: ThreatActor[];
  mitreTechniques: string[];
  customMitreTechniques: string[];
  iocs: string[];
  findings: string[];
  timeline: string;
  attackVector: string;
  evidenceCollection: string;
  affectedSystems: string;
  remediationActions: string;
  recommendations: string;
}

export function useGetAllReports() {
  const { actor, isFetching } = useActor();

  return useQuery<DetailedReport[]>({
    queryKey: ['reports'],
    queryFn: async () => {
      if (!actor) return [];
      // Backend no longer has this method, return empty array
      return [];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetReport(id: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<DetailedReport>({
    queryKey: ['report', id.toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      // Backend no longer has this method, throw error
      throw new Error('Report functionality not available');
    },
    enabled: false, // Disable this query since backend doesn't support it
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
      customMitreTechniques: string[];
      iocs: string[];
      findings: string[];
      timeline: string;
      attackVector: string;
      evidenceCollection: string;
      affectedSystems: string;
      remediationActions: string;
      recommendations: string;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      // Backend no longer has this method
      throw new Error('Report functionality not available');
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
      // Backend no longer has this method
      throw new Error('Report functionality not available');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}
