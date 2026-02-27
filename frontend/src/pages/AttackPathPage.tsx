import React, { useState } from 'react';
import AttackPathCanvas from '../components/AttackPathCanvas';
import AttackPathToolbar from '../components/AttackPathToolbar';
import DiagramSidebar from '../components/DiagramSidebar';
import SaveDiagramDialog from '../components/SaveDiagramDialog';
import { useAttackPathState } from '../hooks/useAttackPathState';
import { useSaveDiagramState } from '../hooks/useSaveDiagramState';
import { DiagramState, NamedDiagram } from '../backend';

export default function AttackPathPage() {
  const state = useAttackPathState();
  const saveMutation = useSaveDiagramState();
  const [activeTool, setActiveTool] = useState('select');
  const [drawColor, setDrawColor] = useState('#ef4444');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [textColor, setTextColor] = useState('#e2e8f0');
  const [fontSize, setFontSize] = useState(16);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const handleSave = async (name: string) => {
    const diagramState: DiagramState = {
      icons: state.icons.map(icon => ({
        id: icon.id,
        iconType: icon.type,
        position: { x: icon.x, y: icon.y },
        name: icon.name,
      })),
      connections: state.connections.map(conn => ({
        sourceId: conn.sourceId,
        targetId: conn.targetId,
        connectionType: conn.connectionType,
        color: conn.color,
      })),
      freehandDrawings: state.drawings
        .filter(d => d.type === 'freehand')
        .map(d => ({
          points: d.points,
          color: d.color,
          strokeWidth: d.strokeWidth,
        })),
      lines: state.drawings
        .filter(d => d.type === 'line' || d.type === 'arrow')
        .map(d => ({
          startPosition: d.points[0] ?? { x: 0, y: 0 },
          endPosition: d.points[1] ?? { x: 0, y: 0 },
          color: d.color,
          strokeWidth: d.strokeWidth,
          isArrow: d.type === 'arrow',
        })),
      textLabels: state.textLabels.map(label => ({
        content: label.text,
        position: { x: label.x, y: label.y },
        fontSize: label.fontSize,
        color: label.color,
        fontWeight: '500',
      })),
      images: state.images.map(img => ({
        id: img.id,
        file: img.blob,
        position: { x: img.x, y: img.y },
        size: { width: img.width, height: img.height },
        name: img.name,
        description: img.description,
      })),
      lastModified: BigInt(Date.now()),
    };
    await saveMutation.mutateAsync({ name, state: diagramState });
    setShowSaveDialog(false);
  };

  const handleLoadDiagram = (diagram: NamedDiagram) => {
    state.onClear();
    const s = diagram.state;
    s.icons.forEach(icon => {
      state.onAddIcon(icon.iconType as any, icon.position.x, icon.position.y, icon.name);
    });
    s.textLabels.forEach(label => {
      state.onAddTextLabel(label.content, label.position.x, label.position.y, label.color, label.fontSize);
    });
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Left sidebar: saved diagrams */}
      <DiagramSidebar onLoadDiagram={handleLoadDiagram} />

      {/* Middle: toolbar */}
      <AttackPathToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        drawColor={drawColor}
        onDrawColorChange={setDrawColor}
        strokeWidth={strokeWidth}
        onStrokeWidthChange={setStrokeWidth}
        textColor={textColor}
        onTextColorChange={setTextColor}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        onUndo={state.onUndo}
        onClear={state.onClear}
        onSave={() => setShowSaveDialog(true)}
        onAddImage={(file: File) => state.onAddImage(file, 100, 100, file.name, '')}
      />

      {/* Right: canvas */}
      <div className="flex-1 relative overflow-hidden">
        <AttackPathCanvas
          icons={state.icons}
          connections={state.connections}
          drawings={state.drawings}
          textLabels={state.textLabels}
          images={state.images}
          selectedElements={state.selectedElements}
          activeTool={activeTool}
          drawColor={drawColor}
          strokeWidth={strokeWidth}
          textColor={textColor}
          fontSize={fontSize}
          onAddIcon={state.onAddIcon}
          onMoveIcon={state.onMoveIcon}
          onResizeIcon={state.onResizeIcon}
          onRotateIcon={state.onRotateIcon}
          onRemoveIcon={state.onRemoveIcon}
          onAddConnection={state.onAddConnection}
          onRemoveConnection={state.onRemoveConnection}
          onAddDrawing={state.onAddDrawing}
          onRemoveDrawing={state.onRemoveDrawing}
          onAddTextLabel={state.onAddTextLabel}
          onMoveTextLabel={state.onMoveTextLabel}
          onRemoveTextLabel={state.onRemoveTextLabel}
          onAddImage={state.onAddImage}
          onMoveImage={state.onMoveImage}
          onResizeImage={state.onResizeImage}
          onRemoveImage={state.onRemoveImage}
          onSetSelectedElements={state.onSetSelectedElements}
          onUndo={state.onUndo}
        />
      </div>

      {/* Save dialog */}
      <SaveDiagramDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        onSave={handleSave}
        isSaving={saveMutation.isPending}
      />
    </div>
  );
}
