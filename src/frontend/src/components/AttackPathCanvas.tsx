import { useRef, useState, useEffect } from 'react';
import AttackPathIcon from './AttackPathIcon';
import AttackPathConnector from './AttackPathConnector';
import { PlacedIcon, Connection, DrawingPath, DrawingTool, TextLabel } from '@/hooks/useAttackPathState';
import { IconType } from './AttackPathToolbar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RotateCw } from 'lucide-react';

interface AttackPathCanvasProps {
  placedIcons: PlacedIcon[];
  connections: Connection[];
  drawings: DrawingPath[];
  textLabels: TextLabel[];
  mode: 'place' | 'connect' | 'draw';
  activeDrawingTool: DrawingTool;
  textColor: string;
  selectedElementId: string | null;
  selectedElementType: 'icon' | 'text' | null;
  onAddIcon: (type: IconType, x: number, y: number) => void;
  onMoveIcon: (id: string, x: number, y: number) => void;
  onResizeIcon: (id: string, width: number, height: number) => void;
  onRemoveIcon: (id: string) => void;
  onAddConnection: (sourceId: string, targetId: string) => void;
  onRemoveConnection: (id: string) => void;
  onAddDrawing: (type: 'freehand' | 'line' | 'arrow', points: { x: number; y: number }[]) => void;
  onRemoveDrawing: (id: string) => void;
  onMoveDrawing: (id: string, offsetX: number, offsetY: number) => void;
  onAddTextLabel: (text: string, x: number, y: number, color: string) => void;
  onRemoveTextLabel: (id: string) => void;
  onUpdateTextLabel: (id: string, updates: Partial<TextLabel>) => void;
  onSelectElement: (id: string | null, type: 'icon' | 'text' | null) => void;
}

