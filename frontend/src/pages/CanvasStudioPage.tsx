import React, { useState, useCallback, useRef } from 'react';
import CanvasWorkspace from '../components/canvas/CanvasWorkspace';
import CanvasToolbar from '../components/canvas/CanvasToolbar';
import IconLibraryPanel from '../components/canvas/IconLibraryPanel';
import { useCanvasState, ToolType, ShapeType } from '../hooks/useCanvasState';
import { exportCanvasToPng } from '../utils/canvasExport';
import { toast } from 'sonner';

export default function CanvasStudioPage() {
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [activeShape, setActiveShape] = useState<ShapeType>('rectangle');
  const [strokeColor, setStrokeColor] = useState('#333333');
  const [fillColor, setFillColor] = useState('#ffffff');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fontSize, setFontSize] = useState(16);
  const [textColor, setTextColor] = useState('#333333');
  const [iconPanelOpen, setIconPanelOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasState = useCanvasState();

  const handleExportPng = useCallback(async () => {
    if (!canvasContainerRef.current) return;
    setIsExporting(true);
    try {
      await exportCanvasToPng(canvasContainerRef.current);
      toast.success('Canvas exported as PNG!');
    } catch (err) {
      toast.error('Failed to export canvas.');
    } finally {
      setIsExporting(false);
    }
  }, []);

  const handleIconSelect = useCallback((iconPath: string, iconName: string) => {
    canvasState.addIcon({
      id: `icon-${Date.now()}`,
      iconPath,
      iconName,
      position: { x: 200, y: 200 },
      size: 64,
    });
    setIconPanelOpen(false);
    setActiveTool('select');
  }, [canvasState]);

  return (
    <div className="flex h-full w-full overflow-hidden bg-canvas-chrome">
      {/* Left Toolbar */}
      <CanvasToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        activeShape={activeShape}
        onShapeChange={setActiveShape}
        strokeColor={strokeColor}
        onStrokeColorChange={setStrokeColor}
        fillColor={fillColor}
        onFillColorChange={setFillColor}
        strokeWidth={strokeWidth}
        onStrokeWidthChange={setStrokeWidth}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        textColor={textColor}
        onTextColorChange={setTextColor}
        onUndo={canvasState.undo}
        canUndo={canvasState.canUndo}
        onExportPng={handleExportPng}
        isExporting={isExporting}
        onToggleIconPanel={() => setIconPanelOpen(v => !v)}
        iconPanelOpen={iconPanelOpen}
      />

      {/* Canvas Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div ref={canvasContainerRef} className="flex-1 overflow-hidden relative">
          <CanvasWorkspace
            activeTool={activeTool}
            activeShape={activeShape}
            strokeColor={strokeColor}
            fillColor={fillColor}
            strokeWidth={strokeWidth}
            fontSize={fontSize}
            textColor={textColor}
            canvasState={canvasState}
          />
        </div>
      </div>

      {/* Icon Library Panel */}
      {iconPanelOpen && (
        <div className="w-72 flex-shrink-0 h-full border-l border-canvas-border bg-canvas-chrome overflow-hidden">
          <IconLibraryPanel
            onIconSelect={handleIconSelect}
            onClose={() => setIconPanelOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
