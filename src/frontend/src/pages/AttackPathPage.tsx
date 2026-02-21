import { useState, useEffect } from 'react';
import AttackPathToolbar from '@/components/AttackPathToolbar';
import AttackPathCanvas from '@/components/AttackPathCanvas';
import { useAttackPathState } from '@/hooks/useAttackPathState';
import { IconType } from '@/components/AttackPathToolbar';
import { useSaveDiagramState } from '@/hooks/useSaveDiagramState';
import { useGetAllDiagrams } from '@/hooks/useGetAllDiagrams';
import { useGetDiagramState } from '@/hooks/useGetDiagramState';
import { useDeleteDiagramState } from '@/hooks/useDeleteDiagramState';
import { DiagramState, NamedDiagram } from '@/backend';
import { ExternalBlob } from '@/backend';
import SaveDiagramDialog from '@/components/SaveDiagramDialog';
import LoadDiagramDialog from '@/components/LoadDiagramDialog';
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

  const saveDiagramMutation = useSaveDiagramState();
  const { data: allDiagrams } = useGetAllDiagrams();

  const handleSaveDiagram = (name: string) => {
    const diagramState: DiagramState = {
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
          const drawingType = d.type;
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

    saveDiagramMutation.mutate({ name, state: diagramState });
    setSaveDialogOpen(false);
  };

  const handleLoadDiagram = (diagram: NamedDiagram) => {
    const state = diagram.state;

    const loadedIcons = state.icons.map((icon) => ({
      id: icon.id,
      type: icon.iconType as IconType,
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

    setLoadDialogOpen(false);
  };

  const handleClearConfirm = () => {
    clearAll();
    setClearDialogOpen(false);
  };

  const handleImageUpload = (file: ExternalBlob, name: string) => {
    addImage(file, 100, 100, name);
  };

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <AttackPathToolbar
        activeDrawingTool={activeDrawingTool}
        onDrawingToolChange={setActiveDrawingTool}
        textColor={textColor}
        onTextColorChange={setTextColor}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        onUndo={undo}
        canUndo={canUndo}
        onSave={() => setSaveDialogOpen(true)}
        onLoad={() => setLoadDialogOpen(true)}
        onClear={() => setClearDialogOpen(true)}
        isSaving={saveDiagramMutation.isPending}
        onImageUpload={handleImageUpload}
      />
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
        onSelectElement={setSelectedElementId}
        onSelectArrow={setSelectedArrowId}
        onSelectMultipleElements={selectMultipleElements}
        onClearSelection={clearSelection}
      />

      <SaveDiagramDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSaveDiagram}
        isSaving={saveDiagramMutation.isPending}
      />

      <LoadDiagramDialog
        open={loadDialogOpen}
        onOpenChange={setLoadDialogOpen}
        onLoadDiagram={handleLoadDiagram}
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
            <AlertDialogAction onClick={handleClearConfirm}>Clear</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
