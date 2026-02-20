import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, X, Loader2 } from 'lucide-react';
import MitreTechniqueSelector from './MitreTechniqueSelector';

interface ReportFormProps {
  onSubmit: (data: {
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
  }) => void;
  isSubmitting: boolean;
}

export default function ReportForm({ onSubmit, isSubmitting }: ReportFormProps) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [executiveSummary, setExecutiveSummary] = useState('');
  const [threatActors, setThreatActors] = useState<Array<{ name: string; description: string }>>([{ name: '', description: '' }]);
  const [mitreTechniques, setMitreTechniques] = useState<string[]>([]);
  const [customMitreTechniques, setCustomMitreTechniques] = useState<string[]>([]);
  const [iocs, setIocs] = useState<string[]>(['']);
  const [findings, setFindings] = useState<string[]>(['']);
  const [timeline, setTimeline] = useState('');
  const [attackVector, setAttackVector] = useState('');
  const [evidenceCollection, setEvidenceCollection] = useState('');
  const [affectedSystems, setAffectedSystems] = useState('');
  const [remediationActions, setRemediationActions] = useState('');
  const [recommendations, setRecommendations] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !author.trim() || !executiveSummary.trim() || 
        !timeline.trim() || !attackVector.trim() || !evidenceCollection.trim() ||
        !affectedSystems.trim() || !remediationActions.trim() || !recommendations.trim()) {
      return;
    }

    onSubmit({
      title,
      author,
      executiveSummary,
      threatActors: threatActors.filter((ta) => ta.name.trim() && ta.description.trim()),
      mitreTechniques,
      customMitreTechniques,
      iocs: iocs.filter((ioc) => ioc.trim()),
      findings: findings.filter((f) => f.trim()),
      timeline,
      attackVector,
      evidenceCollection,
      affectedSystems,
      remediationActions,
      recommendations,
    });
  };

  const addThreatActor = () => {
    setThreatActors([...threatActors, { name: '', description: '' }]);
  };

  const removeThreatActor = (index: number) => {
    setThreatActors(threatActors.filter((_, i) => i !== index));
  };

  const updateThreatActor = (index: number, field: 'name' | 'description', value: string) => {
    const updated = [...threatActors];
    updated[index][field] = value;
    setThreatActors(updated);
  };

  const addIoc = () => {
    setIocs([...iocs, '']);
  };

  const removeIoc = (index: number) => {
    setIocs(iocs.filter((_, i) => i !== index));
  };

  const updateIoc = (index: number, value: string) => {
    const updated = [...iocs];
    updated[index] = value;
    setIocs(updated);
  };

  const addFinding = () => {
    setFindings([...findings, '']);
  };

  const removeFinding = (index: number) => {
    setFindings(findings.filter((_, i) => i !== index));
  };

  const updateFinding = (index: number, value: string) => {
    const updated = [...findings];
    updated[index] = value;
    setFindings(updated);
  };

  const isFormValid = title.trim() && author.trim() && executiveSummary.trim() &&
    timeline.trim() && attackVector.trim() && evidenceCollection.trim() &&
    affectedSystems.trim() && remediationActions.trim() && recommendations.trim();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">
            Report Title <span className="text-destructive">*</span>
          </Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., APT29 Phishing Campaign Analysis" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="author">
            Author <span className="text-destructive">*</span>
          </Label>
          <Input id="author" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Your name" required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="executiveSummary">
          Executive Summary <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="executiveSummary"
          value={executiveSummary}
          onChange={(e) => setExecutiveSummary(e.target.value)}
          placeholder="Provide a high-level overview of the threat hunting activity and key findings..."
          rows={4}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="timeline">
          Timeline of Events <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="timeline"
          value={timeline}
          onChange={(e) => setTimeline(e.target.value)}
          placeholder="Describe the chronological sequence of events, including initial detection, investigation phases, and key milestones..."
          rows={4}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="attackVector">
          Attack Vector Analysis <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="attackVector"
          value={attackVector}
          onChange={(e) => setAttackVector(e.target.value)}
          placeholder="Detail how the threat actor gained initial access, lateral movement techniques, and exploitation methods..."
          rows={4}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="evidenceCollection">
          Evidence Collection Details <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="evidenceCollection"
          value={evidenceCollection}
          onChange={(e) => setEvidenceCollection(e.target.value)}
          placeholder="Document evidence sources, collection methods, forensic artifacts, logs analyzed, and preservation procedures..."
          rows={4}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="affectedSystems">
          Affected Systems/Assets <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="affectedSystems"
          value={affectedSystems}
          onChange={(e) => setAffectedSystems(e.target.value)}
          placeholder="List all compromised or affected systems, servers, endpoints, network segments, and critical assets..."
          rows={4}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="remediationActions">
          Remediation Actions Taken <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="remediationActions"
          value={remediationActions}
          onChange={(e) => setRemediationActions(e.target.value)}
          placeholder="Describe containment measures, eradication steps, system hardening, and recovery procedures implemented..."
          rows={4}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="recommendations">
          Recommendations for Future Prevention <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="recommendations"
          value={recommendations}
          onChange={(e) => setRecommendations(e.target.value)}
          placeholder="Provide strategic and tactical recommendations to prevent similar incidents, including security controls, monitoring improvements, and policy changes..."
          rows={4}
          required
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Threat Actors</Label>
          <Button type="button" variant="outline" size="sm" onClick={addThreatActor}>
            <Plus className="h-4 w-4 mr-1" />
            Add Actor
          </Button>
        </div>
        {threatActors.map((actor, index) => (
          <Card key={index} className="bg-accent/5">
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-3">
                  <Input value={actor.name} onChange={(e) => updateThreatActor(index, 'name', e.target.value)} placeholder="Threat actor name (e.g., APT29, Lazarus Group)" />
                  <Textarea
                    value={actor.description}
                    onChange={(e) => updateThreatActor(index, 'description', e.target.value)}
                    placeholder="Description of the threat actor and their activities..."
                    rows={2}
                  />
                </div>
                {threatActors.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeThreatActor(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-2">
        <Label>MITRE ATT&CK Techniques</Label>
        <MitreTechniqueSelector 
          selectedTechniques={mitreTechniques} 
          onTechniquesChange={setMitreTechniques}
          customTechniques={customMitreTechniques}
          onCustomTechniquesChange={setCustomMitreTechniques}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Indicators of Compromise (IOCs)</Label>
          <Button type="button" variant="outline" size="sm" onClick={addIoc}>
            <Plus className="h-4 w-4 mr-1" />
            Add IOC
          </Button>
        </div>
        {iocs.map((ioc, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input value={ioc} onChange={(e) => updateIoc(index, e.target.value)} placeholder="e.g., 192.168.1.100, malicious.exe, example.com" className="font-mono text-sm" />
            {iocs.length > 1 && (
              <Button type="button" variant="ghost" size="icon" onClick={() => removeIoc(index)}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Detailed Findings</Label>
          <Button type="button" variant="outline" size="sm" onClick={addFinding}>
            <Plus className="h-4 w-4 mr-1" />
            Add Finding
          </Button>
        </div>
        {findings.map((finding, index) => (
          <div key={index} className="flex items-start gap-2">
            <Textarea value={finding} onChange={(e) => updateFinding(index, e.target.value)} placeholder="Describe a specific finding or observation..." rows={3} />
            {findings.length > 1 && (
              <Button type="button" variant="ghost" size="icon" onClick={() => removeFinding(index)}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit" disabled={isSubmitting || !isFormValid}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Create Report'
          )}
        </Button>
      </div>
    </form>
  );
}
