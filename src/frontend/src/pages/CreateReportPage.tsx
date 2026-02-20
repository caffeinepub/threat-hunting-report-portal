import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
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
    iocs: string[];
    findings: string[];
  }) => {
    try {
      await saveReport.mutateAsync({
        title: data.title,
        author: data.author,
        executiveSummary: data.executiveSummary,
        threatActorNames: data.threatActors.map((ta) => ta.name),
        threatActorDescriptions: data.threatActors.map((ta) => ta.description),
        mitreTechniques: data.mitreTechniques,
        iocs: data.iocs,
        findings: data.findings,
      });
      toast.success('Report created successfully');
      navigate({ to: '/' });
    } catch (error) {
      toast.error('Failed to create report');
      console.error(error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create Threat Hunting Report
          </CardTitle>
          <CardDescription>Document your threat hunting findings with MITRE ATT&CK techniques and IOCs</CardDescription>
        </CardHeader>
        <CardContent>
          <ReportForm onSubmit={handleSubmit} isSubmitting={saveReport.isPending} />
        </CardContent>
      </Card>
    </div>
  );
}
