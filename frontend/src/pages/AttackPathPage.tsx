import React, { useState } from 'react';
import AttackPathCanvas, { ToolType } from '../components/AttackPathCanvas';
import AttackPathToolbar from '../components/AttackPathToolbar';
import DiagramSidebar from '../components/DiagramSidebar';
import SaveDiagramDialog from '../components/SaveDiagramDialog';
import LoadDiagramDialog from '../components/LoadDiagramDialog';
import { useAttackPathState } from '../hooks/useAttackPathState';
import { useSaveDiagramState } from '../hooks/useSaveDiagramState';
import { ExternalBlob, NamedDiagram, DiagramState } from '../backend';

export default function AttackPathPage() {
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);

  const diagramState = useAttackPathState();
  const saveMutation = useSaveDiagramState();

  const handleSave = () => {
    setSaveDialogOpen(true);
  };

  const handleSaveConfirm = async (name: string) => {
    const s = diagramState.state;

    const diagramStatePayload: DiagramState = {
      icons: s.icons.map(icon => ({
        id: icon.id,
        iconType: icon.iconType,
        position: { x: icon.position.x, y: icon.position.y },
        name: icon.name,
      })),
      connections: s.connections.map(conn => ({
        sourceId: conn.sourceId,
        targetId: conn.targetId,
        connectionType: conn.connectionType,
        color: conn.color,
      })),
      freehandDrawings: s.freehandDrawings.map(d => ({
        points: d.points.map(p => ({ x: p.x, y: p.y })),
        color: d.color,
        strokeWidth: d.strokeWidth,
      })),
      lines: s.lines.map(l => ({
        startPosition: { x: l.startPosition.x, y: l.startPosition.y },
        endPosition: { x: l.endPosition.x, y: l.endPosition.y },
        color: l.color,
        strokeWidth: l.strokeWidth,
        isArrow: l.isArrow,
      })),
      textLabels: s.textLabels.map(label => ({
        content: label.content,
        position: { x: label.position.x, y: label.position.y },
        fontSize: label.fontSize,
        color: label.color,
        fontWeight: label.fontWeight,
      })),
      images: s.images.map(img => ({
        id: img.id,
        file: ExternalBlob.fromURL(img.url),
        position: { x: img.position.x, y: img.position.y },
        size: { width: img.width, height: img.height },
        name: img.name,
        description: img.description,
      })),
      lastModified: BigInt(Date.now()),
    };

    await saveMutation.mutateAsync({ name, state: diagramStatePayload });
    setSaveDialogOpen(false);
  };

  const handleLoad = () => {
    setLoadDialogOpen(true);
  };

  const handleLoadDiagram = (diagram: NamedDiagram) => {
    diagramState.loadDiagram(diagram.state);
    setLoadDialogOpen(false);
  };

  const handleAddImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      diagramState.addImage(url, { x: 200, y: 200 }, file.name, '');
    };
    reader.readAsDataURL(file);
  };

  const { state } = diagramState;

  return (
    <div className="flex h-full w-full overflow-hidden bg-white">
      {/* Left Toolbar */}
      <AttackPathToolbar
        activeTool={activeTool}
        onToolChange={(tool) => setActiveTool(tool as ToolType)}
        onSave={handleSave}
        onLoad={handleLoad}
        onUndo={diagramState.undo}
        onRedo={diagramState.redo}
        onClear={diagramState.clearDiagram}
        onAddImage={handleAddImage}
        canUndo={diagramState.canUndo}
        canRedo={diagramState.canRedo}
      />

      {/* Main Canvas */}
      <div className="flex-1 overflow-hidden">
        <AttackPathCanvas
          activeTool={activeTool}
          drawColor="#ef4444"
          strokeWidth={2}
          icons={state.icons}
          connections={state.connections}
          freehandDrawings={state.freehandDrawings}
          textLabels={state.textLabels}
          images={state.images}
          lines={state.lines}
          onAddIcon={diagramState.addIcon}
          onUpdateIconPosition={diagramState.updateIconPosition}
          onUpdateIconPositionImmediate={diagramState.updateIconPositionImmediate}
          onUpdateIconRotation={diagramState.updateIconRotation}
          onUpdateIconRotationImmediate={diagramState.updateIconRotationImmediate}
          onUpdateIconSize={diagramState.updateIconSize}
          onUpdateIconSizeImmediate={diagramState.updateIconSizeImmediate}
          onDeleteIcon={diagramState.deleteIcon}
          onAddConnection={diagramState.addConnection}
          onDeleteConnection={diagramState.deleteConnection}
          onAddFreehandDrawing={diagramState.addFreehandDrawing}
          onAddLine={diagramState.addLine}
          onAddTextLabel={diagramState.addTextLabel}
          onUpdateTextLabel={diagramState.updateTextLabel}
          onUpdateTextLabelImmediate={diagramState.updateTextLabelImmediate}
          onDeleteTextLabel={diagramState.deleteTextLabel}
          onAddImage={(url, position, name) => diagramState.addImage(url, position, name ?? '', '')}
          onUpdateImage={diagramState.updateImage}
          onUpdateImageImmediate={diagramState.updateImageImmediate}
          onDeleteImage={diagramState.deleteImage}
        />
      </div>

      {/* Right Sidebar */}
      <DiagramSidebar onLoadDiagram={handleLoadDiagram} />

      {/* Save Dialog */}
      <SaveDiagramDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSaveConfirm}
        isSaving={saveMutation.isPending}
      />

      {/* Load Dialog */}
      <LoadDiagramDialog
        open={loadDialogOpen}
        onOpenChange={setLoadDialogOpen}
        onLoadDiagram={handleLoadDiagram}
      />
    </div>
  );
}
