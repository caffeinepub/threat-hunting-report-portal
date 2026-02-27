import React, { useRef, useState, useCallback, useEffect } from 'react';
import AttackPathConnector from './AttackPathConnector';
import {
  PlacedIcon,
  TextLabel,
  ImageElement,
  Connection,
  FreehandDrawing,
  LineElement,
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

// Re-export canvas element types
export type CanvasIcon = PlacedIcon;
export type CanvasTextLabel = TextLabel;
export type CanvasImage = ImageElement;
export type CanvasConnection = Connection;
export type CanvasFreehandDrawing = FreehandDrawing;
export type CanvasLine = LineElement;

// Icon image map
const ICON_IMAGE_MAP: Record<string, string> = {
  user: '/assets/generated/user-icon.dim_128x128.png',
  multipleusers: '/assets/multiple users icon.png',
  email: '/assets/email.png',
  attacker: '/assets/attacker.png',
  computer: '/assets/Computer.png',
  multiplecomputers: '/assets/multiple computer.png',
  server: '/assets/server icon.png',
  multipleservers: '/assets/Multiple Server Icon.png',
  domain: '/assets/Domain.png',
  file: '/assets/generated/icon-file.dim_64x64.png',
  exe: '/assets/exe.png',
  dll: '/assets/dll.png',
  script: '/assets/script.png',
  pdf: '/assets/pdf.png',
  ppt: '/assets/ppt.png',
  excel: '/assets/excel.png',
  zip: '/assets/zip.png',
  word: '/assets/word.png',
  c2: '/assets/Command and Control.png',
  backdoor: '/assets/backdoor-1.jpg',
  phishing: '/assets/phishing email icon-2.jpg',
  cloudserver: '/assets/Cloud Server.png',
  firewall: '/assets/Firewall.png',
  router: '/assets/Router Device Icon.jpg',
  scheduledtask: '/assets/Scheduled Task.jpg',
  powershell: '/assets/powershell-2.png',
  javascript: '/assets/script.png',
  webbrowser: '/assets/web browser.png',
};

type HandlePosition = 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se';

interface ResizeState {
  elementId: string;
  elementType: 'text' | 'image' | 'icon';
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
const ERASER_RADIUS = 16;

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

// ── Hit detection helpers ────────────────────────────────────────────────────

function pointNearSegment(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number,
  threshold: number
): boolean {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1) <= threshold;
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy)) <= threshold;
}

function pointInRect(
  px: number, py: number,
  rx: number, ry: number,
  rw: number, rh: number,
  padding = 6
): boolean {
  return (
    px >= rx - padding &&
    px <= rx + rw + padding &&
    py >= ry - padding &&
    py <= ry + rh + padding
  );
}

