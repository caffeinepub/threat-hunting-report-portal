import { useState } from 'react';
import AttackPathToolbar from '@/components/AttackPathToolbar';
import AttackPathCanvas from '@/components/AttackPathCanvas';
import { useAttackPathState } from '@/hooks/useAttackPathState';
import SaveDiagramDialog from '@/components/SaveDiagramDialog';
import LoadDiagramDialog from '@/components/LoadDiagramDialog';
import { useSaveDiagramState } from '@/hooks/useSaveDiagramState';
import { useGetDiagramState } from '@/hooks/useGetDiagramState';
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
import { toast } from 'sonner';

export default function AttackPathPage() {
  const {
    placedIcons,
    connections,
    drawings,
    textLabels,
    activeDrawingTool,
    setActiveDrawingTool,
    textColor,
    setTextColor,
    selectedElementId,
    setSelectedElementId,
    selectedElementType,
    setSelectedElementType,
    addIcon,
    moveIcon,
    resizeIcon,
    removeIcon,
    addConnection,
    removeConnection,
    addDrawing,
    removeDrawing,
    moveDrawing,
    addTextLabel,
    removeTextLabel,
    updateTextLabel,
    clearAll,
    undo,
    canUndo,
    restoreState,
  } = useAttackPathState();

  const [mode, setMode] = useState<'place' | 'connect' | 'draw'>('place');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const saveMutation = useSaveDiagramState();
  const [selectedDiagramId, setSelectedDiagramId] = useState<bigint | null>(null);
  
  // Only fetch when we have a valid ID
  const { data: loadedDiagram } = useGetDiagramState(selectedDiagramId || BigInt(0));

  const handleModeChange = (newMode: 'place' | 'connect' | 'draw') => {
    setMode(newMode);
    if (newMode !== 'draw') {
      setActiveDrawingTool(null);
    }
  };

  const handleSave = async (name: string) => {
    const diagramState = {
      icons: placedIcons.map((icon) => ({
        id: icon.id,
        iconType: icon.type,
        position: { x: icon.x, y: icon.y },
        name: icon.type,
      })),
      connections: connections.map((conn) => ({
        sourceId: conn.sourceId,
        targetId: conn.targetId,
        connectionType: 'default',
        color: '#000000',
      })),
      freehandDrawings: drawings
        .filter((d) => d.type === 'freehand')
        .map((d) => ({
          points: d.points.map((p) => ({ x: p.x, y: p.y })),
          color: '#000000',
          strokeWidth: 2,
        })),
      lines: drawings
        .filter((d) => d.type === 'line' || d.type === 'arrow')
        .map((d) => ({
          startPosition: d.points[0],
          endPosition: d.points[1],
          color: '#000000',
          strokeWidth: 2,
          isArrow: d.type === 'arrow',
        })),
      textLabels: textLabels.map((label) => ({
        content: label.text,
        position: { x: label.x, y: label.y },
        fontSize: 16,
        color: label.color,
        fontWeight: 'bold',
      })),
      lastModified: BigInt(Date.now() * 1000000),
    };

    try {
      await saveMutation.mutateAsync({ name, state: diagramState });
      setSaveDialogOpen(false);
      toast.success('Diagram saved successfully');
    } catch (error) {
      toast.error('Failed to save diagram');
      console.error('Save error:', error);
    }
  };

  const handleLoad = (diagramId: bigint) => {
    setSelectedDiagramId(diagramId);
  };

  // Load diagram when data is fetched
  if (loadedDiagram && selectedDiagramId !== null) {
    const state = loadedDiagram.state;
    
    const restoredState = {
      placedIcons: state.icons.map((icon) => ({
        id: icon.id,
        type: icon.iconType as any,
        x: icon.position.x,
        y: icon.position.y,
        width: 48,
        height: 48,
      })),
      connections: state.connections.map((conn) => ({
        id: `conn-${Date.now()}-${Math.random()}`,
        sourceId: conn.sourceId,
        targetId: conn.targetId,
      })),
      drawings: [
        ...state.freehandDrawings.map((drawing) => ({
          id: `drawing-${Date.now()}-${Math.random()}`,
          type: 'freehand' as const,
          points: drawing.points,
        })),
        ...state.lines.map((line) => {
          const drawingType = line.isArrow ? 'arrow' : 'line';
          return {
            id: `drawing-${Date.now()}-${Math.random()}`,
            type: drawingType as 'arrow' | 'line',
            points: [line.startPosition, line.endPosition],
          };
        }),
      ],
      textLabels: state.textLabels.map((label) => ({
        id: `text-${Date.now()}-${Math.random()}`,
        text: label.content,
        x: label.position.x,
        y: label.position.y,
        color: label.color,
        rotation: 0,
        width: undefined,
        height: undefined,
      })),
    };

    restoreState(restoredState);
    setSelectedDiagramId(null);
    toast.success('Diagram loaded successfully');
  }

  const handleExport = () => {
    toast.info('To export this diagram as PNG, please use your browser\'s screenshot tool or print to PDF feature.', {
      duration: 5000,
    });
  };

  const handleSelectElement = (id: string | null, type: 'icon' | 'text' | null) => {
    setSelectedElementId(id);
    setSelectedElementType(type);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="w-64 border-r bg-background p-4 overflow-y-auto">
        <AttackPathToolbar
          activeDrawingTool={activeDrawingTool}
          onDrawingToolChange={setActiveDrawingTool}
          onUndo={undo}
          canUndo={canUndo}
          onSave={() => setSaveDialogOpen(true)}
          onLoad={() => setLoadDialogOpen(true)}
          onExport={handleExport}
          onClear={() => setClearDialogOpen(true)}
          isSaving={saveMutation.isPending}
          textColor={textColor}
          onTextColorChange={setTextColor}
        />
      </div>

      <div className="flex-1 flex flex-col">
        <div className="bg-background border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleModeChange('place')}
                className={`px-4 py-2 rounded ${
                  mode === 'place' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                }`}
              >
                Place
              </button>
              <button
                onClick={() => handleModeChange('connect')}
                className={`px-4 py-2 rounded ${
                  mode === 'connect' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                }`}
              >
                Connect
              </button>
              <button
                onClick={() => handleModeChange('draw')}
                className={`px-4 py-2 rounded ${
                  mode === 'draw' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                }`}
              >
                Draw
              </button>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Mode: <span className="font-semibold capitalize">{mode}</span>
            {activeDrawingTool && (
              <>
                {' '}
                | Tool: <span className="font-semibold capitalize">{activeDrawingTool}</span>
              </>
            )}
          </div>
        </div>

        <AttackPathCanvas
          placedIcons={placedIcons}
          connections={connections}
          drawings={drawings}
          textLabels={textLabels}
          mode={mode}
          activeDrawingTool={activeDrawingTool}
          textColor={textColor}
          selectedElementId={selectedElementId}
          selectedElementType={selectedElementType}
          onAddIcon={addIcon}
          onMoveIcon={moveIcon}
          onResizeIcon={resizeIcon}
          onRemoveIcon={removeIcon}
          onAddConnection={addConnection}
          onRemoveConnection={removeConnection}
          onAddDrawing={addDrawing}
          onRemoveDrawing={removeDrawing}
          onMoveDrawing={moveDrawing}
          onAddTextLabel={addTextLabel}
          onRemoveTextLabel={removeTextLabel}
          onUpdateTextLabel={updateTextLabel}
          onSelectElement={handleSelectElement}
        />
      </div>

      <SaveDiagramDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSave}
        isSaving={saveMutation.isPending}
      />

      <LoadDiagramDialog
        open={loadDialogOpen}
        onOpenChange={setLoadDialogOpen}
        onLoadDiagram={handleLoad}
      />

      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Canvas</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear the entire canvas? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                clearAll();
                setClearDialogOpen(false);
              }}
            >
              Clear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
