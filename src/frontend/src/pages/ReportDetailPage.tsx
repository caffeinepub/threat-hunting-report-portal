import { useParams, Link } from '@tanstack/react-router';
import { useGetReport } from '@/hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Download, Shield, AlertTriangle, Search, FileText, Loader2, AlertCircle, Clock, Target, Database, Server, Wrench, Lightbulb } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PdfGeneratorButton from '@/components/PdfGeneratorButton';
import { mitreAttackData } from '@/data/mitreAttackData';

export default function ReportDetailPage() {
  const { id } = useParams({ from: '/report/$id' });
  const { data: report, isLoading, error } = useGetReport(BigInt(id));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load report. Please try again.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Link>
        </Button>
        <PdfGeneratorButton report={report}>
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </PdfGeneratorButton>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">{report.metadata.title}</CardTitle>
              <CardDescription>
                By {report.metadata.author} • {new Date(Number(report.metadata.date) / 1000000).toLocaleDateString()}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              Threat Hunt Report
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Executive Summary
            </h3>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{report.executiveSummary}</p>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Timeline of Events
            </h3>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{report.timeline}</p>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Target className="h-5 w-5 text-destructive" />
              Attack Vector Analysis
            </h3>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{report.attackVector}</p>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Evidence Collection Details
            </h3>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{report.evidenceCollection}</p>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Server className="h-5 w-5 text-destructive" />
              Affected Systems/Assets
            </h3>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{report.affectedSystems}</p>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              Remediation Actions Taken
            </h3>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{report.remediationActions}</p>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Recommendations for Future Prevention
            </h3>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{report.recommendations}</p>
          </div>

          <Separator />

          {report.threatActors.length > 0 && (
            <>
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-destructive" />
                  Threat Actors
                </h3>
                <div className="space-y-3">
                  {report.threatActors.map((actor, index) => (
                    <Card key={index} className="bg-accent/5">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{actor.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{actor.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {(report.mitreTechniques.length > 0 || report.customMitreTechniques.length > 0) && (
            <>
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  MITRE ATT&CK Techniques
                </h3>
                <div className="space-y-4">
                  {report.mitreTechniques.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-muted-foreground">Predefined Techniques:</p>
                      <div className="grid gap-3">
                        {report.mitreTechniques.map((techniqueId, index) => {
                          const technique = mitreAttackData.find((t) => t.id === techniqueId);
                          return (
                            <Card key={index} className="bg-primary/5 border-primary/20">
                              <CardContent className="pt-4">
                                <div className="flex items-start gap-3">
                                  <Badge variant="outline" className="font-mono text-xs shrink-0">
                                    {techniqueId}
                                  </Badge>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm mb-1">{technique?.name || 'Unknown Technique'}</p>
                                    <p className="text-xs text-muted-foreground">{technique?.description || 'No description available'}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {report.customMitreTechniques.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-muted-foreground">Custom Techniques:</p>
                      <div className="grid gap-2">
                        {report.customMitreTechniques.map((technique, index) => (
                          <Card key={index} className="bg-accent/5 border-accent/20">
                            <CardContent className="pt-4">
                              <p className="text-sm italic text-muted-foreground">{technique}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {report.iocs.length > 0 && (
            <>
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Indicators of Compromise (IOCs)
                </h3>
                <div className="grid gap-2">
                  {report.iocs.map((ioc, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 rounded-md bg-destructive/5 border border-destructive/20">
                      <code className="text-sm font-mono text-destructive flex-1">{ioc}</code>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {report.findings.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Detailed Findings
              </h3>
              <div className="space-y-3">
                {report.findings.map((finding, index) => (
                  <Card key={index} className="bg-accent/5">
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{finding}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