function pointNearPolyline(
  px: number, py: number,
  points: Position[],
  threshold: number
): boolean {
  for (let i = 0; i < points.length - 1; i++) {
    if (pointNearSegment(px, py, points[i].x, points[i].y, points[i + 1].x, points[i + 1].y, threshold)) {
      return true;
    }
  }
  return false;
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
  onAddIcon: (iconType: string, position: Position) => void;
  onUpdateIconPosition: (id: string, position: Position) => void;
  onUpdateIconPositionImmediate: (id: string, position: Position) => void;
  onUpdateIconRotation: (id: string, rotation: number) => void;
  onUpdateIconRotationImmediate: (id: string, rotation: number) => void;
  onUpdateIconSize: (id: string, width: number, height: number) => void;
  onUpdateIconSizeImmediate: (id: string, width: number, height: number) => void;
  onDeleteIcon: (id: string) => void;
  onAddConnection: (sourceId: string, targetId: string, color?: string) => void;
  onDeleteConnection: (id: string) => void;
  onAddFreehandDrawing: (drawing: CanvasFreehandDrawing) => void;
  onDeleteFreehandDrawing: (index: number) => void;
  onAddLine: (line: CanvasLine) => void;
  onDeleteLine: (index: number) => void;
  onAddTextLabel: (content: string, position: Position) => void;
  onUpdateTextLabel: (id: string, updates: Partial<CanvasTextLabel>) => void;
  onUpdateTextLabelImmediate: (id: string, updates: Partial<CanvasTextLabel>) => void;
  onDeleteTextLabel: (id: string) => void;
  onAddImage: (url: string, position: Position, name?: string) => void;
  onUpdateImage: (id: string, updates: Partial<CanvasImage>) => void;
  onUpdateImageImmediate: (id: string, updates: Partial<CanvasImage>) => void;
  onDeleteImage: (id: string) => void;
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
  onDeleteFreehandDrawing,
  onAddLine,
  onDeleteLine,
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

  // Free transform selection (tracks which element has transform handles)
  const [transformIconId, setTransformIconId] = useState<string | null>(null);
  const [transformTextId, setTransformTextId] = useState<string | null>(null);
  const [transformImageId, setTransformImageId] = useState<string | null>(null);

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

  // Eraser
  const [eraserPos, setEraserPos] = useState<Position | null>(null);
  const [isErasing, setIsErasing] = useState(false);

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
    setTransformIconId(null);
    setTransformTextId(null);
    setTransformImageId(null);
  }, []);

  // Clear transform selection when tool changes away from freeTransform
  useEffect(() => {
    if (activeTool !== 'freeTransform') {
      setTransformIconId(null);
      setTransformTextId(null);
      setTransformImageId(null);
    }
  }, [activeTool]);

  // ── Eraser hit detection — removes any element type ──────────────────────
  const eraseAtPoint = useCallback((pt: Position) => {
    const px = pt.x;
    const py = pt.y;

    // 1. Icons (bounding box centered on position)
    for (let i = icons.length - 1; i >= 0; i--) {
      const icon = icons[i];
      const rx = icon.position.x - icon.width / 2;
      const ry = icon.position.y - icon.height / 2;
      if (pointInRect(px, py, rx, ry, icon.width, icon.height, 4)) {
        onDeleteIcon(icon.id);
        return;
      }
    }

    // 2. Images (bounding box from top-left position)
    for (let i = images.length - 1; i >= 0; i--) {
      const img = images[i];
      if (pointInRect(px, py, img.position.x, img.position.y, img.width, img.height, 4)) {
        onDeleteImage(img.id);
        return;
      }
    }

    // 3. Text labels (bounding box from top-left position)
    for (let i = textLabels.length - 1; i >= 0; i--) {
      const lbl = textLabels[i];
      if (pointInRect(px, py, lbl.position.x, lbl.position.y, lbl.width, lbl.height, 4)) {
        onDeleteTextLabel(lbl.id);
        return;
      }
    }

    // 4. Drawn lines / arrows
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (pointNearSegment(
        px, py,
        line.startPosition.x, line.startPosition.y,
        line.endPosition.x, line.endPosition.y,
        ERASER_RADIUS
      )) {
        onDeleteLine(i);
        return;
      }
    }

    // 5. Connections (arrows between icons)
    for (let i = connections.length - 1; i >= 0; i--) {
      const conn = connections[i];
      const src = icons.find(ic => ic.id === conn.sourceId);
      const tgt = icons.find(ic => ic.id === conn.targetId);
      if (src && tgt) {
        if (pointNearSegment(
          px, py,
          src.position.x, src.position.y,
          tgt.position.x, tgt.position.y,
          ERASER_RADIUS
        )) {
          onDeleteConnection(conn.id);
          return;
        }
      }
    }

    // 6. Freehand drawings
    for (let i = freehandDrawings.length - 1; i >= 0; i--) {
      if (pointNearPolyline(px, py, freehandDrawings[i].points, ERASER_RADIUS)) {
        onDeleteFreehandDrawing(i);
        return;
      }
    }
  }, [
    icons, images, textLabels, lines, connections, freehandDrawings,
    onDeleteIcon, onDeleteImage, onDeleteTextLabel, onDeleteLine,
    onDeleteConnection, onDeleteFreehandDrawing,
  ]);

  // ── Drop handler ────────────────────────────────────────────────────────────
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const iconType = e.dataTransfer.getData('iconType') as string;
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

  // ── Mouse Down ──────────────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (e.target !== svgRef.current) return;
    const pt = getSVGPoint(e);

    if (activeTool === 'eraser') {
      setIsErasing(true);
      eraseAtPoint(pt);
      return;
    }
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
  }, [activeTool, getSVGPoint, onAddTextLabel, clearSelection, eraseAtPoint]);

  // ── Mouse Move ──────────────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const pt = getSVGPoint(e);

    if (activeTool === 'eraser') {
      setEraserPos(pt);
      if (isErasing) {
        eraseAtPoint(pt);
      }
      return;
    }

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

      if (handle.includes('e')) newW = Math.max(20, startWidth + dx);
      if (handle.includes('s')) newH = Math.max(20, startHeight + dy);
      if (handle.includes('w')) {
        newW = Math.max(20, startWidth - dx);
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
      } else if (resizeState.elementType === 'image') {
        onUpdateImageImmediate(resizeState.elementId, {
          position: { x: newX, y: newY },
          width: newW,
          height: newH,
        });
      } else if (resizeState.elementType === 'icon') {
        // For icons, position is center-based
        onUpdateIconPositionImmediate(resizeState.elementId, {
          x: newX + newW / 2,
          y: newY + newH / 2,
        });
        onUpdateIconSizeImmediate(resizeState.elementId, newW, newH);
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
  }, [
    isDrawing, activeTool, lineStart, isErasing,
    draggingIconId, dragOffset,
    draggingTextId, textDragOffset,
    draggingImageId, imageDragOffset,
    resizeState, rotateState,
    getSVGPoint, eraseAtPoint,
    onUpdateIconPositionImmediate, onUpdateIconRotationImmediate, onUpdateIconSizeImmediate,
    onUpdateTextLabelImmediate, onUpdateImageImmediate,
  ]);

  // ── Mouse Up ────────────────────────────────────────────────────────────────
  const handleMouseUp = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const pt = getSVGPoint(e);

    if (activeTool === 'eraser') {
      setIsErasing(false);
      return;
    }

    if (isDrawing && (activeTool === 'pen' || activeTool === 'freehand') && currentPath.length > 1) {
      onAddFreehandDrawing({ points: currentPath, color: drawColor, strokeWidth });
      setIsDrawing(false);
      setCurrentPath([]);
      return;
    }
    setIsDrawing(false);
    setCurrentPath([]);

    if (lineStart && (activeTool === 'line' || activeTool === 'arrow')) {
      // Arrow and line tools always use black color
      onAddLine({
        startPosition: lineStart,
        endPosition: pt,
        color: '#000000',
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
      } else if (resizeState.elementType === 'image') {
        const img = images.find(i => i.id === resizeState.elementId);
        if (img) onUpdateImage(resizeState.elementId, { position: img.position, width: img.width, height: img.height });
      } else if (resizeState.elementType === 'icon') {
        const icon = icons.find(i => i.id === resizeState.elementId);
        if (icon) onUpdateIconSize(resizeState.elementId, icon.width, icon.height);
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
  }, [
    isDrawing, activeTool, currentPath, lineStart,
    draggingIconId, draggingTextId, draggingImageId,
    resizeState, rotateState,
    icons, textLabels, images,
    getSVGPoint,
    onAddFreehandDrawing, onAddLine,
    onUpdateIconPosition, onUpdateIconRotation, onUpdateIconSize,
    onUpdateTextLabel, onUpdateImage,
    drawColor, strokeWidth,
  ]);

  const handleMouseLeave = useCallback(() => {
    setEraserPos(null);
    setIsErasing(false);
  }, []);

  // ── Icon interaction ────────────────────────────────────────────────────────
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
    if (activeTool === 'select') {
      clearSelection();
      setSelectedIconId(icon.id);
      setDraggingIconId(icon.id);
      setDragOffset({ x: pt.x - icon.position.x, y: pt.y - icon.position.y });
      return;
    }
    if (activeTool === 'freeTransform') {
      setTransformIconId(icon.id);
      setTransformTextId(null);
      setTransformImageId(null);
      setSelectedIconId(icon.id);
      setDraggingIconId(icon.id);
      setDragOffset({ x: pt.x - icon.position.x, y: pt.y - icon.position.y });
    }
  }, [activeTool, connectingFrom, getSVGPoint, onDeleteIcon, onAddConnection, clearSelection, drawColor]);

  // ── Text label interaction ──────────────────────────────────────────────────
  const handleTextMouseDown = useCallback((e: React.MouseEvent, label: CanvasTextLabel) => {
    e.stopPropagation();
    const pt = getSVGPoint(e);

    if (activeTool === 'eraser') {
      onDeleteTextLabel(label.id);
      return;
    }
    if (activeTool === 'select') {
      clearSelection();
      setSelectedTextId(label.id);
      setDraggingTextId(label.id);
      setTextDragOffset({ x: pt.x - label.position.x, y: pt.y - label.position.y });
      return;
    }
    if (activeTool === 'freeTransform') {
      setTransformTextId(label.id);
      setTransformIconId(null);
      setTransformImageId(null);
      setSelectedTextId(label.id);
      setDraggingTextId(label.id);
      setTextDragOffset({ x: pt.x - label.position.x, y: pt.y - label.position.y });
    }
  }, [activeTool, getSVGPoint, onDeleteTextLabel, clearSelection]);

  // ── Image interaction ───────────────────────────────────────────────────────
  const handleImageMouseDown = useCallback((e: React.MouseEvent, img: CanvasImage) => {
    e.stopPropagation();
    const pt = getSVGPoint(e);

    if (activeTool === 'eraser') {
      onDeleteImage(img.id);
      return;
    }
    if (activeTool === 'select') {
      clearSelection();
      setSelectedImageId(img.id);
      setDraggingImageId(img.id);
      setImageDragOffset({ x: pt.x - img.position.x, y: pt.y - img.position.y });
      return;
    }
    if (activeTool === 'freeTransform') {
      setTransformImageId(img.id);
      setTransformIconId(null);
      setTransformTextId(null);
      setSelectedImageId(img.id);
      setDraggingImageId(img.id);
      setImageDragOffset({ x: pt.x - img.position.x, y: pt.y - img.position.y });
    }
  }, [activeTool, getSVGPoint, onDeleteImage, clearSelection]);

  // ── Connection interaction ──────────────────────────────────────────────────
  const handleConnectionClick = useCallback((connId: string) => {
    if (activeTool === 'eraser') {
      onDeleteConnection(connId);
      return;
    }
    if (activeTool === 'select') {
      clearSelection();
      setSelectedConnId(connId);
    }
  }, [activeTool, onDeleteConnection, clearSelection]);

  // ── Free Transform handle interactions ─────────────────────────────────────
  const handleResizeMouseDown = useCallback((
    e: React.MouseEvent,
    elementId: string,
    elementType: 'text' | 'image' | 'icon',
    handle: HandlePosition,
    startX: number,
    startY: number,
    startWidth: number,
    startHeight: number,
  ) => {
    e.stopPropagation();
    const pt = getSVGPoint(e);
    setResizeState({
      elementId,
      elementType,
      handle,
      startMouseX: pt.x,
      startMouseY: pt.y,
      startX,
      startY,
      startWidth,
      startHeight,
    });
  }, [getSVGPoint]);

  const handleRotateMouseDown = useCallback((
    e: React.MouseEvent,
    elementId: string,
    elementType: 'text' | 'image' | 'icon',
    centerX: number,
    centerY: number,
    initialRotation: number,
  ) => {
    e.stopPropagation();
    const pt = getSVGPoint(e);
    const startAngle = Math.atan2(pt.y - centerY, pt.x - centerX) * (180 / Math.PI);
    setRotateState({
      elementId,
      elementType,
      centerX,
      centerY,
      startAngle,
      initialRotation,
    });
  }, [getSVGPoint]);

  // ── Render free transform handles ──────────────────────────────────────────
  function renderTransformHandles(
    elementId: string,
    elementType: 'text' | 'image' | 'icon',
    x: number,
    y: number,
    width: number,
    height: number,
    rotation: number,
  ) {
    const cx = x + width / 2;
    const cy = y + height / 2;
    const handles = getHandlePositions(x, y, width, height);
    const rotHandleX = cx;
    const rotHandleY = y - ROTATION_HANDLE_OFFSET;

    return (
      <g transform={`rotate(${rotation}, ${cx}, ${cy})`} style={{ pointerEvents: 'all' }}>
        {/* Selection border */}
        <rect
          x={x} y={y}
          width={width} height={height}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={1.5}
          strokeDasharray="4 2"
          pointerEvents="none"
        />
        {/* Resize handles */}
        {(Object.entries(handles) as [HandlePosition, { cx: number; cy: number }][]).map(([handle, pos]) => (
          <rect
            key={handle}
            x={pos.cx - HANDLE_SIZE / 2}
            y={pos.cy - HANDLE_SIZE / 2}
            width={HANDLE_SIZE}
            height={HANDLE_SIZE}
            fill="white"
            stroke="#3b82f6"
            strokeWidth={1.5}
            style={{ cursor: getCursorForHandle(handle) }}
            onMouseDown={ev => handleResizeMouseDown(ev, elementId, elementType, handle, x, y, width, height)}
          />
        ))}
        {/* Rotation handle line */}
        <line
          x1={cx} y1={y}
          x2={rotHandleX} y2={rotHandleY}
          stroke="#3b82f6"
          strokeWidth={1.5}
          pointerEvents="none"
        />
        {/* Rotation handle circle */}
        <circle
          cx={rotHandleX}
          cy={rotHandleY}
          r={6}
          fill="white"
          stroke="#3b82f6"
          strokeWidth={1.5}
          style={{ cursor: 'grab' }}
          onMouseDown={ev => handleRotateMouseDown(ev, elementId, elementType, cx, cy, rotation)}
        />
      </g>
    );
  }

  // ── Cursor style ────────────────────────────────────────────────────────────
  const getCursor = () => {
    if (activeTool === 'eraser') return 'none';
    if (activeTool === 'pen' || activeTool === 'freehand') return 'crosshair';
    if (activeTool === 'line' || activeTool === 'arrow') return 'crosshair';
    if (activeTool === 'text') return 'text';
    if (activeTool === 'connect') return 'cell';
    return 'default';
  };

  // Collect unique colors for arrowhead markers; always include black
  const arrowColors = new Set<string>(['#000000']);
  lines.forEach(l => { if (l.isArrow) arrowColors.add(l.color); });
  connections.forEach(c => arrowColors.add(c.color));

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ cursor: getCursor(), background: '#ffffff' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          {Array.from(arrowColors).map(color => (
            <marker
              key={color}
              id={`arrowhead-${color.replace('#', '')}`}
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill={color} />
            </marker>
          ))}
        </defs>

        {/* ── Freehand drawings ── */}
        {freehandDrawings.map((drawing, i) => (
          <polyline
            key={i}
            points={drawing.points.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={drawing.color}
            strokeWidth={drawing.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ cursor: activeTool === 'eraser' ? 'pointer' : 'default' }}
          />
        ))}

        {/* ── Freehand preview ── */}
        {isDrawing && currentPath.length > 1 && (
          <polyline
            points={currentPath.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={drawColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.7}
            pointerEvents="none"
          />
        )}

        {/* ── Drawn lines / arrows ── */}
        {lines.map((line, i) => (
          <line
            key={i}
            x1={line.startPosition.x}
            y1={line.startPosition.y}
            x2={line.endPosition.x}
            y2={line.endPosition.y}
            stroke={line.color}
            strokeWidth={line.strokeWidth}
            strokeLinecap="round"
            markerEnd={line.isArrow ? `url(#arrowhead-${line.color.replace('#', '')})` : undefined}
            style={{ cursor: activeTool === 'eraser' ? 'pointer' : 'default' }}
          />
        ))}

        {/* ── Line / Arrow preview (always black) ── */}
        {lineStart && linePreview && (
          <line
            x1={lineStart.x}
            y1={lineStart.y}
            x2={linePreview.x}
            y2={linePreview.y}
            stroke="#000000"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray="5 3"
            markerEnd={activeTool === 'arrow' ? 'url(#arrowhead-000000)' : undefined}
            opacity={0.7}
            pointerEvents="none"
          />
        )}

        {/* ── Connections between icons ── */}
        {connections.map(conn => {
          const src = icons.find(ic => ic.id === conn.sourceId);
          const tgt = icons.find(ic => ic.id === conn.targetId);
          if (!src || !tgt) return null;
          return (
            <AttackPathConnector
              key={conn.id}
              id={conn.id}
              sourceX={src.position.x}
              sourceY={src.position.y}
              targetX={tgt.position.x}
              targetY={tgt.position.y}
              isSelected={selectedConnId === conn.id}
              onClick={handleConnectionClick}
            />
          );
        })}

        {/* ── Connector source highlight ── */}
        {connectingFrom && (() => {
          const icon = icons.find(ic => ic.id === connectingFrom);
          if (!icon) return null;
          return (
            <rect
              x={icon.position.x - icon.width / 2 - 3}
              y={icon.position.y - icon.height / 2 - 3}
              width={icon.width + 6}
              height={icon.height + 6}
              fill="none"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="4 2"
              pointerEvents="none"
            />
          );
        })()}

        {/* ── Images ── */}
        {images.map(img => {
          const isTransform = transformImageId === img.id;
          const x = img.position.x;
          const y = img.position.y;
          const w = img.width;
          const h = img.height;
          const cx = x + w / 2;
          const cy = y + h / 2;
          return (
            <g
              key={img.id}
              transform={`rotate(${img.rotation}, ${cx}, ${cy})`}
            >
              <image
                href={img.url}
                x={x}
                y={y}
                width={w}
                height={h}
                style={{
                  cursor: activeTool === 'select' || activeTool === 'freeTransform' ? 'move'
                    : activeTool === 'eraser' ? 'pointer'
                    : 'default',
                }}
                onMouseDown={ev => handleImageMouseDown(ev, img)}
              />
              {isTransform && renderTransformHandles(img.id, 'image', x, y, w, h, img.rotation)}
            </g>
          );
        })}

        {/* ── Placed icons ── */}
        {icons.map(icon => {
          const isTransform = transformIconId === icon.id;
          const isSelected = selectedIconId === icon.id;
          const imgSrc = ICON_IMAGE_MAP[icon.iconType] ?? ICON_IMAGE_MAP['attacker'];
          const x = icon.position.x - icon.width / 2;
          const y = icon.position.y - icon.height / 2;
          const cx = icon.position.x;
          const cy = icon.position.y;
          return (
            <g
              key={icon.id}
              transform={`rotate(${icon.rotation}, ${cx}, ${cy})`}
            >
              {/* Selection highlight */}
              {isSelected && activeTool === 'select' && (
                <rect
                  x={x - 3}
                  y={y - 3}
                  width={icon.width + 6}
                  height={icon.height + 6}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  pointerEvents="none"
                />
              )}
              <image
                href={imgSrc}
                x={x}
                y={y}
                width={icon.width}
                height={icon.height}
                style={{
                  cursor: activeTool === 'select' || activeTool === 'freeTransform' ? 'move'
                    : activeTool === 'connect' ? 'cell'
                    : activeTool === 'eraser' ? 'pointer'
                    : 'default',
                }}
                onMouseDown={ev => handleIconMouseDown(ev, icon)}
              />
              {/* Icon label */}
              <text
                x={cx}
                y={y + icon.height + 14}
                textAnchor="middle"
                fontSize={11}
                fill="#1e293b"
                pointerEvents="none"
                style={{ userSelect: 'none' }}
              >
                {icon.name}
              </text>
              {isTransform && renderTransformHandles(icon.id, 'icon', x, y, icon.width, icon.height, icon.rotation)}
            </g>
          );
        })}

        {/* ── Text labels ── */}
        {textLabels.map(label => {
          const isTransform = transformTextId === label.id;
          const isSelected = selectedTextId === label.id;
          const x = label.position.x;
          const y = label.position.y;
          const w = label.width;
          const h = label.height;
          const cx = x + w / 2;
          const cy = y + h / 2;
          const isEditing = editingTextId === label.id;

          return (
            <g
              key={label.id}
              transform={`rotate(${label.rotation}, ${cx}, ${cy})`}
            >
              {isEditing ? (
                <foreignObject x={x} y={y} width={Math.max(w, 80)} height={Math.max(h, 30)}>
                  <input
                    // @ts-ignore
                    xmlns="http://www.w3.org/1999/xhtml"
                    autoFocus
                    defaultValue={label.content}
                    onBlur={e => {
                      onUpdateTextLabel(label.id, { content: (e.target as HTMLInputElement).value });
                      setEditingTextId(null);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        onUpdateTextLabel(label.id, { content: (e.target as HTMLInputElement).value });
                        setEditingTextId(null);
                      }
                    }}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: '1px solid #3b82f6',
                      background: 'white',
                      fontSize: label.fontSize,
                      fontWeight: label.fontWeight,
                      color: label.color,
                      padding: '2px 4px',
                      outline: 'none',
                    }}
                  />
                </foreignObject>
              ) : (
                <>
                  {(isSelected || isTransform) && (
                    <rect
                      x={x - 2} y={y - 2}
                      width={w + 4} height={h + 4}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth={1}
                      strokeDasharray="3 2"
                      pointerEvents="none"
                    />
                  )}
                  <text
                    x={x + 4}
                    y={y + label.fontSize + 4}
                    fontSize={label.fontSize}
                    fontWeight={label.fontWeight}
                    fill={label.color}
                    style={{
                      cursor: activeTool === 'select' || activeTool === 'freeTransform' ? 'move'
                        : activeTool === 'eraser' ? 'pointer'
                        : 'default',
                      userSelect: 'none',
                    }}
                    onMouseDown={ev => handleTextMouseDown(ev, label)}
                    onDoubleClick={() => {
                      if (activeTool === 'select') setEditingTextId(label.id);
                    }}
                  >
                    {label.content}
                  </text>
                </>
              )}
              {isTransform && renderTransformHandles(label.id, 'text', x, y, w, h, label.rotation)}
            </g>
          );
        })}

        {/* ── Eraser cursor ── */}
        {activeTool === 'eraser' && eraserPos && (
          <circle
            cx={eraserPos.x}
            cy={eraserPos.y}
            r={ERASER_RADIUS}
            fill="rgba(239,68,68,0.12)"
            stroke="#ef4444"
            strokeWidth={1.5}
            pointerEvents="none"
          />
        )}
      </svg>
    </div>
  );
}
