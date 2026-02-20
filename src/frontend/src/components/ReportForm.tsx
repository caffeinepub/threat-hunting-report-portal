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
    iocs: string[];
    findings: string[];
  }) => void;
  isSubmitting: boolean;
}

export default function ReportForm({ onSubmit, isSubmitting }: ReportFormProps) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [executiveSummary, setExecutiveSummary] = useState('');
  const [threatActors, setThreatActors] = useState<Array<{ name: string; description: string }>>([{ name: '', description: '' }]);
  const [mitreTechniques, setMitreTechniques] = useState<string[]>([]);
  const [iocs, setIocs] = useState<string[]>(['']);
  const [findings, setFindings] = useState<string[]>(['']);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !author.trim() || !executiveSummary.trim()) {
      return;
    }

    onSubmit({
      title,
      author,
      executiveSummary,
      threatActors: threatActors.filter((ta) => ta.name.trim() && ta.description.trim()),
      mitreTechniques,
      iocs: iocs.filter((ioc) => ioc.trim()),
      findings: findings.filter((f) => f.trim()),
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
        <MitreTechniqueSelector selectedTechniques={mitreTechniques} onTechniquesChange={setMitreTechniques} />
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
        <Button type="submit" disabled={isSubmitting || !title.trim() || !author.trim() || !executiveSummary.trim()}>
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
