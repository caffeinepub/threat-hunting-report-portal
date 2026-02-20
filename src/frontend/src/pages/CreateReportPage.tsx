import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ReportForm from '@/components/ReportForm';
import { useSaveReport } from '@/hooks/useQueries';
import { toast } from 'sonner';

export default function CreateReportPage() {
  const navigate = useNavigate();
  const saveReport = useSaveReport();

  const handleSubmit = async (data: {
    title: string;
    author: string;
    executiveSummary: string;
    threatActors: Array<{ name: string; description: string }>;
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
    try {
      await saveReport.mutateAsync({
        title: data.title,
        author: data.author,
        executiveSummary: data.executiveSummary,
        threatActorNames: data.threatActors.map((ta) => ta.name),
        threatActorDescriptions: data.threatActors.map((ta) => ta.description),
        mitreTechniques: data.mitreTechniques,
        customMitreTechniques: data.customMitreTechniques,
        iocs: data.iocs,
        findings: data.findings,
        timeline: data.timeline,
        attackVector: data.attackVector,
        evidenceCollection: data.evidenceCollection,
        affectedSystems: data.affectedSystems,
        remediationActions: data.remediationActions,
        recommendations: data.recommendations,
      });
      toast.success('Report created successfully');
      navigate({ to: '/' });
    } catch (error) {
      console.error('Failed to save report:', error);
      toast.error('Failed to create report. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create Threat Hunt Report</CardTitle>
          <CardDescription>Document your threat hunting activities, findings, and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <ReportForm onSubmit={handleSubmit} isSubmitting={saveReport.isPending} />
        </CardContent>
      </Card>
    </div>
  );
}
