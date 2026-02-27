import React, { useState } from 'react';
import { Trash2, FolderOpen, Network, GitBranch, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGetAllDiagrams } from '../hooks/useGetAllDiagrams';
import { useDeleteDiagramState } from '../hooks/useDeleteDiagramState';
import { NamedDiagram } from '../backend';

interface DiagramSidebarProps {
  onLoad: (diagram: NamedDiagram) => void;
}

export default function DiagramSidebar({ onLoad }: DiagramSidebarProps) {
  const { data: diagrams = [], isLoading } = useGetAllDiagrams();
  const deleteMutation = useDeleteDiagramState();
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        Loading diagrams...
      </div>
    );
  }

  if (diagrams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm gap-2">
        <Network className="w-8 h-8 opacity-40" />
        <span>No saved diagrams</span>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-2">
        {diagrams.map((diagram, index) => (
          <div
            key={index}
            draggable={false}
            className="rounded-lg border border-border bg-card overflow-hidden group"
          >
            {/* Thumbnail — only this element is draggable */}
            <div className="relative bg-muted/30 flex items-center justify-center h-24 overflow-hidden border-b border-border">
              <img
                src="/assets/generated/hero-banner.dim_1200x400.png"
                alt={`${diagram.name} preview`}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, diagram)}
                className="w-full h-full object-cover opacity-60 cursor-grab active:cursor-grabbing select-none"
                style={{ pointerEvents: 'auto' }}
                title="Drag onto canvas to load this diagram"
              />
              {/* Overlay showing diagram stats */}
              <div
                draggable={false}
                className="absolute inset-0 flex flex-col items-center justify-center gap-1 pointer-events-none"
              >
                <div className="flex gap-3 text-xs font-medium text-foreground/80 bg-background/70 rounded px-2 py-1">
                  <span className="flex items-center gap-1">
                    <Network className="w-3 h-3" />
                    {diagram.state.icons.length} icons
                  </span>
                  <span className="flex items-center gap-1">
                    <GitBranch className="w-3 h-3" />
                    {diagram.state.connections.length} conn
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
            <div draggable={false} className="p-2">
              <p
                draggable={false}
                className="text-xs font-semibold text-foreground truncate mb-1"
                title={diagram.name}
              >
                {diagram.name}
              </p>
              <p draggable={false} className="text-[10px] text-muted-foreground mb-2">
                {formatDate(diagram.state.lastModified)}
              </p>
              <div draggable={false} className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-6 text-[10px] px-1"
                  onClick={() => onLoad(diagram)}
                >
                  <FolderOpen className="w-3 h-3 mr-1" />
                  Load
                </Button>
                <Button
                  size="sm"
                  variant={confirmDeleteId === index ? 'destructive' : 'ghost'}
                  className="h-6 w-6 p-0"
                  onClick={() => handleDelete(index)}
                  title={confirmDeleteId === index ? 'Click again to confirm delete' : 'Delete diagram'}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
