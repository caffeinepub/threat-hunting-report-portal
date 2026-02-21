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
  const [resizingIcon, setResizingIcon] = useState<string | null>(null);
  const [resizingImage, setResizingImage] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [textDialogOpen, setTextDialogOpen] = useState(false);
  const [textDialogPosition, setTextDialogPosition] = useState({ x: 0, y: 0 });
  const [textInput, setTextInput] = useState('');
  const [editingText, setEditingText] = useState<string | null>(null);
  const [transformingElement, setTransformingElement] = useState<{
    id: string;
    type: 'icon' | 'text' | 'drawing' | 'image';
  } | null>(null);
  const [transformStart, setTransformStart] = useState({ x: 0, y: 0 });
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
      const deltaX = x - resizeStart.x;
      const deltaY = y - resizeStart.y;
      const newWidth = Math.max(20, resizeStart.width + deltaX);
      const newHeight = Math.max(20, resizeStart.height + deltaY);
      onResizeIcon(resizingIcon, newWidth, newHeight);
    }

    if (resizingImage) {
      const deltaX = x - resizeStart.x;
      const deltaY = y - resizeStart.y;
      const newWidth = Math.max(50, resizeStart.width + deltaX);
      const newHeight = Math.max(50, resizeStart.height + deltaY);
      onResizeImage(resizingImage, newWidth, newHeight);
    }

    if (transformingElement) {
      const deltaX = x - transformStart.x;
      const deltaY = y - transformStart.y;

      if (transformingElement.type === 'icon') {
        const icon = placedIcons.find((i) => i.id === transformingElement.id);
        if (icon) {
          onMoveIcon(transformingElement.id, icon.x + deltaX, icon.y + deltaY);
        }
      } else if (transformingElement.type === 'text') {
        const label = textLabels.find((l) => l.id === transformingElement.id);
        if (label) {
          onUpdateTextLabel(transformingElement.id, { x: label.x + deltaX, y: label.y + deltaY });
        }
      } else if (transformingElement.type === 'drawing') {
        onMoveDrawing(transformingElement.id, deltaX, deltaY);
      } else if (transformingElement.type === 'image') {
        const image = images.find((img) => img.id === transformingElement.id);
        if (image) {
          onMoveImage(transformingElement.id, image.x + deltaX, image.y + deltaY);
        }
      }

      setTransformStart({ x, y });
    }

    if (rotatingArrow) {
      const connection = connections.find((c) => c.id === rotatingArrow);
      if (connection) {
        const sourceIcon = placedIcons.find((i) => i.id === connection.sourceId);
        const targetIcon = placedIcons.find((i) => i.id === connection.targetId);

        if (sourceIcon && targetIcon) {
          const centerX = (sourceIcon.x + targetIcon.x) / 2;
          const centerY = (sourceIcon.y + targetIcon.y) / 2;

          const angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI);
          onUpdateArrowRotation(rotatingArrow, angle);
        }
      }
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && currentPath.length > 1) {
      if (activeDrawingTool === 'freehand' || activeDrawingTool === 'line' || activeDrawingTool === 'arrow') {
        onAddDrawing(activeDrawingTool, currentPath);
      }
      setCurrentPath([]);
    }
    setIsDrawing(false);
    setDraggingIcon(null);
    setDraggingImage(null);
    setResizingIcon(null);
    setResizingImage(null);
    setTransformingElement(null);
    setRotatingArrow(null);
  };

  const handleIconClick = (iconId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (activeDrawingTool === 'eraser') {
      onRemoveIcon(iconId);
      return;
    }

    if (activeDrawingTool === 'transform') {
      setTransformingElement({ id: iconId, type: 'icon' });
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setTransformStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
      return;
    }

    if (mode === 'connect') {
      if (connectingFrom === null) {
        setConnectingFrom(iconId);
        onSelectElement(iconId, 'icon');
      } else if (connectingFrom !== iconId) {
        onAddConnection(connectingFrom, iconId);
        setConnectingFrom(null);
        onSelectElement(null, null);
      }
    } else {
      onSelectElement(iconId, 'icon');
    }
  };

  const handleIconMouseDown = (iconId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (activeDrawingTool === 'transform' || activeDrawingTool === 'eraser') {
      return;
    }

    const icon = placedIcons.find((i) => i.id === iconId);
    if (icon && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setDraggingIcon(iconId);
      setDragOffset({ x: x - icon.x, y: y - icon.y });
    }
  };

  const handleImageClick = (imageId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (activeDrawingTool === 'eraser') {
      onRemoveImage(imageId);
      return;
    }

    if (activeDrawingTool === 'transform') {
      setTransformingElement({ id: imageId, type: 'image' });
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setTransformStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
      return;
    }

    onSelectElement(imageId, 'image');
  };

  const handleImageMouseDown = (imageId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (activeDrawingTool === 'transform' || activeDrawingTool === 'eraser') {
      return;
    }

    const image = images.find((img) => img.id === imageId);
    if (image && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setDraggingImage(imageId);
      setDragOffset({ x: x - image.x, y: y - image.y });
    }
  };

  const handleResizeStart = (iconId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const icon = placedIcons.find((i) => i.id === iconId);
    if (icon && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setResizingIcon(iconId);
      setResizeStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        width: icon.width || 48,
        height: icon.height || 48,
      });
    }
  };

  const handleImageResizeStart = (imageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const image = images.find((img) => img.id === imageId);
    if (image && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setResizingImage(imageId);
      setResizeStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        width: image.width,
        height: image.height,
      });
    }
  };

  const handleTextClick = (textId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (activeDrawingTool === 'eraser') {
      onRemoveTextLabel(textId);
      return;
    }

    if (activeDrawingTool === 'transform') {
      setTransformingElement({ id: textId, type: 'text' });
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setTransformStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
      return;
    }

    const label = textLabels.find((l) => l.id === textId);
    if (label) {
      setEditingText(textId);
      setTextInput(label.text);
      setTextDialogPosition({ x: label.x, y: label.y });
      setTextDialogOpen(true);
    }
  };

  const handleDrawingClick = (drawingId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (activeDrawingTool === 'eraser') {
      onRemoveDrawing(drawingId);
      return;
    }

    if (activeDrawingTool === 'transform') {
      setTransformingElement({ id: drawingId, type: 'drawing' });
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setTransformStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
    }
  };

  const handleArrowClick = (connectionId: string) => {
    if (activeDrawingTool === 'eraser') {
      onRemoveConnection(connectionId);
      return;
    }

    onSelectArrow(connectionId);
  };

  const handleArrowRotateStart = (connectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRotatingArrow(connectionId);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setRotationStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  const handleTextSave = () => {
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

  return (
    <>
      <div
        ref={canvasRef}
        className="flex-1 relative bg-white overflow-hidden"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ cursor: activeDrawingTool === 'eraser' ? 'crosshair' : 'default' }}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {connections.map((connection) => {
            const sourceIcon = placedIcons.find((icon) => icon.id === connection.sourceId);
            const targetIcon = placedIcons.find((icon) => icon.id === connection.targetId);

            if (sourceIcon && targetIcon) {
              return (
                <AttackPathConnector
                  key={connection.id}
                  id={connection.id}
                  sourceX={sourceIcon.x + (sourceIcon.width || 48) / 2}
                  sourceY={sourceIcon.y + (sourceIcon.height || 48) / 2}
                  targetX={targetIcon.x + (targetIcon.width || 48) / 2}
                  targetY={targetIcon.y + (targetIcon.height || 48) / 2}
                  rotation={connection.rotation || 0}
                  isSelected={selectedArrowId === connection.id}
                  onClick={handleArrowClick}
                />
              );
            }
            return null;
          })}

          {drawings.map((drawing) => {
            if (drawing.type === 'freehand') {
              const pathData = drawing.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
              return (
                <path
                  key={drawing.id}
                  d={pathData}
                  stroke={drawing.color || textColor}
                  strokeWidth={drawing.strokeWidth || 2}
                  fill="none"
                  className="pointer-events-auto cursor-pointer"
                  onClick={(e) => handleDrawingClick(drawing.id, e as any)}
                />
              );
            } else if (drawing.type === 'line') {
              const start = drawing.points[0];
              const end = drawing.points[1];
              return (
                <line
                  key={drawing.id}
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke={drawing.color || textColor}
                  strokeWidth={drawing.strokeWidth || 2}
                  className="pointer-events-auto cursor-pointer"
                  onClick={(e) => handleDrawingClick(drawing.id, e as any)}
                />
              );
            } else if (drawing.type === 'arrow') {
              const start = drawing.points[0];
              const end = drawing.points[1];
              const angle = Math.atan2(end.y - start.y, end.x - start.x);
              const arrowSize = 10;
              const arrowAngle = Math.PI / 6;

              return (
                <g key={drawing.id} className="pointer-events-auto cursor-pointer" onClick={(e) => handleDrawingClick(drawing.id, e as any)}>
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke={drawing.color || textColor}
                    strokeWidth={drawing.strokeWidth || 2}
                  />
                  <line
                    x1={end.x}
                    y1={end.y}
                    x2={end.x - arrowSize * Math.cos(angle - arrowAngle)}
                    y2={end.y - arrowSize * Math.sin(angle - arrowAngle)}
                    stroke={drawing.color || textColor}
                    strokeWidth={drawing.strokeWidth || 2}
                  />
                  <line
                    x1={end.x}
                    y1={end.y}
                    x2={end.x - arrowSize * Math.cos(angle + arrowAngle)}
                    y2={end.y - arrowSize * Math.sin(angle + arrowAngle)}
                    stroke={drawing.color || textColor}
                    strokeWidth={drawing.strokeWidth || 2}
                  />
                </g>
              );
            }
            return null;
          })}

          {isDrawing && currentPath.length > 0 && (
            <>
              {activeDrawingTool === 'freehand' && (
                <path
                  d={currentPath.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
                  stroke={textColor}
                  strokeWidth={2}
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
                    strokeWidth={2}
                  />
                  {activeDrawingTool === 'arrow' && (
                    <>
                      {(() => {
                        const angle = Math.atan2(currentPath[1].y - currentPath[0].y, currentPath[1].x - currentPath[0].x);
                        const arrowSize = 10;
                        const arrowAngle = Math.PI / 6;
                        return (
                          <>
                            <line
                              x1={currentPath[1].x}
                              y1={currentPath[1].y}
                              x2={currentPath[1].x - arrowSize * Math.cos(angle - arrowAngle)}
                              y2={currentPath[1].y - arrowSize * Math.sin(angle - arrowAngle)}
                              stroke={textColor}
                              strokeWidth={2}
                            />
                            <line
                              x1={currentPath[1].x}
                              y1={currentPath[1].y}
                              x2={currentPath[1].x - arrowSize * Math.cos(angle + arrowAngle)}
                              y2={currentPath[1].y - arrowSize * Math.sin(angle + arrowAngle)}
                              stroke={textColor}
                              strokeWidth={2}
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

        {placedIcons.map((icon) => (
          <div
            key={icon.id}
            className={`absolute cursor-move ${selectedElementId === icon.id && selectedElementType === 'icon' ? 'ring-2 ring-primary' : ''}`}
            style={{
              left: icon.x,
              top: icon.y,
              width: icon.width || 48,
              height: icon.height || 48,
            }}
            onClick={(e) => handleIconClick(icon.id, e)}
            onMouseDown={(e) => handleIconMouseDown(icon.id, e)}
          >
            <AttackPathIcon type={icon.type} width={icon.width || 48} height={icon.height || 48} />
            {selectedElementId === icon.id && selectedElementType === 'icon' && (
              <div
                className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full cursor-nwse-resize"
                onMouseDown={(e) => handleResizeStart(icon.id, e)}
              />
            )}
          </div>
        ))}

        {images.map((image) => {
          const imageUrl = imageUrls.get(image.id);
          return (
            <div
              key={image.id}
              className={`absolute cursor-move ${selectedElementId === image.id && selectedElementType === 'image' ? 'ring-2 ring-primary' : ''}`}
              style={{
                left: image.x,
                top: image.y,
                width: image.width,
                height: image.height,
              }}
              onClick={(e) => handleImageClick(image.id, e)}
              onMouseDown={(e) => handleImageMouseDown(image.id, e)}
            >
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt={image.name}
                  className="w-full h-full object-contain"
                  draggable={false}
                />
              )}
              {selectedElementId === image.id && selectedElementType === 'image' && (
                <div
                  className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full cursor-nwse-resize"
                  onMouseDown={(e) => handleImageResizeStart(image.id, e)}
                />
              )}
            </div>
          );
        })}

        {textLabels.map((label) => (
          <div
            key={label.id}
            className={`absolute cursor-pointer whitespace-pre-wrap ${selectedElementId === label.id && selectedElementType === 'text' ? 'ring-2 ring-primary' : ''}`}
            style={{
              left: label.x,
              top: label.y,
              color: label.color,
              fontSize: `${label.fontSize || 16}px`,
              fontWeight: label.fontWeight || 'normal',
              transform: `rotate(${label.rotation || 0}deg)`,
            }}
            onClick={(e) => handleTextClick(label.id, e)}
          >
            {label.text}
          </div>
        ))}

        {selectedArrowId && (
          <div
            className="absolute cursor-pointer"
            style={{
              left: (() => {
                const connection = connections.find((c) => c.id === selectedArrowId);
                if (connection) {
                  const sourceIcon = placedIcons.find((i) => i.id === connection.sourceId);
                  const targetIcon = placedIcons.find((i) => i.id === connection.targetId);
                  if (sourceIcon && targetIcon) {
                    return (sourceIcon.x + targetIcon.x) / 2;
                  }
                }
                return 0;
              })(),
              top: (() => {
                const connection = connections.find((c) => c.id === selectedArrowId);
                if (connection) {
                  const sourceIcon = placedIcons.find((i) => i.id === connection.sourceId);
                  const targetIcon = placedIcons.find((i) => i.id === connection.targetId);
                  if (sourceIcon && targetIcon) {
                    return (sourceIcon.y + targetIcon.y) / 2;
                  }
                }
                return 0;
              })(),
            }}
            onMouseDown={(e) => handleArrowRotateStart(selectedArrowId, e)}
          >
            <RotateCw className="h-6 w-6 text-primary" />
          </div>
        )}
      </div>

      <Dialog open={textDialogOpen} onOpenChange={setTextDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingText ? 'Edit Text Label' : 'Add Text Label'}</DialogTitle>
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
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTextDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleTextSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
