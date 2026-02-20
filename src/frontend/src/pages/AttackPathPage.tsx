import { useState, useRef } from 'react';
import AttackPathToolbar from '@/components/AttackPathToolbar';
import AttackPathCanvas from '@/components/AttackPathCanvas';
import LoadDiagramDialog from '@/components/LoadDiagramDialog';
import SaveDiagramDialog from '@/components/SaveDiagramDialog';
import { useAttackPathState } from '@/hooks/useAttackPathState';
import { useSaveDiagramState } from '@/hooks/useSaveDiagramState';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { DiagramState, Icon, Connection as BackendConnection, FreehandDrawing, Line, TextLabel as BackendTextLabel } from '@/backend';

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
    undo,
    canUndo,
    restoreState,
    clearAll,
  } = useAttackPathState();

  const [mode, setMode] = useState<'place' | 'connect' | 'draw'>('place');
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const saveDiagramMutation = useSaveDiagramState();
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleModeChange = (newMode: 'place' | 'connect' | 'draw') => {
    setMode(newMode);
    if (newMode !== 'draw') {
      setActiveDrawingTool(null);
    }
  };

  const handleDrawingToolChange = (tool: typeof activeDrawingTool) => {
    setActiveDrawingTool(tool);
    if (tool !== null) {
      setMode('draw');
    }
  };

  const handleSelectElement = (id: string | null, type: 'icon' | 'text' | null) => {
    setSelectedElementId(id);
    setSelectedElementType(type);
  };

  const handleSaveClick = () => {
    setSaveDialogOpen(true);
  };

  const handleSave = async (name: string) => {
    try {
      const icons: Icon[] = placedIcons.map((icon) => ({
        id: icon.id,
        iconType: icon.type,
        position: { x: icon.x, y: icon.y },
        name: icon.type,
      }));

      const backendConnections: BackendConnection[] = connections.map((conn) => ({
        sourceId: conn.sourceId,
        targetId: conn.targetId,
        connectionType: 'solid',
        color: '#000000',
      }));

      const freehandDrawings: FreehandDrawing[] = drawings
        .filter((d) => d.type === 'freehand')
        .map((drawing) => ({
          points: drawing.points,
          color: '#000000',
          strokeWidth: 2,
        }));

      const lines: Line[] = drawings
        .filter((d) => d.type === 'line' || d.type === 'arrow')
        .map((drawing) => ({
          startPosition: drawing.points[0],
          endPosition: drawing.points[1],
          color: '#000000',
          strokeWidth: 2,
          isArrow: drawing.type === 'arrow',
        }));

      const backendTextLabels: BackendTextLabel[] = textLabels.map((label) => ({
        content: label.text,
        position: { x: label.x, y: label.y },
        fontSize: 16,
        color: label.color,
        fontWeight: 'bold',
      }));

      const diagramState: DiagramState = {
        icons,
        connections: backendConnections,
        freehandDrawings,
        lines,
        textLabels: backendTextLabels,
        lastModified: BigInt(Date.now()),
      };

      await saveDiagramMutation.mutateAsync({ name, state: diagramState });
      setSaveDialogOpen(false);
      toast.success('Diagram saved successfully!');
    } catch (error) {
      console.error('Failed to save diagram:', error);
      toast.error('Failed to save diagram');
    }
  };

  const handleLoad = () => {
    setLoadDialogOpen(true);
  };

  const handleLoadComplete = (state: {
    placedIcons: typeof placedIcons;
    connections: typeof connections;
    drawings: typeof drawings;
    textLabels: typeof textLabels;
  }) => {
    restoreState(state);
    setLoadDialogOpen(false);
    toast.success('Diagram loaded successfully!');
  };

  const handleClear = () => {
    if (placedIcons.length > 0 || connections.length > 0 || drawings.length > 0 || textLabels.length > 0) {
      if (window.confirm('Are you sure you want to clear the entire diagram? This action cannot be undone.')) {
        clearAll();
        toast.success('Diagram cleared');
      }
    }
  };

  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error('Canvas not found');
      return;
    }

    // Fallback message for PNG export
    toast.info('To export as PNG, use your browser\'s screenshot tool (e.g., Ctrl+Shift+S in Firefox, Cmd+Shift+4 on Mac, or browser extensions like Awesome Screenshot)');
  };

  return (
    <div className="flex h-[calc(100vh-200px)] gap-4">
      {/* Sidebar */}
      <div className="w-64 bg-card border border-border rounded-lg p-4 overflow-y-auto">
        <AttackPathToolbar
          activeDrawingTool={activeDrawingTool}
          onDrawingToolChange={handleDrawingToolChange}
          onUndo={undo}
          canUndo={canUndo}
          onSave={handleSaveClick}
          onLoad={handleLoad}
          onExport={handleExportPNG}
          onClear={handleClear}
          isSaving={saveDiagramMutation.isPending}
          textColor={textColor}
          onTextColorChange={setTextColor}
        />
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Mode Selector */}
        <div className="flex gap-2">
          <Button
            variant={mode === 'place' ? 'default' : 'outline'}
            onClick={() => handleModeChange('place')}
          >
            Place & Move Icons
          </Button>
          <Button
            variant={mode === 'connect' ? 'default' : 'outline'}
            onClick={() => handleModeChange('connect')}
          >
            Connect Icons
          </Button>
          <Button
            variant={mode === 'draw' ? 'default' : 'outline'}
            onClick={() => handleModeChange('draw')}
          >
            Draw & Annotate
          </Button>
        </div>

        {/* Canvas */}
        <div className="flex-1" ref={canvasRef}>
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
      </div>

      {/* Load Dialog */}
      <LoadDiagramDialog
        open={loadDialogOpen}
        onOpenChange={setLoadDialogOpen}
        onLoad={handleLoadComplete}
      />

      {/* Save Dialog */}
      <SaveDiagramDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSave}
        isSaving={saveDiagramMutation.isPending}
      />
    </div>
  );
}