export default function AttackPathCanvas({
  placedIcons,
  connections,
  drawings,
  textLabels,
  mode,
  activeDrawingTool,
  textColor,
  selectedElementId,
  selectedElementType,
  onAddIcon,
  onMoveIcon,
  onResizeIcon,
  onRemoveIcon,
  onAddConnection,
  onRemoveConnection,
  onAddDrawing,
  onRemoveDrawing,
  onMoveDrawing,
  onAddTextLabel,
  onRemoveTextLabel,
  onUpdateTextLabel,
  onSelectElement,
}: AttackPathCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggedIconId, setDraggedIconId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawingPoints, setCurrentDrawingPoints] = useState<{ x: number; y: number }[]>([]);
  const [textDialogOpen, setTextDialogOpen] = useState(false);
  const [textDialogPosition, setTextDialogPosition] = useState({ x: 0, y: 0 });
  const [textInput, setTextInput] = useState('');
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);
  const [isDraggingDrawing, setIsDraggingDrawing] = useState(false);
  const [drawingDragStart, setDrawingDragStart] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [rotationHandle, setRotationHandle] = useState<string | null>(null);
  const [rotationStart, setRotationStart] = useState({ x: 0, y: 0, rotation: 0 });
  const [transformTarget, setTransformTarget] = useState<{ id: string; type: 'icon' | 'text' } | null>(null);
  const [transformDragStart, setTransformDragStart] = useState({ x: 0, y: 0, elementX: 0, elementY: 0 });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!canvasRef.current || mode !== 'place') return;

    const iconType = e.dataTransfer.getData('iconType') as IconType;
    if (!iconType) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 24; // Center the icon (48px / 2)
    const y = e.clientY - rect.top - 24;

    onAddIcon(iconType, x, y);
  };

  const handleIconMouseDown = (e: React.MouseEvent, iconId: string) => {
    if (activeDrawingTool === 'transform') {
      e.preventDefault();
      e.stopPropagation();
      const icon = placedIcons.find((i) => i.id === iconId);
      if (!icon) return;

      setTransformTarget({ id: iconId, type: 'icon' });
      setTransformDragStart({
        x: e.clientX,
        y: e.clientY,
        elementX: icon.x,
        elementY: icon.y,
      });
      onSelectElement(iconId, 'icon');
      return;
    }

    if (mode === 'place') {
      e.preventDefault();
      const icon = placedIcons.find((i) => i.id === iconId);
      if (!icon) return;

      setDraggedIconId(iconId);
      setDragOffset({
        x: e.clientX - icon.x,
        y: e.clientY - icon.y,
      });
    } else if (mode === 'connect') {
      if (connectingFrom === null) {
        setConnectingFrom(iconId);
        setSelectedIcon(iconId);
      } else if (connectingFrom !== iconId) {
        onAddConnection(connectingFrom, iconId);
        setConnectingFrom(null);
        setSelectedIcon(null);
      }
    }
  };

  const handleTextLabelMouseDown = (e: React.MouseEvent, labelId: string) => {
    if (activeDrawingTool === 'eraser') {
      e.preventDefault();
      e.stopPropagation();
      onRemoveTextLabel(labelId);
      return;
    }

    if (activeDrawingTool === 'transform') {
      e.preventDefault();
      e.stopPropagation();
      const label = textLabels.find((l) => l.id === labelId);
      if (!label) return;

      setTransformTarget({ id: labelId, type: 'text' });
      setTransformDragStart({
        x: e.clientX,
        y: e.clientY,
        elementX: label.x,
        elementY: label.y,
      });
      onSelectElement(labelId, 'text');
      return;
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Handle transform tool dragging
    if (transformTarget && activeDrawingTool === 'transform') {
      const deltaX = e.clientX - transformDragStart.x;
      const deltaY = e.clientY - transformDragStart.y;
      const newX = transformDragStart.elementX + deltaX;
      const newY = transformDragStart.elementY + deltaY;

      if (transformTarget.type === 'icon') {
        onMoveIcon(transformTarget.id, newX, newY);
      } else if (transformTarget.type === 'text') {
        onUpdateTextLabel(transformTarget.id, { x: newX, y: newY });
      }
      return;
    }

    // Handle icon dragging in place mode
    if (draggedIconId && mode === 'place') {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      onMoveIcon(draggedIconId, newX, newY);
      return;
    }

    // Handle drawing
    if (isDrawing && (activeDrawingTool === 'freehand' || activeDrawingTool === 'line' || activeDrawingTool === 'arrow')) {
      if (activeDrawingTool === 'freehand') {
        setCurrentDrawingPoints((prev) => [...prev, { x, y }]);
      } else {
        setCurrentDrawingPoints([currentDrawingPoints[0], { x, y }]);
      }
      return;
    }

    // Handle drawing movement
    if (isDraggingDrawing && selectedDrawingId) {
      const deltaX = x - drawingDragStart.x;
      const deltaY = y - drawingDragStart.y;
      onMoveDrawing(selectedDrawingId, deltaX, deltaY);
      setDrawingDragStart({ x, y });
      return;
    }

    // Handle resize
    if (resizeHandle) {
      const [elementId, handleType] = resizeHandle.split('-');
      const element = selectedElementType === 'icon' 
        ? placedIcons.find((i) => i.id === elementId)
        : textLabels.find((l) => l.id === elementId);

      if (!element) return;

      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;

      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;

      if (handleType === 'se') {
        newWidth = Math.max(20, resizeStart.width + deltaX);
        newHeight = Math.max(20, resizeStart.height + deltaY);
      } else if (handleType === 'sw') {
        newWidth = Math.max(20, resizeStart.width - deltaX);
        newHeight = Math.max(20, resizeStart.height + deltaY);
      } else if (handleType === 'ne') {
        newWidth = Math.max(20, resizeStart.width + deltaX);
        newHeight = Math.max(20, resizeStart.height - deltaY);
      } else if (handleType === 'nw') {
        newWidth = Math.max(20, resizeStart.width - deltaX);
        newHeight = Math.max(20, resizeStart.height - deltaY);
      }

      if (selectedElementType === 'icon') {
        onResizeIcon(elementId, newWidth, newHeight);
      } else if (selectedElementType === 'text') {
        onUpdateTextLabel(elementId, { width: newWidth, height: newHeight });
      }
      return;
    }

    // Handle rotation
    if (rotationHandle) {
      const labelId = rotationHandle.replace('-rotate', '');
      const label = textLabels.find((l) => l.id === labelId);
      if (!label) return;

      const centerX = label.x + (label.width || 100) / 2;
      const centerY = label.y + (label.height || 30) / 2;

      const angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI);
      onUpdateTextLabel(labelId, { rotation: angle });
      return;
    }
  };

  const handleCanvasMouseUp = () => {
    setDraggedIconId(null);
    setTransformTarget(null);
    setIsDraggingDrawing(false);
    setSelectedDrawingId(null);
    setResizeHandle(null);
    setRotationHandle(null);

    if (isDrawing && currentDrawingPoints.length > 0) {
      if (activeDrawingTool === 'freehand' && currentDrawingPoints.length > 1) {
        onAddDrawing('freehand', currentDrawingPoints);
      } else if ((activeDrawingTool === 'line' || activeDrawingTool === 'arrow') && currentDrawingPoints.length === 2) {
        onAddDrawing(activeDrawingTool, currentDrawingPoints);
      }
      setIsDrawing(false);
      setCurrentDrawingPoints([]);
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Handle text tool
    if (activeDrawingTool === 'text') {
      setTextDialogPosition({ x, y });
      setTextDialogOpen(true);
      return;
    }

    // Handle drawing tools
    if (activeDrawingTool === 'freehand' || activeDrawingTool === 'line' || activeDrawingTool === 'arrow') {
      setIsDrawing(true);
      setCurrentDrawingPoints([{ x, y }]);
      return;
    }

    // Handle eraser
    if (activeDrawingTool === 'eraser') {
      // Check if clicking on a drawing
      const clickedDrawing = drawings.find((drawing) => {
        return drawing.points.some((point) => {
          const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
          return distance < 10;
        });
      });

      if (clickedDrawing) {
        onRemoveDrawing(clickedDrawing.id);
        return;
      }
    }

    // Deselect when clicking on empty canvas
    onSelectElement(null, null);
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      onAddTextLabel(textInput, textDialogPosition.x, textDialogPosition.y, textColor);
      setTextInput('');
      setTextDialogOpen(false);
    }
  };

  const handleDrawingMouseDown = (e: React.MouseEvent, drawingId: string) => {
    if (activeDrawingTool === 'eraser') {
      e.preventDefault();
      e.stopPropagation();
      onRemoveDrawing(drawingId);
      return;
    }

    if (!canvasRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setSelectedDrawingId(drawingId);
    setIsDraggingDrawing(true);
    setDrawingDragStart({ x, y });
  };

  const handleResizeMouseDown = (e: React.MouseEvent, elementId: string, handleType: string) => {
    e.preventDefault();
    e.stopPropagation();

    const element = selectedElementType === 'icon'
      ? placedIcons.find((i) => i.id === elementId)
      : textLabels.find((l) => l.id === elementId);

    if (!element) return;

    setResizeHandle(`${elementId}-${handleType}`);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: selectedElementType === 'icon' ? (element as PlacedIcon).width || 48 : (element as TextLabel).width || 100,
      height: selectedElementType === 'icon' ? (element as PlacedIcon).height || 48 : (element as TextLabel).height || 30,
    });
  };

  const handleRotateMouseDown = (e: React.MouseEvent, labelId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const label = textLabels.find((l) => l.id === labelId);
    if (!label) return;

    setRotationHandle(`${labelId}-rotate`);
    setRotationStart({
      x: e.clientX,
      y: e.clientY,
      rotation: label.rotation || 0,
    });
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      handleCanvasMouseUp();
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDrawing, currentDrawingPoints, activeDrawingTool]);

  return (
    <>
      <div
        ref={canvasRef}
        className="relative w-full h-full bg-white border-2 border-border rounded-lg overflow-hidden"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        style={{ cursor: activeDrawingTool === 'eraser' ? 'crosshair' : activeDrawingTool === 'text' ? 'text' : 'default' }}
      >
        {/* Render connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          {connections.map((conn) => {
            const sourceIcon = placedIcons.find((icon) => icon.id === conn.sourceId);
            const targetIcon = placedIcons.find((icon) => icon.id === conn.targetId);

            if (!sourceIcon || !targetIcon) return null;

            return (
              <AttackPathConnector
                key={conn.id}
                id={conn.id}
                sourceX={sourceIcon.x + (sourceIcon.width || 48) / 2}
                sourceY={sourceIcon.y + (sourceIcon.height || 48) / 2}
                targetX={targetIcon.x + (targetIcon.width || 48) / 2}
                targetY={targetIcon.y + (targetIcon.height || 48) / 2}
                onClick={onRemoveConnection}
              />
            );
          })}
        </svg>

        {/* Render drawings */}
        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 2 }}>
          {drawings.map((drawing) => {
            if (drawing.type === 'freehand') {
              const pathData = drawing.points.map((point, index) => 
                `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
              ).join(' ');

              return (
                <path
                  key={drawing.id}
                  d={pathData}
                  stroke="#000000"
                  strokeWidth={2}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="cursor-move"
                  onMouseDown={(e) => handleDrawingMouseDown(e, drawing.id)}
                />
              );
            } else if (drawing.type === 'line' || drawing.type === 'arrow') {
              const start = drawing.points[0];
              const end = drawing.points[1];

              return (
                <g key={drawing.id} onMouseDown={(e) => handleDrawingMouseDown(e, drawing.id)} className="cursor-move">
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke="#000000"
                    strokeWidth={2}
                  />
                  {drawing.type === 'arrow' && (
                    <polygon
                      points={`${end.x},${end.y} ${end.x - 10},${end.y - 5} ${end.x - 10},${end.y + 5}`}
                      fill="#000000"
                      transform={`rotate(${Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI)} ${end.x} ${end.y})`}
                    />
                  )}
                </g>
              );
            }
            return null;
          })}

          {/* Current drawing preview */}
          {isDrawing && currentDrawingPoints.length > 0 && (
            <>
              {activeDrawingTool === 'freehand' && (
                <path
                  d={currentDrawingPoints.map((point, index) => 
                    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
                  ).join(' ')}
                  stroke="#000000"
                  strokeWidth={2}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.5}
                />
              )}
              {(activeDrawingTool === 'line' || activeDrawingTool === 'arrow') && currentDrawingPoints.length === 2 && (
                <g>
                  <line
                    x1={currentDrawingPoints[0].x}
                    y1={currentDrawingPoints[0].y}
                    x2={currentDrawingPoints[1].x}
                    y2={currentDrawingPoints[1].y}
                    stroke="#000000"
                    strokeWidth={2}
                    opacity={0.5}
                  />
                  {activeDrawingTool === 'arrow' && (
                    <polygon
                      points={`${currentDrawingPoints[1].x},${currentDrawingPoints[1].y} ${currentDrawingPoints[1].x - 10},${currentDrawingPoints[1].y - 5} ${currentDrawingPoints[1].x - 10},${currentDrawingPoints[1].y + 5}`}
                      fill="#000000"
                      opacity={0.5}
                      transform={`rotate(${Math.atan2(currentDrawingPoints[1].y - currentDrawingPoints[0].y, currentDrawingPoints[1].x - currentDrawingPoints[0].x) * (180 / Math.PI)} ${currentDrawingPoints[1].x} ${currentDrawingPoints[1].y})`}
                    />
                  )}
                </g>
              )}
            </>
          )}
        </svg>

        {/* Render placed icons */}
        {placedIcons.map((icon) => (
          <div
            key={icon.id}
            className={`absolute ${selectedIcon === icon.id ? 'ring-2 ring-primary' : ''} ${selectedElementId === icon.id && activeDrawingTool === 'transform' ? 'ring-2 ring-blue-500' : ''}`}
            style={{
              left: icon.x,
              top: icon.y,
              width: icon.width || 48,
              height: icon.height || 48,
              zIndex: 10,
            }}
            onMouseDown={(e) => handleIconMouseDown(e, icon.id)}
          >
            <AttackPathIcon type={icon.type} width={icon.width} height={icon.height} />
            
            {/* Transform handles */}
            {selectedElementId === icon.id && activeDrawingTool === 'transform' && (
              <>
                <div
                  className="absolute w-3 h-3 bg-blue-500 border border-white rounded-full cursor-nwse-resize"
                  style={{ top: -6, left: -6 }}
                  onMouseDown={(e) => handleResizeMouseDown(e, icon.id, 'nw')}
                />
                <div
                  className="absolute w-3 h-3 bg-blue-500 border border-white rounded-full cursor-nesw-resize"
                  style={{ top: -6, right: -6 }}
                  onMouseDown={(e) => handleResizeMouseDown(e, icon.id, 'ne')}
                />
                <div
                  className="absolute w-3 h-3 bg-blue-500 border border-white rounded-full cursor-nesw-resize"
                  style={{ bottom: -6, left: -6 }}
                  onMouseDown={(e) => handleResizeMouseDown(e, icon.id, 'sw')}
                />
                <div
                  className="absolute w-3 h-3 bg-blue-500 border border-white rounded-full cursor-nwse-resize"
                  style={{ bottom: -6, right: -6 }}
                  onMouseDown={(e) => handleResizeMouseDown(e, icon.id, 'se')}
                />
              </>
            )}
          </div>
        ))}

        {/* Render text labels */}
        {textLabels.map((label) => (
          <div
            key={label.id}
            className={`absolute font-bold cursor-move select-none ${selectedElementId === label.id && activeDrawingTool === 'transform' ? 'ring-2 ring-blue-500' : ''}`}
            style={{
              left: label.x,
              top: label.y,
              color: label.color,
              transform: `rotate(${label.rotation || 0}deg)`,
              transformOrigin: 'center',
              width: label.width || 'auto',
              height: label.height || 'auto',
              zIndex: 20,
            }}
            onMouseDown={(e) => handleTextLabelMouseDown(e, label.id)}
          >
            {label.text}
            
            {/* Transform handles for text */}
            {selectedElementId === label.id && activeDrawingTool === 'transform' && (
              <>
                <div
                  className="absolute w-3 h-3 bg-blue-500 border border-white rounded-full cursor-nwse-resize"
                  style={{ top: -6, left: -6 }}
                  onMouseDown={(e) => handleResizeMouseDown(e, label.id, 'nw')}
                />
                <div
                  className="absolute w-3 h-3 bg-blue-500 border border-white rounded-full cursor-nesw-resize"
                  style={{ top: -6, right: -6 }}
                  onMouseDown={(e) => handleResizeMouseDown(e, label.id, 'ne')}
                />
                <div
                  className="absolute w-3 h-3 bg-blue-500 border border-white rounded-full cursor-nesw-resize"
                  style={{ bottom: -6, left: -6 }}
                  onMouseDown={(e) => handleResizeMouseDown(e, label.id, 'sw')}
                />
                <div
                  className="absolute w-3 h-3 bg-blue-500 border border-white rounded-full cursor-nwse-resize"
                  style={{ bottom: -6, right: -6 }}
                  onMouseDown={(e) => handleResizeMouseDown(e, label.id, 'se')}
                />
                <div
                  className="absolute w-4 h-4 bg-green-500 border border-white rounded-full cursor-grab"
                  style={{ top: -20, left: '50%', transform: 'translateX(-50%)' }}
                  onMouseDown={(e) => handleRotateMouseDown(e, label.id)}
                >
                  <RotateCw className="w-3 h-3 text-white" style={{ margin: '2px' }} />
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Text Input Dialog */}
      <Dialog open={textDialogOpen} onOpenChange={setTextDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Text Label</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="text-input">Text</Label>
              <Input
                id="text-input"
                placeholder="Enter text..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleTextSubmit();
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTextDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleTextSubmit} disabled={!textInput.trim()}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
