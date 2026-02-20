import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useGetDiagramState } from '@/hooks/useGetDiagramState';
import { Loader2, Calendar } from 'lucide-react';
import type { PlacedIcon, Connection, DrawingPath, TextLabel } from '@/hooks/useAttackPathState';

interface LoadDiagramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoad: (state: { placedIcons: PlacedIcon[]; connections: Connection[]; drawings: DrawingPath[]; textLabels: TextLabel[] }) => void;
}

export default function LoadDiagramDialog({ open, onOpenChange, onLoad }: LoadDiagramDialogProps) {
  const { data: diagramState, isLoading, error } = useGetDiagramState();

  const handleLoad = () => {
    if (!diagramState) return;

    // Convert backend DiagramState to frontend state
    const placedIcons: PlacedIcon[] = diagramState.icons.map((icon) => ({
      id: icon.id,
      type: icon.iconType as any,
      x: icon.position.x,
      y: icon.position.y,
      width: 48,
      height: 48,
    }));

    const connections: Connection[] = diagramState.connections.map((conn, index) => ({
      id: `conn-${index}`,
      sourceId: conn.sourceId,
      targetId: conn.targetId,
    }));

    const freehandDrawings: DrawingPath[] = diagramState.freehandDrawings.map((drawing, index) => ({
      id: `freehand-${index}`,
      type: 'freehand',
      points: drawing.points.map((p) => ({ x: p.x, y: p.y })),
    }));

    const lineDrawings: DrawingPath[] = diagramState.lines.map((line, index) => ({
      id: `line-${index}`,
      type: line.isArrow ? 'arrow' : 'line',
      points: [line.startPosition, line.endPosition],
    }));

    const drawings: DrawingPath[] = [...freehandDrawings, ...lineDrawings];

    const textLabels: TextLabel[] = diagramState.textLabels.map((label, index) => ({
      id: `text-${index}`,
      text: label.content,
      x: label.position.x,
      y: label.position.y,
      color: label.color,
      rotation: 0,
      width: undefined,
      height: undefined,
    }));

    onLoad({ placedIcons, connections, drawings, textLabels });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Load Diagram</DialogTitle>
          <DialogDescription>
            Load your previously saved attack path diagram
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-destructive">
              <p>Failed to load diagram</p>
            </div>
          )}

          {!isLoading && !error && !diagramState && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No saved diagram found</p>
            </div>
          )}

          {!isLoading && !error && diagramState && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Last modified: {new Date(Number(diagramState.lastModified)).toLocaleString()}
                  </span>
                </div>
                <div className="text-sm space-y-1">
                  <p>Icons: {diagramState.icons.length}</p>
                  <p>Connections: {diagramState.connections.length}</p>
                  <p>Drawings: {diagramState.freehandDrawings.length + diagramState.lines.length}</p>
                  <p>Text Labels: {diagramState.textLabels.length}</p>
                </div>
              </div>

              <Button onClick={handleLoad} className="w-full">
                Load Diagram
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
