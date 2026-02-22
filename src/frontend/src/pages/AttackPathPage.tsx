import { useState } from 'react';
import AttackPathCanvas from '@/components/AttackPathCanvas';
import AttackPathToolbar from '@/components/AttackPathToolbar';
import { useAttackPathState } from '@/hooks/useAttackPathState';
import { Button } from '@/components/ui/button';
import { Layers, Pencil } from 'lucide-react';
import SaveDiagramDialog from '@/components/SaveDiagramDialog';
import LoadDiagramDialog from '@/components/LoadDiagramDialog';
import { useSaveDiagramState } from '@/hooks/useSaveDiagramState';
import { useGetAllDiagrams } from '@/hooks/useGetAllDiagrams';
import { toast } from 'sonner';
import { NamedDiagram } from '@/backend';
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
import { ExternalBlob } from '@/backend';

export default function AttackPathPage() {
  const {
    placedIcons,
    connections,
    drawings,
    textLabels,
    images,
    activeDrawingTool,
    setActiveDrawingTool,
    textColor,
    setTextColor,
    fontSize,
    setFontSize,
    selectedElementId,
    setSelectedElementId,
    selectedElementType,
    setSelectedElementType,
    selectedArrowId,
    setSelectedArrowId,
    selectedElements,
    selectMultipleElements,
    clearSelection,
    addIcon,
    moveIcon,
    resizeIcon,
    removeIcon,
    addConnection,
    removeConnection,
    updateArrowRotation,
    addDrawing,
    removeDrawing,
    moveDrawing,
    addTextLabel,
    removeTextLabel,
    updateTextLabel,
    addImage,
    moveImage,
    resizeImage,
    removeImage,
    clearAll,
    undo,
    canUndo,
    restoreState,
  } = useAttackPathState();

  const [mode, setMode] = useState<'place' | 'connect' | 'draw'>('place');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [textRotation, setTextRotation] = useState(0);

  const saveDiagramMutation = useSaveDiagramState();
  const { data: allDiagrams = [], isLoading: isLoadingDiagrams } = useGetAllDiagrams();

  const handleSave = () => {
    setSaveDialogOpen(true);
  };

  const handleSaveConfirm = async (name: string) => {
    try {
      const diagramState = {
        icons: placedIcons.map((icon) => ({
          id: icon.id,
          iconType: icon.type,
          position: { x: icon.x, y: icon.y },
          name: icon.name || '',
        })),
        connections: connections.map((conn) => ({
          sourceId: conn.sourceId,
          targetId: conn.targetId,
          connectionType: 'arrow',
          color: conn.color || 'oklch(0.65 0.18 150)',
        })),
        freehandDrawings: drawings
          .filter((d) => d.type === 'freehand')
          .map((d) => ({
            points: d.points.map((p) => ({ x: p.x, y: p.y })),
            color: d.color || '#000000',
            strokeWidth: d.strokeWidth || 2,
          })),
        lines: drawings
          .filter((d) => d.type === 'line' || d.type === 'arrow')
          .map((d) => {
            const drawingType: 'line' | 'arrow' = d.type === 'arrow' ? 'arrow' : 'line';
            return {
              startPosition: { x: d.points[0].x, y: d.points[0].y },
              endPosition: { x: d.points[1].x, y: d.points[1].y },
              color: d.color || '#000000',
              strokeWidth: d.strokeWidth || 2,
              isArrow: drawingType === 'arrow',
            };
          }),
        textLabels: textLabels.map((label) => ({
          content: label.text,
          position: { x: label.x, y: label.y },
          fontSize: label.fontSize || 16,
          color: label.color,
          fontWeight: label.fontWeight || 'normal',
        })),
        images: images.map((img) => ({
          id: img.id,
          file: img.file,
          position: { x: img.x, y: img.y },
          size: { width: img.width, height: img.height },
          name: img.name,
          description: img.description,
        })),
        lastModified: BigInt(Date.now()),
      };

      await saveDiagramMutation.mutateAsync({ name, state: diagramState });
      toast.success('Diagram saved successfully');
      setSaveDialogOpen(false);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save diagram');
    }
  };

  const handleLoad = () => {
    setLoadDialogOpen(true);
  };

  const handleLoadDiagram = (diagram: NamedDiagram) => {
    try {
      const state = diagram.state;

      const loadedIcons = state.icons.map((icon) => ({
        id: icon.id,
        type: icon.iconType as any,
        x: icon.position.x,
        y: icon.position.y,
        width: 48,
        height: 48,
        name: icon.name,
      }));

      const loadedConnections = state.connections.map((conn) => ({
        id: `conn-${Date.now()}-${Math.random()}`,
        sourceId: conn.sourceId,
        targetId: conn.targetId,
        color: conn.color,
        rotation: 0,
      }));

      const loadedDrawings = [
        ...state.freehandDrawings.map((drawing) => ({
          id: `drawing-${Date.now()}-${Math.random()}`,
          type: 'freehand' as const,
          points: drawing.points.map((p) => ({ x: p.x, y: p.y })),
          color: drawing.color,
          strokeWidth: drawing.strokeWidth,
          rotation: 0,
        })),
        ...state.lines.map((line) => {
          const lineType = line.isArrow ? 'arrow' : 'line';
          return {
            id: `drawing-${Date.now()}-${Math.random()}`,
            type: lineType as 'arrow' | 'line',
            points: [
              { x: line.startPosition.x, y: line.startPosition.y },
              { x: line.endPosition.x, y: line.endPosition.y },
            ],
            color: line.color,
            strokeWidth: line.strokeWidth,
            rotation: 0,
          };
        }),
      ];

      const loadedTextLabels = state.textLabels.map((label) => ({
        id: `text-${Date.now()}-${Math.random()}`,
        text: label.content,
        x: label.position.x,
        y: label.position.y,
        color: label.color,
        fontSize: label.fontSize,
        fontWeight: label.fontWeight,
        rotation: 0,
        width: undefined,
        height: undefined,
      }));

      const loadedImages = state.images.map((img) => ({
        id: img.id,
        file: img.file,
        x: img.position.x,
        y: img.position.y,
        width: img.size.width,
        height: img.size.height,
        name: img.name,
        description: img.description,
      }));

      restoreState({
        placedIcons: loadedIcons,
        connections: loadedConnections,
        drawings: loadedDrawings,
        textLabels: loadedTextLabels,
        images: loadedImages,
      });

      toast.success('Diagram loaded successfully');
      setLoadDialogOpen(false);
    } catch (error) {
      console.error('Load error:', error);
      toast.error('Failed to load diagram');
    }
  };

  const handleClear = () => {
    setClearDialogOpen(true);
  };

  const handleClearConfirm = () => {
    clearAll();
    toast.success('Diagram cleared');
    setClearDialogOpen(false);
  };

  const handleImageUpload = (file: ExternalBlob, name: string) => {
    addImage(file, 100, 100, name, '');
  };

  const handleSelectElement = (id: string | null, type: 'icon' | 'text' | 'arrow' | 'image' | null) => {
    setSelectedElementId(id);
    setSelectedElementType(type);
    
    // Update text rotation when selecting a text element
    if (id && type === 'text') {
      const label = textLabels.find((l) => l.id === id);
      if (label) {
        setTextRotation(label.rotation || 0);
      }
    }
  };

  const handleTextRotationChange = (rotation: number) => {
    setTextRotation(rotation);
    
    // Apply rotation to selected text element
    if (selectedElementId && selectedElementType === 'text') {
      updateTextLabel(selectedElementId, { rotation });
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full">
      {/* Sidebar */}
      <div className="w-80 border-r border-border bg-background overflow-y-auto p-6">
        <AttackPathToolbar
          activeDrawingTool={activeDrawingTool}
          onDrawingToolChange={setActiveDrawingTool}
          onUndo={undo}
          canUndo={canUndo}
          onSave={handleSave}
          onLoad={handleLoad}
          onClear={handleClear}
          isSaving={saveDiagramMutation.isPending}
          textColor={textColor}
          onTextColorChange={setTextColor}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          onImageUpload={handleImageUpload}
          selectedElementId={selectedElementId}
          selectedElementType={selectedElementType}
          textRotation={textRotation}
          onTextRotationChange={handleTextRotationChange}
        />
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 p-6">
        <div className="mb-4 flex gap-2">
          <Button
            variant={mode === 'place' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('place')}
          >
            <Layers className="h-4 w-4 mr-2" />
            Place Mode
          </Button>
          <Button
            variant={mode === 'connect' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('connect')}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Connect Mode
          </Button>
        </div>

        <AttackPathCanvas
          placedIcons={placedIcons}
          connections={connections}
          drawings={drawings}
          textLabels={textLabels}
          images={images}
          mode={mode}
          activeDrawingTool={activeDrawingTool}
          textColor={textColor}
          fontSize={fontSize}
          selectedElementId={selectedElementId}
          selectedElementType={selectedElementType}
          selectedArrowId={selectedArrowId}
          selectedElements={selectedElements}
          onAddIcon={addIcon}
          onMoveIcon={moveIcon}
          onResizeIcon={resizeIcon}
          onRemoveIcon={removeIcon}
          onAddConnection={addConnection}
          onRemoveConnection={removeConnection}
          onUpdateArrowRotation={updateArrowRotation}
          onAddDrawing={addDrawing}
          onRemoveDrawing={removeDrawing}
          onMoveDrawing={moveDrawing}
          onAddTextLabel={addTextLabel}
          onRemoveTextLabel={removeTextLabel}
          onUpdateTextLabel={updateTextLabel}
          onAddImage={addImage}
          onMoveImage={moveImage}
          onResizeImage={resizeImage}
          onRemoveImage={removeImage}
          onSelectElement={handleSelectElement}
          onSelectArrow={setSelectedArrowId}
          onSelectMultipleElements={selectMultipleElements}
          onClearSelection={clearSelection}
        />
      </div>

      {/* Save Dialog */}
      <SaveDiagramDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSaveConfirm}
        isSaving={saveDiagramMutation.isPending}
      />

      {/* Load Dialog */}
      <LoadDiagramDialog
        open={loadDialogOpen}
        onOpenChange={setLoadDialogOpen}
        onLoadDiagram={handleLoadDiagram}
      />

      {/* Clear Confirmation Dialog */}
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Diagram?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all elements from the canvas. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearConfirm}>Clear</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
