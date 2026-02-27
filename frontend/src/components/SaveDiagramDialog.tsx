import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SaveDiagramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string) => void;
  isSaving: boolean;
}

export default function SaveDiagramDialog({ open, onOpenChange, onSave, isSaving }: SaveDiagramDialogProps) {
  const [diagramName, setDiagramName] = useState('');

  const handleSave = () => {
    if (diagramName.trim()) {
      onSave(diagramName.trim());
      setDiagramName('');
    }
  };

  const handleCancel = () => {
    setDiagramName('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Diagram</DialogTitle>
          <DialogDescription>
            Enter a name for your attack path diagram
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="diagram-name">Diagram Name</Label>
            <Input
              id="diagram-name"
              placeholder="e.g., Phishing Attack Path"
              value={diagramName}
              onChange={(e) => setDiagramName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && diagramName.trim()) {
                  handleSave();
                }
              }}
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!diagramName.trim() || isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
