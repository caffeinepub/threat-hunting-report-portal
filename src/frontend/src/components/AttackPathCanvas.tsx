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
  selectedElementType: 'icon' | 'text' | 'arrow' | null;
  selectedArrowId: string | null;
  onAddIcon: (type: IconType, x: number, y: number) => void;
  onMoveIcon: (id: string, x: number, y: number) => void;
  onResizeIcon: (id: string, width: number, height: number) => void;
  onRemoveIcon: (id: string) => void;
  onAddConnection: (sourceId: string, targetId: string) => void;
  onRemoveConnection: (id: string) => void;
  onUpdateArrowRotation: (id: string, rotation: number) => void;
  onAddDrawing: (type: 'freehand' | 'line' | 'arrow', points: { x: number; y: number }[]) => void;
  onRemoveDrawing: (id: string) => void;
  onMoveDrawing: (id: string, offsetX: number, offsetY: number) => void;
  onAddTextLabel: (text: string, x: number, y: number, color: string, fontSize: number) => void;
  onRemoveTextLabel: (id: string) => void;
  onUpdateTextLabel: (id: string, updates: Partial<TextLabel>) => void;
  onSelectElement: (id: string | null, type: 'icon' | 'text' | 'arrow' | null) => void;
  onSelectArrow: (id: string | null) => void;
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
  selectedArrowId,
  onAddIcon,
  onMoveIcon,
  onResizeIcon,
  onRemoveIcon,
  onAddConnection,
  onRemoveConnection,
  onUpdateArrowRotation,
  onAddDrawing,
  onRemoveDrawing,
  onMoveDrawing,
  onAddTextLabel,
  onRemoveTextLabel,
  onUpdateTextLabel,
  onSelectElement,
  onSelectArrow,
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
  const [isRotatingArrow, setIsRotatingArrow] = useState(false);
  const [arrowRotationStart, setArrowRotationStart] = useState({ x: 0, y: 0, rotation: 0, centerX: 0, centerY: 0 });

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

  const handleArrowClick = (arrowId: string) => {
    if (activeDrawingTool === 'eraser') {
      onRemoveConnection(arrowId);
      return;
    }

    // Select arrow for rotation
    onSelectArrow(arrowId);
    onSelectElement(arrowId, 'arrow');
  };

  const handleArrowMouseDown = (e: React.MouseEvent, arrowId: string) => {
    if (selectedArrowId === arrowId && !activeDrawingTool) {
      e.preventDefault();
      e.stopPropagation();

      const connection = connections.find((c) => c.id === arrowId);
      if (!connection) return;

      const sourceIcon = placedIcons.find((i) => i.id === connection.sourceId);
      const targetIcon = placedIcons.find((i) => i.id === connection.targetId);
      if (!sourceIcon || !targetIcon) return;

      const centerX = (sourceIcon.x + (sourceIcon.width || 48) / 2 + targetIcon.x + (targetIcon.width || 48) / 2) / 2;
      const centerY = (sourceIcon.y + (sourceIcon.height || 48) / 2 + targetIcon.y + (targetIcon.height || 48) / 2) / 2;

      setIsRotatingArrow(true);
      setArrowRotationStart({
        x: e.clientX,
        y: e.clientY,
        rotation: connection.rotation || 0,
        centerX,
        centerY,
      });
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

    if (isRotatingArrow && selectedArrowId) {
      const deltaX = e.clientX - arrowRotationStart.centerX;
      const deltaY = e.clientY - arrowRotationStart.centerY;
      const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
      
      const startDeltaX = arrowRotationStart.x - arrowRotationStart.centerX;
      const startDeltaY = arrowRotationStart.y - arrowRotationStart.centerY;
      const startAngle = Math.atan2(startDeltaY, startDeltaX) * (180 / Math.PI);
      
      const rotationDelta = angle - startAngle;
      const newRotation = arrowRotationStart.rotation + rotationDelta;
      
      onUpdateArrowRotation(selectedArrowId, newRotation);
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
      }
    }

    if (rotationHandle && selectedElementType === 'text' && selectedElementId) {
      const label = textLabels.find((l) => l.id === selectedElementId);
      if (!label) return;

      const centerX = label.x;
      const centerY = label.y;

      const deltaX = e.clientX - rect.left - centerX;
      const deltaY = e.clientY - rect.top - centerY;
      const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

      const startDeltaX = rotationStart.x - centerX;
      const startDeltaY = rotationStart.y - centerY;
      const startAngle = Math.atan2(startDeltaY, startDeltaX) * (180 / Math.PI);

      const rotationDelta = angle - startAngle;
      const newRotation = rotationStart.rotation + rotationDelta;

      onUpdateTextLabel(selectedElementId, { rotation: newRotation });
    }

    if (isDrawing && (activeDrawingTool === 'freehand' || activeDrawingTool === 'line' || activeDrawingTool === 'arrow')) {
      if (activeDrawingTool === 'freehand') {
        setCurrentDrawingPoints((prev) => [...prev, { x, y }]);
      } else {
        setCurrentDrawingPoints([currentDrawingPoints[0], { x, y }]);
      }
    }

    if (isDraggingDrawing && selectedDrawingId) {
      const offsetX = e.clientX - drawingDragStart.x;
      const offsetY = e.clientY - drawingDragStart.y;
      onMoveDrawing(selectedDrawingId, offsetX, offsetY);
      setDrawingDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleCanvasMouseUp = () => {
    setDraggedIconId(null);
    setTransformTarget(null);
    setResizeHandle(null);
    setRotationHandle(null);
    setIsRotatingArrow(false);

    if (isDrawing && currentDrawingPoints.length > 0) {
      if (activeDrawingTool === 'freehand' && currentDrawingPoints.length > 1) {
        onAddDrawing('freehand', currentDrawingPoints);
      } else if ((activeDrawingTool === 'line' || activeDrawingTool === 'arrow') && currentDrawingPoints.length === 2) {
        onAddDrawing(activeDrawingTool, currentDrawingPoints);
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

    // Deselect arrow if clicking on canvas
    if (selectedArrowId && !isRotatingArrow) {
      onSelectArrow(null);
      onSelectElement(null, null);
    }

    if (activeDrawingTool === 'text') {
      setTextDialogPosition({ x, y });
      setTextDialogOpen(true);
      return;
    }

    if (activeDrawingTool === 'freehand' || activeDrawingTool === 'line' || activeDrawingTool === 'arrow') {
      setIsDrawing(true);
      setCurrentDrawingPoints([{ x, y }]);
    }

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
      }
    }

    if (activeDrawingTool === 'transform') {
      // Check if clicking on a drawing
      const clickedDrawing = drawings.find((drawing) => {
        return drawing.points.some((point) => {
          const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
          return distance < 10;
        });
      });

      if (clickedDrawing) {
        setSelectedDrawingId(clickedDrawing.id);
        setIsDraggingDrawing(true);
        setDrawingDragStart({ x: e.clientX, y: e.clientY });
      }
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
    }
  };

  const handleRotationHandleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (selectedElementType === 'text' && selectedElementId) {
      const label = textLabels.find((l) => l.id === selectedElementId);
      if (!label || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      setRotationHandle('rotate');
      setRotationStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        rotation: label.rotation || 0,
      });
    }
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      onAddTextLabel(textInput, textDialogPosition.x, textDialogPosition.y, textColor, fontSize);
      setTextInput('');
      setTextDialogOpen(false);
    }
  };

  const renderTransformHandles = () => {
    if (!selectedElementId || activeDrawingTool !== 'transform') return null;

    if (selectedElementType === 'icon') {
      const icon = placedIcons.find((i) => i.id === selectedElementId);
      if (!icon) return null;

      const width = icon.width || 48;
      const height = icon.height || 48;
      const handleSize = 8;

      return (
        <div
          className="absolute border-2 border-blue-500 pointer-events-none"
          style={{
            left: icon.x,
            top: icon.y,
            width,
            height,
          }}
        >
          {/* Resize handles */}
          {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map((handle) => {
            let style: React.CSSProperties = {
              position: 'absolute',
              width: handleSize,
              height: handleSize,
              backgroundColor: 'white',
              border: '2px solid #3b82f6',
              cursor: `${handle}-resize`,
              pointerEvents: 'all',
            };

            if (handle.includes('n')) style.top = -handleSize / 2;
            if (handle.includes('s')) style.bottom = -handleSize / 2;
            if (handle.includes('w')) style.left = -handleSize / 2;
            if (handle.includes('e')) style.right = -handleSize / 2;
            if (handle === 'n' || handle === 's') style.left = `calc(50% - ${handleSize / 2}px)`;
            if (handle === 'w' || handle === 'e') style.top = `calc(50% - ${handleSize / 2}px)`;

            return (
              <div
                key={handle}
                style={style}
                onMouseDown={(e) => handleResizeHandleMouseDown(e, handle)}
              />
            );
          })}
        </div>
      );
    }

    if (selectedElementType === 'text') {
      const label = textLabels.find((l) => l.id === selectedElementId);
      if (!label) return null;

      const handleSize = 8;
      const rotationHandleDistance = 30;

      return (
        <div
          className="absolute pointer-events-none"
          style={{
            left: label.x - 20,
            top: label.y - 20,
            width: 40,
            height: 40,
          }}
        >
          {/* Rotation handle */}
          <div
            className="absolute bg-green-500 rounded-full cursor-pointer pointer-events-all"
            style={{
              width: handleSize,
              height: handleSize,
              left: `calc(50% - ${handleSize / 2}px)`,
              top: -rotationHandleDistance,
            }}
            onMouseDown={handleRotationHandleMouseDown}
            title="Rotate"
          >
            <RotateCw className="w-3 h-3 text-white" style={{ marginLeft: '-2px', marginTop: '-2px' }} />
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div
      ref={canvasRef}
      className="flex-1 relative bg-white overflow-hidden"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onMouseLeave={handleCanvasMouseUp}
    >
      {/* SVG Layer for connections and drawings */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <polygon points="0 0, 10 3, 0 6" fill="oklch(0.65 0.18 150)" />
          </marker>
        </defs>

        {/* Render connections */}
        {connections.map((connection) => {
          const sourceIcon = placedIcons.find((icon) => icon.id === connection.sourceId);
          const targetIcon = placedIcons.find((icon) => icon.id === connection.targetId);

          if (!sourceIcon || !targetIcon) return null;

          const sourceX = sourceIcon.x + (sourceIcon.width || 48) / 2;
          const sourceY = sourceIcon.y + (sourceIcon.height || 48) / 2;
          const targetX = targetIcon.x + (targetIcon.width || 48) / 2;
          const targetY = targetIcon.y + (targetIcon.height || 48) / 2;

          return (
            <g
              key={connection.id}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleArrowMouseDown(e as any, connection.id);
              }}
            >
              <AttackPathConnector
                id={connection.id}
                sourceX={sourceX}
                sourceY={sourceY}
                targetX={targetX}
                targetY={targetY}
                rotation={connection.rotation}
                isSelected={selectedArrowId === connection.id}
                onClick={handleArrowClick}
              />
            </g>
          );
        })}

        {/* Render drawings */}
        {drawings.map((drawing) => {
          if (drawing.type === 'freehand') {
            const pathData = drawing.points.map((point, index) => {
              return `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
            }).join(' ');

            return (
              <path
                key={drawing.id}
                d={pathData}
                stroke={drawing.color || '#000000'}
                strokeWidth={drawing.strokeWidth || 2}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          } else if (drawing.type === 'line' && drawing.points.length === 2) {
            return (
              <line
                key={drawing.id}
                x1={drawing.points[0].x}
                y1={drawing.points[0].y}
                x2={drawing.points[1].x}
                y2={drawing.points[1].y}
                stroke={drawing.color || '#000000'}
                strokeWidth={drawing.strokeWidth || 2}
              />
            );
          } else if (drawing.type === 'arrow' && drawing.points.length === 2) {
            const angle = Math.atan2(
              drawing.points[1].y - drawing.points[0].y,
              drawing.points[1].x - drawing.points[0].x
            );
            const arrowSize = 10;
            const arrowPoint1X = drawing.points[1].x - arrowSize * Math.cos(angle - Math.PI / 6);
            const arrowPoint1Y = drawing.points[1].y - arrowSize * Math.sin(angle - Math.PI / 6);
            const arrowPoint2X = drawing.points[1].x - arrowSize * Math.cos(angle + Math.PI / 6);
            const arrowPoint2Y = drawing.points[1].y - arrowSize * Math.sin(angle + Math.PI / 6);

            return (
              <g key={drawing.id}>
                <line
                  x1={drawing.points[0].x}
                  y1={drawing.points[0].y}
                  x2={drawing.points[1].x}
                  y2={drawing.points[1].y}
                  stroke={drawing.color || '#000000'}
                  strokeWidth={drawing.strokeWidth || 2}
                />
                <polygon
                  points={`${drawing.points[1].x},${drawing.points[1].y} ${arrowPoint1X},${arrowPoint1Y} ${arrowPoint2X},${arrowPoint2Y}`}
                  fill={drawing.color || '#000000'}
                />
              </g>
            );
          }
          return null;
        })}

        {/* Render current drawing */}
        {isDrawing && currentDrawingPoints.length > 0 && (
          <>
            {activeDrawingTool === 'freehand' && (
              <path
                d={currentDrawingPoints.map((point, index) => {
                  return `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
                }).join(' ')}
                stroke={textColor}
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {(activeDrawingTool === 'line' || activeDrawingTool === 'arrow') && currentDrawingPoints.length === 2 && (
              <>
                <line
                  x1={currentDrawingPoints[0].x}
                  y1={currentDrawingPoints[0].y}
                  x2={currentDrawingPoints[1].x}
                  y2={currentDrawingPoints[1].y}
                  stroke={textColor}
                  strokeWidth={2}
                />
                {activeDrawingTool === 'arrow' && (
                  <>
                    {(() => {
                      const angle = Math.atan2(
                        currentDrawingPoints[1].y - currentDrawingPoints[0].y,
                        currentDrawingPoints[1].x - currentDrawingPoints[0].x
                      );
                      const arrowSize = 10;
                      const arrowPoint1X = currentDrawingPoints[1].x - arrowSize * Math.cos(angle - Math.PI / 6);
                      const arrowPoint1Y = currentDrawingPoints[1].y - arrowSize * Math.sin(angle - Math.PI / 6);
                      const arrowPoint2X = currentDrawingPoints[1].x - arrowSize * Math.cos(angle + Math.PI / 6);
                      const arrowPoint2Y = currentDrawingPoints[1].y - arrowSize * Math.sin(angle + Math.PI / 6);

                      return (
                        <polygon
                          points={`${currentDrawingPoints[1].x},${currentDrawingPoints[1].y} ${arrowPoint1X},${arrowPoint1Y} ${arrowPoint2X},${arrowPoint2Y}`}
                          fill={textColor}
                        />
                      );
                    })()}
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* Connecting line preview */}
        {mode === 'connect' && connectingFrom && selectedIcon && (
          <line
            x1={placedIcons.find((i) => i.id === connectingFrom)!.x + 24}
            y1={placedIcons.find((i) => i.id === connectingFrom)!.y + 24}
            x2={placedIcons.find((i) => i.id === connectingFrom)!.x + 24}
            y2={placedIcons.find((i) => i.id === connectingFrom)!.y + 24}
            stroke="oklch(0.65 0.18 150)"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
        )}
      </svg>

      {/* Icons Layer */}
      {placedIcons.map((icon) => (
        <div
          key={icon.id}
          className={`absolute cursor-move ${selectedIcon === icon.id ? 'ring-2 ring-blue-500' : ''}`}
          style={{
            left: icon.x,
            top: icon.y,
            width: icon.width || 48,
            height: icon.height || 48,
            zIndex: 2,
          }}
          onMouseDown={(e) => handleIconMouseDown(e, icon.id)}
        >
          <AttackPathIcon type={icon.type} width={icon.width || 48} height={icon.height || 48} />
        </div>
      ))}

      {/* Text Labels Layer */}
      {textLabels.map((label) => (
        <div
          key={label.id}
          className="absolute cursor-move select-none"
          style={{
            left: label.x,
            top: label.y,
            color: label.color,
            fontSize: `${label.fontSize || 16}px`,
            fontWeight: label.fontWeight || 'normal',
            transform: `rotate(${label.rotation || 0}deg)`,
            transformOrigin: 'top left',
            zIndex: 3,
            whiteSpace: 'pre-wrap',
          }}
          onMouseDown={(e) => handleTextLabelMouseDown(e, label.id)}
        >
          {label.text}
        </div>
      ))}

      {/* Transform handles */}
      {renderTransformHandles()}

      {/* Text input dialog */}
      <Dialog open={textDialogOpen} onOpenChange={setTextDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Text Label</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="text-input">Text</Label>
              <Textarea
                id="text-input"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Enter your text here..."
                rows={4}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleTextSubmit();
                  }
                }}
              />
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
    </div>
  );
}
