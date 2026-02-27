import React, { useRef, useState, useCallback, useEffect } from 'react';
import AttackPathConnector from './AttackPathConnector';
import { NamedDiagram } from '../backend';
import {
  PlacedIcon,
  TextLabel,
  ImageElement,
  Connection,
  FreehandDrawing,
  LineElement,
  Position,
  DiagramStateLocal,
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
  | 'image'
  | 'connector';

// Icon image map
const ICON_IMAGE_MAP: Record<string, string> = {
  user: '/assets/generated/user-icon.dim_128x128.png',
  multipleusers: '/assets/multiple users icon.png',
  multiuser: '/assets/multiple users icon.png',
  email: '/assets/email.png',
  attacker: '/assets/attacker.png',
  computer: '/assets/Computer.png',
  multiplecomputers: '/assets/multiple computer.png',
  multicomputer: '/assets/multiple computer.png',
  server: '/assets/server icon.png',
  multipleservers: '/assets/Multiple Server Icon.png',
  multiserver: '/assets/Multiple Server Icon.png',
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
  cloud: '/assets/Cloud Server.png',
  firewall: '/assets/Firewall.png',
  router: '/assets/Router Device Icon.jpg',
  scheduledtask: '/assets/Scheduled Task.jpg',
  powershell: '/assets/powershell-2.png',
  javascript: '/assets/script.png',
  webbrowser: '/assets/web browser.png',
};

function getIconSrc(iconType: string): string {
  return ICON_IMAGE_MAP[iconType] ?? '/assets/attacker.png';
}

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
const ERASER_RADIUS = 16;

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
  state: DiagramStateLocal;
  onStateChange: (newState: DiagramStateLocal) => void;
  onLoadDiagram?: (diagram: NamedDiagram) => void;
}

