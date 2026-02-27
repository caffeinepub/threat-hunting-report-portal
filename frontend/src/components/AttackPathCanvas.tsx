import React, { useRef, useState, useCallback, useEffect } from 'react';
import AttackPathIcon, { IconType } from './AttackPathIcon';
import AttackPathConnector from './AttackPathConnector';
import {
  PlacedIcon,
  TextLabel,
  ImageElement,
  Position,
} from '../hooks/useAttackPathState';

export type ToolType =
  | 'select'
  | 'connect'
  | 'pen'
  | 'freehand'
  | 'line'
  | 'arrow'
  | 'text'
  | 'eraser'
  | 'freeTransform'
  | 'image';

// ─── Re-export canvas element types ─────────────────────────────────────────
export type CanvasIcon = PlacedIcon;
export type CanvasTextLabel = TextLabel;
export type CanvasImage = ImageElement;

export interface CanvasConnection {
  id: string;
  sourceId: string;
  targetId: string;
  connectionType: string;
  color: string;
}

export interface CanvasFreehandDrawing {
  points: Position[];
  color: string;
  strokeWidth: number;
}

export interface CanvasLine {
  startPosition: Position;
  endPosition: Position;
  color: string;
  strokeWidth: number;
  isArrow: boolean;
}

interface AttackPathCanvasProps {
  activeTool: ToolType;
  drawColor?: string;
  strokeWidth?: number;
  icons: CanvasIcon[];
  connections: CanvasConnection[];
  freehandDrawings: CanvasFreehandDrawing[];
  textLabels: CanvasTextLabel[];
  images: CanvasImage[];
  lines: CanvasLine[];
  onAddIcon: (iconType: IconType, position: Position) => void;
  onUpdateIconPosition: (id: string, position: Position) => void;
  onUpdateIconPositionImmediate: (id: string, position: Position) => void;
  onUpdateIconRotation: (id: string, rotation: number) => void;
  onUpdateIconRotationImmediate: (id: string, rotation: number) => void;
  onUpdateIconSize: (id: string, size: number) => void;
  onUpdateIconSizeImmediate: (id: string, size: number) => void;
  onDeleteIcon: (id: string) => void;
  onAddConnection: (sourceId: string, targetId: string, color?: string) => void;
  onDeleteConnection: (id: string) => void;
  onAddFreehandDrawing: (drawing: CanvasFreehandDrawing) => void;
  onAddLine: (line: CanvasLine) => void;
  onAddTextLabel: (content: string, position: Position) => void;
  onUpdateTextLabel: (id: string, updates: Partial<CanvasTextLabel>) => void;
  onUpdateTextLabelImmediate: (id: string, updates: Partial<CanvasTextLabel>) => void;
  onDeleteTextLabel: (id: string) => void;
  onAddImage: (url: string, position: Position, name?: string) => void;
  onUpdateImage: (id: string, updates: Partial<CanvasImage>) => void;
  onUpdateImageImmediate: (id: string, updates: Partial<CanvasImage>) => void;
  onDeleteImage: (id: string) => void;
}

type HandlePosition = 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se';

interface ResizeState {
  elementId: string;
  elementType: 'text' | 'image';
  handle: HandlePosition;
  startMouseX: number;
  startMouseY: number;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
}

interface RotateState {
  elementId: string;
  elementType: 'text' | 'image' | 'icon';
  centerX: number;
  centerY: number;
  startAngle: number;
  initialRotation: number;
}

const HANDLE_SIZE = 8;
const ROTATION_HANDLE_OFFSET = 28;

function getHandlePositions(x: number, y: number, w: number, h: number) {
  return {
    nw: { cx: x,         cy: y },
    n:  { cx: x + w / 2, cy: y },
    ne: { cx: x + w,     cy: y },
    w:  { cx: x,         cy: y + h / 2 },
    e:  { cx: x + w,     cy: y + h / 2 },
    sw: { cx: x,         cy: y + h },
    s:  { cx: x + w / 2, cy: y + h },
    se: { cx: x + w,     cy: y + h },
  };
}

function getCursorForHandle(handle: HandlePosition): string {
  const map: Record<HandlePosition, string> = {
    nw: 'nw-resize', n: 'n-resize', ne: 'ne-resize',
    w: 'w-resize', e: 'e-resize',
    sw: 'sw-resize', s: 's-resize', se: 'se-resize',
  };
  return map[handle];
}

