import { useRef, useState } from 'react';
import AttackPathIcon from './AttackPathIcon';
import AttackPathConnector from './AttackPathConnector';
import { PlacedIcon, Connection, DrawingPath, DrawingTool, TextLabel } from '@/hooks/useAttackPathState';
import { IconType } from './AttackPathToolbar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
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
  fontSize: number;
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
  onAddTextLabel: (text: string, x: number, y: number, color: string, fontSize: number) => void;
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
  fontSize,
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
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, elementX: 0, elementY: 0 });
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
    if (activeDrawingTool === 'eraser') {
      e.preventDefault();
      e.stopPropagation();
      onRemoveIcon(iconId);
      return;
    }

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

    if (draggedIconId) {
      onMoveIcon(draggedIconId, x - dragOffset.x, y - dragOffset.y);
    }

    if (transformTarget) {
      const deltaX = e.clientX - transformDragStart.x;
      const deltaY = e.clientY - transformDragStart.y;
      const newX = transformDragStart.elementX + deltaX;
      const newY = transformDragStart.elementY + deltaY;

      if (transformTarget.type === 'icon') {
        onMoveIcon(transformTarget.id, newX, newY);
      } else if (transformTarget.type === 'text') {
        onUpdateTextLabel(transformTarget.id, { x: newX, y: newY });
      }
    }

    if (resizeHandle) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;

      if (selectedElementType === 'icon' && selectedElementId) {
        let newWidth = resizeStart.width;
        let newHeight = resizeStart.height;
        let newX = resizeStart.elementX;
        let newY = resizeStart.elementY;

        if (resizeHandle.includes('e')) {
          newWidth = Math.max(20, resizeStart.width + deltaX);
        }
        if (resizeHandle.includes('w')) {
          newWidth = Math.max(20, resizeStart.width - deltaX);
          newX = resizeStart.elementX + deltaX;
        }
        if (resizeHandle.includes('s')) {
          newHeight = Math.max(20, resizeStart.height + deltaY);
        }
        if (resizeHandle.includes('n')) {
          newHeight = Math.max(20, resizeStart.height - deltaY);
          newY = resizeStart.elementY + deltaY;
        }

        onResizeIcon(selectedElementId, newWidth, newHeight);
        if (newX !== resizeStart.elementX || newY !== resizeStart.elementY) {
          onMoveIcon(selectedElementId, newX, newY);
        }
      } else if (selectedElementType === 'text' && selectedElementId) {
        let newWidth = resizeStart.width;
        let newHeight = resizeStart.height;
        let newX = resizeStart.elementX;
        let newY = resizeStart.elementY;

        if (resizeHandle.includes('e')) {
          newWidth = Math.max(50, resizeStart.width + deltaX);
        }
        if (resizeHandle.includes('w')) {
          newWidth = Math.max(50, resizeStart.width - deltaX);
          newX = resizeStart.elementX + deltaX;
        }
        if (resizeHandle.includes('s')) {
          newHeight = Math.max(20, resizeStart.height + deltaY);
        }
        if (resizeHandle.includes('n')) {
          newHeight = Math.max(20, resizeStart.height - deltaY);
          newY = resizeStart.elementY + deltaY;
        }

        onUpdateTextLabel(selectedElementId, { width: newWidth, height: newHeight, x: newX, y: newY });
      }
    }

    if (rotationHandle && selectedElementType === 'text' && selectedElementId) {
      const label = textLabels.find((l) => l.id === selectedElementId);
      if (!label) return;

      const centerX = label.x + (label.width || 100) / 2;
      const centerY = label.y + (label.height || 30) / 2;

      const angle = Math.atan2(y - centerY, x - centerX);
      const degrees = (angle * 180) / Math.PI;

      onUpdateTextLabel(selectedElementId, { rotation: degrees });
    }

    if (isDrawing && (activeDrawingTool === 'freehand' || activeDrawingTool === 'line' || activeDrawingTool === 'arrow')) {
      setCurrentDrawingPoints((prev) => [...prev, { x, y }]);
    }

    if (isDraggingDrawing && selectedDrawingId) {
      const deltaX = x - drawingDragStart.x;
      const deltaY = y - drawingDragStart.y;
      onMoveDrawing(selectedDrawingId, deltaX, deltaY);
      setDrawingDragStart({ x, y });
    }
  };

  const handleCanvasMouseUp = () => {
    if (draggedIconId) {
      setDraggedIconId(null);
    }

    if (transformTarget) {
      setTransformTarget(null);
    }

    if (resizeHandle) {
      setResizeHandle(null);
    }

    if (rotationHandle) {
      setRotationHandle(null);
    }

    if (isDrawing && currentDrawingPoints.length > 0) {
      if (activeDrawingTool === 'freehand') {
        onAddDrawing('freehand', currentDrawingPoints);
      } else if (activeDrawingTool === 'line' && currentDrawingPoints.length >= 2) {
        const start = currentDrawingPoints[0];
        const end = currentDrawingPoints[currentDrawingPoints.length - 1];
        onAddDrawing('line', [start, end]);
      } else if (activeDrawingTool === 'arrow' && currentDrawingPoints.length >= 2) {
        const start = currentDrawingPoints[0];
        const end = currentDrawingPoints[currentDrawingPoints.length - 1];
        onAddDrawing('arrow', [start, end]);
      }
      setIsDrawing(false);
      setCurrentDrawingPoints([]);
    }

    if (isDraggingDrawing) {
      setIsDraggingDrawing(false);
      setSelectedDrawingId(null);
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeDrawingTool === 'text') {
      setTextDialogPosition({ x, y });
      setTextDialogOpen(true);
      return;
    }

    if (activeDrawingTool === 'freehand' || activeDrawingTool === 'line' || activeDrawingTool === 'arrow') {
      setIsDrawing(true);
      setCurrentDrawingPoints([{ x, y }]);
    }

    if (activeDrawingTool === 'transform') {
      onSelectElement(null, null);
    }
  };

  const handleDrawingMouseDown = (e: React.MouseEvent, drawingId: string) => {
    if (activeDrawingTool === 'eraser') {
      e.preventDefault();
      e.stopPropagation();
      onRemoveDrawing(drawingId);
      return;
    }

    if (activeDrawingTool === 'transform') {
      e.preventDefault();
      e.stopPropagation();
      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setSelectedDrawingId(drawingId);
      setIsDraggingDrawing(true);
      setDrawingDragStart({ x, y });
    }
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      onAddTextLabel(textInput, textDialogPosition.x, textDialogPosition.y, textColor, fontSize);
      setTextInput('');
      setTextDialogOpen(false);
    }
  };

  const handleResizeHandleMouseDown = (e: React.MouseEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (selectedElementType === 'icon' && selectedElementId) {
      const icon = placedIcons.find((i) => i.id === selectedElementId);
      if (!icon) return;

      setResizeHandle(handle);
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: icon.width || 48,
        height: icon.height || 48,
        elementX: icon.x,
        elementY: icon.y,
      });
    } else if (selectedElementType === 'text' && selectedElementId) {
      const label = textLabels.find((l) => l.id === selectedElementId);
      if (!label) return;

      setResizeHandle(handle);
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: label.width || 100,
        height: label.height || 30,
        elementX: label.x,
        elementY: label.y,
      });
    }
  };

  const handleRotationHandleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (selectedElementType === 'text' && selectedElementId) {
      const label = textLabels.find((l) => l.id === selectedElementId);
      if (!label) return;

      setRotationHandle(selectedElementId);
      setRotationStart({
        x: e.clientX,
        y: e.clientY,
        rotation: label.rotation || 0,
      });
    }
  };

  const renderTransformHandles = () => {
    if (!selectedElementId || !selectedElementType || activeDrawingTool !== 'transform') return null;

    if (selectedElementType === 'icon') {
      const icon = placedIcons.find((i) => i.id === selectedElementId);
      if (!icon) return null;

      const width = icon.width || 48;
      const height = icon.height || 48;

      return (
        <div
          style={{
            position: 'absolute',
            left: icon.x,
            top: icon.y,
            width,
            height,
            border: '2px solid #3B82F6',
            pointerEvents: 'none',
          }}
        >
          {['nw', 'ne', 'sw', 'se'].map((handle) => (
            <div
              key={handle}
              onMouseDown={(e) => handleResizeHandleMouseDown(e, handle)}
              style={{
                position: 'absolute',
                width: 10,
                height: 10,
                backgroundColor: '#3B82F6',
                border: '2px solid white',
                borderRadius: '50%',
                pointerEvents: 'auto',
                cursor: `${handle}-resize`,
                ...(handle === 'nw' && { top: -5, left: -5 }),
                ...(handle === 'ne' && { top: -5, right: -5 }),
                ...(handle === 'sw' && { bottom: -5, left: -5 }),
                ...(handle === 'se' && { bottom: -5, right: -5 }),
              }}
            />
          ))}
        </div>
      );
    } else if (selectedElementType === 'text') {
      const label = textLabels.find((l) => l.id === selectedElementId);
      if (!label) return null;

      const width = label.width || 100;
      const height = label.height || 30;

      return (
        <div
          style={{
            position: 'absolute',
            left: label.x,
            top: label.y,
            width,
            height,
            border: '2px solid #3B82F6',
            pointerEvents: 'none',
            transform: `rotate(${label.rotation || 0}deg)`,
            transformOrigin: 'center',
          }}
        >
          {['nw', 'ne', 'sw', 'se'].map((handle) => (
            <div
              key={handle}
              onMouseDown={(e) => handleResizeHandleMouseDown(e, handle)}
              style={{
                position: 'absolute',
                width: 10,
                height: 10,
                backgroundColor: '#3B82F6',
                border: '2px solid white',
                borderRadius: '50%',
                pointerEvents: 'auto',
                cursor: `${handle}-resize`,
                ...(handle === 'nw' && { top: -5, left: -5 }),
                ...(handle === 'ne' && { top: -5, right: -5 }),
                ...(handle === 'sw' && { bottom: -5, left: -5 }),
                ...(handle === 'se' && { bottom: -5, right: -5 }),
              }}
            />
          ))}
          <div
            onMouseDown={handleRotationHandleMouseDown}
            style={{
              position: 'absolute',
              top: -30,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 20,
              height: 20,
              backgroundColor: '#10B981',
              border: '2px solid white',
              borderRadius: '50%',
              pointerEvents: 'auto',
              cursor: 'grab',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RotateCw className="h-3 w-3 text-white" />
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <div
        ref={canvasRef}
        className="flex-1 bg-muted/20 relative overflow-hidden"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseDown={handleCanvasMouseDown}
        style={{ cursor: activeDrawingTool === 'text' ? 'text' : activeDrawingTool ? 'crosshair' : 'default' }}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {connections.map((conn) => {
            const source = placedIcons.find((icon) => icon.id === conn.sourceId);
            const target = placedIcons.find((icon) => icon.id === conn.targetId);
            if (!source || !target) return null;

            return (
              <AttackPathConnector
                key={conn.id}
                id={conn.id}
                sourceX={source.x + (source.width || 48) / 2}
                sourceY={source.y + (source.height || 48) / 2}
                targetX={target.x + (target.width || 48) / 2}
                targetY={target.y + (target.height || 48) / 2}
                onClick={onRemoveConnection}
              />
            );
          })}

          {drawings.map((drawing) => {
            if (drawing.type === 'freehand') {
              const pathData = drawing.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
              return (
                <path
                  key={drawing.id}
                  d={pathData}
                  stroke="#000000"
                  strokeWidth={2}
                  fill="none"
                  style={{ pointerEvents: 'stroke', cursor: activeDrawingTool === 'eraser' ? 'pointer' : 'default' }}
                  onMouseDown={(e) => handleDrawingMouseDown(e, drawing.id)}
                />
              );
            } else if (drawing.type === 'line' && drawing.points.length >= 2) {
              const start = drawing.points[0];
              const end = drawing.points[1];
              return (
                <line
                  key={drawing.id}
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke="#000000"
                  strokeWidth={2}
                  style={{ pointerEvents: 'stroke', cursor: activeDrawingTool === 'eraser' ? 'pointer' : 'default' }}
                  onMouseDown={(e) => handleDrawingMouseDown(e, drawing.id)}
                />
              );
            } else if (drawing.type === 'arrow' && drawing.points.length >= 2) {
              const start = drawing.points[0];
              const end = drawing.points[1];
              const angle = Math.atan2(end.y - start.y, end.x - start.x);
              const arrowSize = 10;

              return (
                <g key={drawing.id}>
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke="#000000"
                    strokeWidth={2}
                    style={{ pointerEvents: 'stroke', cursor: activeDrawingTool === 'eraser' ? 'pointer' : 'default' }}
                    onMouseDown={(e) => handleDrawingMouseDown(e, drawing.id)}
                  />
                  <polygon
                    points={`0,-${arrowSize / 2} ${arrowSize},0 0,${arrowSize / 2}`}
                    fill="#000000"
                    transform={`translate(${end.x}, ${end.y}) rotate(${(angle * 180) / Math.PI})`}
                    style={{ pointerEvents: 'auto', cursor: activeDrawingTool === 'eraser' ? 'pointer' : 'default' }}
                    onMouseDown={(e) => handleDrawingMouseDown(e, drawing.id)}
                  />
                </g>
              );
            }
            return null;
          })}

          {isDrawing && currentDrawingPoints.length > 0 && (
            <>
              {activeDrawingTool === 'freehand' && (
                <path
                  d={currentDrawingPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
                  stroke="#000000"
                  strokeWidth={2}
                  fill="none"
                  opacity={0.5}
                />
              )}
              {(activeDrawingTool === 'line' || activeDrawingTool === 'arrow') && currentDrawingPoints.length >= 2 && (
                <>
                  <line
                    x1={currentDrawingPoints[0].x}
                    y1={currentDrawingPoints[0].y}
                    x2={currentDrawingPoints[currentDrawingPoints.length - 1].x}
                    y2={currentDrawingPoints[currentDrawingPoints.length - 1].y}
                    stroke="#000000"
                    strokeWidth={2}
                    opacity={0.5}
                  />
                  {activeDrawingTool === 'arrow' && (
                    <polygon
                      points={`0,-5 10,0 0,5`}
                      fill="#000000"
                      opacity={0.5}
                      transform={`translate(${currentDrawingPoints[currentDrawingPoints.length - 1].x}, ${
                        currentDrawingPoints[currentDrawingPoints.length - 1].y
                      }) rotate(${
                        (Math.atan2(
                          currentDrawingPoints[currentDrawingPoints.length - 1].y - currentDrawingPoints[0].y,
                          currentDrawingPoints[currentDrawingPoints.length - 1].x - currentDrawingPoints[0].x
                        ) *
                          180) /
                        Math.PI
                      })`}
                    />
                  )}
                </>
              )}
            </>
          )}
        </svg>

        {placedIcons.map((icon) => (
          <div
            key={icon.id}
            style={{
              position: 'absolute',
              left: icon.x,
              top: icon.y,
              cursor: mode === 'place' ? 'move' : mode === 'connect' ? 'pointer' : 'default',
            }}
            onMouseDown={(e) => handleIconMouseDown(e, icon.id)}
          >
            <AttackPathIcon type={icon.type} width={icon.width} height={icon.height} />
          </div>
        ))}

        {textLabels.map((label) => {
          const lines = label.text.split('\n');
          return (
            <div
              key={label.id}
              style={{
                position: 'absolute',
                left: label.x,
                top: label.y,
                color: label.color,
                fontSize: label.fontSize || 16,
                fontWeight: 'bold',
                cursor: activeDrawingTool === 'transform' ? 'move' : activeDrawingTool === 'eraser' ? 'pointer' : 'default',
                userSelect: 'none',
                whiteSpace: 'pre-wrap',
                transform: `rotate(${label.rotation || 0}deg)`,
                transformOrigin: 'top left',
                width: label.width || 'auto',
                height: label.height || 'auto',
                overflow: 'visible',
              }}
              onMouseDown={(e) => handleTextLabelMouseDown(e, label.id)}
            >
              {lines.map((line, index) => (
                <div key={index}>{line}</div>
              ))}
            </div>
          );
        })}

        {renderTransformHandles()}
      </div>

      <Dialog open={textDialogOpen} onOpenChange={setTextDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Text Label</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="text-input">Text (Press Enter for new line, Shift+Enter to submit)</Label>
              <Textarea
                id="text-input"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.shiftKey) {
                    e.preventDefault();
                    handleTextSubmit();
                  }
                }}
                placeholder="Enter text here..."
                className="mt-2"
                rows={4}
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-2">
                Press Enter to create a new line. Press Shift+Enter to submit.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTextDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleTextSubmit}>Add Text</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