export default function AttackPathCanvas({
  activeTool,
  state,
  onStateChange,
  onLoadDiagram,
}: AttackPathCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);
  const [selectedConnId, setSelectedConnId] = useState<string | null>(null);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  const [draggingIconId, setDraggingIconId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });

  const [draggingTextId, setDraggingTextId] = useState<string | null>(null);
  const [textDragOffset, setTextDragOffset] = useState<Position>({ x: 0, y: 0 });

  const [draggingImageId, setDraggingImageId] = useState<string | null>(null);
  const [imageDragOffset, setImageDragOffset] = useState<Position>({ x: 0, y: 0 });

  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const [rotateState, setRotateState] = useState<RotateState | null>(null);

  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Position[]>([]);

  const [lineStart, setLineStart] = useState<Position | null>(null);
  const [linePreview, setLinePreview] = useState<Position | null>(null);

  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingIconLabelId, setEditingIconLabelId] = useState<string | null>(null);

  const [eraserPos, setEraserPos] = useState<Position | null>(null);
  const [isErasing, setIsErasing] = useState(false);

  const [dragOver, setDragOver] = useState(false);

  const getSVGPoint = useCallback((e: React.MouseEvent | MouseEvent): Position => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: (e as MouseEvent).clientX - rect.left,
      y: (e as MouseEvent).clientY - rect.top,
    };
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIconId(null);
    setSelectedConnId(null);
    setSelectedTextId(null);
    setSelectedImageId(null);
  }, []);

  useEffect(() => {
    if (activeTool !== 'freeTransform' && activeTool !== 'select') {
      clearSelection();
    }
  }, [activeTool, clearSelection]);

  // ── Eraser ──────────────────────────────────────────────────────────────────
  const eraseAtPoint = useCallback((pt: Position) => {
    const px = pt.x;
    const py = pt.y;

    for (let i = state.icons.length - 1; i >= 0; i--) {
      const icon = state.icons[i];
      const rx = icon.position.x - icon.width / 2;
      const ry = icon.position.y - icon.height / 2;
      if (pointInRect(px, py, rx, ry, icon.width, icon.height, 4)) {
        onStateChange({
          ...state,
          icons: state.icons.filter((_, idx) => idx !== i),
          connections: state.connections.filter(c => c.sourceId !== icon.id && c.targetId !== icon.id),
        });
        return;
      }
    }

    for (let i = state.images.length - 1; i >= 0; i--) {
      const img = state.images[i];
      if (pointInRect(px, py, img.position.x, img.position.y, img.width, img.height, 4)) {
        onStateChange({ ...state, images: state.images.filter((_, idx) => idx !== i) });
        return;
      }
    }

    for (let i = state.textLabels.length - 1; i >= 0; i--) {
      const lbl = state.textLabels[i];
      if (pointInRect(px, py, lbl.position.x, lbl.position.y, lbl.width, lbl.height, 4)) {
        onStateChange({ ...state, textLabels: state.textLabels.filter((_, idx) => idx !== i) });
        return;
      }
    }

    for (let i = state.lines.length - 1; i >= 0; i--) {
      const line = state.lines[i];
      if (pointNearSegment(px, py, line.startPosition.x, line.startPosition.y, line.endPosition.x, line.endPosition.y, ERASER_RADIUS)) {
        onStateChange({ ...state, lines: state.lines.filter((_, idx) => idx !== i) });
        return;
      }
    }

    for (let i = state.connections.length - 1; i >= 0; i--) {
      const conn = state.connections[i];
      const src = state.icons.find(ic => ic.id === conn.sourceId);
      const tgt = state.icons.find(ic => ic.id === conn.targetId);
      if (src && tgt) {
        if (pointNearSegment(px, py, src.position.x, src.position.y, tgt.position.x, tgt.position.y, ERASER_RADIUS)) {
          onStateChange({ ...state, connections: state.connections.filter((_, idx) => idx !== i) });
          return;
        }
      }
    }

    for (let i = state.freehandDrawings.length - 1; i >= 0; i--) {
      if (pointNearPolyline(px, py, state.freehandDrawings[i].points, ERASER_RADIUS)) {
        onStateChange({ ...state, freehandDrawings: state.freehandDrawings.filter((_, idx) => idx !== i) });
        return;
      }
    }
  }, [state, onStateChange]);

  // ── Drop handler ─────────────────────────────────────────────────────────────
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);

    // Check for diagram state drop (from sidebar/dialog thumbnail)
    const diagramData = e.dataTransfer.getData('diagramState');
    if (diagramData) {
      try {
        const namedDiagram: NamedDiagram = JSON.parse(diagramData);
        if (onLoadDiagram) {
          onLoadDiagram(namedDiagram);
        }
        return;
      } catch {
        // fall through to icon drop
      }
    }

    // Icon drop
    const iconType = e.dataTransfer.getData('iconType');
    if (!iconType) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const position: Position = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    const newIcon: PlacedIcon = {
      id: `icon-${Date.now()}-${Math.random()}`,
      iconType,
      position,
      name: iconType,
      width: 56,
      height: 56,
      rotation: 0,
    };
    onStateChange({ ...state, icons: [...state.icons, newIcon] });
  }, [state, onStateChange, onLoadDiagram]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
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
      const newLabel: TextLabel = {
        id: `text-${Date.now()}-${Math.random()}`,
        content: 'Text',
        position: pt,
        fontSize: 16,
        color: '#1e293b',
        fontWeight: 'normal',
        width: 160,
        height: 60,
        rotation: 0,
      };
      onStateChange({ ...state, textLabels: [...state.textLabels, newLabel] });
      setEditingTextId(newLabel.id);
      return;
    }
    if (activeTool === 'select' || activeTool === 'freeTransform') {
      clearSelection();
    }
  }, [activeTool, getSVGPoint, state, onStateChange, clearSelection, eraseAtPoint]);

  // ── Mouse Move ──────────────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const pt = getSVGPoint(e);

    if (activeTool === 'eraser') {
      setEraserPos(pt);
      if (isErasing) eraseAtPoint(pt);
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
      onStateChange({
        ...state,
        icons: state.icons.map(icon =>
          icon.id === draggingIconId
            ? { ...icon, position: { x: pt.x - dragOffset.x, y: pt.y - dragOffset.y } }
            : icon
        ),
      });
      return;
    }

    if (draggingTextId) {
      onStateChange({
        ...state,
        textLabels: state.textLabels.map(lbl =>
          lbl.id === draggingTextId
            ? { ...lbl, position: { x: pt.x - textDragOffset.x, y: pt.y - textDragOffset.y } }
            : lbl
        ),
      });
      return;
    }

    if (draggingImageId) {
      onStateChange({
        ...state,
        images: state.images.map(img =>
          img.id === draggingImageId
            ? { ...img, position: { x: pt.x - imageDragOffset.x, y: pt.y - imageDragOffset.y } }
            : img
        ),
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
      if (handle.includes('w')) { newW = Math.max(20, startWidth - dx); newX = startX + startWidth - newW; }
      if (handle.includes('n')) { newH = Math.max(20, startHeight - dy); newY = startY + startHeight - newH; }

      if (resizeState.elementType === 'text') {
        onStateChange({
          ...state,
          textLabels: state.textLabels.map(lbl =>
            lbl.id === resizeState.elementId
              ? { ...lbl, position: { x: newX, y: newY }, width: newW, height: newH }
              : lbl
          ),
        });
      } else if (resizeState.elementType === 'image') {
        onStateChange({
          ...state,
          images: state.images.map(img =>
            img.id === resizeState.elementId
              ? { ...img, position: { x: newX, y: newY }, width: newW, height: newH }
              : img
          ),
        });
      } else if (resizeState.elementType === 'icon') {
        onStateChange({
          ...state,
          icons: state.icons.map(icon =>
            icon.id === resizeState.elementId
              ? { ...icon, position: { x: newX + newW / 2, y: newY + newH / 2 }, width: newW, height: newH }
              : icon
          ),
        });
      }
      return;
    }

    if (rotateState) {
      const angle = Math.atan2(pt.y - rotateState.centerY, pt.x - rotateState.centerX);
      const angleDeg = (angle * 180) / Math.PI;
      const newRotation = rotateState.initialRotation + (angleDeg - rotateState.startAngle);

      if (rotateState.elementType === 'text') {
        onStateChange({
          ...state,
          textLabels: state.textLabels.map(lbl =>
            lbl.id === rotateState.elementId ? { ...lbl, rotation: newRotation } : lbl
          ),
        });
      } else if (rotateState.elementType === 'image') {
        onStateChange({
          ...state,
          images: state.images.map(img =>
            img.id === rotateState.elementId ? { ...img, rotation: newRotation } : img
          ),
        });
      } else if (rotateState.elementType === 'icon') {
        onStateChange({
          ...state,
          icons: state.icons.map(icon =>
            icon.id === rotateState.elementId ? { ...icon, rotation: newRotation } : icon
          ),
        });
      }
      return;
    }
  }, [
    isDrawing, activeTool, lineStart, isErasing,
    draggingIconId, dragOffset,
    draggingTextId, textDragOffset,
    draggingImageId, imageDragOffset,
    resizeState, rotateState,
    getSVGPoint, eraseAtPoint, state, onStateChange,
  ]);

  // ── Mouse Up ────────────────────────────────────────────────────────────────
  const handleMouseUp = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const pt = getSVGPoint(e);

    if (activeTool === 'eraser') {
      setIsErasing(false);
      return;
    }

    if (isDrawing && (activeTool === 'pen' || activeTool === 'freehand') && currentPath.length > 1) {
      onStateChange({
        ...state,
        freehandDrawings: [...state.freehandDrawings, { points: currentPath, color: '#000000', strokeWidth: 2 }],
      });
    }
    setIsDrawing(false);
    setCurrentPath([]);

    if (lineStart && (activeTool === 'line' || activeTool === 'arrow') && linePreview) {
      const dx = linePreview.x - lineStart.x;
      const dy = linePreview.y - lineStart.y;
      if (Math.sqrt(dx * dx + dy * dy) > 5) {
        onStateChange({
          ...state,
          lines: [...state.lines, {
            startPosition: lineStart,
            endPosition: linePreview,
            color: '#000000',
            strokeWidth: 2,
            isArrow: activeTool === 'arrow',
          }],
        });
      }
    }
    setLineStart(null);
    setLinePreview(null);

    if (draggingIconId) setDraggingIconId(null);
    if (draggingTextId) setDraggingTextId(null);
    if (draggingImageId) setDraggingImageId(null);
    if (resizeState) setResizeState(null);
    if (rotateState) setRotateState(null);
  }, [
    activeTool, isDrawing, currentPath, lineStart, linePreview,
    draggingIconId, draggingTextId, draggingImageId, resizeState, rotateState,
    getSVGPoint, state, onStateChange,
  ]);

  // ── Icon interaction ────────────────────────────────────────────────────────
  const handleIconMouseDown = useCallback((e: React.MouseEvent, icon: PlacedIcon) => {
    e.stopPropagation();
    const pt = getSVGPoint(e);

    if (activeTool === 'eraser') {
      onStateChange({
        ...state,
        icons: state.icons.filter(i => i.id !== icon.id),
        connections: state.connections.filter(c => c.sourceId !== icon.id && c.targetId !== icon.id),
      });
      return;
    }

    if (activeTool === 'connect' || activeTool === 'connector') {
      if (!connectingFrom) {
        setConnectingFrom(icon.id);
      } else if (connectingFrom !== icon.id) {
        const exists = state.connections.some(c => c.sourceId === connectingFrom && c.targetId === icon.id);
        if (!exists) {
          onStateChange({
            ...state,
            connections: [...state.connections, {
              id: `conn-${Date.now()}-${Math.random()}`,
              sourceId: connectingFrom,
              targetId: icon.id,
              connectionType: 'arrow',
              color: '#000000',
            }],
          });
        }
        setConnectingFrom(null);
      }
      return;
    }

    if (activeTool === 'select' || activeTool === 'freeTransform') {
      setSelectedIconId(icon.id);
      setDraggingIconId(icon.id);
      setDragOffset({ x: pt.x - icon.position.x, y: pt.y - icon.position.y });
    }
  }, [activeTool, connectingFrom, state, onStateChange, getSVGPoint]);

  const handleIconDoubleClick = useCallback((e: React.MouseEvent, icon: PlacedIcon) => {
    e.stopPropagation();
    setEditingIconLabelId(icon.id);
  }, []);

  // ── Text interaction ────────────────────────────────────────────────────────
  const handleTextMouseDown = useCallback((e: React.MouseEvent, lbl: TextLabel) => {
    e.stopPropagation();
    const pt = getSVGPoint(e);

    if (activeTool === 'eraser') {
      onStateChange({ ...state, textLabels: state.textLabels.filter(t => t.id !== lbl.id) });
      return;
    }
    if (activeTool === 'select' || activeTool === 'freeTransform') {
      setSelectedTextId(lbl.id);
      setDraggingTextId(lbl.id);
      setTextDragOffset({ x: pt.x - lbl.position.x, y: pt.y - lbl.position.y });
    }
  }, [activeTool, state, onStateChange, getSVGPoint]);

  const handleTextDoubleClick = useCallback((e: React.MouseEvent, lbl: TextLabel) => {
    e.stopPropagation();
    setEditingTextId(lbl.id);
  }, []);

  // ── Image interaction ───────────────────────────────────────────────────────
  const handleImageMouseDown = useCallback((e: React.MouseEvent, img: ImageElement) => {
    e.stopPropagation();
    const pt = getSVGPoint(e);

    if (activeTool === 'eraser') {
      onStateChange({ ...state, images: state.images.filter(i => i.id !== img.id) });
      return;
    }
    if (activeTool === 'select' || activeTool === 'freeTransform') {
      setSelectedImageId(img.id);
      setDraggingImageId(img.id);
      setImageDragOffset({ x: pt.x - img.position.x, y: pt.y - img.position.y });
    }
  }, [activeTool, state, onStateChange, getSVGPoint]);

  // ── Connection interaction ──────────────────────────────────────────────────
  const handleConnectionClick = useCallback((connId: string) => {
    if (activeTool === 'eraser') {
      onStateChange({ ...state, connections: state.connections.filter(c => c.id !== connId) });
    } else {
      setSelectedConnId(connId);
    }
  }, [activeTool, state, onStateChange]);

  // ── Resize handles ──────────────────────────────────────────────────────────
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
    setResizeState({ elementId, elementType, handle, startMouseX: pt.x, startMouseY: pt.y, startX, startY, startWidth, startHeight });
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
    const startAngle = (Math.atan2(pt.y - centerY, pt.x - centerX) * 180) / Math.PI;
    setRotateState({ elementId, elementType, centerX, centerY, startAngle, initialRotation });
  }, [getSVGPoint]);

  // ── Render handles ──────────────────────────────────────────────────────────
  const renderHandles = (
    elementId: string,
    elementType: 'text' | 'image' | 'icon',
    x: number, y: number, w: number, h: number,
    rotation: number,
  ) => {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const handles: { handle: HandlePosition; hx: number; hy: number }[] = [
      { handle: 'nw', hx: x, hy: y },
      { handle: 'n', hx: cx, hy: y },
      { handle: 'ne', hx: x + w, hy: y },
      { handle: 'e', hx: x + w, hy: cy },
      { handle: 'se', hx: x + w, hy: y + h },
      { handle: 's', hx: cx, hy: y + h },
      { handle: 'sw', hx: x, hy: y + h },
      { handle: 'w', hx: x, hy: cy },
    ];

    return (
      <g transform={`rotate(${rotation}, ${cx}, ${cy})`}>
        <rect x={x - 1} y={y - 1} width={w + 2} height={h + 2}
          fill="none" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4 2" pointerEvents="none" />
        {handles.map(({ handle, hx, hy }) => (
          <rect
            key={handle}
            x={hx - HANDLE_SIZE / 2} y={hy - HANDLE_SIZE / 2}
            width={HANDLE_SIZE} height={HANDLE_SIZE}
            fill="white" stroke="#3b82f6" strokeWidth={1.5}
            style={{ cursor: `${handle}-resize` }}
            onMouseDown={(e) => handleResizeMouseDown(e, elementId, elementType, handle, x, y, w, h)}
          />
        ))}
        <circle cx={cx} cy={y - 20} r={6} fill="#3b82f6" stroke="white" strokeWidth={1.5}
          style={{ cursor: 'grab' }}
          onMouseDown={(e) => handleRotateMouseDown(e, elementId, elementType, cx, cy, rotation)} />
        <line x1={cx} y1={y - 14} x2={cx} y2={y - 1} stroke="#3b82f6" strokeWidth={1.5} pointerEvents="none" />
      </g>
    );
  };

  const getCursor = () => {
    if (activeTool === 'pen' || activeTool === 'freehand') return 'crosshair';
    if (activeTool === 'line' || activeTool === 'arrow') return 'crosshair';
    if (activeTool === 'text') return 'text';
    if (activeTool === 'eraser') return 'cell';
    if (activeTool === 'connect' || activeTool === 'connector') return 'cell';
    return 'default';
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {dragOver && (
        <div className="absolute inset-0 z-10 pointer-events-none border-4 border-dashed border-primary/60 bg-primary/5 flex items-center justify-center">
          <span className="text-primary font-semibold text-lg bg-background/80 px-4 py-2 rounded-lg shadow">
            Drop to load diagram
          </span>
        </div>
      )}

      <svg
        ref={svgRef}
        className="w-full h-full bg-background"
        style={{ cursor: getCursor() }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setIsErasing(false);
          setEraserPos(null);
          if (draggingIconId) setDraggingIconId(null);
          if (draggingTextId) setDraggingTextId(null);
          if (draggingImageId) setDraggingImageId(null);
        }}
      >
        {/* Grid */}
        <defs>
          <pattern id="canvas-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.3" className="text-border" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#canvas-grid)" />

        {/* Freehand drawings */}
        {state.freehandDrawings.map((drawing, index) => {
          if (drawing.points.length < 2) return null;
          const d = drawing.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
          return (
            <path key={index} d={d} fill="none"
              stroke={drawing.color} strokeWidth={drawing.strokeWidth}
              strokeLinecap="round" strokeLinejoin="round"
              style={{ cursor: activeTool === 'eraser' ? 'cell' : 'pointer' }}
            />
          );
        })}

        {/* Lines */}
        {state.lines.map((line, index) => {
          const dx = line.endPosition.x - line.startPosition.x;
          const dy = line.endPosition.y - line.startPosition.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          const ux = len > 0 ? dx / len : 0;
          const uy = len > 0 ? dy / len : 0;
          const arrowSize = 10;
          return (
            <g key={index} style={{ cursor: activeTool === 'eraser' ? 'cell' : 'pointer' }}>
              <line
                x1={line.startPosition.x} y1={line.startPosition.y}
                x2={line.endPosition.x} y2={line.endPosition.y}
                stroke="#000000" strokeWidth={line.strokeWidth} strokeLinecap="round"
              />
              {line.isArrow && len > 0 && (
                <polygon
                  points={`${line.endPosition.x},${line.endPosition.y} ${line.endPosition.x - ux * arrowSize - uy * arrowSize * 0.5},${line.endPosition.y - uy * arrowSize + ux * arrowSize * 0.5} ${line.endPosition.x - ux * arrowSize + uy * arrowSize * 0.5},${line.endPosition.y - uy * arrowSize - ux * arrowSize * 0.5}`}
                  fill="#000000"
                />
              )}
              <line
                x1={line.startPosition.x} y1={line.startPosition.y}
                x2={line.endPosition.x} y2={line.endPosition.y}
                stroke="transparent" strokeWidth={12}
              />
            </g>
          );
        })}

        {/* Connections */}
        {state.connections.map((conn) => {
          const src = state.icons.find(i => i.id === conn.sourceId);
          const tgt = state.icons.find(i => i.id === conn.targetId);
          if (!src || !tgt) return null;
          const isSelected = selectedConnId === conn.id;
          return (
            <AttackPathConnector
              key={conn.id}
              id={conn.id}
              sourceX={src.position.x}
              sourceY={src.position.y}
              targetX={tgt.position.x}
              targetY={tgt.position.y}
              isSelected={isSelected}
              onClick={handleConnectionClick}
            />
          );
        })}

        {/* Images */}
        {state.images.map((img) => {
          const isSelected = selectedImageId === img.id;
          const cx = img.position.x + img.width / 2;
          const cy = img.position.y + img.height / 2;
          return (
            <g key={img.id}>
              <image
                href={img.url}
                x={img.position.x} y={img.position.y}
                width={img.width} height={img.height}
                transform={`rotate(${img.rotation}, ${cx}, ${cy})`}
                style={{ cursor: activeTool === 'select' ? 'move' : activeTool === 'eraser' ? 'cell' : 'default' }}
                onMouseDown={(e) => handleImageMouseDown(e, img)}
              />
              {isSelected && renderHandles(img.id, 'image', img.position.x, img.position.y, img.width, img.height, img.rotation)}
            </g>
          );
        })}

        {/* Icons */}
        {state.icons.map((icon) => {
          const isSelected = selectedIconId === icon.id;
          const isConnectingSource = connectingFrom === icon.id;
          const ix = icon.position.x - icon.width / 2;
          const iy = icon.position.y - icon.height / 2;
          const cx = icon.position.x;
          const cy = icon.position.y;
          return (
            <g key={icon.id} transform={`rotate(${icon.rotation}, ${cx}, ${cy})`}>
              {/* Selection/connecting highlight */}
              {(isSelected || isConnectingSource) && (
                <rect
                  x={ix - 3} y={iy - 3}
                  width={icon.width + 6} height={icon.height + 6}
                  fill="none"
                  stroke={isConnectingSource ? '#f59e0b' : '#3b82f6'}
                  strokeWidth={2}
                  strokeDasharray={isConnectingSource ? '4 2' : 'none'}
                  rx={4}
                  pointerEvents="none"
                />
              )}
              <image
                href={getIconSrc(icon.iconType)}
                x={ix} y={iy}
                width={icon.width} height={icon.height}
                style={{ cursor: activeTool === 'select' ? 'move' : activeTool === 'eraser' ? 'cell' : activeTool === 'connect' || activeTool === 'connector' ? 'cell' : 'default' }}
                onMouseDown={(e) => handleIconMouseDown(e, icon)}
                onDoubleClick={(e) => handleIconDoubleClick(e, icon)}
              />
              {/* Icon label */}
              {editingIconLabelId === icon.id ? (
                <foreignObject x={ix - 10} y={iy + icon.height + 2} width={icon.width + 20} height={24}>
                  <input
                    autoFocus
                    defaultValue={icon.name}
                    className="w-full text-center text-xs bg-background border border-primary rounded px-1 outline-none"
                    onBlur={(e) => {
                      onStateChange({
                        ...state,
                        icons: state.icons.map(i => i.id === icon.id ? { ...i, name: e.target.value } : i),
                      });
                      setEditingIconLabelId(null);
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                  />
                </foreignObject>
              ) : (
                <text
                  x={cx} y={iy + icon.height + 14}
                  textAnchor="middle" fontSize={11}
                  fill="currentColor" className="text-foreground"
                  style={{ cursor: 'text', userSelect: 'none' }}
                  onDoubleClick={(e) => handleIconDoubleClick(e, icon)}
                >
                  {icon.name}
                </text>
              )}
              {isSelected && renderHandles(icon.id, 'icon', ix, iy, icon.width, icon.height, icon.rotation)}
            </g>
          );
        })}

        {/* Text Labels */}
        {state.textLabels.map((lbl) => {
          const isSelected = selectedTextId === lbl.id;
          return (
            <g key={lbl.id}>
              {editingTextId === lbl.id ? (
                <foreignObject x={lbl.position.x} y={lbl.position.y - lbl.fontSize} width={200} height={lbl.fontSize + 10}>
                  <input
                    autoFocus
                    defaultValue={lbl.content}
                    className="w-full bg-background border border-primary rounded px-1 outline-none text-foreground"
                    style={{ fontSize: lbl.fontSize }}
                    onBlur={(e) => {
                      onStateChange({
                        ...state,
                        textLabels: state.textLabels.map(t => t.id === lbl.id ? { ...t, content: e.target.value } : t),
                      });
                      setEditingTextId(null);
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                  />
                </foreignObject>
              ) : (
                <text
                  x={lbl.position.x} y={lbl.position.y}
                  fontSize={lbl.fontSize}
                  fill={isSelected ? '#3b82f6' : lbl.color}
                  fontWeight={lbl.fontWeight}
                  style={{ cursor: activeTool === 'select' ? 'move' : activeTool === 'eraser' ? 'cell' : 'text', userSelect: 'none' }}
                  onMouseDown={(e) => handleTextMouseDown(e, lbl)}
                  onDoubleClick={(e) => handleTextDoubleClick(e, lbl)}
                >
                  {lbl.content}
                </text>
              )}
            </g>
          );
        })}

        {/* Active freehand preview */}
        {isDrawing && currentPath.length > 1 && (
          <path
            d={currentPath.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
            fill="none" stroke="#000000" strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" pointerEvents="none"
          />
        )}

        {/* Active line/arrow preview */}
        {lineStart && linePreview && (
          <line
            x1={lineStart.x} y1={lineStart.y}
            x2={linePreview.x} y2={linePreview.y}
            stroke="#000000" strokeWidth={2} strokeDasharray="4 2"
            strokeLinecap="round" pointerEvents="none"
          />
        )}

        {/* Eraser cursor */}
        {activeTool === 'eraser' && eraserPos && (
          <circle cx={eraserPos.x} cy={eraserPos.y} r={ERASER_RADIUS}
            fill="none" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="3 2" pointerEvents="none" />
        )}

        {/* Connecting mode hint */}
        {connectingFrom && (
          <text x={10} y={20} fontSize={12} fill="#f59e0b" pointerEvents="none">
            Click another icon to connect…
          </text>
        )}
      </svg>
    </div>
  );
}
