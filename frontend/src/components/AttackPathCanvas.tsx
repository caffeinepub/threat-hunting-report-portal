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

const RESIZE_HANDLE_SIZE = 8;

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
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);

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

  const getIconAt = useCallback((x: number, y: number) => {
    return icons.find(icon => {
      const w = icon.width ?? 56;
      const h = icon.height ?? 56;
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
      setSelectedConnectionId(null);
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

  const handleIconMouseDown = useCallback((e: React.MouseEvent, icon: CanvasIcon) => {
    e.preventDefault();
    e.stopPropagation();

    if (activeTool === 'eraser') {
      onRemoveIcon(icon.id);
      return;
    }

    if (activeTool === 'select') {
      if (e.shiftKey) {
        const newIcons = new Set(selectedElements.icons);
        if (newIcons.has(icon.id)) newIcons.delete(icon.id);
        else newIcons.add(icon.id);
        onSetSelectedElements({ ...selectedElements, icons: newIcons });
      } else {
        onSetSelectedElements({ icons: new Set([icon.id]), textLabels: new Set(), images: new Set() });
        const pos = getCanvasPos(e);
        setDragState({ kind: 'icon', id: icon.id, offsetX: pos.x - icon.x, offsetY: pos.y - icon.y });
      }
      return;
    }

    if (activeTool === 'freeTransform') {
      setFreeTransformId(icon.id);
      onSetSelectedElements({ icons: new Set([icon.id]), textLabels: new Set(), images: new Set() });
      return;
    }

    if (activeTool === 'connect') {
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
      return;
    }
  }, [activeTool, selectedElements, onSetSelectedElements, getCanvasPos, onRemoveIcon, connectingFrom, onAddConnection, drawColor]);

  const handleFreeTransformResizeMouseDown = useCallback((e: React.MouseEvent, icon: CanvasIcon, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    const pos = getCanvasPos(e);
    setDragState({
      kind: 'freeTransformResize',
      id: icon.id,
      handle,
      startX: pos.x,
      startY: pos.y,
      origWidth: icon.width ?? 56,
      origHeight: icon.height ?? 56,
      origX: icon.x,
      origY: icon.y,
    });
  }, [getCanvasPos]);

  const handleFreeTransformRotateMouseDown = useCallback((e: React.MouseEvent, icon: CanvasIcon) => {
    e.preventDefault();
    e.stopPropagation();
    const pos = getCanvasPos(e);
    const centerX = icon.x + (icon.width ?? 56) / 2;
    const centerY = icon.y + (icon.height ?? 56) / 2;
    const startAngle = Math.atan2(pos.y - centerY, pos.x - centerX) * (180 / Math.PI) + 90;
    setDragState({
      kind: 'freeTransformRotate',
      id: icon.id,
      centerX,
      centerY,
      startAngle,
      origRotation: icon.rotation ?? 0,
    });
  }, [getCanvasPos]);

  const handleImageMouseDown = useCallback((e: React.MouseEvent, img: CanvasImage) => {
    e.preventDefault();
    e.stopPropagation();

    if (activeTool === 'eraser') {
      onRemoveImage(img.id);
      return;
    }

    if (activeTool === 'select') {
      if (e.shiftKey) {
        const newImages = new Set(selectedElements.images);
        if (newImages.has(img.id)) newImages.delete(img.id);
        else newImages.add(img.id);
        onSetSelectedElements({ ...selectedElements, images: newImages });
      } else {
        onSetSelectedElements({ icons: new Set(), textLabels: new Set(), images: new Set([img.id]) });
        const pos = getCanvasPos(e);
        setDragState({ kind: 'image', id: img.id, offsetX: pos.x - img.x, offsetY: pos.y - img.y });
      }
    }
  }, [activeTool, selectedElements, onSetSelectedElements, getCanvasPos, onRemoveImage]);

  const handleImageResizeMouseDown = useCallback((e: React.MouseEvent, img: CanvasImage) => {
    e.preventDefault();
    e.stopPropagation();
    const pos = getCanvasPos(e);
    setDragState({
      kind: 'freeTransformResize',
      id: img.id,
      handle: 'se',
      startX: pos.x,
      startY: pos.y,
      origWidth: img.width,
      origHeight: img.height,
      origX: img.x,
      origY: img.y,
    });
  }, [getCanvasPos]);

  const handleLabelMouseDown = useCallback((e: React.MouseEvent, label: TextLabel) => {
    e.preventDefault();
    e.stopPropagation();

    if (activeTool === 'eraser') {
      onRemoveTextLabel(label.id);
      return;
    }

    if (activeTool === 'select') {
      if (e.shiftKey) {
        const newLabels = new Set(selectedElements.textLabels);
        if (newLabels.has(label.id)) newLabels.delete(label.id);
        else newLabels.add(label.id);
        onSetSelectedElements({ ...selectedElements, textLabels: newLabels });
      } else {
        onSetSelectedElements({ icons: new Set(), textLabels: new Set([label.id]), images: new Set() });
        const pos = getCanvasPos(e);
        setDragState({ kind: 'textLabel', id: label.id, offsetX: pos.x - label.x, offsetY: pos.y - label.y });
      }
    }
  }, [activeTool, selectedElements, onSetSelectedElements, getCanvasPos, onRemoveTextLabel]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      selectedElements.icons.forEach(id => onRemoveIcon(id));
      selectedElements.textLabels.forEach(id => onRemoveTextLabel(id));
      selectedElements.images.forEach(id => onRemoveImage(id));
      if (selectedConnectionId) {
        onRemoveConnection(selectedConnectionId);
        setSelectedConnectionId(null);
      }
      onSetSelectedElements({ icons: new Set(), textLabels: new Set(), images: new Set() });
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      onUndo();
    }
  }, [selectedElements, selectedConnectionId, onRemoveIcon, onRemoveTextLabel, onRemoveImage, onRemoveConnection, onSetSelectedElements, onUndo]);

  // Cursor style
  const getCursor = () => {
    if (activeTool === 'draw' || activeTool === 'line' || activeTool === 'arrow') return 'crosshair';
    if (activeTool === 'text') return 'text';
    if (activeTool === 'eraser') return 'cell';
    if (activeTool === 'connect') return connectingFrom ? 'cell' : 'crosshair';
    return 'default';
  };

  // Live preview path for freehand drawing
  const liveDrawPath = liveDrawPoints.length > 1
    ? liveDrawPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    : null;

  return (
    <div
      ref={canvasRef}
      tabIndex={0}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        cursor: getCursor(),
        outline: 'none',
        // White background with subtle grid
        backgroundColor: '#ffffff',
        backgroundImage: `
          linear-gradient(rgba(200,200,200,0.25) 1px, transparent 1px),
          linear-gradient(90deg, rgba(200,200,200,0.25) 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onKeyDown={handleKeyDown}
    >
      {/* SVG layer: drawings + connections */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}
      >
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill={drawColor} />
          </marker>
        </defs>

        {/* Saved drawings */}
        {drawings.map(drawing => {
          if (drawing.type === 'freehand') {
            if (drawing.points.length < 2) return null;
            const d = drawing.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
            return (
              <path
                key={drawing.id}
                d={d}
                stroke={drawing.color}
                strokeWidth={drawing.strokeWidth}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ pointerEvents: activeTool === 'eraser' ? 'stroke' : 'none', cursor: 'pointer' }}
                onClick={() => activeTool === 'eraser' && onRemoveDrawing(drawing.id)}
              />
            );
          }
          if (drawing.type === 'line' || drawing.type === 'arrow') {
            const start = drawing.points[0];
            const end = drawing.points[1];
            if (!start || !end) return null;
            const angle = Math.atan2(end.y - start.y, end.x - start.x);
            const arrowSize = 10;
            return (
              <g key={drawing.id} style={{ pointerEvents: activeTool === 'eraser' ? 'stroke' : 'none', cursor: 'pointer' }}
                onClick={() => activeTool === 'eraser' && onRemoveDrawing(drawing.id)}>
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
        })}

        {/* Live freehand preview */}
        {liveDrawPath && (
          <path
            d={liveDrawPath}
            stroke={drawColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ pointerEvents: 'none' }}
          />
        )}

        {/* Live line/arrow preview */}
        {(dragState.kind === 'line' || dragState.kind === 'arrow') && liveLineEnd && (
          <g style={{ pointerEvents: 'none' }}>
            <line
              x1={dragState.startX} y1={dragState.startY}
              x2={liveLineEnd.x} y2={liveLineEnd.y}
              stroke={drawColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray="4 4"
            />
            {dragState.kind === 'arrow' && (() => {
              const angle = Math.atan2(liveLineEnd.y - dragState.startY, liveLineEnd.x - dragState.startX);
              const arrowSize = 10;
              return (
                <polygon
                  points={`
                    ${liveLineEnd.x},${liveLineEnd.y}
                    ${liveLineEnd.x - arrowSize * Math.cos(angle - Math.PI / 6)},${liveLineEnd.y - arrowSize * Math.sin(angle - Math.PI / 6)}
                    ${liveLineEnd.x - arrowSize * Math.cos(angle + Math.PI / 6)},${liveLineEnd.y - arrowSize * Math.sin(angle + Math.PI / 6)}
                  `}
                  fill={drawColor}
                />
              );
            })()}
          </g>
        )}

        {/* Connections */}
        {connections.map(conn => {
          const src = icons.find(i => i.id === conn.sourceId);
          const tgt = icons.find(i => i.id === conn.targetId);
          if (!src || !tgt) return null;
          const srcW = src.width ?? 56;
          const srcH = src.height ?? 56;
          const tgtW = tgt.width ?? 56;
          const tgtH = tgt.height ?? 56;
          return (
            <AttackPathConnector
              key={conn.id}
              id={conn.id}
              sourceX={src.x + srcW / 2}
              sourceY={src.y + srcH / 2}
              targetX={tgt.x + tgtW / 2}
              targetY={tgt.y + tgtH / 2}
              rotation={conn.rotation ?? 0}
              isSelected={selectedConnectionId === conn.id}
              onClick={(id) => {
                setSelectedConnectionId(id);
                onSetSelectedElements({ icons: new Set(), textLabels: new Set(), images: new Set() });
              }}
            />
          );
        })}

        {/* Selection rectangle */}
        {dragState.kind === 'select' && (
          <rect
            x={Math.min(dragState.startX, dragState.currentX)}
            y={Math.min(dragState.startY, dragState.currentY)}
            width={Math.abs(dragState.currentX - dragState.startX)}
            height={Math.abs(dragState.currentY - dragState.startY)}
            fill="rgba(59,130,246,0.08)"
            stroke="rgba(59,130,246,0.6)"
            strokeWidth={1}
            strokeDasharray="4 2"
            style={{ pointerEvents: 'none' }}
          />
        )}
      </svg>

      {/* Icons — image only, no labels */}
      {icons.map(icon => {
        const isSelected = selectedElements.icons.has(icon.id);
        const isFreeTransform = freeTransformId === icon.id && activeTool === 'freeTransform';
        const w = icon.width ?? 56;
        const h = icon.height ?? 56;
        const rotation = icon.rotation ?? 0;
        const isConnectSource = connectingFrom === icon.id;

        return (
          <div
            key={icon.id}
            style={{
              position: 'absolute',
              left: icon.x,
              top: icon.y,
              width: w,
              height: h,
              transform: rotation !== 0 ? `rotate(${rotation}deg)` : undefined,
              transformOrigin: 'center center',
              outline: isSelected
                ? '2px solid #3b82f6'
                : isConnectSource
                ? '2px dashed #f59e0b'
                : 'none',
              borderRadius: 4,
              cursor: activeTool === 'select' ? 'move' : activeTool === 'eraser' ? 'cell' : 'default',
              userSelect: 'none',
              zIndex: isSelected ? 10 : 1,
            }}
            onMouseDown={(e) => handleIconMouseDown(e, icon)}
          >
            {/* Image only — no label prop passed */}
            <div style={{ pointerEvents: 'none', width: '100%', height: '100%' }}>
              <AttackPathIcon
                type={icon.type}
                size={Math.min(w, h)}
              />
            </div>

            {/* Free-transform handles */}
            {isFreeTransform && (
              <>
                {/* Resize handles */}
                {(['nw', 'ne', 'sw', 'se'] as const).map(handle => {
                  const hStyle: React.CSSProperties = {
                    position: 'absolute',
                    width: RESIZE_HANDLE_SIZE,
                    height: RESIZE_HANDLE_SIZE,
                    backgroundColor: '#3b82f6',
                    border: '1px solid white',
                    borderRadius: 1,
                    cursor: `${handle}-resize`,
                    pointerEvents: 'all',
                    zIndex: 20,
                    ...(handle.includes('n') ? { top: -RESIZE_HANDLE_SIZE / 2 } : { bottom: -RESIZE_HANDLE_SIZE / 2 }),
                    ...(handle.includes('w') ? { left: -RESIZE_HANDLE_SIZE / 2 } : { right: -RESIZE_HANDLE_SIZE / 2 }),
                  };
                  return (
                    <div
                      key={handle}
                      style={hStyle}
                      onMouseDown={(e) => handleFreeTransformResizeMouseDown(e, icon, handle)}
                    />
                  );
                })}
                {/* Rotate handle */}
                <div
                  style={{
                    position: 'absolute',
                    top: -24,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 12,
                    height: 12,
                    backgroundColor: '#f59e0b',
                    border: '1px solid white',
                    borderRadius: '50%',
                    cursor: 'grab',
                    pointerEvents: 'all',
                    zIndex: 20,
                  }}
                  onMouseDown={(e) => handleFreeTransformRotateMouseDown(e, icon)}
                />
              </>
            )}

            {/* Select-mode resize handle */}
            {isSelected && activeTool === 'select' && (
              <div
                style={{
                  position: 'absolute',
                  right: -4,
                  bottom: -4,
                  width: 10,
                  height: 10,
                  backgroundColor: '#3b82f6',
                  border: '1px solid white',
                  borderRadius: 2,
                  cursor: 'se-resize',
                  pointerEvents: 'all',
                  zIndex: 20,
                }}
                onMouseDown={(e) => handleFreeTransformResizeMouseDown(e, icon, 'se')}
              />
            )}
          </div>
        );
      })}

      {/* Images */}
      {images.map(img => {
        const isSelected = selectedElements.images.has(img.id);
        const url = imageUrls[img.id];
        return (
          <div
            key={img.id}
            style={{
              position: 'absolute',
              left: img.x,
              top: img.y,
              width: img.width,
              height: img.height,
              outline: isSelected ? '2px solid #3b82f6' : 'none',
              borderRadius: 4,
              cursor: activeTool === 'select' ? 'move' : activeTool === 'eraser' ? 'cell' : 'default',
              userSelect: 'none',
              zIndex: isSelected ? 10 : 1,
            }}
            onMouseDown={(e) => handleImageMouseDown(e, img)}
          >
            {url && (
              <img
                src={url}
                alt={img.name}
                style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', display: 'block' }}
              />
            )}
            {isSelected && activeTool === 'select' && (
              <div
                style={{
                  position: 'absolute',
                  right: -4,
                  bottom: -4,
                  width: 10,
                  height: 10,
                  backgroundColor: '#3b82f6',
                  border: '1px solid white',
                  borderRadius: 2,
                  cursor: 'se-resize',
                  pointerEvents: 'all',
                  zIndex: 20,
                }}
                onMouseDown={(e) => handleImageResizeMouseDown(e, img)}
              />
            )}
          </div>
        );
      })}

      {/* Text Labels */}
      {textLabels.map(label => {
        const isSelected = selectedElements.textLabels.has(label.id);
        return (
          <div
            key={label.id}
            style={{
              position: 'absolute',
              left: label.x,
              top: label.y,
              fontSize: label.fontSize,
              color: label.color,
              cursor: activeTool === 'select' ? 'move' : activeTool === 'eraser' ? 'cell' : 'default',
              userSelect: 'none',
              outline: isSelected ? '1px dashed #3b82f6' : 'none',
              padding: '2px 4px',
              whiteSpace: 'nowrap',
              zIndex: isSelected ? 10 : 1,
            }}
            onMouseDown={(e) => handleLabelMouseDown(e, label)}
          >
            {label.text}
          </div>
        );
      })}

      {/* Connect mode hint */}
      {activeTool === 'connect' && connectingFrom && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(245,158,11,0.92)',
            color: 'white',
            padding: '4px 14px',
            borderRadius: 4,
            fontSize: 12,
            pointerEvents: 'none',
            zIndex: 100,
          }}
        >
          Click another icon to connect
        </div>
      )}
    </div>
  );
}
