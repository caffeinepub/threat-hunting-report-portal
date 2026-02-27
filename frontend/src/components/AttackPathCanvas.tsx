import React, { useRef, useState, useCallback } from 'react';
import {
  PlacedIcon,
  TextLabel,
  ImageElement,
  FreehandDrawing,
  LineElement,
  Connection,
  Position,
} from '../hooks/useAttackPathState';
import { IconType } from '../components/AttackPathIcon';

export type ToolType =
  | 'select'
  | 'connect'
  | 'freehand'
  | 'line'
  | 'arrow'
  | 'text'
  | 'eraser'
  | 'freeTransform';

// Re-export canvas element types using the hook's actual types
export type CanvasIcon = PlacedIcon;
export type CanvasTextLabel = TextLabel;
export type CanvasImage = ImageElement;
export type CanvasFreehandDrawing = FreehandDrawing;
export type CanvasLine = LineElement;
export type CanvasConnection = Connection;

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
  onAddTextLabel: (content: string, position: Position, fontSize?: number, color?: string, fontWeight?: string) => void;
  onUpdateTextLabel: (id: string, updates: Partial<CanvasTextLabel>) => void;
  onUpdateTextLabelImmediate: (id: string, updates: Partial<CanvasTextLabel>) => void;
  onDeleteTextLabel: (id: string) => void;
  onAddImage: (url: string, position: Position, name?: string, description?: string) => void;
  onUpdateImage: (id: string, updates: Partial<CanvasImage>) => void;
  onUpdateImageImmediate: (id: string, updates: Partial<CanvasImage>) => void;
  onDeleteImage: (id: string) => void;
  // Optional delete handlers for eraser drag support
  onDeleteFreehandDrawing?: (idx: number) => void;
  onDeleteLine?: (idx: number) => void;
}

const ICON_SIZE = 56;
const HANDLE_SIZE = 8;

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

function getResizeHandles(x: number, y: number, w: number, h: number): { handle: ResizeHandle; cx: number; cy: number }[] {
  return [
    { handle: 'nw', cx: x, cy: y },
    { handle: 'n', cx: x + w / 2, cy: y },
    { handle: 'ne', cx: x + w, cy: y },
    { handle: 'e', cx: x + w, cy: y + h / 2 },
    { handle: 'se', cx: x + w, cy: y + h },
    { handle: 's', cx: x + w / 2, cy: y + h },
    { handle: 'sw', cx: x, cy: y + h },
    { handle: 'w', cx: x, cy: y + h / 2 },
  ];
}

