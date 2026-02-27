import React from 'react';
import { Trash2, FolderOpen, Network, GitBranch, Image as ImageIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGetAllDiagrams } from '../hooks/useGetAllDiagrams';
import { useDeleteDiagramState } from '../hooks/useDeleteDiagramState';
import { NamedDiagram } from '../backend';

interface LoadDiagramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoad: (diagram: NamedDiagram) => void;
}

export default function LoadDiagramDialog({ open, onOpenChange, onLoad }: LoadDiagramDialogProps) {
  const { data: diagrams = [], isLoading } = useGetAllDiagrams();
  const deleteMutation = useDeleteDiagramState();
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<number | null>(null);

  const handleLoad = (diagram: NamedDiagram) => {
    onLoad(diagram);
    onOpenChange(false);
  };

  const handleDelete = (index: number) => {
    if (confirmDeleteId === index) {
      deleteMutation.mutate(BigInt(index));
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(index);
    }
  };

  const formatDate = (lastModified: bigint) => {
    const date = new Date(Number(lastModified));
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleDragStart = (e: React.DragEvent<HTMLImageElement>, diagram: NamedDiagram) => {
    e.dataTransfer.setData('diagramState', JSON.stringify(diagram));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Load Diagram</DialogTitle>
          <DialogDescription>
            Click Load to open a diagram, or drag the thumbnail preview onto the canvas.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            Loading diagrams...
          </div>
        ) : diagrams.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm gap-2">
            <Network className="w-8 h-8 opacity-40" />
            <span>No saved diagrams yet</span>
          </div>
        ) : (
          <ScrollArea className="flex-1 min-h-0">
            <div className="grid grid-cols-2 gap-3 p-1">
              {diagrams.map((diagram, index) => (
                <div
                  key={index}
                  draggable={false}
                  className="rounded-lg border border-border bg-card overflow-hidden"
                >
                  {/* Thumbnail — only this <img> is draggable */}
                  <div className="relative bg-muted/30 h-28 overflow-hidden border-b border-border">
                    <img
                      src="/assets/generated/hero-banner.dim_1200x400.png"
                      alt={`${diagram.name} preview`}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, diagram)}
                      className="w-full h-full object-cover opacity-50 cursor-grab active:cursor-grabbing select-none"
                      title="Drag onto canvas to load this diagram"
                    />
                    {/* Stats overlay — not draggable */}
                    <div
                      draggable={false}
                      className="absolute inset-0 flex flex-col items-center justify-center gap-1 pointer-events-none"
                    >
                      <div className="flex gap-3 text-xs font-medium text-foreground/90 bg-background/75 rounded px-2 py-1">
                        <span className="flex items-center gap-1">
                          <Network className="w-3 h-3" />
                          {diagram.state.icons.length} icons
                        </span>
                        <span className="flex items-center gap-1">
                          <GitBranch className="w-3 h-3" />
                          {diagram.state.connections.length}
                        </span>
                        {diagram.state.images.length > 0 && (
                          <span className="flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" />
                            {diagram.state.images.length}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground bg-background/60 rounded px-1">
                        drag to canvas
                      </span>
                    </div>
                  </div>

                  {/* Card body — not draggable */}
                  <div draggable={false} className="p-3">
                    <p
                      draggable={false}
                      className="text-sm font-semibold text-foreground truncate mb-0.5"
                      title={diagram.name}
                    >
                      {diagram.name}
                    </p>
                    <p draggable={false} className="text-xs text-muted-foreground mb-2">
                      {formatDate(diagram.state.lastModified)}
                    </p>
                    <div draggable={false} className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-7 text-xs"
                        onClick={() => handleLoad(diagram)}
                      >
                        <FolderOpen className="w-3 h-3 mr-1" />
                        Load
                      </Button>
                      <Button
                        size="sm"
                        variant={confirmDeleteId === index ? 'destructive' : 'ghost'}
                        className="h-7 w-7 p-0"
                        onClick={() => handleDelete(index)}
                        title={confirmDeleteId === index ? 'Click again to confirm' : 'Delete'}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
