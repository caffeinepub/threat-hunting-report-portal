import React, { useRef, useState, useCallback, useEffect } from 'react';
import { ToolType, ShapeType, FreehandPath, CanvasShape, CanvasTextLabel, CanvasIcon, Position } from '../../hooks/useCanvasState';
import { drawShape } from '../../utils/shapeRenderer';

interface CanvasWorkspaceProps {
  activeTool: ToolType;
  activeShape: ShapeType;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  fontSize: number;
  textColor: string;
  canvasState: {
    paths: FreehandPath[];
    shapes: CanvasShape[];
    textLabels: CanvasTextLabel[];
    icons: CanvasIcon[];
    addPath: (path: FreehandPath) => void;
    addShape: (shape: CanvasShape) => void;
    updateShapePosition: (id: string, x: number, y: number) => void;
    updateShapeGeometry: (id: string, x: number, y: number, w: number, h: number) => void;
    deleteShape: (id: string) => void;
    addTextLabel: (label: CanvasTextLabel) => void;
    updateTextPosition: (id: string, pos: Position) => void;
    updateTextContent: (id: string, content: string) => void;
    deleteText: (id: string) => void;
    addIcon: (icon: CanvasIcon) => void;
    updateIconPosition: (id: string, pos: Position) => void;
    updateIconSize: (id: string, size: number, pos: Position) => void;
    deleteIcon: (id: string) => void;
    deletePath: (id: string) => void;
    undo: () => void;
  };
}

type SelectedElement =
  | { type: 'shape'; id: string }
  | { type: 'text'; id: string }
  | { type: 'icon'; id: string }
  | null;

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | null;