function hitTestHandle(mx: number, my: number, handles: { handle: ResizeHandle; cx: number; cy: number }[]): ResizeHandle | null {
  for (const h of handles) {
    if (Math.abs(mx - h.cx) <= HANDLE_SIZE && Math.abs(my - h.cy) <= HANDLE_SIZE) return h.handle;
  }
  return null;
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
  onDeleteFreehandDrawing,
  onDeleteLine,
}: AttackPathCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Freehand drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Position[]>([]);

  // Line/arrow drawing state
  const [isDrawingLine, setIsDrawingLine] = useState(false);
  const [lineStart, setLineStart] = useState<Position | null>(null);
  const [linePreview, setLinePreview] = useState<Position | null>(null);

  // Connection state
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);

  // Text editing state
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [textInputPos, setTextInputPos] = useState<Position | null>(null);

  // Eraser drag state
  const [isErasing, setIsErasing] = useState(false);

  // Free transform selection
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });

  // Resize state
  const [resizingHandle, setResizingHandle] = useState<ResizeHandle | null>(null);
  const [resizeStart, setResizeStart] = useState<{
    mx: number; my: number;
    ox: number; oy: number;
    ow: number; oh: number;
  } | null>(null);

  // Rotation state
  const [rotatingId, setRotatingId] = useState<string | null>(null);
  const [rotatingType, setRotatingType] = useState<'icon' | 'image' | 'label' | null>(null);
  const [rotateCenter, setRotateCenter] = useState<Position | null>(null);
  const [rotateStartAngle, setRotateStartAngle] = useState<number>(0);
  const [rotateInitialRotation, setRotateInitialRotation] = useState<number>(0);

  const getSVGCoords = useCallback((e: React.MouseEvent): Position => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const getIconAtPoint = useCallback((x: number, y: number): CanvasIcon | null => {
    for (let i = icons.length - 1; i >= 0; i--) {
      const icon = icons[i];
      const iw = icon.size ?? ICON_SIZE;
      const ih = icon.size ?? ICON_SIZE;
      if (
        x >= icon.position.x - iw / 2 &&
        x <= icon.position.x + iw / 2 &&
        y >= icon.position.y - ih / 2 &&
        y <= icon.position.y + ih / 2
      ) return icon;
    }
    return null;
  }, [icons]);

  const getImageAtPoint = useCallback((x: number, y: number): CanvasImage | null => {
    for (let i = images.length - 1; i >= 0; i--) {
      const img = images[i];
      if (x >= img.position.x && x <= img.position.x + img.width &&
          y >= img.position.y && y <= img.position.y + img.height) return img;
    }
    return null;
  }, [images]);

  const getLabelAtPoint = useCallback((x: number, y: number): CanvasTextLabel | null => {
    for (let i = textLabels.length - 1; i >= 0; i--) {
      const label = textLabels[i];
      const lw = label.width ?? 150;
      const lh = label.height ?? (label.fontSize + 8);
      if (x >= label.position.x && x <= label.position.x + lw &&
          y >= label.position.y && y <= label.position.y + lh) return label;
    }
    return null;
  }, [textLabels]);

  const getFreehandIndexAtPoint = useCallback((x: number, y: number): number => {
    for (let i = freehandDrawings.length - 1; i >= 0; i--) {
      const drawing = freehandDrawings[i];
      for (const pt of drawing.points) {
        if (Math.abs(pt.x - x) <= drawing.strokeWidth + 4 && Math.abs(pt.y - y) <= drawing.strokeWidth + 4) {
          return i;
        }
      }
    }
    return -1;
  }, [freehandDrawings]);

  const getLineIndexAtPoint = useCallback((x: number, y: number): number => {
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      const { startPosition: s, endPosition: e } = line;
      const dx = e.x - s.x;
      const dy = e.y - s.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) continue;
      const t = ((x - s.x) * dx + (y - s.y) * dy) / (len * len);
      const clampedT = Math.max(0, Math.min(1, t));
      const closestX = s.x + clampedT * dx;
      const closestY = s.y + clampedT * dy;
      const dist = Math.sqrt((x - closestX) ** 2 + (y - closestY) ** 2);
      if (dist <= line.strokeWidth + 6) return i;
    }
    return -1;
  }, [lines]);

  // Unified erase-at-point: erases the topmost element under the cursor
  const eraseAtPoint = useCallback((x: number, y: number) => {
    const icon = getIconAtPoint(x, y);
    if (icon) { onDeleteIcon(icon.id); return; }

    const label = getLabelAtPoint(x, y);
    if (label) { onDeleteTextLabel(label.id); return; }

    const img = getImageAtPoint(x, y);
    if (img) { onDeleteImage(img.id); return; }

    const freehandIdx = getFreehandIndexAtPoint(x, y);
    if (freehandIdx >= 0 && onDeleteFreehandDrawing) {
      onDeleteFreehandDrawing(freehandIdx);
      return;
    }

    const lineIdx = getLineIndexAtPoint(x, y);
    if (lineIdx >= 0 && onDeleteLine) {
      onDeleteLine(lineIdx);
      return;
    }

    // Check connections
    for (const conn of connections) {
      const src = icons.find(i => i.id === conn.sourceId);
      const tgt = icons.find(i => i.id === conn.targetId);
      if (src && tgt) {
        const dx = tgt.position.x - src.position.x;
        const dy = tgt.position.y - src.position.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len === 0) continue;
        const t = ((x - src.position.x) * dx + (y - src.position.y) * dy) / (len * len);
        const clampedT = Math.max(0, Math.min(1, t));
        const closestX = src.position.x + clampedT * dx;
        const closestY = src.position.y + clampedT * dy;
        const dist = Math.sqrt((x - closestX) ** 2 + (y - closestY) ** 2);
        if (dist <= 8) { onDeleteConnection(conn.id); return; }
      }
    }
  }, [
    getIconAtPoint, getLabelAtPoint, getImageAtPoint, getFreehandIndexAtPoint, getLineIndexAtPoint,
    icons, connections,
    onDeleteIcon, onDeleteTextLabel, onDeleteImage, onDeleteFreehandDrawing, onDeleteLine, onDeleteConnection,
  ]);

  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    const { x, y } = getSVGCoords(e);

    // ── Eraser ──────────────────────────────────────────────────────────────
    if (activeTool === 'eraser') {
      setIsErasing(true);
      eraseAtPoint(x, y);
      return;
    }

    // ── Free Transform ───────────────────────────────────────────────────────
    if (activeTool === 'freeTransform') {
      // Check rotation/resize handles on selected icon
      if (selectedIconId) {
        const icon = icons.find(i => i.id === selectedIconId);
        if (icon) {
          const iw = icon.size ?? ICON_SIZE;
          const ih = icon.size ?? ICON_SIZE;
          const cx = icon.position.x;
          const cy = icon.position.y;
          const rotHandleX = cx;
          const rotHandleY = cy - ih / 2 - 20;
          if (Math.abs(x - rotHandleX) <= 8 && Math.abs(y - rotHandleY) <= 8) {
            setRotatingId(icon.id);
            setRotatingType('icon');
            setRotateCenter({ x: cx, y: cy });
            setRotateStartAngle(Math.atan2(y - cy, x - cx) * (180 / Math.PI));
            setRotateInitialRotation(icon.rotation ?? 0);
            return;
          }
          const handles = getResizeHandles(cx - iw / 2, cy - ih / 2, iw, ih);
          const hit = hitTestHandle(x, y, handles);
          if (hit) {
            setResizingHandle(hit);
            setResizeStart({ mx: x, my: y, ox: cx - iw / 2, oy: cy - ih / 2, ow: iw, oh: ih });
            return;
          }
        }
      }

      // Check rotation/resize handles on selected image
      if (selectedImageId) {
        const img = images.find(i => i.id === selectedImageId);
        if (img) {
          const rotHandleX = img.position.x + img.width / 2;
          const rotHandleY = img.position.y - 20;
          if (Math.abs(x - rotHandleX) <= 8 && Math.abs(y - rotHandleY) <= 8) {
            setRotatingId(img.id);
            setRotatingType('image');
            setRotateCenter({ x: img.position.x + img.width / 2, y: img.position.y + img.height / 2 });
            setRotateStartAngle(Math.atan2(y - (img.position.y + img.height / 2), x - (img.position.x + img.width / 2)) * (180 / Math.PI));
            setRotateInitialRotation(img.rotation ?? 0);
            return;
          }
          const handles = getResizeHandles(img.position.x, img.position.y, img.width, img.height);
          const hit = hitTestHandle(x, y, handles);
          if (hit) {
            setResizingHandle(hit);
            setResizeStart({ mx: x, my: y, ox: img.position.x, oy: img.position.y, ow: img.width, oh: img.height });
            return;
          }
        }
      }

      // Check rotation/resize handles on selected label
      if (selectedLabelId) {
        const label = textLabels.find(l => l.id === selectedLabelId);
        if (label) {
          const lw = label.width ?? 150;
          const lh = label.height ?? (label.fontSize + 8);
          const rotHandleX = label.position.x + lw / 2;
          const rotHandleY = label.position.y - 20;
          if (Math.abs(x - rotHandleX) <= 8 && Math.abs(y - rotHandleY) <= 8) {
            setRotatingId(label.id);
            setRotatingType('label');
            setRotateCenter({ x: label.position.x + lw / 2, y: label.position.y + lh / 2 });
            setRotateStartAngle(Math.atan2(y - (label.position.y + lh / 2), x - (label.position.x + lw / 2)) * (180 / Math.PI));
            setRotateInitialRotation(label.rotation ?? 0);
            return;
          }
          const handles = getResizeHandles(label.position.x, label.position.y, lw, lh);
          const hit = hitTestHandle(x, y, handles);
          if (hit) {
            setResizingHandle(hit);
            setResizeStart({ mx: x, my: y, ox: label.position.x, oy: label.position.y, ow: lw, oh: lh });
            return;
          }
        }
      }

      // Try to select icon
      const icon = getIconAtPoint(x, y);
      if (icon) {
        setSelectedIconId(icon.id);
        setSelectedImageId(null);
        setSelectedLabelId(null);
        setIsDragging(true);
        setDragOffset({ x: x - icon.position.x, y: y - icon.position.y });
        return;
      }

      // Try to select image
      const img = getImageAtPoint(x, y);
      if (img) {
        setSelectedImageId(img.id);
        setSelectedIconId(null);
        setSelectedLabelId(null);
        setIsDragging(true);
        setDragOffset({ x: x - img.position.x, y: y - img.position.y });
        return;
      }

      // Try to select label
      const label = getLabelAtPoint(x, y);
      if (label) {
        setSelectedLabelId(label.id);
        setSelectedImageId(null);
        setSelectedIconId(null);
        setIsDragging(true);
        setDragOffset({ x: x - label.position.x, y: y - label.position.y });
        return;
      }

      // Deselect on background click
      setSelectedImageId(null);
      setSelectedLabelId(null);
      setSelectedIconId(null);
      return;
    }

    // ── Freehand ─────────────────────────────────────────────────────────────
    if (activeTool === 'freehand') {
      setIsDrawing(true);
      setCurrentPath([{ x, y }]);
      return;
    }

    // ── Line / Arrow ─────────────────────────────────────────────────────────
    if (activeTool === 'line' || activeTool === 'arrow') {
      setIsDrawingLine(true);
      setLineStart({ x, y });
      setLinePreview({ x, y });
      return;
    }

    // ── Text ─────────────────────────────────────────────────────────────────
    if (activeTool === 'text') {
      const label = getLabelAtPoint(x, y);
      if (label) {
        setEditingLabelId(label.id);
        setEditingText(label.content);
        setTextInputPos(label.position);
      } else {
        setEditingLabelId('new');
        setEditingText('');
        setTextInputPos({ x, y });
      }
      return;
    }

    // ── Connect ───────────────────────────────────────────────────────────────
    if (activeTool === 'connect') {
      const icon = getIconAtPoint(x, y);
      if (icon) {
        if (connectingFrom === null) {
          setConnectingFrom(icon.id);
        } else if (connectingFrom !== icon.id) {
          onAddConnection(connectingFrom, icon.id, drawColor);
          setConnectingFrom(null);
        }
      } else {
        setConnectingFrom(null);
      }
      return;
    }

    // ── Select ────────────────────────────────────────────────────────────────
    if (activeTool === 'select') {
      const icon = getIconAtPoint(x, y);
      if (icon) {
        setIsDragging(true);
        setSelectedIconId(icon.id);
        setDragOffset({ x: x - icon.position.x, y: y - icon.position.y });
        return;
      }
      setSelectedIconId(null);
    }
  }, [
    activeTool, getSVGCoords, getIconAtPoint, getImageAtPoint, getLabelAtPoint,
    icons, textLabels, images, connections,
    selectedImageId, selectedLabelId, selectedIconId,
    eraseAtPoint, onAddConnection, drawColor, connectingFrom,
  ]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const { x, y } = getSVGCoords(e);

    // Drag-to-erase
    if (isErasing && activeTool === 'eraser') {
      eraseAtPoint(x, y);
      return;
    }

    // Rotation
    if (rotatingId && rotateCenter) {
      const angle = Math.atan2(y - rotateCenter.y, x - rotateCenter.x) * (180 / Math.PI);
      const newRotation = rotateInitialRotation + (angle - rotateStartAngle);
      if (rotatingType === 'icon') {
        onUpdateIconRotationImmediate(rotatingId, newRotation);
      } else if (rotatingType === 'image') {
        onUpdateImageImmediate(rotatingId, { rotation: newRotation });
      } else if (rotatingType === 'label') {
        onUpdateTextLabelImmediate(rotatingId, { rotation: newRotation });
      }
      return;
    }

    // Resize
    if (resizingHandle && resizeStart) {
      const dx = x - resizeStart.mx;
      const dy = y - resizeStart.my;
      let newX = resizeStart.ox;
      let newY = resizeStart.oy;
      let newW = resizeStart.ow;
      let newH = resizeStart.oh;

      if (resizingHandle.includes('e')) newW = Math.max(20, resizeStart.ow + dx);
      if (resizingHandle.includes('s')) newH = Math.max(20, resizeStart.oh + dy);
      if (resizingHandle.includes('w')) { newX = resizeStart.ox + dx; newW = Math.max(20, resizeStart.ow - dx); }
      if (resizingHandle.includes('n')) { newY = resizeStart.oy + dy; newH = Math.max(20, resizeStart.oh - dy); }

      if (selectedImageId) {
        onUpdateImageImmediate(selectedImageId, { position: { x: newX, y: newY }, width: newW, height: newH });
      } else if (selectedLabelId) {
        onUpdateTextLabelImmediate(selectedLabelId, { position: { x: newX, y: newY }, width: newW, height: newH });
      } else if (selectedIconId) {
        // Icon position is center-based; derive new size from average of w/h
        const newSize = Math.max(20, (newW + newH) / 2);
        const cx = newX + newW / 2;
        const cy = newY + newH / 2;
        onUpdateIconPositionImmediate(selectedIconId, { x: cx, y: cy });
        onUpdateIconSizeImmediate(selectedIconId, newSize);
      }
      return;
    }

    // Drag
    if (isDragging) {
      if (selectedImageId) {
        onUpdateImageImmediate(selectedImageId, { position: { x: x - dragOffset.x, y: y - dragOffset.y } });
      } else if (selectedLabelId) {
        onUpdateTextLabelImmediate(selectedLabelId, { position: { x: x - dragOffset.x, y: y - dragOffset.y } });
      } else if (selectedIconId) {
        onUpdateIconPositionImmediate(selectedIconId, { x: x - dragOffset.x, y: y - dragOffset.y });
      }
      return;
    }

    // Freehand drawing
    if (isDrawing && activeTool === 'freehand') {
      setCurrentPath(prev => [...prev, { x, y }]);
      return;
    }

    // Line preview
    if (isDrawingLine && (activeTool === 'line' || activeTool === 'arrow')) {
      setLinePreview({ x, y });
      return;
    }
  }, [
    getSVGCoords, isErasing, activeTool, eraseAtPoint,
    rotatingId, rotateCenter, rotateStartAngle, rotateInitialRotation, rotatingType,
    resizingHandle, resizeStart, isDragging, isDrawing, isDrawingLine,
    selectedImageId, selectedLabelId, selectedIconId, dragOffset,
    onUpdateIconPositionImmediate, onUpdateIconRotationImmediate, onUpdateIconSizeImmediate,
    onUpdateImageImmediate, onUpdateTextLabelImmediate,
  ]);

  const handleMouseUp = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const { x, y } = getSVGCoords(e);

    // Stop erasing
    if (isErasing) {
      setIsErasing(false);
      return;
    }

    // Commit rotation
    if (rotatingId) {
      if (rotatingType === 'icon') {
        const icon = icons.find(i => i.id === rotatingId);
        if (icon) onUpdateIconRotation(rotatingId, icon.rotation);
      } else if (rotatingType === 'image') {
        const img = images.find(i => i.id === rotatingId);
        if (img) onUpdateImage(rotatingId, { rotation: img.rotation });
      } else if (rotatingType === 'label') {
        const label = textLabels.find(l => l.id === rotatingId);
        if (label) onUpdateTextLabel(rotatingId, { rotation: label.rotation });
      }
      setRotatingId(null);
      setRotatingType(null);
      setRotateCenter(null);
      return;
    }

    // Commit resize
    if (resizingHandle && resizeStart) {
      if (selectedImageId) {
        const img = images.find(i => i.id === selectedImageId);
        if (img) onUpdateImage(selectedImageId, { position: img.position, width: img.width, height: img.height });
      } else if (selectedLabelId) {
        const label = textLabels.find(l => l.id === selectedLabelId);
        if (label) onUpdateTextLabel(selectedLabelId, { position: label.position, width: label.width, height: label.height });
      } else if (selectedIconId) {
        const icon = icons.find(i => i.id === selectedIconId);
        if (icon) {
          onUpdateIconPosition(selectedIconId, icon.position);
          onUpdateIconSize(selectedIconId, icon.size);
        }
      }
      setResizingHandle(null);
      setResizeStart(null);
      return;
    }

    // Commit drag
    if (isDragging) {
      if (selectedImageId) {
        const img = images.find(i => i.id === selectedImageId);
        if (img) onUpdateImage(selectedImageId, { position: img.position });
      } else if (selectedLabelId) {
        const label = textLabels.find(l => l.id === selectedLabelId);
        if (label) onUpdateTextLabel(selectedLabelId, { position: label.position });
      } else if (selectedIconId) {
        const icon = icons.find(i => i.id === selectedIconId);
        if (icon) onUpdateIconPosition(selectedIconId, icon.position);
      }
      setIsDragging(false);
      return;
    }

    // Commit freehand drawing
    if (isDrawing && activeTool === 'freehand') {
      if (currentPath.length > 1) {
        onAddFreehandDrawing({ points: currentPath, color: drawColor, strokeWidth });
      }
      setIsDrawing(false);
      setCurrentPath([]);
      return;
    }

    // Commit line/arrow
    if (isDrawingLine && (activeTool === 'line' || activeTool === 'arrow') && lineStart) {
      onAddLine({
        startPosition: lineStart,
        endPosition: { x, y },
        color: drawColor,
        strokeWidth,
        isArrow: activeTool === 'arrow',
      });
      setIsDrawingLine(false);
      setLineStart(null);
      setLinePreview(null);
      return;
    }
  }, [
    getSVGCoords, isErasing,
    rotatingId, rotatingType, icons, images, textLabels,
    resizingHandle, resizeStart, isDragging, isDrawing, isDrawingLine, activeTool,
    selectedImageId, selectedLabelId, selectedIconId, currentPath, lineStart, drawColor, strokeWidth,
    onUpdateIconPosition, onUpdateIconRotation, onUpdateIconSize,
    onUpdateImage, onUpdateTextLabel, onAddFreehandDrawing, onAddLine,
  ]);

  const handleTextSubmit = useCallback(() => {
    if (!textInputPos) {
      setEditingLabelId(null);
      return;
    }
    if (!editingText.trim()) {
      setEditingLabelId(null);
      setTextInputPos(null);
      return;
    }
    if (editingLabelId === 'new') {
      onAddTextLabel(editingText, textInputPos);
    } else if (editingLabelId) {
      onUpdateTextLabel(editingLabelId, { content: editingText });
    }
    setEditingLabelId(null);
    setEditingText('');
    setTextInputPos(null);
  }, [textInputPos, editingText, editingLabelId, onAddTextLabel, onUpdateTextLabel]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const iconType = e.dataTransfer.getData('iconType') as IconType;
    if (!iconType) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    onAddIcon(iconType, { x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, [onAddIcon]);

  const renderArrowMarker = () => (
    <defs>
      <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill={drawColor} />
      </marker>
      <marker id="arrowhead-conn" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
      </marker>
    </defs>
  );

  const renderResizeHandles = (x: number, y: number, w: number, h: number, rotHandleX: number, rotHandleY: number) => {
    const handles = getResizeHandles(x, y, w, h);
    return (
      <>
        <rect x={x} y={y} width={w} height={h} fill="none" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4 2" />
        <line x1={rotHandleX} y1={rotHandleY} x2={rotHandleX} y2={y} stroke="#3b82f6" strokeWidth={1} strokeDasharray="3 2" />
        <circle cx={rotHandleX} cy={rotHandleY} r={6} fill="white" stroke="#3b82f6" strokeWidth={1.5} style={{ cursor: 'grab' }} />
        {handles.map(({ handle, cx, cy }) => (
          <rect
            key={handle}
            x={cx - HANDLE_SIZE / 2}
            y={cy - HANDLE_SIZE / 2}
            width={HANDLE_SIZE}
            height={HANDLE_SIZE}
            fill="white"
            stroke="#3b82f6"
            strokeWidth={1.5}
            style={{ cursor: `${handle}-resize` }}
          />
        ))}
      </>
    );
  };

  const getIconImageSrc = (iconType: string): string => {
    const map: Record<string, string> = {
      attacker: '/assets/attacker.png',
      computer: '/assets/Computer.png',
      server: '/assets/server icon.png',
      firewall: '/assets/Firewall.png',
      router: '/assets/Router Device Icon.jpg',
      cloud: '/assets/Cloud Server.png',
      domain: '/assets/Domain.png',
      multipleServers: '/assets/Multiple Server Icon.png',
      multipleComputers: '/assets/multiple computer.png',
      multipleUsers: '/assets/multiple users icon.png',
      email: '/assets/email.png',
      phishing: '/assets/phishing email icon-2.jpg',
      powershell: '/assets/powershell-2.png',
      backdoor: '/assets/backdoor-1.jpg',
      dll: '/assets/dll.png',
      exe: '/assets/exe.png',
      script: '/assets/script.png',
      scheduledTask: '/assets/Scheduled Task.jpg',
      c2: '/assets/Command and Control.png',
      webBrowser: '/assets/web browser.png',
      excel: '/assets/excel.png',
      word: '/assets/word.png',
      pdf: '/assets/pdf.png',
      zip: '/assets/zip.png',
    };
    return map[iconType] || '/assets/attacker.png';
  };

  const getCursor = () => {
    if (activeTool === 'eraser') return 'cell';
    if (activeTool === 'freehand') return 'crosshair';
    if (activeTool === 'line' || activeTool === 'arrow') return 'crosshair';
    if (activeTool === 'text') return 'text';
    if (activeTool === 'connect') return 'pointer';
    if (activeTool === 'freeTransform') return isDragging ? 'grabbing' : 'grab';
    return 'default';
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
    >
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ cursor: getCursor(), background: 'transparent' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {renderArrowMarker()}

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

        {/* Lines and arrows */}
        {lines.map((line, idx) => (
          <line
            key={idx}
            x1={line.startPosition.x}
            y1={line.startPosition.y}
            x2={line.endPosition.x}
            y2={line.endPosition.y}
            stroke={line.color}
            strokeWidth={line.strokeWidth}
            markerEnd={line.isArrow ? 'url(#arrowhead)' : undefined}
          />
        ))}

        {/* Line preview */}
        {isDrawingLine && lineStart && linePreview && (
          <line
            x1={lineStart.x}
            y1={lineStart.y}
            x2={linePreview.x}
            y2={linePreview.y}
            stroke={drawColor}
            strokeWidth={strokeWidth}
            strokeDasharray="5 3"
            markerEnd={activeTool === 'arrow' ? 'url(#arrowhead)' : undefined}
          />
        )}

        {/* Connections between icons */}
        {connections.map(conn => {
          const src = icons.find(i => i.id === conn.sourceId);
          const tgt = icons.find(i => i.id === conn.targetId);
          if (!src || !tgt) return null;
          return (
            <line
              key={conn.id}
              x1={src.position.x}
              y1={src.position.y}
              x2={tgt.position.x}
              y2={tgt.position.y}
              stroke={conn.color}
              strokeWidth={2}
              markerEnd="url(#arrowhead-conn)"
            />
          );
        })}

        {/* Images */}
        {images.map(img => {
          const isSelected = selectedImageId === img.id && activeTool === 'freeTransform';
          const rotation = img.rotation ?? 0;
          const cx = img.position.x + img.width / 2;
          const cy = img.position.y + img.height / 2;
          return (
            <g key={img.id} transform={`rotate(${rotation}, ${cx}, ${cy})`}>
              <image
                href={img.url}
                x={img.position.x}
                y={img.position.y}
                width={img.width}
                height={img.height}
                preserveAspectRatio="xMidYMid meet"
              />
              {isSelected && renderResizeHandles(
                img.position.x, img.position.y, img.width, img.height,
                img.position.x + img.width / 2, img.position.y - 20
              )}
            </g>
          );
        })}

        {/* Icons */}
        {icons.map(icon => {
          const iw = icon.size ?? ICON_SIZE;
          const ih = icon.size ?? ICON_SIZE;
          const cx = icon.position.x;
          const cy = icon.position.y;
          const rotation = icon.rotation ?? 0;
          const isSelected = selectedIconId === icon.id && activeTool === 'freeTransform';
          const isConnecting = connectingFrom === icon.id;
          return (
            <g key={icon.id} transform={`rotate(${rotation}, ${cx}, ${cy})`}>
              {isConnecting && (
                <circle cx={cx} cy={cy} r={iw / 2 + 4} fill="none" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 2" />
              )}
              <image
                href={getIconImageSrc(icon.iconType)}
                x={cx - iw / 2}
                y={cy - ih / 2}
                width={iw}
                height={ih}
                preserveAspectRatio="xMidYMid meet"
              />
              <text
                x={cx}
                y={cy + ih / 2 + 14}
                textAnchor="middle"
                fontSize={11}
                fill="#94a3b8"
                fontFamily="sans-serif"
              >
                {icon.name}
              </text>
              {isSelected && renderResizeHandles(
                cx - iw / 2, cy - ih / 2, iw, ih,
                cx, cy - ih / 2 - 20
              )}
            </g>
          );
        })}

        {/* Text Labels */}
        {textLabels.map(label => {
          const lw = label.width ?? 150;
          const lh = label.height ?? (label.fontSize + 8);
          const rotation = label.rotation ?? 0;
          const cx = label.position.x + lw / 2;
          const cy = label.position.y + lh / 2;
          const isSelected = selectedLabelId === label.id && activeTool === 'freeTransform';
          return (
            <g key={label.id} transform={`rotate(${rotation}, ${cx}, ${cy})`}>
              <text
                x={label.position.x}
                y={label.position.y + label.fontSize}
                fontSize={label.fontSize}
                fill={label.color}
                fontWeight={label.fontWeight}
                fontFamily="sans-serif"
                style={{ cursor: activeTool === 'text' ? 'text' : 'default' }}
                onClick={() => {
                  if (activeTool === 'text') {
                    setEditingLabelId(label.id);
                    setEditingText(label.content);
                    setTextInputPos(label.position);
                  }
                }}
              >
                {label.content}
              </text>
              {isSelected && renderResizeHandles(
                label.position.x, label.position.y, lw, lh,
                label.position.x + lw / 2, label.position.y - 20
              )}
            </g>
          );
        })}

        {/* Connecting indicator */}
        {connectingFrom && (
          <text x={10} y={20} fontSize={12} fill="#f59e0b" fontFamily="sans-serif">
            Click another icon to connect
          </text>
        )}
      </svg>

      {/* Text editing overlay */}
      {editingLabelId && textInputPos && (
        <div
          style={{
            position: 'absolute',
            left: textInputPos.x,
            top: textInputPos.y,
            zIndex: 100,
          }}
        >
          <input
            autoFocus
            value={editingText}
            onChange={e => setEditingText(e.target.value)}
            onBlur={handleTextSubmit}
            onKeyDown={e => {
              if (e.key === 'Enter') handleTextSubmit();
              if (e.key === 'Escape') {
                setEditingLabelId(null);
                setEditingText('');
                setTextInputPos(null);
              }
            }}
            style={{
              fontSize: `16px`,
              color: drawColor,
              background: 'rgba(15,23,42,0.85)',
              border: '1px solid #3b82f6',
              borderRadius: 4,
              padding: '2px 6px',
              outline: 'none',
              minWidth: 80,
            }}
          />
        </div>
      )}
    </div>
  );
}