export default function AttackPathCanvas({
  activeTool,
  drawColor = '#ef4444',
  strokeWidth = 2,
  icons,
  connections,
  freehandDrawings,
  textLabels,
  images,
  lines,
  onAddIcon,
  onUpdateIconPosition,
  onUpdateIconPositionImmediate,
  onUpdateIconRotation,
  onUpdateIconRotationImmediate,
  onUpdateIconSize,
  onUpdateIconSizeImmediate,
  onDeleteIcon,
  onAddConnection,
  onDeleteConnection,
  onAddFreehandDrawing,
  onAddLine,
  onAddTextLabel,
  onUpdateTextLabel,
  onUpdateTextLabelImmediate,
  onDeleteTextLabel,
  onAddImage,
  onUpdateImage,
  onUpdateImageImmediate,
  onDeleteImage,
}: AttackPathCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Selection
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);
  const [selectedConnId, setSelectedConnId] = useState<string | null>(null);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  // Dragging icons
  const [draggingIconId, setDraggingIconId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });

  // Dragging text labels
  const [draggingTextId, setDraggingTextId] = useState<string | null>(null);
  const [textDragOffset, setTextDragOffset] = useState<Position>({ x: 0, y: 0 });

  // Dragging images
  const [draggingImageId, setDraggingImageId] = useState<string | null>(null);
  const [imageDragOffset, setImageDragOffset] = useState<Position>({ x: 0, y: 0 });

  // Resizing
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);

  // Rotating
  const [rotateState, setRotateState] = useState<RotateState | null>(null);

  // Connecting
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);

  // Freehand drawing
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Position[]>([]);

  // Line/arrow drawing
  const [lineStart, setLineStart] = useState<Position | null>(null);
  const [linePreview, setLinePreview] = useState<Position | null>(null);

  // Text editing
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // Icon resize (free transform)
  const [iconResizeState, setIconResizeState] = useState<{
    id: string;
    startSize: number;
    startMouseX: number;
    startMouseY: number;
  } | null>(null);

  const getSVGPoint = useCallback((e: React.MouseEvent): Position => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIconId(null);
    setSelectedConnId(null);
    setSelectedTextId(null);
    setSelectedImageId(null);
  }, []);

  // ─── Drop handler for dragging icons from toolbar ──────────────────────────
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const iconType = e.dataTransfer.getData('iconType') as IconType;
    if (!iconType) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const position: Position = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    onAddIcon(iconType, position);
  }, [onAddIcon]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  // ─── Mouse Down ────────────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (e.target !== svgRef.current) return;
    const pt = getSVGPoint(e);

    if (activeTool === 'pen' || activeTool === 'freehand') {
      setIsDrawing(true);
      setCurrentPath([pt]);
      return;
    }
    if (activeTool === 'line' || activeTool === 'arrow') {
      setLineStart(pt);
      setLinePreview(pt);
      return;
    }
    if (activeTool === 'text') {
      onAddTextLabel('Text', pt);
      return;
    }
    if (activeTool === 'select' || activeTool === 'freeTransform') {
      clearSelection();
    }
  }, [activeTool, getSVGPoint, onAddTextLabel, clearSelection]);

  // ─── Mouse Move ────────────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const pt = getSVGPoint(e);

    if (isDrawing && (activeTool === 'pen' || activeTool === 'freehand')) {
      setCurrentPath(prev => [...prev, pt]);
      return;
    }

    if (lineStart && (activeTool === 'line' || activeTool === 'arrow')) {
      setLinePreview(pt);
      return;
    }

    if (draggingIconId) {
      onUpdateIconPositionImmediate(draggingIconId, {
        x: pt.x - dragOffset.x,
        y: pt.y - dragOffset.y,
      });
      return;
    }

    if (draggingTextId) {
      onUpdateTextLabelImmediate(draggingTextId, {
        position: { x: pt.x - textDragOffset.x, y: pt.y - textDragOffset.y },
      });
      return;
    }

    if (draggingImageId) {
      onUpdateImageImmediate(draggingImageId, {
        position: { x: pt.x - imageDragOffset.x, y: pt.y - imageDragOffset.y },
      });
      return;
    }

    if (resizeState) {
      const dx = pt.x - resizeState.startMouseX;
      const dy = pt.y - resizeState.startMouseY;
      const { handle, startX, startY, startWidth, startHeight } = resizeState;

      let newX = startX;
      let newY = startY;
      let newW = startWidth;
      let newH = startHeight;

      if (handle.includes('e')) newW = Math.max(40, startWidth + dx);
      if (handle.includes('s')) newH = Math.max(20, startHeight + dy);
      if (handle.includes('w')) {
        newW = Math.max(40, startWidth - dx);
        newX = startX + startWidth - newW;
      }
      if (handle.includes('n')) {
        newH = Math.max(20, startHeight - dy);
        newY = startY + startHeight - newH;
      }

      if (resizeState.elementType === 'text') {
        onUpdateTextLabelImmediate(resizeState.elementId, {
          position: { x: newX, y: newY },
          width: newW,
          height: newH,
        });
      } else {
        onUpdateImageImmediate(resizeState.elementId, {
          position: { x: newX, y: newY },
          width: newW,
          height: newH,
        });
      }
      return;
    }

    if (rotateState) {
      const angle = Math.atan2(
        pt.y - rotateState.centerY,
        pt.x - rotateState.centerX
      );
      const angleDeg = (angle * 180) / Math.PI;
      const newRotation = rotateState.initialRotation + (angleDeg - rotateState.startAngle);

      if (rotateState.elementType === 'text') {
        onUpdateTextLabelImmediate(rotateState.elementId, { rotation: newRotation });
      } else if (rotateState.elementType === 'image') {
        onUpdateImageImmediate(rotateState.elementId, { rotation: newRotation });
      } else if (rotateState.elementType === 'icon') {
        onUpdateIconRotationImmediate(rotateState.elementId, newRotation);
      }
      return;
    }

    if (iconResizeState) {
      const dx = pt.x - iconResizeState.startMouseX;
      const newSize = Math.max(24, iconResizeState.startSize + dx);
      onUpdateIconSizeImmediate(iconResizeState.id, newSize);
      return;
    }
  }, [
    isDrawing, activeTool, lineStart,
    draggingIconId, dragOffset,
    draggingTextId, textDragOffset,
    draggingImageId, imageDragOffset,
    resizeState, rotateState, iconResizeState,
    getSVGPoint,
    onUpdateIconPositionImmediate, onUpdateIconRotationImmediate, onUpdateIconSizeImmediate,
    onUpdateTextLabelImmediate, onUpdateImageImmediate,
  ]);

  // ─── Mouse Up ──────────────────────────────────────────────────────────────
  const handleMouseUp = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const pt = getSVGPoint(e);

    if (isDrawing && (activeTool === 'pen' || activeTool === 'freehand') && currentPath.length > 1) {
      onAddFreehandDrawing({ points: currentPath, color: drawColor, strokeWidth });
      setIsDrawing(false);
      setCurrentPath([]);
      return;
    }
    setIsDrawing(false);
    setCurrentPath([]);

    if (lineStart && (activeTool === 'line' || activeTool === 'arrow')) {
      onAddLine({
        startPosition: lineStart,
        endPosition: pt,
        color: drawColor,
        strokeWidth,
        isArrow: activeTool === 'arrow',
      });
      setLineStart(null);
      setLinePreview(null);
      return;
    }

    if (draggingIconId) {
      const icon = icons.find(i => i.id === draggingIconId);
      if (icon) onUpdateIconPosition(draggingIconId, icon.position);
      setDraggingIconId(null);
    }

    if (draggingTextId) {
      const label = textLabels.find(l => l.id === draggingTextId);
      if (label) onUpdateTextLabel(draggingTextId, { position: label.position });
      setDraggingTextId(null);
    }

    if (draggingImageId) {
      const img = images.find(i => i.id === draggingImageId);
      if (img) onUpdateImage(draggingImageId, { position: img.position });
      setDraggingImageId(null);
    }

    if (resizeState) {
      if (resizeState.elementType === 'text') {
        const label = textLabels.find(l => l.id === resizeState.elementId);
        if (label) onUpdateTextLabel(resizeState.elementId, { position: label.position, width: label.width, height: label.height });
      } else {
        const img = images.find(i => i.id === resizeState.elementId);
        if (img) onUpdateImage(resizeState.elementId, { position: img.position, width: img.width, height: img.height });
      }
      setResizeState(null);
    }

    if (rotateState) {
      if (rotateState.elementType === 'text') {
        const label = textLabels.find(l => l.id === rotateState.elementId);
        if (label) onUpdateTextLabel(rotateState.elementId, { rotation: label.rotation });
      } else if (rotateState.elementType === 'image') {
        const img = images.find(i => i.id === rotateState.elementId);
        if (img) onUpdateImage(rotateState.elementId, { rotation: img.rotation });
      } else if (rotateState.elementType === 'icon') {
        const icon = icons.find(i => i.id === rotateState.elementId);
        if (icon) onUpdateIconRotation(rotateState.elementId, icon.rotation);
      }
      setRotateState(null);
    }

    if (iconResizeState) {
      const icon = icons.find(i => i.id === iconResizeState.id);
      if (icon) onUpdateIconSize(iconResizeState.id, icon.size);
      setIconResizeState(null);
    }
  }, [
    isDrawing, activeTool, currentPath, lineStart,
    draggingIconId, draggingTextId, draggingImageId,
    resizeState, rotateState, iconResizeState,
    icons, textLabels, images,
    getSVGPoint,
    onAddFreehandDrawing, onAddLine,
    onUpdateIconPosition, onUpdateIconRotation, onUpdateIconSize,
    onUpdateTextLabel, onUpdateImage,
    drawColor, strokeWidth,
  ]);

  // ─── Icon interaction ──────────────────────────────────────────────────────
  const handleIconMouseDown = useCallback((e: React.MouseEvent, icon: CanvasIcon) => {
    e.stopPropagation();
    const pt = getSVGPoint(e);

    if (activeTool === 'eraser') {
      onDeleteIcon(icon.id);
      return;
    }
    if (activeTool === 'connect') {
      if (!connectingFrom) {
        setConnectingFrom(icon.id);
      } else if (connectingFrom !== icon.id) {
        onAddConnection(connectingFrom, icon.id, drawColor);
        setConnectingFrom(null);
      }
      return;
    }
    if (activeTool === 'select' || activeTool === 'freeTransform') {
      clearSelection();
      setSelectedIconId(icon.id);
      setDraggingIconId(icon.id);
      setDragOffset({ x: pt.x - icon.position.x, y: pt.y - icon.position.y });
    }
  }, [activeTool, connectingFrom, getSVGPoint, onDeleteIcon, onAddConnection, clearSelection, drawColor]);

  // ─── Text label interaction ────────────────────────────────────────────────
  const handleTextMouseDown = useCallback((e: React.MouseEvent, label: CanvasTextLabel) => {
    e.stopPropagation();
    const pt = getSVGPoint(e);

    if (activeTool === 'eraser') {
      onDeleteTextLabel(label.id);
      return;
    }
    if (activeTool === 'select' || activeTool === 'freeTransform') {
      clearSelection();
      setSelectedTextId(label.id);
      setDraggingTextId(label.id);
      setTextDragOffset({ x: pt.x - label.position.x, y: pt.y - label.position.y });
    }
  }, [activeTool, getSVGPoint, onDeleteTextLabel, clearSelection]);

  const handleTextDoubleClick = useCallback((e: React.MouseEvent, label: CanvasTextLabel) => {
    e.stopPropagation();
    setEditingTextId(label.id);
  }, []);

  // ─── Image interaction ─────────────────────────────────────────────────────
  const handleImageMouseDown = useCallback((e: React.MouseEvent, img: CanvasImage) => {
    e.stopPropagation();
    const pt = getSVGPoint(e);

    if (activeTool === 'eraser') {
      onDeleteImage(img.id);
      return;
    }
    if (activeTool === 'select' || activeTool === 'freeTransform') {
      clearSelection();
      setSelectedImageId(img.id);
      setDraggingImageId(img.id);
      setImageDragOffset({ x: pt.x - img.position.x, y: pt.y - img.position.y });
    }
  }, [activeTool, getSVGPoint, onDeleteImage, clearSelection]);

  // ─── Resize handle mouse down ──────────────────────────────────────────────
  const handleResizeMouseDown = useCallback((
    e: React.MouseEvent,
    elementId: string,
    elementType: 'text' | 'image',
    handle: HandlePosition,
    elementX: number,
    elementY: number,
    elementW: number,
    elementH: number,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const pt = getSVGPoint(e);
    setDraggingTextId(null);
    setDraggingImageId(null);
    setResizeState({
      elementId,
      elementType,
      handle,
      startMouseX: pt.x,
      startMouseY: pt.y,
      startX: elementX,
      startY: elementY,
      startWidth: elementW,
      startHeight: elementH,
    });
  }, [getSVGPoint]);

  // ─── Rotation handle mouse down ────────────────────────────────────────────
  const handleRotateMouseDown = useCallback((
    e: React.MouseEvent,
    elementId: string,
    elementType: 'text' | 'image' | 'icon',
    centerX: number,
    centerY: number,
    currentRotation: number,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const pt = getSVGPoint(e);
    const startAngle = (Math.atan2(pt.y - centerY, pt.x - centerX) * 180) / Math.PI;
    setDraggingTextId(null);
    setDraggingImageId(null);
    setDraggingIconId(null);
    setRotateState({
      elementId,
      elementType,
      centerX,
      centerY,
      startAngle,
      initialRotation: currentRotation,
    });
  }, [getSVGPoint]);

  // ─── Connector interaction ─────────────────────────────────────────────────
  const handleConnectorClick = useCallback((id: string) => {
    if (activeTool === 'eraser') {
      onDeleteConnection(id);
      return;
    }
    if (activeTool === 'select' || activeTool === 'freeTransform') {
      clearSelection();
      setSelectedConnId(id);
    }
  }, [activeTool, onDeleteConnection, clearSelection]);

  // ─── Keyboard delete ───────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (editingTextId) return;
        if (selectedIconId) { onDeleteIcon(selectedIconId); setSelectedIconId(null); }
        if (selectedConnId) { onDeleteConnection(selectedConnId); setSelectedConnId(null); }
        if (selectedTextId) { onDeleteTextLabel(selectedTextId); setSelectedTextId(null); }
        if (selectedImageId) { onDeleteImage(selectedImageId); setSelectedImageId(null); }
      }
      if (e.key === 'Escape') {
        clearSelection();
        setEditingTextId(null);
        setConnectingFrom(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIconId, selectedConnId, selectedTextId, selectedImageId, editingTextId,
    onDeleteIcon, onDeleteConnection, onDeleteTextLabel, onDeleteImage, clearSelection]);

  // ─── Render resize handles (8 handles) ────────────────────────────────────
  const renderResizeHandles = (
    elementId: string,
    elementType: 'text' | 'image',
    x: number, y: number, w: number, h: number,
    rotation: number,
  ) => {
    const handles = getHandlePositions(x, y, w, h);
    const cx = x + w / 2;
    const cy = y + h / 2;

    return (
      <g transform={`rotate(${rotation}, ${cx}, ${cy})`}>
        <rect
          x={x} y={y} width={w} height={h}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          pointerEvents="none"
        />
        {(Object.entries(handles) as [HandlePosition, { cx: number; cy: number }][]).map(([pos, { cx: hx, cy: hy }]) => (
          <rect
            key={pos}
            x={hx - HANDLE_SIZE / 2}
            y={hy - HANDLE_SIZE / 2}
            width={HANDLE_SIZE}
            height={HANDLE_SIZE}
            fill="white"
            stroke="#3b82f6"
            strokeWidth={1.5}
            rx={1}
            style={{ cursor: getCursorForHandle(pos) }}
            onMouseDown={(e) => handleResizeMouseDown(e, elementId, elementType, pos, x, y, w, h)}
          />
        ))}
      </g>
    );
  };

  // ─── Render rotation handle ────────────────────────────────────────────────
  const renderRotationHandle = (
    elementId: string,
    elementType: 'text' | 'image' | 'icon',
    x: number, y: number, w: number, h: number,
    rotation: number,
  ) => {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const handleX = cx;
    const handleY = y - ROTATION_HANDLE_OFFSET;

    return (
      <g transform={`rotate(${rotation}, ${cx}, ${cy})`}>
        <line
          x1={cx} y1={y}
          x2={handleX} y2={handleY}
          stroke="#3b82f6"
          strokeWidth={1.5}
          pointerEvents="none"
        />
        <circle
          cx={handleX}
          cy={handleY}
          r={6}
          fill="white"
          stroke="#3b82f6"
          strokeWidth={1.5}
          style={{ cursor: 'grab' }}
          onMouseDown={(e) => handleRotateMouseDown(e, elementId, elementType, cx, cy, rotation)}
        />
        <text
          x={handleX}
          y={handleY + 4}
          textAnchor="middle"
          fontSize={8}
          fill="#3b82f6"
          pointerEvents="none"
          style={{ userSelect: 'none' }}
        >
          ↻
        </text>
      </g>
    );
  };

  // ─── Cursor ────────────────────────────────────────────────────────────────
  const getCursor = () => {
    if (activeTool === 'pen' || activeTool === 'freehand') return 'crosshair';
    if (activeTool === 'line' || activeTool === 'arrow') return 'crosshair';
    if (activeTool === 'text') return 'text';
    if (activeTool === 'eraser') return 'cell';
    if (activeTool === 'connect') return 'pointer';
    return 'default';
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-white overflow-hidden"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ cursor: getCursor() }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Freehand drawings */}
        {freehandDrawings.map((drawing, idx) => (
          <polyline
            key={idx}
            points={drawing.points.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={drawing.color}
            strokeWidth={drawing.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* Current freehand path preview */}
        {isDrawing && currentPath.length > 1 && (
          <polyline
            points={currentPath.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={drawColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Lines */}
        {lines.map((line, idx) => (
          <g key={idx}>
            <line
              x1={line.startPosition.x} y1={line.startPosition.y}
              x2={line.endPosition.x} y2={line.endPosition.y}
              stroke={line.color}
              strokeWidth={line.strokeWidth}
              strokeLinecap="round"
            />
            {line.isArrow && (() => {
              const dx = line.endPosition.x - line.startPosition.x;
              const dy = line.endPosition.y - line.startPosition.y;
              const angle = Math.atan2(dy, dx) * 180 / Math.PI;
              return (
                <polygon
                  points="-8,-4 0,0 -8,4"
                  fill={line.color}
                  transform={`translate(${line.endPosition.x},${line.endPosition.y}) rotate(${angle})`}
                />
              );
            })()}
          </g>
        ))}

        {/* Line preview */}
        {lineStart && linePreview && (
          <line
            x1={lineStart.x} y1={lineStart.y}
            x2={linePreview.x} y2={linePreview.y}
            stroke={drawColor}
            strokeWidth={strokeWidth}
            strokeDasharray="5 3"
            strokeLinecap="round"
          />
        )}

        {/* Connectors */}
        {connections.map(conn => {
          const source = icons.find(i => i.id === conn.sourceId);
          const target = icons.find(i => i.id === conn.targetId);
          if (!source || !target) return null;
          return (
            <AttackPathConnector
              key={conn.id}
              id={conn.id}
              sourceX={source.position.x}
              sourceY={source.position.y}
              targetX={target.position.x}
              targetY={target.position.y}
              onClick={handleConnectorClick}
            />
          );
        })}

        {/* Images */}
        {images.map(img => {
          const isSelected = selectedImageId === img.id;
          const cx = img.position.x + img.width / 2;
          const cy = img.position.y + img.height / 2;
          const rotation = img.rotation ?? 0;

          return (
            <g key={img.id}>
              <g transform={`rotate(${rotation}, ${cx}, ${cy})`}>
                <image
                  href={img.url}
                  x={img.position.x}
                  y={img.position.y}
                  width={img.width}
                  height={img.height}
                  preserveAspectRatio="xMidYMid meet"
                  style={{ cursor: activeTool === 'eraser' ? 'cell' : 'move' }}
                  onMouseDown={(e) => handleImageMouseDown(e, img)}
                />
              </g>
              {isSelected && renderResizeHandles(
                img.id, 'image',
                img.position.x, img.position.y, img.width, img.height,
                rotation,
              )}
              {isSelected && activeTool === 'freeTransform' && renderRotationHandle(
                img.id, 'image',
                img.position.x, img.position.y, img.width, img.height,
                rotation,
              )}
            </g>
          );
        })}

        {/* Icons */}
        {icons.map(icon => {
          const isSelected = selectedIconId === icon.id;
          const halfSize = icon.size / 2;
          const cx = icon.position.x;
          const cy = icon.position.y;
          const rotation = icon.rotation ?? 0;

          return (
            <g key={icon.id}>
              <g
                transform={`rotate(${rotation}, ${cx}, ${cy})`}
                style={{ cursor: activeTool === 'eraser' ? 'cell' : 'move' }}
                onMouseDown={(e) => handleIconMouseDown(e, icon)}
              >
                {isSelected && (
                  <rect
                    x={cx - halfSize - 4}
                    y={cy - halfSize - 4}
                    width={icon.size + 8}
                    height={icon.size + 8}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    rx={4}
                    pointerEvents="none"
                  />
                )}
                <foreignObject
                  x={cx - halfSize}
                  y={cy - halfSize}
                  width={icon.size}
                  height={icon.size}
                  style={{ pointerEvents: 'none' }}
                >
                  <div
                    style={{
                      width: icon.size,
                      height: icon.size,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AttackPathIcon type={icon.iconType} size={icon.size} />
                  </div>
                </foreignObject>
              </g>

              {/* Icon handles (free transform) */}
              {isSelected && activeTool === 'freeTransform' && (
                <>
                  {renderRotationHandle(
                    icon.id, 'icon',
                    cx - halfSize, cy - halfSize, icon.size, icon.size,
                    rotation,
                  )}
                  {/* SE resize handle for icons */}
                  <rect
                    x={cx + halfSize - 6}
                    y={cy + halfSize - 6}
                    width={12}
                    height={12}
                    fill="white"
                    stroke="#3b82f6"
                    strokeWidth={1.5}
                    rx={2}
                    style={{ cursor: 'se-resize' }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      const pt = getSVGPoint(e);
                      setIconResizeState({
                        id: icon.id,
                        startSize: icon.size,
                        startMouseX: pt.x,
                        startMouseY: pt.y,
                      });
                    }}
                  />
                </>
              )}
            </g>
          );
        })}

        {/* Text Labels */}
        {textLabels.map(label => {
          const isSelected = selectedTextId === label.id;
          const isEditing = editingTextId === label.id;
          const rotation = label.rotation ?? 0;
          const cx = label.position.x + label.width / 2;
          const cy = label.position.y + label.height / 2;

          return (
            <g key={label.id}>
              <g transform={`rotate(${rotation}, ${cx}, ${cy})`}>
                {isEditing ? (
                  <foreignObject
                    x={label.position.x}
                    y={label.position.y}
                    width={label.width}
                    height={label.height}
                  >
                    <textarea
                      autoFocus
                      defaultValue={label.content}
                      style={{
                        width: '100%',
                        height: '100%',
                        fontSize: label.fontSize,
                        color: label.color,
                        fontWeight: label.fontWeight,
                        background: 'rgba(255,255,255,0.95)',
                        border: '1.5px solid #3b82f6',
                        borderRadius: 4,
                        padding: '4px 6px',
                        resize: 'none',
                        outline: 'none',
                        boxSizing: 'border-box',
                        fontFamily: 'inherit',
                        lineHeight: 1.4,
                      }}
                      onBlur={(e) => {
                        onUpdateTextLabel(label.id, { content: e.target.value });
                        setEditingTextId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          onUpdateTextLabel(label.id, { content: (e.target as HTMLTextAreaElement).value });
                          setEditingTextId(null);
                        }
                      }}
                    />
                  </foreignObject>
                ) : (
                  <foreignObject
                    x={label.position.x}
                    y={label.position.y}
                    width={label.width}
                    height={label.height}
                    style={{ cursor: activeTool === 'eraser' ? 'cell' : 'move', overflow: 'visible' }}
                    onMouseDown={(e) => handleTextMouseDown(e, label)}
                    onDoubleClick={(e) => handleTextDoubleClick(e, label)}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        fontSize: label.fontSize,
                        color: label.color,
                        fontWeight: label.fontWeight,
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap',
                        overflow: 'hidden',
                        padding: '4px 6px',
                        boxSizing: 'border-box',
                        lineHeight: 1.4,
                        userSelect: 'none',
                      }}
                    >
                      {label.content}
                    </div>
                  </foreignObject>
                )}
              </g>

              {isSelected && !isEditing && renderResizeHandles(
                label.id, 'text',
                label.position.x, label.position.y, label.width, label.height,
                rotation,
              )}
              {isSelected && !isEditing && activeTool === 'freeTransform' && renderRotationHandle(
                label.id, 'text',
                label.position.x, label.position.y, label.width, label.height,
                rotation,
              )}
            </g>
          );
        })}

        {/* Connecting indicator */}
        {connectingFrom && (
          <text x={10} y={20} fill="#ef4444" fontSize={12} fontWeight="bold">
            Click another icon to connect…
          </text>
        )}
      </svg>
    </div>
  );
}
