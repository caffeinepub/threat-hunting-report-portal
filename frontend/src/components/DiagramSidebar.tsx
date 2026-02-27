import React, { useState } from 'react';
import { Trash2, FolderOpen, LayoutGrid } from 'lucide-react';
import { useGetAllDiagrams } from '../hooks/useGetAllDiagrams';
import { useDeleteDiagramState } from '../hooks/useDeleteDiagramState';
import { NamedDiagram } from '../backend';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DiagramSidebarProps {
  onLoad: (diagram: NamedDiagram) => void;
}

const DiagramSidebar: React.FC<DiagramSidebarProps> = ({ onLoad }) => {
  const { data: diagrams = [], isLoading } = useGetAllDiagrams();
  const deleteMutation = useDeleteDiagramState();
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDeleteClick = (index: number) => {
    setDeleteIndex(index);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteIndex === null) return;
    try {
      await deleteMutation.mutateAsync(BigInt(deleteIndex));
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setConfirmOpen(false);
      setDeleteIndex(null);
    }
  };

  const formatDate = (lastModified: bigint) => {
    const ms = Number(lastModified) / 1_000_000;
    return new Date(ms).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="flex flex-col h-full bg-sidebar border-l border-border overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border flex items-center gap-2">
        <LayoutGrid size={14} className="text-muted-foreground" />
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Saved Diagrams
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : diagrams.length === 0 ? (
          <div className="text-center py-8 px-2">
            <LayoutGrid size={24} className="mx-auto mb-2 text-muted-foreground opacity-40" />
            <p className="text-xs text-muted-foreground">No saved diagrams yet.</p>
            <p className="text-[10px] text-muted-foreground mt-1 opacity-70">
              Use Save to store your diagram.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {diagrams.map((diagram, index) => (
              <div
                key={index}
                className="rounded-md border border-border bg-card p-2 flex flex-col gap-1.5"
              >
                <div className="flex items-start justify-between gap-1">
                  <span className="text-xs font-medium text-foreground truncate flex-1">
                    {diagram.name}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                  <span>{diagram.state.icons.length} icons</span>
                  <span>{diagram.state.connections.length} connections</span>
                  {diagram.state.textLabels.length > 0 && (
                    <span>{diagram.state.textLabels.length} labels</span>
                  )}
                </div>

                <div className="text-[10px] text-muted-foreground opacity-70">
                  {formatDate(diagram.state.lastModified)}
                </div>

                <div className="flex gap-1 mt-0.5">
                  <button
                    onClick={() => onLoad(diagram)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-[10px] bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    <FolderOpen size={10} />
                    Load
                  </button>
                  <button
                    onClick={() => handleDeleteClick(index)}
                    disabled={deleteMutation.isPending}
                    className="flex items-center justify-center px-2 py-1 rounded text-[10px] bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Diagram</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this diagram? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DiagramSidebar;
