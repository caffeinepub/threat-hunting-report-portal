import React from 'react';
import { FolderOpen, Trash2, LayoutGrid } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useGetAllDiagrams } from '../hooks/useGetAllDiagrams';
import { useDeleteDiagramState } from '../hooks/useDeleteDiagramState';
import { NamedDiagram } from '../backend';

interface LoadDiagramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoad: (diagram: NamedDiagram) => void;
}

const LoadDiagramDialog: React.FC<LoadDiagramDialogProps> = ({ open, onOpenChange, onLoad }) => {
  const { data: diagrams = [], isLoading } = useGetAllDiagrams();
  const deleteMutation = useDeleteDiagramState();

  const formatDate = (lastModified: bigint) => {
    const ms = Number(lastModified) / 1_000_000;
    return new Date(ms).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleLoad = (diagram: NamedDiagram) => {
    onLoad(diagram);
    onOpenChange(false);
  };

  const handleDelete = async (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteMutation.mutateAsync(BigInt(index));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen size={18} />
            Load Diagram
          </DialogTitle>
          <DialogDescription>
            Select a saved diagram to load onto the canvas.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : diagrams.length === 0 ? (
            <div className="text-center py-8">
              <LayoutGrid size={32} className="mx-auto mb-3 text-muted-foreground opacity-40" />
              <p className="text-sm text-muted-foreground">No saved diagrams found.</p>
              <p className="text-xs text-muted-foreground mt-1 opacity-70">
                Save a diagram first to load it here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {diagrams.map((diagram, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer group"
                  onClick={() => handleLoad(diagram)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{diagram.name}</p>
                    <div className="flex gap-3 mt-0.5 text-xs text-muted-foreground">
                      <span>{diagram.state.icons.length} icons</span>
                      <span>{diagram.state.connections.length} connections</span>
                      {diagram.state.textLabels.length > 0 && (
                        <span>{diagram.state.textLabels.length} labels</span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 opacity-70">
                      {formatDate(diagram.state.lastModified)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleDelete(index, e)}
                      disabled={deleteMutation.isPending}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-destructive hover:bg-destructive/10 transition-all disabled:opacity-50"
                      title="Delete diagram"
                    >
                      <Trash2 size={14} />
                    </button>
                    <div className="p-1.5 rounded text-primary">
                      <FolderOpen size={14} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoadDiagramDialog;
