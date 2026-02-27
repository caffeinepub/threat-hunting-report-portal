import React, { useRef, useState, useEffect, useCallback } from 'react';
import { CanvasIcon, Connection, DrawingPath, TextLabel, CanvasImage, SelectedElements } from '../hooks/useAttackPathState';
import AttackPathIcon, { IconType } from './AttackPathIcon';
import AttackPathConnector from './AttackPathConnector';

interface AttackPathCanvasProps {
  icons: CanvasIcon[];
  connections: Connection[];
  drawings: DrawingPath[];
  textLabels: TextLabel[];
  images: CanvasImage[];
  selectedElements: SelectedElements;
  activeTool: string;
  drawColor: string;
  strokeWidth: number;
  textColor: string;
  fontSize: number;
  onAddIcon: (type: IconType, x: number, y: number, name: string) => void;
  onMoveIcon: (id: string, x: number, y: number) => void;
  onResizeIcon: (id: string, width: number, height: number) => void;
  onRotateIcon: (id: string, rotation: number) => void;
  onRemoveIcon: (id: string) => void;
  onAddConnection: (sourceId: string, targetId: string, connectionType: string, color: string) => void;
  onRemoveConnection: (id: string) => void;
  onAddDrawing: (type: 'freehand' | 'line' | 'arrow', points: { x: number; y: number }[], color: string, strokeWidth: number) => void;
  onRemoveDrawing: (id: string) => void;
  onAddTextLabel: (text: string, x: number, y: number, color: string, fontSize: number) => void;
  onMoveTextLabel: (id: string, x: number, y: number) => void;
  onRemoveTextLabel: (id: string) => void;
  onAddImage: (file: File, x: number, y: number, name: string, description: string) => void;
  onMoveImage: (id: string, x: number, y: number) => void;
  onResizeImage: (id: string, width: number, height: number) => void;
  onRemoveImage: (id: string) => void;
  onSetSelectedElements: (selected: SelectedElements) => void;
  onUndo: () => void;
}

type DragState =
  | { kind: 'none' }
  | { kind: 'icon'; id: string; offsetX: number; offsetY: number }
  | { kind: 'textLabel'; id: string; offsetX: number; offsetY: number }
  | { kind: 'image'; id: string; offsetX: number; offsetY: number }
  | { kind: 'drawing'; points: { x: number; y: number }[] }
  | { kind: 'line'; startX: number; startY: number; currentX: number; currentY: number }
  | { kind: 'arrow'; startX: number; startY: number; currentX: number; currentY: number }
  | { kind: 'eraser'; points: { x: number; y: number }[]; erasedDrawingIds: Set<string> }
  | { kind: 'select'; startX: number; startY: number; currentX: number; currentY: number }
  | { kind: 'connect'; sourceId: string }
  | { kind: 'freeTransformResize'; id: string; handle: string; startX: number; startY: number; origWidth: number; origHeight: number; origX: number; origY: number }
  | { kind: 'freeTransformRotate'; id: string; centerX: number; centerY: number; startAngle: number; origRotation: number };

