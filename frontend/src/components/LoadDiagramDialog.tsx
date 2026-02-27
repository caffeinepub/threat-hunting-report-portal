import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGetAllDiagrams } from '@/hooks/useGetAllDiagrams';
import { useDeleteDiagramState } from '@/hooks/useDeleteDiagramState';
import { Loader2, Trash2 } from 'lucide-react';
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
import { useState } from 'react';
import type { NamedDiagram } from '@/backend';

interface LoadDiagramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadDiagram: (diagram: NamedDiagram) => void;
}

export default function LoadDiagramDialog({ open, onOpenChange, onLoadDiagram }: LoadDiagramDialogProps) {
  const { data: diagrams, isLoading } = useGetAllDiagrams();
  const deleteMutation = useDeleteDiagramState();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [diagramToDelete, setDiagramToDelete] = useState<{ id: bigint; name: string } | null>(null);
  const [selectedDiagramIndex, setSelectedDiagramIndex] = useState<number | null>(null);

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
      setSelectedDiagramIndex(null);
    }
  };

  const handleLoadClick = (diagram: NamedDiagram, index: number) => {
    setSelectedDiagramIndex(index);
    onLoadDiagram(diagram);
    onOpenChange(false);
    setSelectedDiagramIndex(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Load Diagram</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : diagrams && diagrams.length > 0 ? (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {diagrams.map((diagram, index) => {
                    // Convert nanoseconds to milliseconds for JavaScript Date
                    const lastModifiedMs = Number(diagram.state.lastModified) / 1_000_000;
                    const lastModified = new Date(lastModifiedMs);
                    
                    return (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors group ${
                          selectedDiagramIndex === index ? 'bg-accent border-primary' : ''
                        }`}
                      >
                        <div className="flex-1" onClick={() => handleLoadClick(diagram, index)}>
                          <h3 className="font-semibold text-lg">{diagram.name}</h3>
                          <div className="text-sm text-muted-foreground mt-1">
                            <p>Icons: {diagram.state.icons.length}</p>
                            <p>Connections: {diagram.state.connections.length}</p>
                            <p>Text Labels: {diagram.state.textLabels.length}</p>
                            <p>Last modified: {lastModified.toLocaleString()}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleDeleteClick(e, index, diagram.name)}
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending && diagramToDelete?.id === BigInt(index) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-destructive" />
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No saved diagrams found.</p>
                <p className="text-sm mt-2">Create and save a diagram to see it here.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the diagram "{diagramToDelete?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
