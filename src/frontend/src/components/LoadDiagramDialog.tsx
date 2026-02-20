import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useGetAllDiagrams } from '@/hooks/useGetAllDiagrams';
import { Loader2, Calendar, FileText } from 'lucide-react';
import type { PlacedIcon, Connection, DrawingPath, TextLabel } from '@/hooks/useAttackPathState';
import type { NamedDiagram } from '@/backend';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LoadDiagramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoad: (state: { placedIcons: PlacedIcon[]; connections: Connection[]; drawings: DrawingPath[]; textLabels: TextLabel[] }) => void;
}

export default function LoadDiagramDialog({ open, onOpenChange, onLoad }: LoadDiagramDialogProps) {
  const { data: diagrams, isLoading, error } = useGetAllDiagrams();

  const handleLoadDiagram = (diagram: NamedDiagram) => {
    const diagramState = diagram.state;

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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Load Diagram</DialogTitle>
          <DialogDescription>
            Select a saved attack path diagram to load
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-destructive">
              <p>Failed to load diagrams</p>
            </div>
          )}

          {!isLoading && !error && (!diagrams || diagrams.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No saved diagrams found</p>
            </div>
          )}

          {!isLoading && !error && diagrams && diagrams.length > 0 && (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {diagrams.map((diagram, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 hover:bg-accent transition-colors cursor-pointer"
                    onClick={() => handleLoadDiagram(diagram)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <h3 className="font-semibold text-lg">{diagram.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(Number(diagram.state.lastModified)).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Icons: {diagram.state.icons.length}</p>
                          <p>Connections: {diagram.state.connections.length}</p>
                          <p>Drawings: {diagram.state.freehandDrawings.length + diagram.state.lines.length}</p>
                          <p>Text Labels: {diagram.state.textLabels.length}</p>
                        </div>
                      </div>
                      <Button size="sm">Load</Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