export default function AttackPathCanvas({
  icons,
  connections,
  drawings,
  textLabels,
  images,
  selectedElements,
  activeTool,
  drawColor,
  strokeWidth,
  textColor,
  fontSize,
  onAddIcon,
  onMoveIcon,
  onResizeIcon,
  onRotateIcon,
  onRemoveIcon,
  onAddConnection,
  onRemoveConnection,
  onAddDrawing,
  onRemoveDrawing,
  onAddTextLabel,
  onMoveTextLabel,
  onRemoveTextLabel,
  onAddImage,
  onMoveImage,
  onResizeImage,
  onRemoveImage,
  onSetSelectedElements,
  onUndo,
}: AttackPathCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState>({ kind: 'none' });
  const [liveDrawPoints, setLiveDrawPoints] = useState<{ x: number; y: number }[]>([]);
  const [liveLineEnd, setLiveLineEnd] = useState<{ x: number; y: number } | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [freeTransformId, setFreeTransformId] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  // Load image URLs
  useEffect(() => {
    images.forEach(img => {
      if (!imageUrls[img.id]) {
        img.blob.getBytes().then(bytes => {
          const blob = new Blob([bytes]);
          const url = URL.createObjectURL(blob);
          setImageUrls(prev => ({ ...prev, [img.id]: url }));
        });
      }
    });
  }, [images]);

  const getCanvasPos = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  // Hit-test only the icon IMAGE area (not the text label below it)
  const getIconAt = useCallback((x: number, y: number) => {
    return icons.find(icon => {
      const w = icon.width ?? 56;
      const h = icon.height ?? 56;
      // Icon image occupies [icon.x, icon.x + w] x [icon.y, icon.y + h]
      return x >= icon.x && x <= icon.x + w && y >= icon.y && y <= icon.y + h;
    });
  }, [icons]);

  const getTextLabelAt = useCallback((x: number, y: number) => {
    return textLabels.find(label => {
      const w = label.text.length * (label.fontSize * 0.6);
      const h = label.fontSize * 1.4;
      return x >= label.x && x <= label.x + w && y >= label.y && y <= label.y + h;
    });
  }, [textLabels]);

  const getImageAt = useCallback((x: number, y: number) => {
    return images.find(img =>
      x >= img.x && x <= img.x + img.width && y >= img.y && y <= img.y + img.height
    );
  }, [images]);

  // Eraser: check if point is near a drawing stroke
  const getDrawingAtPoint = useCallback((x: number, y: number, radius = 14) => {
    return drawings.find(drawing => {
      if (drawing.points.length < 2) return false;
      if (drawing.type === 'freehand') {
        return drawing.points.some(pt => {
          const dx = pt.x - x;
          const dy = pt.y - y;
          return Math.sqrt(dx * dx + dy * dy) <= radius;
        });
      }
      if (drawing.type === 'line' || drawing.type === 'arrow') {
        const [start, end] = drawing.points;
        if (!start || !end) return false;
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) {
          const ddx = x - start.x;
          const ddy = y - start.y;
          return Math.sqrt(ddx * ddx + ddy * ddy) <= radius;
        }
        let t = ((x - start.x) * dx + (y - start.y) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));
        const closestX = start.x + t * dx;
        const closestY = start.y + t * dy;
        const distX = x - closestX;
        const distY = y - closestY;
        return Math.sqrt(distX * distX + distY * distY) <= radius;
      }
      return false;
    });
  }, [drawings]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const pos = getCanvasPos(e);

    if (activeTool === 'select') {
      // Only allow dragging by clicking on the icon IMAGE area
      const icon = getIconAt(pos.x, pos.y);
      if (icon) {
        if (e.shiftKey) {
          const newIcons = new Set(selectedElements.icons);
          if (newIcons.has(icon.id)) newIcons.delete(icon.id);
          else newIcons.add(icon.id);
          onSetSelectedElements({ ...selectedElements, icons: newIcons });
        } else {
          onSetSelectedElements({ icons: new Set([icon.id]), textLabels: new Set(), images: new Set() });
          setDragState({ kind: 'icon', id: icon.id, offsetX: pos.x - icon.x, offsetY: pos.y - icon.y });
        }
        return;
      }
      const label = getTextLabelAt(pos.x, pos.y);
      if (label) {
        if (e.shiftKey) {
          const newLabels = new Set(selectedElements.textLabels);
          if (newLabels.has(label.id)) newLabels.delete(label.id);
          else newLabels.add(label.id);
          onSetSelectedElements({ ...selectedElements, textLabels: newLabels });
        } else {
          onSetSelectedElements({ icons: new Set(), textLabels: new Set([label.id]), images: new Set() });
          setDragState({ kind: 'textLabel', id: label.id, offsetX: pos.x - label.x, offsetY: pos.y - label.y });
        }
        return;
      }
      const img = getImageAt(pos.x, pos.y);
      if (img) {
        if (e.shiftKey) {
          const newImages = new Set(selectedElements.images);
          if (newImages.has(img.id)) newImages.delete(img.id);
          else newImages.add(img.id);
          onSetSelectedElements({ ...selectedElements, images: newImages });
        } else {
          onSetSelectedElements({ icons: new Set(), textLabels: new Set(), images: new Set([img.id]) });
          setDragState({ kind: 'image', id: img.id, offsetX: pos.x - img.x, offsetY: pos.y - img.y });
        }
        return;
      }
      onSetSelectedElements({ icons: new Set(), textLabels: new Set(), images: new Set() });
      setDragState({ kind: 'select', startX: pos.x, startY: pos.y, currentX: pos.x, currentY: pos.y });
      return;
    }

    if (activeTool === 'freeTransform') {
      const icon = getIconAt(pos.x, pos.y);
      if (icon) {
        setFreeTransformId(icon.id);
        onSetSelectedElements({ icons: new Set([icon.id]), textLabels: new Set(), images: new Set() });
      } else {
        setFreeTransformId(null);
        onSetSelectedElements({ icons: new Set(), textLabels: new Set(), images: new Set() });
      }
      return;
    }

    if (activeTool === 'eraser') {
      const erasedDrawingIds = new Set<string>();
      const icon = getIconAt(pos.x, pos.y);
      if (icon) {
        onRemoveIcon(icon.id);
      }
      const drawing = getDrawingAtPoint(pos.x, pos.y);
      if (drawing) {
        erasedDrawingIds.add(drawing.id);
        onRemoveDrawing(drawing.id);
      }
      const label = getTextLabelAt(pos.x, pos.y);
      if (label) {
        onRemoveTextLabel(label.id);
      }
      setDragState({ kind: 'eraser', points: [pos], erasedDrawingIds });
      return;
    }

    if (activeTool === 'draw') {
      setDragState({ kind: 'drawing', points: [pos] });
      setLiveDrawPoints([pos]);
      return;
    }

    if (activeTool === 'line') {
      setDragState({ kind: 'line', startX: pos.x, startY: pos.y, currentX: pos.x, currentY: pos.y });
      return;
    }

    if (activeTool === 'arrow') {
      setDragState({ kind: 'arrow', startX: pos.x, startY: pos.y, currentX: pos.x, currentY: pos.y });
      return;
    }

    if (activeTool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        onAddTextLabel(text, pos.x, pos.y, textColor, fontSize);
      }
      return;
    }

    if (activeTool === 'connect') {
      const icon = getIconAt(pos.x, pos.y);
      if (icon) {
        if (connectingFrom === null) {
          setConnectingFrom(icon.id);
          setDragState({ kind: 'connect', sourceId: icon.id });
        } else {
          if (connectingFrom !== icon.id) {
            onAddConnection(connectingFrom, icon.id, 'default', drawColor);
          }
          setConnectingFrom(null);
          setDragState({ kind: 'none' });
        }
      }
      return;
    }
  }, [activeTool, getCanvasPos, getIconAt, getTextLabelAt, getImageAt, getDrawingAtPoint, selectedElements, onSetSelectedElements, connectingFrom, onAddConnection, onAddTextLabel, textColor, fontSize, drawColor, onRemoveIcon, onRemoveDrawing, onRemoveTextLabel]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const pos = getCanvasPos(e);

    if (dragState.kind === 'icon') {
      // Only move the icon image; text label (labelX/labelY) stays fixed
      onMoveIcon(dragState.id, pos.x - dragState.offsetX, pos.y - dragState.offsetY);
      return;
    }

    if (dragState.kind === 'textLabel') {
      onMoveTextLabel(dragState.id, pos.x - dragState.offsetX, pos.y - dragState.offsetY);
      return;
    }

    if (dragState.kind === 'image') {
      onMoveImage(dragState.id, pos.x - dragState.offsetX, pos.y - dragState.offsetY);
      return;
    }

    if (dragState.kind === 'drawing') {
      const newPoints = [...dragState.points, pos];
      setDragState({ kind: 'drawing', points: newPoints });
      setLiveDrawPoints(newPoints);
      return;
    }

    if (dragState.kind === 'line') {
      setDragState({ ...dragState, currentX: pos.x, currentY: pos.y });
      setLiveLineEnd(pos);
      return;
    }

    if (dragState.kind === 'arrow') {
      setDragState({ ...dragState, currentX: pos.x, currentY: pos.y });
      setLiveLineEnd(pos);
      return;
    }

    if (dragState.kind === 'eraser') {
      const newPoints = [...dragState.points, pos];
      const newErasedIds = new Set(dragState.erasedDrawingIds);

      const icon = getIconAt(pos.x, pos.y);
      if (icon) {
        onRemoveIcon(icon.id);
      }

      const drawing = getDrawingAtPoint(pos.x, pos.y);
      if (drawing && !newErasedIds.has(drawing.id)) {
        newErasedIds.add(drawing.id);
        onRemoveDrawing(drawing.id);
      }

      const label = getTextLabelAt(pos.x, pos.y);
      if (label) {
        onRemoveTextLabel(label.id);
      }

      setDragState({ kind: 'eraser', points: newPoints, erasedDrawingIds: newErasedIds });
      return;
    }

    if (dragState.kind === 'select') {
      setDragState({ ...dragState, currentX: pos.x, currentY: pos.y });
      return;
    }

    if (dragState.kind === 'freeTransformResize') {
      const icon = icons.find(i => i.id === dragState.id);
      if (!icon) return;
      const dx = pos.x - dragState.startX;
      const dy = pos.y - dragState.startY;
      let newWidth = dragState.origWidth;
      let newHeight = dragState.origHeight;
      const aspect = dragState.origWidth / dragState.origHeight;

      if (dragState.handle === 'se') {
        newWidth = Math.max(20, dragState.origWidth + dx);
        newHeight = Math.max(20, dragState.origHeight + dy);
      } else if (dragState.handle === 'sw') {
        newWidth = Math.max(20, dragState.origWidth - dx);
        newHeight = Math.max(20, dragState.origHeight + dy);
      } else if (dragState.handle === 'ne') {
        newWidth = Math.max(20, dragState.origWidth + dx);
        newHeight = Math.max(20, dragState.origHeight - dy);
      } else if (dragState.handle === 'nw') {
        newWidth = Math.max(20, dragState.origWidth - dx);
        newHeight = Math.max(20, dragState.origHeight - dy);
      }

      if (Math.abs(newWidth - dragState.origWidth) >= Math.abs(newHeight - dragState.origHeight)) {
        newHeight = newWidth / aspect;
      } else {
        newWidth = newHeight * aspect;
      }
      newWidth = Math.max(20, newWidth);
      newHeight = Math.max(20, newHeight);

      onResizeIcon(dragState.id, newWidth, newHeight);
      return;
    }

    if (dragState.kind === 'freeTransformRotate') {
      const dx = pos.x - dragState.centerX;
      const dy = pos.y - dragState.centerY;
      const currentAngle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      const delta = currentAngle - dragState.startAngle;
      onRotateIcon(dragState.id, dragState.origRotation + delta);
      return;
    }
  }, [dragState, getCanvasPos, onMoveIcon, onMoveTextLabel, onMoveImage, getIconAt, getTextLabelAt, getDrawingAtPoint, onRemoveIcon, onRemoveDrawing, onRemoveTextLabel, icons, onResizeIcon, onRotateIcon]);

  const handleMouseUp = useCallback((_e: React.MouseEvent) => {
    if (dragState.kind === 'drawing' && dragState.points.length > 1) {
      onAddDrawing('freehand', dragState.points, drawColor, strokeWidth);
      setLiveDrawPoints([]);
    }

    if (dragState.kind === 'line') {
      const pts = [{ x: dragState.startX, y: dragState.startY }, { x: dragState.currentX, y: dragState.currentY }];
      if (Math.abs(dragState.currentX - dragState.startX) > 5 || Math.abs(dragState.currentY - dragState.startY) > 5) {
        onAddDrawing('line', pts, drawColor, strokeWidth);
      }
      setLiveLineEnd(null);
    }

    if (dragState.kind === 'arrow') {
      const pts = [{ x: dragState.startX, y: dragState.startY }, { x: dragState.currentX, y: dragState.currentY }];
      if (Math.abs(dragState.currentX - dragState.startX) > 5 || Math.abs(dragState.currentY - dragState.startY) > 5) {
        onAddDrawing('arrow', pts, drawColor, strokeWidth);
      }
      setLiveLineEnd(null);
    }

    if (dragState.kind === 'select') {
      const minX = Math.min(dragState.startX, dragState.currentX);
      const maxX = Math.max(dragState.startX, dragState.currentX);
      const minY = Math.min(dragState.startY, dragState.currentY);
      const maxY = Math.max(dragState.startY, dragState.currentY);
      const selectedIcons = new Set(
        icons.filter(icon => icon.x >= minX && icon.x + (icon.width ?? 56) <= maxX && icon.y >= minY && icon.y + (icon.height ?? 56) <= maxY).map(i => i.id)
      );
      const selectedLabels = new Set(
        textLabels.filter(label => label.x >= minX && label.x <= maxX && label.y >= minY && label.y <= maxY).map(l => l.id)
      );
      const selectedImages = new Set(
        images.filter(img => img.x >= minX && img.x + img.width <= maxX && img.y >= minY && img.y + img.height <= maxY).map(i => i.id)
      );
      onSetSelectedElements({ icons: selectedIcons, textLabels: selectedLabels, images: selectedImages });
    }

    setDragState({ kind: 'none' });
  }, [dragState, onAddDrawing, drawColor, strokeWidth, icons, textLabels, images, onSetSelectedElements]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const iconType = e.dataTransfer.getData('iconType') as IconType;
    const iconName = e.dataTransfer.getData('iconName');
    if (iconType) {
      onAddIcon(iconType, x - 28, y - 28, iconName || iconType);
    }
  }, [onAddIcon]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const renderDrawings = () => {
    return drawings.map(drawing => {
      if (drawing.type === 'freehand') {
        if (drawing.points.length < 2) return null;
        const d = drawing.points.reduce((acc, pt, i) =>
          i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`, '');
        return (
          <path
            key={drawing.id}
            d={d}
            stroke={drawing.color}
            strokeWidth={drawing.strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      }
      if (drawing.type === 'line' || drawing.type === 'arrow') {
        const [start, end] = drawing.points;
        if (!start || !end) return null;
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const arrowSize = 10;
        return (
          <g key={drawing.id}>
            <line
              x1={start.x} y1={start.y}
              x2={end.x} y2={end.y}
              stroke={drawing.color}
              strokeWidth={drawing.strokeWidth}
              strokeLinecap="round"
            />
            {drawing.type === 'arrow' && (
              <polygon
                points={`
                  ${end.x},${end.y}
                  ${end.x - arrowSize * Math.cos(angle - Math.PI / 6)},${end.y - arrowSize * Math.sin(angle - Math.PI / 6)}
                  ${end.x - arrowSize * Math.cos(angle + Math.PI / 6)},${end.y - arrowSize * Math.sin(angle + Math.PI / 6)}
                `}
                fill={drawing.color}
              />
            )}
          </g>
        );
      }
      return null;
    });
  };

  const renderLiveDrawing = () => {
    if (dragState.kind === 'drawing' && liveDrawPoints.length > 1) {
      const d = liveDrawPoints.reduce((acc, pt, i) =>
        i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`, '');
      return (
        <path
          d={d}
          stroke={drawColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.7}
        />
      );
    }
    if ((dragState.kind === 'line' || dragState.kind === 'arrow') && liveLineEnd) {
      const angle = Math.atan2(
        liveLineEnd.y - dragState.startY,
        liveLineEnd.x - dragState.startX
      );
      const arrowSize = 10;
      return (
        <g>
          <line
            x1={dragState.startX} y1={dragState.startY}
            x2={liveLineEnd.x} y2={liveLineEnd.y}
            stroke={drawColor}
            strokeWidth={strokeWidth}
            strokeDasharray="6 3"
            opacity={0.7}
          />
          {dragState.kind === 'arrow' && (
            <polygon
              points={`
                ${liveLineEnd.x},${liveLineEnd.y}
                ${liveLineEnd.x - arrowSize * Math.cos(angle - Math.PI / 6)},${liveLineEnd.y - arrowSize * Math.sin(angle - Math.PI / 6)}
                ${liveLineEnd.x - arrowSize * Math.cos(angle + Math.PI / 6)},${liveLineEnd.y - arrowSize * Math.sin(angle + Math.PI / 6)}
              `}
              fill={drawColor}
              opacity={0.7}
            />
          )}
        </g>
      );
    }
    return null;
  };

  const renderFreeTransformHandles = (icon: CanvasIcon) => {
    const w = icon.width ?? 56;
    const h = icon.height ?? 56;
    const handles = [
      { key: 'nw', cx: icon.x, cy: icon.y },
      { key: 'ne', cx: icon.x + w, cy: icon.y },
      { key: 'se', cx: icon.x + w, cy: icon.y + h },
      { key: 'sw', cx: icon.x, cy: icon.y + h },
    ];
    const rotateHandleX = icon.x + w / 2;
    const rotateHandleY = icon.y - 20;

    return (
      <g key={`ft-${icon.id}`}>
        <rect
          x={icon.x} y={icon.y}
          width={w} height={h}
          fill="none"
          stroke="oklch(0.55 0.25 250)"
          strokeWidth={1.5}
          strokeDasharray="4 2"
        />
        {handles.map(h => (
          <rect
            key={h.key}
            x={h.cx - 5} y={h.cy - 5}
            width={10} height={10}
            fill="white"
            stroke="oklch(0.55 0.25 250)"
            strokeWidth={1.5}
            style={{ cursor: `${h.key}-resize`, pointerEvents: 'all' }}
            onMouseDown={(e) => {
              e.stopPropagation();
              setDragState({
                kind: 'freeTransformResize',
                id: icon.id,
                handle: h.key,
                startX: e.clientX - (canvasRef.current?.getBoundingClientRect().left ?? 0),
                startY: e.clientY - (canvasRef.current?.getBoundingClientRect().top ?? 0),
                origWidth: icon.width ?? 56,
                origHeight: icon.height ?? 56,
                origX: icon.x,
                origY: icon.y,
              });
            }}
          />
        ))}
        {/* Rotate handle */}
        <line
          x1={rotateHandleX} y1={icon.y}
          x2={rotateHandleX} y2={rotateHandleY}
          stroke="oklch(0.55 0.25 250)"
          strokeWidth={1.5}
        />
        <circle
          cx={rotateHandleX} cy={rotateHandleY}
          r={6}
          fill="white"
          stroke="oklch(0.55 0.25 250)"
          strokeWidth={1.5}
          style={{ cursor: 'grab', pointerEvents: 'all' }}
          onMouseDown={(e) => {
            e.stopPropagation();
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;
            const cx = icon.x + (icon.width ?? 56) / 2;
            const cy = icon.y + (icon.height ?? 56) / 2;
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const startAngle = Math.atan2(mouseY - cy, mouseX - cx) * (180 / Math.PI) + 90;
            setDragState({
              kind: 'freeTransformRotate',
              id: icon.id,
              centerX: cx,
              centerY: cy,
              startAngle,
              origRotation: icon.rotation ?? 0,
            });
          }}
        />
      </g>
    );
  };

  const getIconCenter = (icon: CanvasIcon) => ({
    x: icon.x + (icon.width ?? 56) / 2,
    y: icon.y + (icon.height ?? 56) / 2,
  });

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full overflow-hidden bg-background select-none"
      style={{
        cursor:
          activeTool === 'draw' || activeTool === 'eraser'
            ? 'crosshair'
            : activeTool === 'text'
            ? 'text'
            : 'default',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* ── LAYER 0: Uploaded background images (bottom-most, always below everything) ── */}
      {images.map(img => {
        const url = imageUrls[img.id];
        const isSelected = selectedElements.images.has(img.id);
        return (
          <div
            key={img.id}
            className="absolute"
            style={{
              left: img.x,
              top: img.y,
              width: img.width,
              height: img.height,
              zIndex: 0,
              outline: isSelected ? '2px solid oklch(0.55 0.25 250)' : 'none',
              outlineOffset: 2,
            }}
          >
            {url && (
              <img
                src={url}
                alt={img.name}
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                draggable={false}
              />
            )}
          </div>
        );
      })}

      {/* ── LAYER 1: Connections SVG (above images, below drawings and icons) ── */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 1 }}
      >
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="oklch(0.65 0.18 150)" />
          </marker>
        </defs>
        {connections.map(conn => {
          const srcIcon = icons.find(i => i.id === conn.sourceId);
          const tgtIcon = icons.find(i => i.id === conn.targetId);
          if (!srcIcon || !tgtIcon) return null;
          const src = getIconCenter(srcIcon);
          const tgt = getIconCenter(tgtIcon);
          return (
            <AttackPathConnector
              key={conn.id}
              id={conn.id}
              sourceX={src.x}
              sourceY={src.y}
              targetX={tgt.x}
              targetY={tgt.y}
              rotation={conn.rotation ?? 0}
              isSelected={selectedElements.icons.size === 0 && false}
              onClick={(id) => {
                onRemoveConnection(id);
              }}
            />
          );
        })}
      </svg>

      {/* ── LAYER 2: Freehand drawings SVG (above connections and images) ── */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 2 }}
      >
        {renderDrawings()}
        {renderLiveDrawing()}
      </svg>

      {/* ── LAYER 3: Icons (icon images only, above drawings and images) ── */}
      {icons.map(icon => {
        const w = icon.width ?? 56;
        const h = icon.height ?? 56;
        const isSelected = selectedElements.icons.has(icon.id);
        return (
          <div
            key={icon.id}
            className="absolute"
            style={{
              left: icon.x,
              top: icon.y,
              width: w,
              height: h,
              zIndex: 3,
              transform: icon.rotation ? `rotate(${icon.rotation}deg)` : undefined,
              transformOrigin: 'center center',
              outline: isSelected ? '2px solid oklch(0.55 0.25 250)' : 'none',
              outlineOffset: 2,
              cursor: activeTool === 'select' ? 'grab' : 'default',
            }}
          >
            <AttackPathIcon
              type={icon.type}
              size={Math.min(w, h)}
            />
          </div>
        );
      })}

      {/* ── LAYER 4: Text labels (fixed at labelX/labelY, vertically centered, never move on icon drag) ── */}
      {icons.map(icon => {
        // Use labelX/labelY if set (fixed drop position), otherwise fall back to icon center
        const lx = icon.labelX ?? (icon.x + (icon.width ?? 56) / 2);
        const ly = icon.labelY ?? (icon.y + (icon.height ?? 56) + 10);
        return (
          <div
            key={`label-${icon.id}`}
            className="absolute pointer-events-none"
            style={{
              left: lx,
              top: ly,
              zIndex: 4,
              // Vertically center the label text relative to its anchor point
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: '#e2e8f0',
                fontWeight: 500,
                textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                background: 'rgba(15,23,42,0.65)',
                borderRadius: 3,
                padding: '1px 5px',
                lineHeight: 1.4,
              }}
            >
              {icon.name}
            </span>
          </div>
        );
      })}

      {/* Standalone text labels (layer 4) */}
      {textLabels.map(label => {
        const isSelected = selectedElements.textLabels.has(label.id);
        return (
          <div
            key={label.id}
            className="absolute"
            style={{
              left: label.x,
              top: label.y,
              zIndex: 4,
              fontSize: label.fontSize,
              color: label.color,
              fontWeight: 500,
              cursor: activeTool === 'select' ? 'grab' : 'default',
              outline: isSelected ? '1px dashed oklch(0.55 0.25 250)' : 'none',
              userSelect: 'none',
              // Vertically center the text relative to its position
              transform: 'translateY(-50%)',
            }}
          >
            {label.text}
          </div>
        );
      })}

      {/* ── LAYER 5: Free transform handles SVG (topmost) ── */}
      {activeTool === 'freeTransform' && (
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ zIndex: 5, pointerEvents: 'none' }}
        >
          {icons
            .filter(icon => freeTransformId === icon.id || selectedElements.icons.has(icon.id))
            .map(icon => renderFreeTransformHandles(icon))}
        </svg>
      )}

      {/* Selection rectangle */}
      {dragState.kind === 'select' && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 6 }}
        >
          <rect
            x={Math.min(dragState.startX, dragState.currentX)}
            y={Math.min(dragState.startY, dragState.currentY)}
            width={Math.abs(dragState.currentX - dragState.startX)}
            height={Math.abs(dragState.currentY - dragState.startY)}
            fill="oklch(0.55 0.25 250 / 0.1)"
            stroke="oklch(0.55 0.25 250)"
            strokeWidth={1}
            strokeDasharray="4 2"
          />
        </svg>
      )}

      {/* Connect mode indicator */}
      {activeTool === 'connect' && connectingFrom && (
        <div
          className="absolute top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full pointer-events-none"
          style={{ zIndex: 10 }}
        >
          Click target icon to connect
        </div>
      )}
    </div>
  );
}
