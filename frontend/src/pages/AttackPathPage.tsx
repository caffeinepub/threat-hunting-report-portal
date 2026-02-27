import React, { useState, useCallback } from 'react';
import AttackPathCanvas from '../components/AttackPathCanvas';
import AttackPathToolbar from '../components/AttackPathToolbar';
import DiagramSidebar from '../components/DiagramSidebar';
import SaveDiagramDialog from '../components/SaveDiagramDialog';
import LoadDiagramDialog from '../components/LoadDiagramDialog';
import { useAttackPathState, ToolType } from '../hooks/useAttackPathState';
import { useSaveDiagramState } from '../hooks/useSaveDiagramState';
import { Button } from '@/components/ui/button';
import { Save, FolderOpen } from 'lucide-react';
import { DiagramState, NamedDiagram } from '../backend';

export default function AttackPathPage() {
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [drawColor, setDrawColor] = useState('#333333');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);

  const state = useAttackPathState();
  const saveMutation = useSaveDiagramState();

  const handleAddImage = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const maxW = 600;
      const maxH = 400;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
      if (h > maxH) { w = Math.round(w * maxH / h); h = maxH; }
      state.addImage({
        id: `img-${Date.now()}`,
        url,
        position: { x: 80, y: 80 },
        size: { width: w, height: h },
        name: file.name,
        description: '',
      });
    };
    img.src = url;
  }, [state]);

  const handleSave = useCallback(async (name: string) => {
    const diagramState: DiagramState = {
      icons: state.icons.map(ic => ({
        id: ic.id,
        iconType: ic.iconType,
        position: ic.position,
        name: ic.name,
      })),
      connections: state.connections.map(c => ({
        sourceId: c.sourceId,
        targetId: c.targetId,
        connectionType: c.connectionType,
        color: c.color,
      })),
      freehandDrawings: state.freehandDrawings.map(d => ({
        points: d.points,
        color: d.color,
        strokeWidth: d.strokeWidth,
      })),
      lines: state.lines.map(l => ({
        startPosition: l.startPosition,
        endPosition: l.endPosition,
        color: l.color,
        strokeWidth: l.strokeWidth,
        isArrow: l.isArrow,
      })),
      textLabels: state.textLabels.map(tl => ({
        content: tl.content,
        position: tl.position,
        fontSize: tl.fontSize,
        color: tl.color,
        fontWeight: tl.fontWeight,
      })),
      images: [],
      boxShapes: state.boxShapes.map(b => ({
        id: b.id,
        position: b.position,
        dimensions: b.dimensions,
        color: 'transparent',
        borderColor: b.strokeColor,
        borderWidth: b.strokeWidth,
        title: '',
      })),
      lastModified: BigInt(Date.now()),
    };

    await saveMutation.mutateAsync({ name, state: diagramState });
    setSaveDialogOpen(false);
  }, [state, saveMutation]);

  const handleLoad = useCallback((diagram: NamedDiagram) => {
    const ds = diagram.state;
    state.loadState({
      icons: ds.icons.map((ic, idx) => ({
        id: ic.id || `icon-loaded-${idx}`,
        iconType: ic.iconType,
        position: ic.position,
        name: ic.name,
      })),
      connections: ds.connections.map((c, idx) => ({
        id: `conn-loaded-${idx}`,
        sourceId: c.sourceId,
        targetId: c.targetId,
        connectionType: c.connectionType,
        color: c.color,
        rotation: 0,
      })),
      freehandDrawings: ds.freehandDrawings.map((d, idx) => ({
        id: `drawing-loaded-${idx}`,
        points: d.points,
        color: d.color,
        strokeWidth: d.strokeWidth,
      })),
      lines: ds.lines.map((l, idx) => ({
        id: `line-loaded-${idx}`,
        startPosition: l.startPosition,
        endPosition: l.endPosition,
        color: l.color,
        strokeWidth: l.strokeWidth,
        isArrow: l.isArrow,
      })),
      textLabels: ds.textLabels.map((tl, idx) => ({
        id: `label-loaded-${idx}`,
        content: tl.content,
        position: tl.position,
        fontSize: tl.fontSize,
        color: tl.color,
        fontWeight: tl.fontWeight,
      })),
      images: [],
      boxShapes: (ds.boxShapes ?? []).map((b, idx) => ({
        id: b.id || `box-loaded-${idx}`,
        position: b.position,
        dimensions: b.dimensions,
        strokeColor: b.borderColor,
        strokeWidth: b.borderWidth,
      })),
      dottedConnections: [],
    });
    setLoadDialogOpen(false);
  }, [state]);

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Left toolbar */}
      <div className="w-52 flex-shrink-0 h-full overflow-y-auto">
        <AttackPathToolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          drawColor={drawColor}
          onColorChange={setDrawColor}
          strokeWidth={strokeWidth}
          onStrokeWidthChange={setStrokeWidth}
          onUndo={state.undo}
          onClear={state.clearAll}
          onAddImage={handleAddImage}
        />
      </div>

      {/* Main canvas area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card flex-shrink-0">
          <h2 className="text-sm font-semibold text-foreground">Attack Path Canvas</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs"
              onClick={() => setLoadDialogOpen(true)}
            >
              <FolderOpen size={14} />
              Load
            </Button>
            <Button
              variant="default"
              size="sm"
              className="gap-2 text-xs"
              onClick={() => setSaveDialogOpen(true)}
              disabled={saveMutation.isPending}
            >
              <Save size={14} />
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-hidden">
          <AttackPathCanvas
            activeTool={activeTool}
            drawColor={drawColor}
            strokeWidth={strokeWidth}
            state={state}
            onIconSelect={setSelectedIconId}
            selectedIconId={selectedIconId}
          />
        </div>
      </div>

      {/* Right sidebar */}
      <div className="w-64 flex-shrink-0 h-full overflow-y-auto border-l border-border">
        <DiagramSidebar onLoadDiagram={handleLoad} />
      </div>

      {/* Dialogs */}
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
    </div>
  );
}
