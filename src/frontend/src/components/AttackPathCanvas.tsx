import { useRef, useState, useEffect } from 'react';
import AttackPathIcon from './AttackPathIcon';
import AttackPathConnector from './AttackPathConnector';
import { PlacedIcon, Connection, DrawingPath, DrawingTool, TextLabel, UploadedImage, SelectedElements } from '@/hooks/useAttackPathState';
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
  selectedElements: SelectedElements;
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
  onSelectMultipleElements: (elements: SelectedElements) => void;
  onClearSelection: () => void;
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
  selectedElements,
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
  onSelectMultipleElements,
  onClearSelection,
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
  
  // Drag-to-select state
  const [isDraggingSelectionBox, setIsDraggingSelectionBox] = useState(false);
  const [selectionBoxStart, setSelectionBoxStart] = useState({ x: 0, y: 0 });
  const [selectionBoxEnd, setSelectionBoxEnd] = useState({ x: 0, y: 0 });

  // Track if mouse has moved during transform to prevent click-to-duplicate
  const [hasMovedDuringTransform, setHasMovedDuringTransform] = useState(false);

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

  const isClickOnElement = (x: number, y: number): boolean => {
    // Check if click is on any icon
    for (const icon of placedIcons) {
      const iconWidth = icon.width || 48;
      const iconHeight = icon.height || 48;
      if (x >= icon.x && x <= icon.x + iconWidth && y >= icon.y && y <= icon.y + iconHeight) {
        return true;
      }
    }

    // Check if click is on any text label
    for (const label of textLabels) {
      const labelWidth = label.width || 100;
      const labelHeight = label.height || 30;
      if (x >= label.x && x <= label.x + labelWidth && y >= label.y && y <= label.y + labelHeight) {
        return true;
      }
    }

    // Check if click is on any image
    for (const image of images) {
      if (x >= image.x && x <= image.x + image.width && y >= image.y && y <= image.y + image.height) {
        return true;
      }
    }

    return false;
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

    // Check if we're clicking on empty space for drag-to-select
    const clickedOnElement = isClickOnElement(x, y);
    
    if (!clickedOnElement && !activeDrawingTool && mode === 'place') {
      // Start drag-to-select
      setIsDraggingSelectionBox(true);
      setSelectionBoxStart({ x, y });
      setSelectionBoxEnd({ x, y });
      
      // Clear previous selection if shift/ctrl not held
      if (!e.shiftKey && !e.ctrlKey) {
        onClearSelection();
      }
      return;
    }

    if (activeDrawingTool === 'freehand' || activeDrawingTool === 'line' || activeDrawingTool === 'arrow') {
      setIsDrawing(true);
      setCurrentPath([{ x, y }]);
    }
  };

  const getElementsInSelectionBox = (startX: number, startY: number, endX: number, endY: number): SelectedElements => {
    const minX = Math.min(startX, endX);
    const maxX = Math.max(startX, endX);
    const minY = Math.min(startY, endY);
    const maxY = Math.max(startY, endY);

    const selectedIcons = new Set<string>();
    const selectedTextLabels = new Set<string>();
    const selectedImages = new Set<string>();
    const selectedConnections = new Set<string>();

    // Check icons
    placedIcons.forEach((icon) => {
      const iconWidth = icon.width || 48;
      const iconHeight = icon.height || 48;
      const iconCenterX = icon.x + iconWidth / 2;
      const iconCenterY = icon.y + iconHeight / 2;
      
      // Check if icon intersects or is within selection box
      if (
        iconCenterX >= minX && iconCenterX <= maxX &&
        iconCenterY >= minY && iconCenterY <= maxY
      ) {
        selectedIcons.add(icon.id);
      }
    });

    // Check text labels
    textLabels.forEach((label) => {
      const labelWidth = label.width || 100;
      const labelHeight = label.height || 30;
      const labelCenterX = label.x + labelWidth / 2;
      const labelCenterY = label.y + labelHeight / 2;
      
      if (
        labelCenterX >= minX && labelCenterX <= maxX &&
        labelCenterY >= minY && labelCenterY <= maxY
      ) {
        selectedTextLabels.add(label.id);
      }
    });

    // Check images
    images.forEach((image) => {
      const imageCenterX = image.x + image.width / 2;
      const imageCenterY = image.y + image.height / 2;
      
      if (
        imageCenterX >= minX && imageCenterX <= maxX &&
        imageCenterY >= minY && imageCenterY <= maxY
      ) {
        selectedImages.add(image.id);
      }
    });

    // Check connections (check if midpoint is in selection)
    connections.forEach((connection) => {
      const sourceIcon = placedIcons.find((i) => i.id === connection.sourceId);
      const targetIcon = placedIcons.find((i) => i.id === connection.targetId);
      
      if (sourceIcon && targetIcon) {
        const midX = (sourceIcon.x + targetIcon.x) / 2;
        const midY = (sourceIcon.y + targetIcon.y) / 2;
        
        if (midX >= minX && midX <= maxX && midY >= minY && midY <= maxY) {
          selectedConnections.add(connection.id);
        }
      }
    });

    return {
      icons: selectedIcons,
      textLabels: selectedTextLabels,
      images: selectedImages,
      connections: selectedConnections,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Handle drag-to-select
    if (isDraggingSelectionBox) {
      setSelectionBoxEnd({ x, y });
      return;
    }

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
      // Mark that we've moved during transform
      setHasMovedDuringTransform(true);
      
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
    // Handle drag-to-select completion
    if (isDraggingSelectionBox) {
      const elementsInBox = getElementsInSelectionBox(
        selectionBoxStart.x,
        selectionBoxStart.y,
        selectionBoxEnd.x,
        selectionBoxEnd.y
      );
      onSelectMultipleElements(elementsInBox);
      setIsDraggingSelectionBox(false);
    }

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
    setHasMovedDuringTransform(false);
  };

  const handleIconClick = (iconId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (activeDrawingTool === 'eraser') {
      onRemoveIcon(iconId);
      return;
    }

    // Transform tool: only select, no duplication
    if (activeDrawingTool === 'transform') {
      onSelectElement(iconId, 'icon');
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

    if (activeDrawingTool === 'eraser') {
      return;
    }

    // Transform tool: set up transform state on mouse down, but only transform on drag
    if (activeDrawingTool === 'transform') {
      setTransformingElement({ id: iconId, type: 'icon' });
      setHasMovedDuringTransform(false);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setTransformStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
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

    // Transform tool: only select, no duplication
    if (activeDrawingTool === 'transform') {
      onSelectElement(imageId, 'image');
      return;
    }

    onSelectElement(imageId, 'image');
  };

  const handleImageMouseDown = (imageId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (activeDrawingTool === 'eraser') {
      return;
    }

    // Transform tool: set up transform state on mouse down, but only transform on drag
    if (activeDrawingTool === 'transform') {
      setTransformingElement({ id: imageId, type: 'image' });
      setHasMovedDuringTransform(false);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setTransformStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
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

  const handleTextClick = (labelId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (activeDrawingTool === 'eraser') {
      onRemoveTextLabel(labelId);
      return;
    }

    // Transform tool: only select, no duplication
    if (activeDrawingTool === 'transform') {
      onSelectElement(labelId, 'text');
      return;
    }

    if (activeDrawingTool === 'text') {
      const label = textLabels.find((l) => l.id === labelId);
      if (label) {
        setTextInput(label.text);
        setEditingText(labelId);
        setTextDialogOpen(true);
      }
      return;
    }

    onSelectElement(labelId, 'text');
  };

  const handleTextMouseDown = (labelId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (activeDrawingTool === 'eraser' || activeDrawingTool === 'text') {
      return;
    }

    // Transform tool: set up transform state on mouse down, but only transform on drag
    if (activeDrawingTool === 'transform') {
      setTransformingElement({ id: labelId, type: 'text' });
      setHasMovedDuringTransform(false);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setTransformStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
      return;
    }

    const label = textLabels.find((l) => l.id === labelId);
    if (label && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setTransformingElement({ id: labelId, type: 'text' });
      setTransformStart({ x, y });
    }
  };

  const handleDrawingClick = (drawingId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (activeDrawingTool === 'eraser') {
      onRemoveDrawing(drawingId);
      return;
    }

    // Transform tool: only select, no duplication
    if (activeDrawingTool === 'transform') {
      onSelectElement(drawingId, 'text');
      return;
    }
  };

  const handleDrawingMouseDown = (drawingId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (activeDrawingTool === 'eraser') {
      return;
    }

    // Transform tool: set up transform state on mouse down, but only transform on drag
    if (activeDrawingTool === 'transform') {
      setTransformingElement({ id: drawingId, type: 'drawing' });
      setHasMovedDuringTransform(false);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setTransformStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
      return;
    }
  };

  const handleArrowClick = (connectionId: string) => {
    if (activeDrawingTool === 'eraser') {
      onRemoveConnection(connectionId);
      return;
    }

    onSelectArrow(connectionId);
  };

  const handleRotateArrow = (connectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRotatingArrow(connectionId);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setRotationStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
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

  const renderSelectionBox = () => {
    if (!isDraggingSelectionBox) return null;

    const minX = Math.min(selectionBoxStart.x, selectionBoxEnd.x);
    const minY = Math.min(selectionBoxStart.y, selectionBoxEnd.y);
    const width = Math.abs(selectionBoxEnd.x - selectionBoxStart.x);
    const height = Math.abs(selectionBoxEnd.y - selectionBoxStart.y);

    return (
      <div
        className="absolute border-2 border-primary bg-primary/10 pointer-events-none"
        style={{
          left: minX,
          top: minY,
          width,
          height,
        }}
      />
    );
  };

  return (
    <>
      <div
        ref={canvasRef}
        className="relative w-full h-full bg-background border border-border overflow-hidden"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Render connections */}
        {connections.map((connection) => {
          const sourceIcon = placedIcons.find((icon) => icon.id === connection.sourceId);
          const targetIcon = placedIcons.find((icon) => icon.id === connection.targetId);

          if (!sourceIcon || !targetIcon) return null;

          const isSelected = selectedArrowId === connection.id;

          return (
            <AttackPathConnector
              key={connection.id}
              id={connection.id}
              sourceX={sourceIcon.x + (sourceIcon.width || 48) / 2}
              sourceY={sourceIcon.y + (sourceIcon.height || 48) / 2}
              targetX={targetIcon.x + (targetIcon.width || 48) / 2}
              targetY={targetIcon.y + (targetIcon.height || 48) / 2}
              rotation={connection.rotation || 0}
              isSelected={isSelected}
              onClick={handleArrowClick}
            />
          );
        })}

        {/* Render freehand drawings, lines, and arrows */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {drawings.map((drawing) => {
            if (drawing.type === 'freehand') {
              const pathData = drawing.points.map((point, index) => 
                `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
              ).join(' ');

              return (
                <path
                  key={drawing.id}
                  d={pathData}
                  stroke={drawing.color || textColor}
                  strokeWidth={drawing.strokeWidth || 2}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="pointer-events-auto cursor-pointer"
                  onClick={(e) => handleDrawingClick(drawing.id, e as any)}
                  onMouseDown={(e) => handleDrawingMouseDown(drawing.id, e as any)}
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
                  stroke={drawing.color || textColor}
                  strokeWidth={drawing.strokeWidth || 2}
                  className="pointer-events-auto cursor-pointer"
                  onClick={(e) => handleDrawingClick(drawing.id, e as any)}
                  onMouseDown={(e) => handleDrawingMouseDown(drawing.id, e as any)}
                />
              );
            } else if (drawing.type === 'arrow') {
              const start = drawing.points[0];
              const end = drawing.points[drawing.points.length - 1];
              const angle = Math.atan2(end.y - start.y, end.x - start.x);
              const arrowLength = 15;
              const arrowAngle = Math.PI / 6;

              const arrowPoint1X = end.x - arrowLength * Math.cos(angle - arrowAngle);
              const arrowPoint1Y = end.y - arrowLength * Math.sin(angle - arrowAngle);
              const arrowPoint2X = end.x - arrowLength * Math.cos(angle + arrowAngle);
              const arrowPoint2Y = end.y - arrowLength * Math.sin(angle + arrowAngle);

              return (
                <g
                  key={drawing.id}
                  className="pointer-events-auto cursor-pointer"
                  onClick={(e) => handleDrawingClick(drawing.id, e as any)}
                  onMouseDown={(e) => handleDrawingMouseDown(drawing.id, e as any)}
                >
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke={drawing.color || textColor}
                    strokeWidth={drawing.strokeWidth || 2}
                  />
                  <polygon
                    points={`${end.x},${end.y} ${arrowPoint1X},${arrowPoint1Y} ${arrowPoint2X},${arrowPoint2Y}`}
                    fill={drawing.color || textColor}
                  />
                </g>
              );
            }

            return null;
          })}

          {/* Render current drawing path */}
          {isDrawing && currentPath.length > 0 && (
            <>
              {activeDrawingTool === 'freehand' && (
                <path
                  d={currentPath.map((point, index) => 
                    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
                  ).join(' ')}
                  stroke={textColor}
                  strokeWidth={2}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {(activeDrawingTool === 'line' || activeDrawingTool === 'arrow') && currentPath.length >= 2 && (
                <>
                  <line
                    x1={currentPath[0].x}
                    y1={currentPath[0].y}
                    x2={currentPath[currentPath.length - 1].x}
                    y2={currentPath[currentPath.length - 1].y}
                    stroke={textColor}
                    strokeWidth={2}
                  />
                  {activeDrawingTool === 'arrow' && (
                    (() => {
                      const start = currentPath[0];
                      const end = currentPath[currentPath.length - 1];
                      const angle = Math.atan2(end.y - start.y, end.x - start.x);
                      const arrowLength = 15;
                      const arrowAngle = Math.PI / 6;

                      const arrowPoint1X = end.x - arrowLength * Math.cos(angle - arrowAngle);
                      const arrowPoint1Y = end.y - arrowLength * Math.sin(angle - arrowAngle);
                      const arrowPoint2X = end.x - arrowLength * Math.cos(angle + arrowAngle);
                      const arrowPoint2Y = end.y - arrowLength * Math.sin(angle + arrowAngle);

                      return (
                        <polygon
                          points={`${end.x},${end.y} ${arrowPoint1X},${arrowPoint1Y} ${arrowPoint2X},${arrowPoint2Y}`}
                          fill={textColor}
                        />
                      );
                    })()
                  )}
                </>
              )}
            </>
          )}
        </svg>

        {/* Render placed icons */}
        {placedIcons.map((icon) => {
          const isSelected = selectedElementId === icon.id && selectedElementType === 'icon';
          const isInMultiSelection = selectedElements.icons.has(icon.id);

          return (
            <div
              key={icon.id}
              className={`absolute cursor-move ${
                isSelected || isInMultiSelection ? 'ring-2 ring-primary' : ''
              }`}
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
              {isSelected && (
                <div
                  className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full cursor-se-resize"
                  onMouseDown={(e) => handleResizeStart(icon.id, e)}
                />
              )}
            </div>
          );
        })}

        {/* Render uploaded images */}
        {images.map((image) => {
          const isSelected = selectedElementId === image.id && selectedElementType === 'image';
          const isInMultiSelection = selectedElements.images.has(image.id);
          const imageUrl = imageUrls.get(image.id);

          return (
            <div
              key={image.id}
              className={`absolute cursor-move ${
                isSelected || isInMultiSelection ? 'ring-2 ring-primary' : ''
              }`}
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
                />
              )}
              {isSelected && (
                <div
                  className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full cursor-se-resize"
                  onMouseDown={(e) => handleImageResizeStart(image.id, e)}
                />
              )}
            </div>
          );
        })}

        {/* Render text labels */}
        {textLabels.map((label) => {
          const isSelected = selectedElementId === label.id && selectedElementType === 'text';
          const isInMultiSelection = selectedElements.textLabels.has(label.id);

          return (
            <div
              key={label.id}
              className={`absolute cursor-move whitespace-nowrap ${
                isSelected || isInMultiSelection ? 'ring-2 ring-primary' : ''
              }`}
              style={{
                left: label.x,
                top: label.y,
                color: label.color,
                fontSize: `${label.fontSize || 16}px`,
                fontWeight: label.fontWeight || 'normal',
              }}
              onClick={(e) => handleTextClick(label.id, e)}
              onMouseDown={(e) => handleTextMouseDown(label.id, e)}
            >
              {label.text}
            </div>
          );
        })}

        {/* Render selection box */}
        {renderSelectionBox()}

        {/* Rotate arrow button */}
        {selectedArrowId && (
          (() => {
            const connection = connections.find((c) => c.id === selectedArrowId);
            if (!connection) return null;

            const sourceIcon = placedIcons.find((i) => i.id === connection.sourceId);
            const targetIcon = placedIcons.find((i) => i.id === connection.targetId);

            if (!sourceIcon || !targetIcon) return null;

            const midX = (sourceIcon.x + targetIcon.x) / 2;
            const midY = (sourceIcon.y + targetIcon.y) / 2;

            return (
              <button
                className="absolute w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
                style={{
                  left: midX - 16,
                  top: midY - 16,
                }}
                onMouseDown={(e) => handleRotateArrow(selectedArrowId, e)}
                title="Rotate arrow"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            );
          })()
        )}
      </div>

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
            <Button onClick={handleSaveText}>
              {editingText ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