export default function CanvasWorkspace({
  activeTool,
  activeShape,
  strokeColor,
  fillColor,
  strokeWidth,
  fontSize,
  textColor,
  canvasState,
}: CanvasWorkspaceProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Position[]>([]);

  // Shape drawing state
  const [isDrawingShape, setIsDrawingShape] = useState(false);
  const [shapeStart, setShapeStart] = useState<Position | null>(null);
  const [shapePreview, setShapePreview] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Selection & drag state
  const [selectedElement, setSelectedElement] = useState<SelectedElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null);
  const [resizeStart, setResizeStart] = useState<{ mouseX: number; mouseY: number; origX: number; origY: number; origW: number; origH: number } | null>(null);

  // Text editing state
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextPos, setEditingTextPos] = useState<Position | null>(null);
  const [editingTextValue, setEditingTextValue] = useState('');
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  const getSvgPoint = useCallback((e: React.MouseEvent | MouseEvent): Position => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        canvasState.undo();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (editingTextId) return;
        if (selectedElement) {
          if (selectedElement.type === 'shape') canvasState.deleteShape(selectedElement.id);
          else if (selectedElement.type === 'text') canvasState.deleteText(selectedElement.id);
          else if (selectedElement.type === 'icon') canvasState.deleteIcon(selectedElement.id);
          setSelectedElement(null);
        }
      }
      if (e.key === 'Escape') {
        setSelectedElement(null);
        setEditingTextId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canvasState, selectedElement, editingTextId]);

  // Focus text input when editing
  useEffect(() => {
    if (editingTextId && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [editingTextId]);

  const pathToD = (points: Position[]): string => {
    if (points.length < 2) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
    return d;
  };

  // ---- Mouse Handlers ----

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const pt = getSvgPoint(e);

    if (activeTool === 'draw') {
      setIsDrawing(true);
      setCurrentPath([pt]);
      setSelectedElement(null);
      return;
    }

    if (activeTool === 'shape') {
      setIsDrawingShape(true);
      setShapeStart(pt);
      setShapePreview({ x: pt.x, y: pt.y, width: 0, height: 0 });
      setSelectedElement(null);
      return;
    }

    if (activeTool === 'text') {
      // Start new text label
      setEditingTextPos(pt);
      setEditingTextId(`text-new-${Date.now()}`);
      setEditingTextValue('');
      setSelectedElement(null);
      return;
    }

    if (activeTool === 'select') {
      setSelectedElement(null);
    }
  }, [activeTool, getSvgPoint]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const pt = getSvgPoint(e);

    if (activeTool === 'draw' && isDrawing) {
      setCurrentPath(prev => [...prev, pt]);
      return;
    }

    if (activeTool === 'shape' && isDrawingShape && shapeStart) {
      const x = Math.min(pt.x, shapeStart.x);
      const y = Math.min(pt.y, shapeStart.y);
      const width = Math.abs(pt.x - shapeStart.x);
      const height = Math.abs(pt.y - shapeStart.y);
      setShapePreview({ x, y, width, height });
      return;
    }

    if (isDragging && selectedElement) {
      if (selectedElement.type === 'shape') {
        canvasState.updateShapePosition(selectedElement.id, pt.x - dragOffset.x, pt.y - dragOffset.y);
      } else if (selectedElement.type === 'text') {
        canvasState.updateTextPosition(selectedElement.id, { x: pt.x - dragOffset.x, y: pt.y - dragOffset.y });
      } else if (selectedElement.type === 'icon') {
        canvasState.updateIconPosition(selectedElement.id, { x: pt.x - dragOffset.x, y: pt.y - dragOffset.y });
      }
      return;
    }

    if (resizeHandle && resizeStart && selectedElement?.type === 'shape') {
      const shape = canvasState.shapes.find(s => s.id === selectedElement.id);
      if (!shape) return;
      const dx = pt.x - resizeStart.mouseX;
      const dy = pt.y - resizeStart.mouseY;
      let { origX: nx, origY: ny, origW: nw, origH: nh } = resizeStart;

      if (resizeHandle === 'se') { nw = Math.max(10, resizeStart.origW + dx); nh = Math.max(10, resizeStart.origH + dy); }
      else if (resizeHandle === 'sw') { nx = resizeStart.origX + dx; nw = Math.max(10, resizeStart.origW - dx); nh = Math.max(10, resizeStart.origH + dy); }
      else if (resizeHandle === 'ne') { ny = resizeStart.origY + dy; nw = Math.max(10, resizeStart.origW + dx); nh = Math.max(10, resizeStart.origH - dy); }
      else if (resizeHandle === 'nw') { nx = resizeStart.origX + dx; ny = resizeStart.origY + dy; nw = Math.max(10, resizeStart.origW - dx); nh = Math.max(10, resizeStart.origH - dy); }

      canvasState.updateShapeGeometry(selectedElement.id, nx, ny, nw, nh);
      return;
    }

    if (resizeHandle && resizeStart && selectedElement?.type === 'icon') {
      const icon = canvasState.icons.find(i => i.id === selectedElement.id);
      if (!icon) return;
      const dx = pt.x - resizeStart.mouseX;
      const dy = pt.y - resizeStart.mouseY;
      const delta = (dx + dy) / 2;
      const newSize = Math.max(16, resizeStart.origW + delta);
      const newPos = {
        x: resizeHandle === 'nw' || resizeHandle === 'sw' ? resizeStart.origX + (resizeStart.origW - newSize) : resizeStart.origX,
        y: resizeHandle === 'nw' || resizeHandle === 'ne' ? resizeStart.origY + (resizeStart.origW - newSize) : resizeStart.origY,
      };
      canvasState.updateIconSize(selectedElement.id, newSize, newPos);
      return;
    }
  }, [activeTool, isDrawing, isDrawingShape, shapeStart, isDragging, selectedElement, dragOffset, resizeHandle, resizeStart, canvasState, getSvgPoint]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (activeTool === 'draw' && isDrawing) {
      if (currentPath.length > 1) {
        canvasState.addPath({
          id: `path-${Date.now()}`,
          points: currentPath,
          color: strokeColor,
          strokeWidth,
        });
      }
      setIsDrawing(false);
      setCurrentPath([]);
      return;
    }

    if (activeTool === 'shape' && isDrawingShape && shapePreview) {
      if (shapePreview.width > 5 && shapePreview.height > 5) {
        canvasState.addShape({
          id: `shape-${Date.now()}`,
          shapeType: activeShape,
          x: shapePreview.x,
          y: shapePreview.y,
          width: shapePreview.width,
          height: shapePreview.height,
          strokeColor,
          fillColor,
          strokeWidth,
        });
      }
      setIsDrawingShape(false);
      setShapeStart(null);
      setShapePreview(null);
      return;
    }

    if (isDragging) {
      setIsDragging(false);
      return;
    }

    if (resizeHandle) {
      setResizeHandle(null);
      setResizeStart(null);
      return;
    }
  }, [activeTool, isDrawing, currentPath, isDrawingShape, shapePreview, isDragging, resizeHandle, strokeColor, fillColor, strokeWidth, activeShape, canvasState]);

  const handleShapeMouseDown = useCallback((e: React.MouseEvent, shapeId: string) => {
    if (activeTool !== 'select') return;
    e.stopPropagation();
    const pt = getSvgPoint(e);
    const shape = canvasState.shapes.find(s => s.id === shapeId);
    if (!shape) return;
    setSelectedElement({ type: 'shape', id: shapeId });
    setIsDragging(true);
    setDragOffset({ x: pt.x - shape.x, y: pt.y - shape.y });
  }, [activeTool, canvasState.shapes, getSvgPoint]);

  const handleTextMouseDown = useCallback((e: React.MouseEvent, textId: string) => {
    if (activeTool !== 'select') return;
    e.stopPropagation();
    const pt = getSvgPoint(e);
    const label = canvasState.textLabels.find(l => l.id === textId);
    if (!label) return;
    setSelectedElement({ type: 'text', id: textId });
    setIsDragging(true);
    setDragOffset({ x: pt.x - label.position.x, y: pt.y - label.position.y });
  }, [activeTool, canvasState.textLabels, getSvgPoint]);

  const handleIconMouseDown = useCallback((e: React.MouseEvent, iconId: string) => {
    if (activeTool !== 'select') return;
    e.stopPropagation();
    const pt = getSvgPoint(e);
    const icon = canvasState.icons.find(i => i.id === iconId);
    if (!icon) return;
    setSelectedElement({ type: 'icon', id: iconId });
    setIsDragging(true);
    setDragOffset({ x: pt.x - icon.position.x, y: pt.y - icon.position.y });
  }, [activeTool, canvasState.icons, getSvgPoint]);

  const handleResizeHandleMouseDown = useCallback((e: React.MouseEvent, handle: ResizeHandle, elementId: string, elementType: 'shape' | 'icon') => {
    e.stopPropagation();
    const pt = getSvgPoint(e);
    if (elementType === 'shape') {
      const shape = canvasState.shapes.find(s => s.id === elementId);
      if (!shape) return;
      setResizeHandle(handle);
      setResizeStart({ mouseX: pt.x, mouseY: pt.y, origX: shape.x, origY: shape.y, origW: shape.width, origH: shape.height });
    } else if (elementType === 'icon') {
      const icon = canvasState.icons.find(i => i.id === elementId);
      if (!icon) return;
      setResizeHandle(handle);
      setResizeStart({ mouseX: pt.x, mouseY: pt.y, origX: icon.position.x, origY: icon.position.y, origW: icon.size, origH: icon.size });
    }
  }, [canvasState.shapes, canvasState.icons, getSvgPoint]);

  const handleTextDoubleClick = useCallback((e: React.MouseEvent, textId: string) => {
    e.stopPropagation();
    const label = canvasState.textLabels.find(l => l.id === textId);
    if (!label) return;
    setEditingTextId(textId);
    setEditingTextPos(label.position);
    setEditingTextValue(label.content);
  }, [canvasState.textLabels]);

  const commitTextEdit = useCallback(() => {
    if (!editingTextId || !editingTextPos) return;
    const isNew = editingTextId.startsWith('text-new-');
    if (editingTextValue.trim()) {
      if (isNew) {
        canvasState.addTextLabel({
          id: `text-${Date.now()}`,
          content: editingTextValue,
          position: editingTextPos,
          fontSize,
          color: textColor,
        });
      } else {
        canvasState.updateTextContent(editingTextId, editingTextValue);
      }
    }
    setEditingTextId(null);
    setEditingTextPos(null);
    setEditingTextValue('');
  }, [editingTextId, editingTextPos, editingTextValue, fontSize, textColor, canvasState]);

  const getCursor = () => {
    if (activeTool === 'draw') return 'crosshair';
    if (activeTool === 'shape') return 'crosshair';
    if (activeTool === 'text') return 'text';
    if (isDragging) return 'grabbing';
    return 'default';
  };

  const HANDLE_SIZE = 8;

  const renderSelectionHandles = (x: number, y: number, w: number, h: number, elementId: string, elementType: 'shape' | 'icon') => {
    const handles: { handle: ResizeHandle; cx: number; cy: number }[] = [
      { handle: 'nw', cx: x, cy: y },
      { handle: 'ne', cx: x + w, cy: y },
      { handle: 'sw', cx: x, cy: y + h },
      { handle: 'se', cx: x + w, cy: y + h },
    ];
    return (
      <g>
        <rect x={x} y={y} width={w} height={h} fill="none" stroke="#2563eb" strokeWidth={1.5} strokeDasharray="4 2" />
        {handles.map(({ handle, cx, cy }) => (
          <rect
            key={handle}
            x={cx - HANDLE_SIZE / 2}
            y={cy - HANDLE_SIZE / 2}
            width={HANDLE_SIZE}
            height={HANDLE_SIZE}
            fill="white"
            stroke="#2563eb"
            strokeWidth={1.5}
            style={{ cursor: `${handle}-resize` }}
            onMouseDown={e => handleResizeHandleMouseDown(e, handle, elementId, elementType)}
          />
        ))}
      </g>
    );
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden"
      style={{ background: '#ffffff' }}
    >
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ cursor: getCursor(), userSelect: 'none', background: '#ffffff' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Freehand paths */}
        {canvasState.paths.map(path => (
          <path
            key={path.id}
            d={pathToD(path.points)}
            stroke={path.color}
            strokeWidth={path.strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* Current drawing path */}
        {isDrawing && currentPath.length > 1 && (
          <path
            d={pathToD(currentPath)}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Shapes */}
        {canvasState.shapes.map(shape => {
          const isSelected = selectedElement?.type === 'shape' && selectedElement.id === shape.id;
          return (
            <g key={shape.id}>
              {drawShape(shape)}
              <rect
                x={shape.x}
                y={shape.y}
                width={shape.width}
                height={shape.height}
                fill="transparent"
                stroke="none"
                style={{ cursor: activeTool === 'select' ? 'grab' : 'default' }}
                onMouseDown={e => handleShapeMouseDown(e, shape.id)}
              />
              {isSelected && renderSelectionHandles(shape.x, shape.y, shape.width, shape.height, shape.id, 'shape')}
            </g>
          );
        })}

        {/* Shape preview while drawing */}
        {isDrawingShape && shapePreview && shapePreview.width > 0 && shapePreview.height > 0 && (
          <g opacity={0.6}>
            {drawShape({
              id: 'preview',
              shapeType: activeShape,
              x: shapePreview.x,
              y: shapePreview.y,
              width: shapePreview.width,
              height: shapePreview.height,
              strokeColor,
              fillColor,
              strokeWidth,
            })}
          </g>
        )}

        {/* Text labels */}
        {canvasState.textLabels.map(label => {
          const isSelected = selectedElement?.type === 'text' && selectedElement.id === label.id;
          const isEditing = editingTextId === label.id;
          if (isEditing) return null;
          return (
            <g key={label.id}>
              <text
                x={label.position.x}
                y={label.position.y}
                fontSize={label.fontSize}
                fill={label.color}
                fontFamily="Inter, system-ui, sans-serif"
                style={{ cursor: activeTool === 'select' ? 'grab' : 'default', userSelect: 'none' }}
                onMouseDown={e => handleTextMouseDown(e, label.id)}
                onDoubleClick={e => handleTextDoubleClick(e, label.id)}
              >
                {label.content}
              </text>
              {isSelected && (
                <rect
                  x={label.position.x - 4}
                  y={label.position.y - label.fontSize - 2}
                  width={label.content.length * label.fontSize * 0.6 + 8}
                  height={label.fontSize + 8}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                />
              )}
            </g>
          );
        })}

        {/* Icons */}
        {canvasState.icons.map(icon => {
          const isSelected = selectedElement?.type === 'icon' && selectedElement.id === icon.id;
          return (
            <g key={icon.id}>
              <image
                href={icon.iconPath}
                x={icon.position.x}
                y={icon.position.y}
                width={icon.size}
                height={icon.size}
                style={{ cursor: activeTool === 'select' ? 'grab' : 'default' }}
                onMouseDown={e => handleIconMouseDown(e, icon.id)}
              />
              {isSelected && renderSelectionHandles(icon.position.x, icon.position.y, icon.size, icon.size, icon.id, 'icon')}
            </g>
          );
        })}
      </svg>

      {/* Text editing overlay */}
      {editingTextId && editingTextPos && (
        <textarea
          ref={textInputRef}
          value={editingTextValue}
          onChange={e => setEditingTextValue(e.target.value)}
          onBlur={commitTextEdit}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              commitTextEdit();
            }
            if (e.key === 'Escape') {
              setEditingTextId(null);
              setEditingTextPos(null);
              setEditingTextValue('');
            }
          }}
          style={{
            position: 'absolute',
            left: editingTextPos.x,
            top: editingTextPos.y - fontSize,
            fontSize: `${fontSize}px`,
            color: textColor,
            fontFamily: 'Inter, system-ui, sans-serif',
            background: 'rgba(255,255,255,0.9)',
            border: '1.5px dashed #2563eb',
            outline: 'none',
            padding: '2px 4px',
            minWidth: '80px',
            minHeight: `${fontSize + 8}px`,
            resize: 'none',
            overflow: 'hidden',
            lineHeight: '1.4',
            borderRadius: '2px',
          }}
          rows={1}
          placeholder="Type here..."
        />
      )}
    </div>
  );
}
