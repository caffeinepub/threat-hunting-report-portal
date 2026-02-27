import { useState } from 'react';
import { useGetAllDiagrams } from '@/hooks/useGetAllDiagrams';
import { useDeleteDiagramState } from '@/hooks/useDeleteDiagramState';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Loader2, Trash2, FolderOpen, LayoutDashboard, Link, Type, Clock } from 'lucide-react';
import type { NamedDiagram } from '@/backend';

interface DiagramSidebarProps {
  onLoadDiagram: (diagram: NamedDiagram) => void;
}

export default function DiagramSidebar({ onLoadDiagram }: DiagramSidebarProps) {
  const { data: diagrams, isLoading } = useGetAllDiagrams();
  const deleteMutation = useDeleteDiagramState();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [diagramToDelete, setDiagramToDelete] = useState<{ id: bigint; name: string } | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, index: number, diagramName: string) => {
    e.stopPropagation();
    setDiagramToDelete({ id: BigInt(index), name: diagramName });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (diagramToDelete) {
      await deleteMutation.mutateAsync(diagramToDelete.id);
      setDeleteDialogOpen(false);
      setDiagramToDelete(null);
    }
  };

  const formatDate = (lastModified: bigint) => {
    // Backend stores milliseconds as bigint
    const ms = Number(lastModified);
    if (ms === 0) return 'Unknown';
    const date = new Date(ms);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-sm">Saved Diagrams</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {diagrams ? `${diagrams.length} diagram${diagrams.length !== 1 ? 's' : ''} saved` : 'Loading...'}
          </p>
        </div>

        {/* Diagram list */}
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {isLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-3 rounded-lg border border-border space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                ))}
              </>
            ) : diagrams && diagrams.length > 0 ? (
              diagrams.map((diagram, index) => (
                <div
                  key={index}
                  className="group relative p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                >
                  {/* Diagram name */}
                  <div className="pr-8 mb-2">
                    <h3 className="font-medium text-sm truncate" title={diagram.name}>
                      {diagram.name}
                    </h3>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <LayoutDashboard className="h-3 w-3 flex-shrink-0" />
                      <span>{diagram.state.icons.length} icon{diagram.state.icons.length !== 1 ? 's' : ''}</span>
                      <span className="mx-1">·</span>
                      <Link className="h-3 w-3 flex-shrink-0" />
                      <span>{diagram.state.connections.length} connection{diagram.state.connections.length !== 1 ? 's' : ''}</span>
                    </div>
                    {diagram.state.textLabels.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Type className="h-3 w-3 flex-shrink-0" />
                        <span>{diagram.state.textLabels.length} text label{diagram.state.textLabels.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 flex-shrink-0" />
                      <span>{formatDate(diagram.state.lastModified)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-2 flex items-center gap-1">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1 h-7 text-xs"
                      onClick={() => onLoadDiagram(diagram)}
                    >
                      <FolderOpen className="h-3 w-3 mr-1" />
                      Load
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => handleDeleteClick(e, index, diagram.name)}
                      disabled={deleteMutation.isPending && diagramToDelete?.id === BigInt(index)}
                    >
                      {deleteMutation.isPending && diagramToDelete?.id === BigInt(index) ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 px-3">
                <LayoutDashboard className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-xs text-muted-foreground">No saved diagrams yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Save a diagram to see it here.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Diagram?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{diagramToDelete?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Deleting...</>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
