import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { generateReportPdf } from '@/utils/pdfGenerator';
import type { DetailedReport } from '@/hooks/useQueries';
import { toast } from 'sonner';

interface PdfGeneratorButtonProps {
  report: DetailedReport;
  children?: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'destructive' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export default function PdfGeneratorButton({ report, children, variant = 'default', size = 'default' }: PdfGeneratorButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePdf = async () => {
    setIsGenerating(true);
    try {
      await generateReportPdf(report);
      toast.success('Opening print dialog for PDF generation');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button variant={variant} size={size} onClick={handleGeneratePdf} disabled={isGenerating}>
      {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </Button>
  );
}
