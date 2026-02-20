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
    } else if (mode === 'draw' && activeDrawingTool === 'eraser') {
      // Eraser can delete icons
      onRemoveIcon(iconId);
    } else if (mode === 'draw' && activeDrawingTool === 'transform') {
      // Select icon for transformation
      onSelectElement(iconId, 'icon');
    }
  };

  const handleTextLabelMouseDown = (e: React.MouseEvent, labelId: string) => {
    if (mode === 'draw' && activeDrawingTool === 'transform') {
      e.stopPropagation();
      onSelectElement(labelId, 'text');
    } else if (mode === 'draw' && activeDrawingTool === 'eraser') {
      onRemoveTextLabel(labelId);
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    if (!selectedElementId) return;

    const element = selectedElementType === 'icon' 
      ? placedIcons.find(i => i.id === selectedElementId)
      : textLabels.find(t => t.id === selectedElementId);

    if (!element) return;

    setResizeHandle(handle);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: element.width || 48,
      height: element.height || 48,
    });
  };

  const handleRotationMouseDown = (e: React.MouseEvent, labelId: string) => {
    e.stopPropagation();
    const label = textLabels.find(t => t.id === labelId);
    if (!label) return;

    setRotationHandle(labelId);
    setRotationStart({
      x: e.clientX,
      y: e.clientY,
      rotation: label.rotation || 0,
    });
  };

  const isPointNearPath = (x: number, y: number, points: { x: number; y: number }[], threshold: number = 10): boolean => {
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      
      // Calculate distance from point to line segment
      const A = x - p1.x;
      const B = y - p1.y;
      const C = p2.x - p1.x;
      const D = p2.y - p1.y;

      const dot = A * C + B * D;
      const lenSq = C * C + D * D;
      let param = -1;
      
      if (lenSq !== 0) param = dot / lenSq;

      let xx, yy;

      if (param < 0) {
        xx = p1.x;
        yy = p1.y;
      } else if (param > 1) {
        xx = p2.x;
        yy = p2.y;
      } else {
        xx = p1.x + param * C;
        yy = p1.y + param * D;
      }

      const dx = x - xx;
      const dy = y - yy;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < threshold) return true;
    }
    return false;
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (mode === 'draw' && activeDrawingTool && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (activeDrawingTool === 'text') {
        // Open text input dialog
        setTextDialogPosition({ x, y });
        setTextDialogOpen(true);
      } else if (activeDrawingTool === 'eraser') {
        // Check if clicking on a drawing element
        for (const drawing of drawings) {
          if (isPointNearPath(x, y, drawing.points)) {
            onRemoveDrawing(drawing.id);
            return;
          }
        }
        // Check if clicking on a text label
        for (const label of textLabels) {
          const labelWidth = label.width || label.text.length * 8;
          const labelHeight = label.height || 20;
          if (
            x >= label.x &&
            x <= label.x + labelWidth &&
            y >= label.y - labelHeight &&
            y <= label.y
          ) {
            onRemoveTextLabel(label.id);
            return;
          }
        }
      } else if (activeDrawingTool === 'transform') {
        // Deselect if clicking on empty canvas
        onSelectElement(null, null);
      } else {
        // Check if clicking on a drawing to select it for moving
        for (const drawing of drawings) {
          if (isPointNearPath(x, y, drawing.points)) {
            setSelectedDrawingId(drawing.id);
            setIsDraggingDrawing(true);
            setDrawingDragStart({ x, y });
            return;
          }
        }
        // Start new drawing
        setIsDrawing(true);
        setCurrentDrawingPoints([{ x, y }]);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedIconId && canvasRef.current && mode === 'place') {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - dragOffset.x;
      const y = e.clientY - rect.top - dragOffset.y;

      onMoveIcon(draggedIconId, Math.max(0, Math.min(x, rect.width - 48)), Math.max(0, Math.min(y, rect.height - 48)));
    } else if (resizeHandle && selectedElementId && canvasRef.current) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;

      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;

      if (resizeHandle.includes('e')) {
        newWidth = Math.max(20, resizeStart.width + deltaX);
      }
      if (resizeHandle.includes('w')) {
        newWidth = Math.max(20, resizeStart.width - deltaX);
      }
      if (resizeHandle.includes('s')) {
        newHeight = Math.max(20, resizeStart.height + deltaY);
      }
      if (resizeHandle.includes('n')) {
        newHeight = Math.max(20, resizeStart.height - deltaY);
      }

      if (selectedElementType === 'icon') {
        onResizeIcon(selectedElementId, newWidth, newHeight);
      } else if (selectedElementType === 'text') {
        onUpdateTextLabel(selectedElementId, { width: newWidth, height: newHeight });
      }
    } else if (rotationHandle && canvasRef.current) {
      const label = textLabels.find(t => t.id === rotationHandle);
      if (!label) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const centerX = label.x + (label.width || 100) / 2;
      const centerY = label.y - (label.height || 20) / 2;

      const startAngle = Math.atan2(rotationStart.y - rect.top - centerY, rotationStart.x - rect.left - centerX);
      const currentAngle = Math.atan2(e.clientY - rect.top - centerY, e.clientX - rect.left - centerX);
      
      const deltaAngle = (currentAngle - startAngle) * (180 / Math.PI);
      const newRotation = (rotationStart.rotation + deltaAngle) % 360;

      onUpdateTextLabel(rotationHandle, { rotation: newRotation });
    } else if (isDraggingDrawing && selectedDrawingId && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const offsetX = x - drawingDragStart.x;
      const offsetY = y - drawingDragStart.y;
      
      onMoveDrawing(selectedDrawingId, offsetX, offsetY);
      setDrawingDragStart({ x, y });
    } else if (isDrawing && canvasRef.current && mode === 'draw' && activeDrawingTool) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (activeDrawingTool === 'freehand') {
        setCurrentDrawingPoints((prev) => [...prev, { x, y }]);
      } else {
        // For line and arrow, only update the end point
        setCurrentDrawingPoints((prev) => [prev[0], { x, y }]);
      }
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && currentDrawingPoints.length > 1 && activeDrawingTool && activeDrawingTool !== 'text' && activeDrawingTool !== 'eraser' && activeDrawingTool !== 'transform') {
      onAddDrawing(activeDrawingTool as 'freehand' | 'line' | 'arrow', currentDrawingPoints);
    }
    setIsDrawing(false);
    setCurrentDrawingPoints([]);
    setDraggedIconId(null);
    setIsDraggingDrawing(false);
    setSelectedDrawingId(null);
    setResizeHandle(null);
    setRotationHandle(null);
  };

  const handleIconDoubleClick = (iconId: string) => {
    if (mode === 'place') {
      onRemoveIcon(iconId);
    }
  };

  const handleConnectionClick = (connectionId: string) => {
    if (activeDrawingTool === 'eraser') {
      onRemoveConnection(connectionId);
    }
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      onAddTextLabel(textInput, textDialogPosition.x, textDialogPosition.y, textColor);
      setTextInput('');
    }
    setTextDialogOpen(false);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDrawing && currentDrawingPoints.length > 1 && activeDrawingTool && activeDrawingTool !== 'text' && activeDrawingTool !== 'eraser' && activeDrawingTool !== 'transform') {
        onAddDrawing(activeDrawingTool as 'freehand' | 'line' | 'arrow', currentDrawingPoints);
      }
      setIsDrawing(false);
      setCurrentDrawingPoints([]);
      setDraggedIconId(null);
      setIsDraggingDrawing(false);
      setSelectedDrawingId(null);
      setResizeHandle(null);
      setRotationHandle(null);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDrawing, currentDrawingPoints, activeDrawingTool, onAddDrawing]);

  const renderDrawing = (drawing: DrawingPath) => {
    if (drawing.type === 'freehand') {
      const pathData = drawing.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
      return (
        <path
          key={drawing.id}
          d={pathData}
          stroke="black"
          strokeWidth="2"
          fill="none"
          style={{ pointerEvents: 'stroke' }}
        />
      );
    } else if (drawing.type === 'line' || drawing.type === 'arrow') {
      const start = drawing.points[0];
      const end = drawing.points[1];
      return (
        <g key={drawing.id}>
          <line
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke="black"
            strokeWidth="2"
            style={{ pointerEvents: 'stroke' }}
          />
          {drawing.type === 'arrow' && (
            <polygon
              points={`${end.x},${end.y} ${end.x - 10},${end.y - 5} ${end.x - 10},${end.y + 5}`}
              fill="black"
              transform={`rotate(${Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI)}, ${end.x}, ${end.y})`}
            />
          )}
        </g>
      );
    }
    return null;
  };

  const renderTransformHandles = (element: PlacedIcon | TextLabel, type: 'icon' | 'text') => {
    const width = element.width || (type === 'icon' ? 48 : 100);
    const height = element.height || (type === 'icon' ? 48 : 20);
    const x = element.x;
    const y = type === 'icon' ? element.y : element.y - height;

    const handles = [
      { id: 'nw', x: x - 4, y: y - 4, cursor: 'nw-resize' },
      { id: 'ne', x: x + width - 4, y: y - 4, cursor: 'ne-resize' },
      { id: 'sw', x: x - 4, y: y + height - 4, cursor: 'sw-resize' },
      { id: 'se', x: x + width - 4, y: y + height - 4, cursor: 'se-resize' },
      { id: 'n', x: x + width / 2 - 4, y: y - 4, cursor: 'n-resize' },
      { id: 's', x: x + width / 2 - 4, y: y + height - 4, cursor: 's-resize' },
      { id: 'w', x: x - 4, y: y + height / 2 - 4, cursor: 'w-resize' },
      { id: 'e', x: x + width - 4, y: y + height / 2 - 4, cursor: 'e-resize' },
    ];

    return (
      <>
        <div
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: width,
            height: height,
            border: '2px solid #3B82F6',
            pointerEvents: 'none',
          }}
        />
        {handles.map((handle) => (
          <div
            key={handle.id}
            onMouseDown={(e) => handleResizeMouseDown(e, handle.id)}
            style={{
              position: 'absolute',
              left: handle.x,
              top: handle.y,
              width: 8,
              height: 8,
              backgroundColor: '#3B82F6',
              border: '1px solid white',
              cursor: handle.cursor,
              zIndex: 1000,
            }}
          />
        ))}
        {type === 'text' && (
          <div
            onMouseDown={(e) => handleRotationMouseDown(e, element.id)}
            style={{
              position: 'absolute',
              left: x + width / 2 - 12,
              top: y - 30,
              width: 24,
              height: 24,
              backgroundColor: '#3B82F6',
              border: '1px solid white',
              borderRadius: '50%',
              cursor: 'grab',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
          >
            <RotateCw className="w-4 h-4 text-white" />
          </div>
        )}
      </>
    );
  };

  return (
    <>
      <div
        ref={canvasRef}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="relative w-full h-full bg-white border border-border rounded-lg overflow-hidden"
        style={{ cursor: mode === 'draw' && activeDrawingTool ? 'crosshair' : 'default' }}
      >
        {/* SVG Layer for connections and drawings */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          {connections.map((conn) => {
            const sourceIcon = placedIcons.find((icon) => icon.id === conn.sourceId);
            const targetIcon = placedIcons.find((icon) => icon.id === conn.targetId);
            if (!sourceIcon || !targetIcon) return null;

            return (
              <AttackPathConnector
                key={conn.id}
                id={conn.id}
                sourceX={sourceIcon.x + 24}
                sourceY={sourceIcon.y + 24}
                targetX={targetIcon.x + 24}
                targetY={targetIcon.y + 24}
                onClick={handleConnectionClick}
              />
            );
          })}
          {drawings.map(renderDrawing)}
          {isDrawing && currentDrawingPoints.length > 0 && renderDrawing({
            id: 'temp',
            type: activeDrawingTool as 'freehand' | 'line' | 'arrow',
            points: currentDrawingPoints,
          })}
        </svg>

        {/* Icons Layer */}
        {placedIcons.map((icon) => (
          <div
            key={icon.id}
            style={{
              position: 'absolute',
              left: icon.x,
              top: icon.y,
              zIndex: 2,
            }}
            onMouseDown={(e) => handleIconMouseDown(e, icon.id)}
            onDoubleClick={() => handleIconDoubleClick(icon.id)}
          >
            <AttackPathIcon 
              type={icon.type} 
              width={icon.width}
              height={icon.height}
            />
          </div>
        ))}

        {/* Text Labels Layer */}
        {textLabels.map((label) => (
          <div
            key={label.id}
            onMouseDown={(e) => handleTextLabelMouseDown(e, label.id)}
            style={{
              position: 'absolute',
              left: label.x,
              top: label.y,
              color: label.color,
              fontSize: '16px',
              fontWeight: 'bold',
              userSelect: 'none',
              cursor: activeDrawingTool === 'transform' ? 'move' : 'default',
              zIndex: 3,
              transform: `rotate(${label.rotation || 0}deg)`,
              transformOrigin: 'top left',
              width: label.width || 'auto',
              height: label.height || 'auto',
              overflow: 'hidden',
            }}
          >
            {label.text}
          </div>
        ))}

        {/* Transform Handles */}
        {activeDrawingTool === 'transform' && selectedElementId && selectedElementType === 'icon' && (
          <>
            {placedIcons.filter(i => i.id === selectedElementId).map(icon => (
              <div key={`transform-${icon.id}`}>
                {renderTransformHandles(icon, 'icon')}
              </div>
            ))}
          </>
        )}
        {activeDrawingTool === 'transform' && selectedElementId && selectedElementType === 'text' && (
          <>
            {textLabels.filter(t => t.id === selectedElementId).map(label => (
              <div key={`transform-${label.id}`}>
                {renderTransformHandles(label, 'text')}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Text Input Dialog */}
      <Dialog open={textDialogOpen} onOpenChange={setTextDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Text Label</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="text-input">Text</Label>
              <Input
                id="text-input"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleTextSubmit();
                  }
                }}
                placeholder="Enter text..."
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTextDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleTextSubmit}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
