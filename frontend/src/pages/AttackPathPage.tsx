import React, { useState, useCallback } from 'react';
import AttackPathToolbar from '../components/AttackPathToolbar';
import AttackPathCanvas, { ToolType } from '../components/AttackPathCanvas';
import DiagramSidebar from '../components/DiagramSidebar';
import SaveDiagramDialog from '../components/SaveDiagramDialog';
import LoadDiagramDialog from '../components/LoadDiagramDialog';
import { useAttackPathState } from '../hooks/useAttackPathState';
import { useSaveDiagramState } from '../hooks/useSaveDiagramState';
import { NamedDiagram, ExternalBlob } from '../backend';

const DEFAULT_ICON_WIDTH = 56;
const DEFAULT_ICON_HEIGHT = 56;
const DEFAULT_TEXT_WIDTH = 160;
const DEFAULT_TEXT_HEIGHT = 60;
const DEFAULT_IMAGE_WIDTH = 150;
const DEFAULT_IMAGE_HEIGHT = 150;

export default function AttackPathPage() {
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);

  const diagramState = useAttackPathState();
  const saveMutation = useSaveDiagramState();

  const handleSaveConfirm = useCallback(async (name: string) => {
    const payload = diagramState.serializeForBackend();
    await saveMutation.mutateAsync({ name, state: payload });
    setSaveDialogOpen(false);
  }, [diagramState, saveMutation]);

  const handleLoadDiagram = useCallback((diagram: NamedDiagram) => {
    diagramState.loadDiagram(diagram.state);
    setLoadDialogOpen(false);
  }, [diagramState]);

  const handleImageUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      diagramState.addImage(url, { x: 100, y: 100 }, file.name, '');
    };
    reader.readAsDataURL(file);
  }, [diagramState]);

  // Adapter: canvas calls onStateChange with DiagramStateLocal directly
  const handleStateChange = useCallback((newState: typeof diagramState.state) => {
    // Push to history via a direct state replacement
    diagramState.loadDiagramLocal(newState);
  }, [diagramState]);

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Left toolbar */}
      <AttackPathToolbar
        activeTool={activeTool}
        onToolChange={(tool) => setActiveTool(tool as ToolType)}
        onSave={() => setSaveDialogOpen(true)}
        onLoad={() => setLoadDialogOpen(true)}
        onUndo={diagramState.undo}
        onRedo={diagramState.redo}
        onClear={diagramState.clearDiagram}
        onImageUpload={handleImageUpload}
        canUndo={diagramState.canUndo}
        canRedo={diagramState.canRedo}
      />

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <AttackPathCanvas
          activeTool={activeTool}
          state={diagramState.state}
          onStateChange={handleStateChange}
          onLoadDiagram={handleLoadDiagram}
        />
      </div>

      {/* Right sidebar */}
      <div className="w-48 border-l border-border bg-card flex flex-col overflow-hidden">
        <div className="px-3 py-2 border-b border-border shrink-0">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Saved Diagrams
          </h3>
        </div>
        <div className="flex-1 overflow-hidden">
          <DiagramSidebar onLoad={handleLoadDiagram} />
        </div>
      </div>

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
