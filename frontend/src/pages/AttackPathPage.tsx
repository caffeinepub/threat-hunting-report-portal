import React, { useState } from 'react';
import AttackPathCanvas, { ToolType } from '../components/AttackPathCanvas';
import AttackPathToolbar from '../components/AttackPathToolbar';
import DiagramSidebar from '../components/DiagramSidebar';
import SaveDiagramDialog from '../components/SaveDiagramDialog';
import LoadDiagramDialog from '../components/LoadDiagramDialog';
import { useAttackPathState } from '../hooks/useAttackPathState';
import { useSaveDiagramState } from '../hooks/useSaveDiagramState';
import { NamedDiagram } from '../backend';

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
    const diagramStatePayload = diagramState.serializeForBackend();
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
          onDeleteFreehandDrawing={diagramState.deleteFreehandDrawing}
          onAddLine={diagramState.addLine}
          onDeleteLine={diagramState.deleteLine}
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
      <DiagramSidebar onLoad={handleLoadDiagram} />

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
        onLoad={handleLoadDiagram}
      />
    </div>
  );
}
