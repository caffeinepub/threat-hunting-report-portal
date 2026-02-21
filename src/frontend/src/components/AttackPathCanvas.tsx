import { useRef, useState, useEffect } from 'react';
import AttackPathIcon from './AttackPathIcon';
import AttackPathConnector from './AttackPathConnector';
import { PlacedIcon, Connection, DrawingPath, DrawingTool, TextLabel, UploadedImage } from '@/hooks/useAttackPathState';
import { IconType } from './AttackPathToolbar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RotateCw } from 'lucide-react';
import { ExternalBlob } from '@/backend';

interface AttackPathCanvasProps {
  placedIcons: PlacedIcon[];
  connections: Connection[];
  drawings: DrawingPath[];
  textLabels: TextLabel[];
  images: UploadedImage[];
  mode: 'place' | 'connect' | 'draw';
  activeDrawingTool: DrawingTool;
  textColor: string;
  fontSize: number;
  selectedElementId: string | null;
  selectedElementType: 'icon' | 'text' | 'arrow' | 'image' | null;
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
  onAddImage: (file: ExternalBlob, x: number, y: number, name: string) => void;
  onMoveImage: (id: string, x: number, y: number) => void;
  onResizeImage: (id: string, width: number, height: number) => void;
  onRemoveImage: (id: string) => void;
  onSelectElement: (id: string | null, type: 'icon' | 'text' | 'arrow' | 'image' | null) => void;
  onSelectArrow: (id: string | null) => void;
}

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export default function AttackPathCanvas({
  placedIcons,
  connections,
  drawings,
  textLabels,
  images,
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
  onAddImage,
  onMoveImage,
  onResizeImage,
  onRemoveImage,
  onSelectElement,
  onSelectArrow,
}: AttackPathCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [draggingIcon, setDraggingIcon] = useState<string | null>(null);
  const [draggingImage, setDraggingImage] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizingIcon, setResizingIcon] = useState<{ id: string; handle: ResizeHandle } | null>(null);
  const [resizingImage, setResizingImage] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, iconX: 0, iconY: 0 });
  const [textDialogOpen, setTextDialogOpen] = useState(false);
  const [textDialogPosition, setTextDialogPosition] = useState({ x: 0, y: 0 });
  const [textInput, setTextInput] = useState('');
  const [editingText, setEditingText] = useState<string | null>(null);
  const [rotatingArrow, setRotatingArrow] = useState<string | null>(null);
  const [rotationStart, setRotationStart] = useState({ x: 0, y: 0 });
  const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map());

  // Load image URLs from ExternalBlob
  useEffect(() => {
    const newUrls = new Map<string, string>();
    images.forEach((image) => {
      const url = image.file.getDirectURL();
      newUrls.set(image.id, url);
    });
    setImageUrls(newUrls);
  }, [images]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const iconType = e.dataTransfer.getData('iconType') as IconType;
    if (iconType && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      onAddIcon(iconType, x, y);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Deselect when clicking on empty canvas
    if (e.target === canvasRef.current) {
      onSelectElement(null, null);
      onSelectArrow(null);
    }

    if (activeDrawingTool === 'text') {
      setTextDialogPosition({ x, y });
      setTextDialogOpen(true);
      setEditingText(null);
      setTextInput('');
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeDrawingTool === 'freehand' || activeDrawingTool === 'line' || activeDrawingTool === 'arrow') {
      setIsDrawing(true);
      setCurrentPath([{ x, y }]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDrawing && (activeDrawingTool === 'freehand' || activeDrawingTool === 'line' || activeDrawingTool === 'arrow')) {
      if (activeDrawingTool === 'freehand') {
        setCurrentPath((prev) => [...prev, { x, y }]);
      } else {
        setCurrentPath((prev) => [prev[0], { x, y }]);
      }
    }

    if (draggingIcon) {
      onMoveIcon(draggingIcon, x - dragOffset.x, y - dragOffset.y);
    }

    if (draggingImage) {
      onMoveImage(draggingImage, x - dragOffset.x, y - dragOffset.y);
    }

    if (resizingIcon) {
      const { id, handle } = resizingIcon;
      const icon = placedIcons.find((i) => i.id === id);
      if (!icon) return;

      const deltaX = x - resizeStart.x;
      const deltaY = y - resizeStart.y;

      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newX = resizeStart.iconX;
      let newY = resizeStart.iconY;

      // Corner handles - maintain aspect ratio
      if (handle === 'nw' || handle === 'ne' || handle === 'sw' || handle === 'se') {
        const aspectRatio = resizeStart.width / resizeStart.height;
        
        if (handle === 'se') {
          // Bottom-right corner
          const delta = Math.max(deltaX, deltaY);
          newWidth = Math.max(20, resizeStart.width + delta);
          newHeight = Math.max(20, newWidth / aspectRatio);
        } else if (handle === 'sw') {
          // Bottom-left corner
          const delta = Math.max(-deltaX, deltaY);
          newWidth = Math.max(20, resizeStart.width + delta);
          newHeight = Math.max(20, newWidth / aspectRatio);
          newX = resizeStart.iconX - (newWidth - resizeStart.width);
        } else if (handle === 'ne') {
          // Top-right corner
          const delta = Math.max(deltaX, -deltaY);
          newWidth = Math.max(20, resizeStart.width + delta);
          newHeight = Math.max(20, newWidth / aspectRatio);
          newY = resizeStart.iconY - (newHeight - resizeStart.height);
        } else if (handle === 'nw') {
          // Top-left corner
          const delta = Math.max(-deltaX, -deltaY);
          newWidth = Math.max(20, resizeStart.width + delta);
          newHeight = Math.max(20, newWidth / aspectRatio);
          newX = resizeStart.iconX - (newWidth - resizeStart.width);
          newY = resizeStart.iconY - (newHeight - resizeStart.height);
        }
      } else {
        // Edge handles - resize in one dimension
        if (handle === 'n') {
          newHeight = Math.max(20, resizeStart.height - deltaY);
          newY = resizeStart.iconY + (resizeStart.height - newHeight);
        } else if (handle === 's') {
          newHeight = Math.max(20, resizeStart.height + deltaY);
        } else if (handle === 'e') {
          newWidth = Math.max(20, resizeStart.width + deltaX);
        } else if (handle === 'w') {
          newWidth = Math.max(20, resizeStart.width - deltaX);
          newX = resizeStart.iconX + (resizeStart.width - newWidth);
        }
      }

      onResizeIcon(id, newWidth, newHeight);
      if (newX !== resizeStart.iconX || newY !== resizeStart.iconY) {
        onMoveIcon(id, newX, newY);
      }
    }

    if (resizingImage) {
      const image = images.find((img) => img.id === resizingImage);
      if (!image) return;

      const deltaX = x - resizeStart.x;
      const deltaY = y - resizeStart.y;
      const delta = Math.max(deltaX, deltaY);

      const newWidth = Math.max(50, resizeStart.width + delta);
      const newHeight = Math.max(50, resizeStart.height + delta);

      onResizeImage(resizingImage, newWidth, newHeight);
    }

    if (rotatingArrow) {
      const conn = connections.find((c) => c.id === rotatingArrow);
      if (!conn) return;

      const sourceIcon = placedIcons.find((icon) => icon.id === conn.sourceId);
      const targetIcon = placedIcons.find((icon) => icon.id === conn.targetId);

      if (!sourceIcon || !targetIcon) return;

      const centerX = (sourceIcon.x + targetIcon.x) / 2;
      const centerY = (sourceIcon.y + targetIcon.y) / 2;

      const angle = Math.atan2(y - centerY, x - centerX);
      const degrees = (angle * 180) / Math.PI;

      onUpdateArrowRotation(rotatingArrow, degrees);
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && currentPath.length > 1) {
      if (activeDrawingTool === 'freehand' || activeDrawingTool === 'line' || activeDrawingTool === 'arrow') {
        onAddDrawing(activeDrawingTool, currentPath);
      }
    }
    setIsDrawing(false);
    setCurrentPath([]);
    setDraggingIcon(null);
    setDraggingImage(null);
    setResizingIcon(null);
    setResizingImage(null);
    setRotatingArrow(null);
  };

  const handleIconClick = (iconId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (mode === 'connect') {
      if (!connectingFrom) {
        setConnectingFrom(iconId);
      } else {
        if (connectingFrom !== iconId) {
          onAddConnection(connectingFrom, iconId);
        }
        setConnectingFrom(null);
      }
    } else if (activeDrawingTool === 'eraser') {
      onRemoveIcon(iconId);
    } else {
      // Select icon for transform
      onSelectElement(iconId, 'icon');
    }
  };

  const handleIconMouseDown = (iconId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (mode === 'place' && !activeDrawingTool) {
      const icon = placedIcons.find((i) => i.id === iconId);
      if (!icon) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setDraggingIcon(iconId);
      setDragOffset({ x: x - icon.x, y: y - icon.y });
      onSelectElement(iconId, 'icon');
    }
  };

  const handleResizeHandleMouseDown = (iconId: string, handle: ResizeHandle, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const icon = placedIcons.find((i) => i.id === iconId);
    if (!icon) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setResizingIcon({ id: iconId, handle });
    setResizeStart({
      x,
      y,
      width: icon.width || 48,
      height: icon.height || 48,
      iconX: icon.x,
      iconY: icon.y,
    });
  };

  const handleImageClick = (imageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (activeDrawingTool === 'eraser') {
      onRemoveImage(imageId);
    } else {
      onSelectElement(imageId, 'image');
    }
  };

  const handleImageMouseDown = (imageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const image = images.find((img) => img.id === imageId);
    if (!image) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setDraggingImage(imageId);
    setDragOffset({ x: x - image.x, y: y - image.y });
    onSelectElement(imageId, 'image');
  };

  const handleImageResizeMouseDown = (imageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const image = images.find((img) => img.id === imageId);
    if (!image) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setResizingImage(imageId);
    setResizeStart({
      x,
      y,
      width: image.width,
      height: image.height,
      iconX: image.x,
      iconY: image.y,
    });
  };

  const handleTextClick = (textId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (activeDrawingTool === 'eraser') {
      onRemoveTextLabel(textId);
    } else {
      const label = textLabels.find((t) => t.id === textId);
      if (label && !label.iconId) {
        // Only allow editing standalone text labels, not icon labels
        setEditingText(textId);
        setTextInput(label.text);
        setTextDialogPosition({ x: label.x, y: label.y });
        setTextDialogOpen(true);
      }
    }
  };

  const handleArrowClick = (connId: string) => {
    if (activeDrawingTool === 'eraser') {
      onRemoveConnection(connId);
    } else {
      onSelectArrow(connId);
    }
  };

  const handleArrowRotateMouseDown = (connId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setRotatingArrow(connId);
    setRotationStart({ x, y });
  };

  const handleDrawingClick = (drawingId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (activeDrawingTool === 'eraser') {
      onRemoveDrawing(drawingId);
    }
  };

  const handleSaveText = () => {
    if (textInput.trim()) {
      if (editingText) {
        onUpdateTextLabel(editingText, { text: textInput });
      } else {
        onAddTextLabel(textInput, textDialogPosition.x, textDialogPosition.y, textColor, fontSize);
      }
    }
    setTextDialogOpen(false);
    setTextInput('');
    setEditingText(null);
  };

  const renderResizeHandles = (icon: PlacedIcon) => {
    if (selectedElementId !== icon.id || selectedElementType !== 'icon') return null;

    const width = icon.width || 48;
    const height = icon.height || 48;
    const handleSize = 8;

    const handles: { handle: ResizeHandle; x: number; y: number; cursor: string }[] = [
      { handle: 'nw', x: icon.x - handleSize / 2, y: icon.y - handleSize / 2, cursor: 'nwse-resize' },
      { handle: 'n', x: icon.x + width / 2 - handleSize / 2, y: icon.y - handleSize / 2, cursor: 'ns-resize' },
      { handle: 'ne', x: icon.x + width - handleSize / 2, y: icon.y - handleSize / 2, cursor: 'nesw-resize' },
      { handle: 'e', x: icon.x + width - handleSize / 2, y: icon.y + height / 2 - handleSize / 2, cursor: 'ew-resize' },
      { handle: 'se', x: icon.x + width - handleSize / 2, y: icon.y + height - handleSize / 2, cursor: 'nwse-resize' },
      { handle: 's', x: icon.x + width / 2 - handleSize / 2, y: icon.y + height - handleSize / 2, cursor: 'ns-resize' },
      { handle: 'sw', x: icon.x - handleSize / 2, y: icon.y + height - handleSize / 2, cursor: 'nesw-resize' },
      { handle: 'w', x: icon.x - handleSize / 2, y: icon.y + height / 2 - handleSize / 2, cursor: 'ew-resize' },
    ];

    return (
      <>
        {handles.map(({ handle, x, y, cursor }) => (
          <div
            key={handle}
            className="resize-handle"
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: handleSize,
              height: handleSize,
              cursor,
            }}
            onMouseDown={(e) => handleResizeHandleMouseDown(icon.id, handle, e)}
          />
        ))}
      </>
    );
  };

  const renderSelectionBox = (icon: PlacedIcon) => {
    if (selectedElementId !== icon.id || selectedElementType !== 'icon') return null;

    const width = icon.width || 48;
    const height = icon.height || 48;
    
    // Calculate bounding box that includes icon and label
    const label = textLabels.find((l) => l.id === icon.labelId);
    let boxX = icon.x;
    let boxY = icon.y;
    let boxWidth = width;
    let boxHeight = height;
    
    if (label) {
      const labelWidth = label.text.length * (label.fontSize || 14) * 0.6;
      const labelHeight = (label.fontSize || 14) * 1.2;
      
      boxX = Math.min(icon.x, label.x);
      boxY = Math.min(icon.y, label.y);
      boxWidth = Math.max(icon.x + width, label.x + labelWidth) - boxX;
      boxHeight = Math.max(icon.y + height, label.y + labelHeight) - boxY;
    }

    return (
      <div
        className="selection-box"
        style={{
          position: 'absolute',
          left: boxX - 4,
          top: boxY - 4,
          width: boxWidth + 8,
          height: boxHeight + 8,
          pointerEvents: 'none',
        }}
      />
    );
  };

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full bg-white dark:bg-gray-900 overflow-hidden"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={handleCanvasClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Render connections */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
        {connections.map((conn) => {
          const sourceIcon = placedIcons.find((icon) => icon.id === conn.sourceId);
          const targetIcon = placedIcons.find((icon) => icon.id === conn.targetId);

          if (!sourceIcon || !targetIcon) return null;

          return (
            <g key={conn.id} className="pointer-events-auto">
              <AttackPathConnector
                id={conn.id}
                sourceX={sourceIcon.x + (sourceIcon.width || 48) / 2}
                sourceY={sourceIcon.y + (sourceIcon.height || 48) / 2}
                targetX={targetIcon.x + (targetIcon.width || 48) / 2}
                targetY={targetIcon.y + (targetIcon.height || 48) / 2}
                rotation={conn.rotation || 0}
                isSelected={selectedArrowId === conn.id}
                onClick={handleArrowClick}
              />
              {selectedArrowId === conn.id && (
                <g>
                  <circle
                    cx={(sourceIcon.x + targetIcon.x) / 2 + (sourceIcon.width || 48) / 4}
                    cy={(sourceIcon.y + targetIcon.y) / 2 + (sourceIcon.height || 48) / 4}
                    r="8"
                    fill="oklch(var(--primary))"
                    className="cursor-pointer"
                    onMouseDown={(e) => handleArrowRotateMouseDown(conn.id, e as any)}
                  />
                  <RotateCw
                    size={12}
                    className="pointer-events-none"
                    style={{
                      position: 'absolute',
                      left: (sourceIcon.x + targetIcon.x) / 2 + (sourceIcon.width || 48) / 4 - 6,
                      top: (sourceIcon.y + targetIcon.y) / 2 + (sourceIcon.height || 48) / 4 - 6,
                      color: 'white',
                    }}
                  />
                </g>
              )}
            </g>
          );
        })}

        {connectingFrom && (
          <line
            x1={placedIcons.find((i) => i.id === connectingFrom)!.x + 24}
            y1={placedIcons.find((i) => i.id === connectingFrom)!.y + 24}
            x2={placedIcons.find((i) => i.id === connectingFrom)!.x + 24}
            y2={placedIcons.find((i) => i.id === connectingFrom)!.y + 24}
            stroke="oklch(var(--primary))"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
        )}
      </svg>

      {/* Render drawings */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 2 }}>
        {drawings.map((drawing) => {
          if (drawing.type === 'freehand') {
            const pathData = drawing.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
            return (
              <path
                key={drawing.id}
                d={pathData}
                stroke={drawing.color}
                strokeWidth={drawing.strokeWidth}
                fill="none"
                className="pointer-events-auto cursor-pointer"
                onClick={(e) => handleDrawingClick(drawing.id, e as any)}
              />
            );
          } else if (drawing.type === 'line') {
            const start = drawing.points[0];
            const end = drawing.points[drawing.points.length - 1];
            return (
              <line
                key={drawing.id}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={drawing.color}
                strokeWidth={drawing.strokeWidth}
                className="pointer-events-auto cursor-pointer"
                onClick={(e) => handleDrawingClick(drawing.id, e as any)}
              />
            );
          } else if (drawing.type === 'arrow') {
            const start = drawing.points[0];
            const end = drawing.points[drawing.points.length - 1];
            const angle = Math.atan2(end.y - start.y, end.x - start.x);
            const arrowLength = 15;
            const arrowAngle = Math.PI / 6;

            return (
              <g key={drawing.id} className="pointer-events-auto cursor-pointer" onClick={(e) => handleDrawingClick(drawing.id, e as any)}>
                <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={drawing.color} strokeWidth={drawing.strokeWidth} />
                <line
                  x1={end.x}
                  y1={end.y}
                  x2={end.x - arrowLength * Math.cos(angle - arrowAngle)}
                  y2={end.y - arrowLength * Math.sin(angle - arrowAngle)}
                  stroke={drawing.color}
                  strokeWidth={drawing.strokeWidth}
                />
                <line
                  x1={end.x}
                  y1={end.y}
                  x2={end.x - arrowLength * Math.cos(angle + arrowAngle)}
                  y2={end.y - arrowLength * Math.sin(angle + arrowAngle)}
                  stroke={drawing.color}
                  strokeWidth={drawing.strokeWidth}
                />
              </g>
            );
          }
          return null;
        })}

        {currentPath.length > 0 && (
          <>
            {activeDrawingTool === 'freehand' && (
              <path
                d={currentPath.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
                stroke={textColor}
                strokeWidth="2"
                fill="none"
              />
            )}
            {(activeDrawingTool === 'line' || activeDrawingTool === 'arrow') && currentPath.length === 2 && (
              <>
                <line
                  x1={currentPath[0].x}
                  y1={currentPath[0].y}
                  x2={currentPath[1].x}
                  y2={currentPath[1].y}
                  stroke={textColor}
                  strokeWidth="2"
                />
                {activeDrawingTool === 'arrow' && (
                  <>
                    {(() => {
                      const angle = Math.atan2(currentPath[1].y - currentPath[0].y, currentPath[1].x - currentPath[0].x);
                      const arrowLength = 15;
                      const arrowAngle = Math.PI / 6;
                      return (
                        <>
                          <line
                            x1={currentPath[1].x}
                            y1={currentPath[1].y}
                            x2={currentPath[1].x - arrowLength * Math.cos(angle - arrowAngle)}
                            y2={currentPath[1].y - arrowLength * Math.sin(angle - arrowAngle)}
                            stroke={textColor}
                            strokeWidth="2"
                          />
                          <line
                            x1={currentPath[1].x}
                            y1={currentPath[1].y}
                            x2={currentPath[1].x - arrowLength * Math.cos(angle + arrowAngle)}
                            y2={currentPath[1].y - arrowLength * Math.sin(angle + arrowAngle)}
                            stroke={textColor}
                            strokeWidth="2"
                          />
                        </>
                      );
                    })()}
                  </>
                )}
              </>
            )}
          </>
        )}
      </svg>

      {/* Render uploaded images */}
      {images.map((image) => {
        const imageUrl = imageUrls.get(image.id);
        if (!imageUrl) return null;

        return (
          <div key={image.id} style={{ position: 'absolute', left: image.x, top: image.y, zIndex: 3 }}>
            <img
              src={imageUrl}
              alt={image.name}
              style={{ width: image.width, height: image.height }}
              className="cursor-move"
              onClick={(e) => handleImageClick(image.id, e)}
              onMouseDown={(e) => handleImageMouseDown(image.id, e)}
            />
            {selectedElementId === image.id && selectedElementType === 'image' && (
              <>
                <div
                  className="selection-box"
                  style={{
                    position: 'absolute',
                    left: -4,
                    top: -4,
                    width: image.width + 8,
                    height: image.height + 8,
                    pointerEvents: 'none',
                  }}
                />
                <div
                  className="resize-handle"
                  style={{
                    position: 'absolute',
                    right: -4,
                    bottom: -4,
                    width: 8,
                    height: 8,
                    cursor: 'nwse-resize',
                  }}
                  onMouseDown={(e) => handleImageResizeMouseDown(image.id, e)}
                />
              </>
            )}
          </div>
        );
      })}

      {/* Render icons with selection boxes and resize handles */}
      {placedIcons.map((icon) => (
        <div key={icon.id} style={{ position: 'absolute', left: icon.x, top: icon.y, zIndex: 4 }}>
          {renderSelectionBox(icon)}
          <div
            onClick={(e) => handleIconClick(icon.id, e)}
            onMouseDown={(e) => handleIconMouseDown(icon.id, e)}
            className="cursor-move"
          >
            <AttackPathIcon type={icon.type} width={icon.width || 48} height={icon.height || 48} />
          </div>
          {renderResizeHandles(icon)}
        </div>
      ))}

      {/* Render text labels */}
      {textLabels.map((label) => (
        <div
          key={label.id}
          style={{
            position: 'absolute',
            left: label.x,
            top: label.y,
            color: label.color,
            fontSize: label.fontSize || 16,
            fontWeight: label.fontWeight || 'normal',
            cursor: label.iconId ? 'default' : 'pointer',
            userSelect: 'none',
            zIndex: 5,
          }}
          onClick={(e) => handleTextClick(label.id, e)}
        >
          {label.text}
        </div>
      ))}

      {/* Text input dialog */}
      <Dialog open={textDialogOpen} onOpenChange={setTextDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingText ? 'Edit Text' : 'Add Text'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="text-input">Text</Label>
              <Textarea
                id="text-input"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Enter text..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTextDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveText}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
