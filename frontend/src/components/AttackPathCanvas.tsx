import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  useAttackPathState,
  CanvasIcon,
  CanvasConnection,
  FreehandDrawing,
  CanvasLine,
  CanvasTextLabel,
  CanvasImage,
  CanvasBoxShape,
  CanvasDottedConnection,
  Position,
  ToolType,
} from '../hooks/useAttackPathState';
import AttackPathIcon, { IconType } from './AttackPathIcon';
import AttackPathConnector from './AttackPathConnector';

interface AttackPathCanvasProps {
  activeTool: ToolType;
  drawColor: string;
  strokeWidth: number;
  state: ReturnType<typeof useAttackPathState>;
  onIconSelect?: (iconId: string | null) => void;
  selectedIconId?: string | null;
}

const ICON_SIZE = 56;

export default function AttackPathCanvas({
  activeTool,
  drawColor,
  strokeWidth,
  state,
  onIconSelect,
  selectedIconId,
}: AttackPathCanvasProps) {
  const {
    icons,
    connections,
    freehandDrawings,
    lines,
    textLabels,
    images,
    boxShapes,
    dottedConnections,
    addIcon,
    updateIconPosition,
    removeIcon,
    addConnection,
    removeConnection,
    updateConnectionRotation,
    addFreehandDrawing,
    onRemoveDrawing,
    addLine,
    addTextLabel,
    updateTextLabelPosition,
    updateImagePosition,
    addBoxShape,
    removeBoxShape,
    addDottedConnection,
    removeDottedConnection,
  } = state;

  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Drag state for icons (image only)
  const [draggingIconId, setDraggingIconId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });

  // Drag state for text labels
  const [draggingLabelId, setDraggingLabelId] = useState<string | null>(null);
  const [labelDragOffset, setLabelDragOffset] = useState<Position>({ x: 0, y: 0 });

  // Drag state for images
  const [draggingImageId, setDraggingImageId] = useState<string | null>(null);
  const [imageDragOffset, setImageDragOffset] = useState<Position>({ x: 0, y: 0 });

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Position[]>([]);

  // Line drawing state
  const [isDrawingLine, setIsDrawingLine] = useState(false);
  const [lineStart, setLineStart] = useState<Position | null>(null);
  const [linePreview, setLinePreview] = useState<Position | null>(null);

  // Box drawing state
  const [isDrawingBox, setIsDrawingBox] = useState(false);
  const [boxStart, setBoxStart] = useState<Position | null>(null);
  const [boxPreview, setBoxPreview] = useState<Position | null>(null);

  // Connection state
  const [connectingFromId, setConnectingFromId] = useState<string | null>(null);

  // Dotted connector state
  const [dottedConnectingFromId, setDottedConnectingFromId] = useState<string | null>(null);

  // Selected connection
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [selectedDottedConnectionId, setSelectedDottedConnectionId] = useState<string | null>(null);

  // Drop target for drag-from-toolbar
  const [isDragOver, setIsDragOver] = useState(false);

  const getCanvasPos = useCallback((e: React.MouseEvent | MouseEvent): Position => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  // ── Icon drag (image only) ──────────────────────────────────────────────
  const handleIconMouseDown = useCallback((e: React.MouseEvent, iconId: string) => {
    if (activeTool !== 'select') return;
    e.stopPropagation();
    e.preventDefault();
    const icon = icons.find(i => i.id === iconId);
    if (!icon) return;
    const pos = getCanvasPos(e);
    setDraggingIconId(iconId);
    setDragOffset({ x: pos.x - icon.position.x, y: pos.y - icon.position.y });
    onIconSelect?.(iconId);
    setSelectedConnectionId(null);
    setSelectedDottedConnectionId(null);
  }, [activeTool, icons, getCanvasPos, onIconSelect]);

  // ── Text label drag ─────────────────────────────────────────────────────
  const handleLabelMouseDown = useCallback((e: React.MouseEvent, labelId: string) => {
    if (activeTool !== 'select') return;
    e.stopPropagation();
    e.preventDefault();
    const label = textLabels.find(l => l.id === labelId);
    if (!label) return;
    const pos = getCanvasPos(e);
    setDraggingLabelId(labelId);
    setLabelDragOffset({ x: pos.x - label.position.x, y: pos.y - label.position.y });
    onIconSelect?.(null);
    setSelectedConnectionId(null);
    setSelectedDottedConnectionId(null);
  }, [activeTool, textLabels, getCanvasPos, onIconSelect]);

  // ── Uploaded image drag ─────────────────────────────────────────────────
  const handleImageMouseDown = useCallback((e: React.MouseEvent, imageId: string) => {
    if (activeTool !== 'select') return;
    e.stopPropagation();
    e.preventDefault();
    const image = images.find(img => img.id === imageId);
    if (!image) return;
    const pos = getCanvasPos(e);
    setDraggingImageId(imageId);
    setImageDragOffset({ x: pos.x - image.position.x, y: pos.y - image.position.y });
    onIconSelect?.(null);
    setSelectedConnectionId(null);
    setSelectedDottedConnectionId(null);
  }, [activeTool, images, getCanvasPos, onIconSelect]);

  // ── Mouse move ──────────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const pos = getCanvasPos(e);

    if (draggingIconId) {
      updateIconPosition(draggingIconId, {
        x: pos.x - dragOffset.x,
        y: pos.y - dragOffset.y,
      });
      return;
    }

    if (draggingLabelId) {
      updateTextLabelPosition(draggingLabelId, {
        x: pos.x - labelDragOffset.x,
        y: pos.y - labelDragOffset.y,
      });
      return;
    }

    if (draggingImageId) {
      updateImagePosition(draggingImageId, {
        x: pos.x - imageDragOffset.x,
        y: pos.y - imageDragOffset.y,
      });
      return;
    }

    if (isDrawing && activeTool === 'draw') {
      setCurrentPath(prev => [...prev, pos]);
      return;
    }

    if (isDrawingLine && (activeTool === 'line' || activeTool === 'arrow')) {
      setLinePreview(pos);
      return;
    }

    if (isDrawingBox && activeTool === 'box') {
      setBoxPreview(pos);
    }
  }, [
    draggingIconId, dragOffset, updateIconPosition,
    draggingLabelId, labelDragOffset, updateTextLabelPosition,
    draggingImageId, imageDragOffset, updateImagePosition,
    isDrawing, activeTool,
    isDrawingLine,
    isDrawingBox,
    getCanvasPos,
  ]);

  // ── Mouse up ────────────────────────────────────────────────────────────
  const handleMouseUp = useCallback(() => {
    if (draggingIconId) {
      setDraggingIconId(null);
      return;
    }
    if (draggingLabelId) {
      setDraggingLabelId(null);
      return;
    }
    if (draggingImageId) {
      setDraggingImageId(null);
      return;
    }
    if (isDrawing && currentPath.length > 1) {
      addFreehandDrawing({
        id: `drawing-${Date.now()}`,
        points: currentPath,
        color: drawColor,
        strokeWidth,
      });
    }
    setIsDrawing(false);
    setCurrentPath([]);
  }, [
    draggingIconId, draggingLabelId, draggingImageId,
    isDrawing, currentPath, addFreehandDrawing, drawColor, strokeWidth,
  ]);

  // ── Canvas mouse down ───────────────────────────────────────────────────
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    const pos = getCanvasPos(e);

    if (activeTool === 'draw') {
      setIsDrawing(true);
      setCurrentPath([pos]);
      return;
    }

    if (activeTool === 'line' || activeTool === 'arrow') {
      setIsDrawingLine(true);
      setLineStart(pos);
      setLinePreview(pos);
      return;
    }

    if (activeTool === 'box') {
      setIsDrawingBox(true);
      setBoxStart(pos);
      setBoxPreview(pos);
      return;
    }

    if (activeTool === 'text') {
      const id = `label-${Date.now()}`;
      addTextLabel({
        id,
        content: 'Text',
        position: pos,
        fontSize: 14,
        color: drawColor,
        fontWeight: 'normal',
      });
      return;
    }

    if (activeTool === 'select') {
      onIconSelect?.(null);
      setSelectedConnectionId(null);
      setSelectedDottedConnectionId(null);
    }
  }, [activeTool, getCanvasPos, addTextLabel, drawColor, onIconSelect]);

  // ── Canvas mouse up (line/box finish) ───────────────────────────────────
  const handleCanvasMouseUp = useCallback((e: React.MouseEvent) => {
    if (isDrawingLine && lineStart) {
      const pos = getCanvasPos(e);
      if (Math.abs(pos.x - lineStart.x) > 5 || Math.abs(pos.y - lineStart.y) > 5) {
        addLine({
          id: `line-${Date.now()}`,
          startPosition: lineStart,
          endPosition: pos,
          color: drawColor,
          strokeWidth,
          isArrow: activeTool === 'arrow',
        });
      }
      setIsDrawingLine(false);
      setLineStart(null);
      setLinePreview(null);
    }

    if (isDrawingBox && boxStart) {
      const pos = getCanvasPos(e);
      const w = pos.x - boxStart.x;
      const h = pos.y - boxStart.y;
      if (Math.abs(w) > 5 && Math.abs(h) > 5) {
        const x = w < 0 ? pos.x : boxStart.x;
        const y = h < 0 ? pos.y : boxStart.y;
        addBoxShape({
          id: `box-${Date.now()}`,
          position: { x, y },
          dimensions: { width: Math.abs(w), height: Math.abs(h) },
          strokeColor: drawColor,
          strokeWidth,
        });
      }
      setIsDrawingBox(false);
      setBoxStart(null);
      setBoxPreview(null);
    }

    handleMouseUp();
  }, [
    isDrawingLine, lineStart, getCanvasPos, addLine, drawColor, strokeWidth, activeTool,
    isDrawingBox, boxStart, addBoxShape,
    handleMouseUp,
  ]);

  // ── Drag-and-drop from toolbar ──────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const iconType = e.dataTransfer.getData('iconType');
    const iconName = e.dataTransfer.getData('iconName');
    if (!iconType) return;
    const pos = getCanvasPos(e as unknown as React.MouseEvent);
    const id = `icon-${Date.now()}`;
    addIcon({
      id,
      iconType,
      position: { x: pos.x - ICON_SIZE / 2, y: pos.y - ICON_SIZE / 2 },
      name: iconName || iconType,
    });
  }, [getCanvasPos, addIcon]);

  // ── Connect tool ────────────────────────────────────────────────────────
  const handleIconConnectClick = useCallback((iconId: string) => {
    if (activeTool === 'connect') {
      if (!connectingFromId) {
        setConnectingFromId(iconId);
      } else if (connectingFromId !== iconId) {
        addConnection({
          id: `conn-${Date.now()}`,
          sourceId: connectingFromId,
          targetId: iconId,
          connectionType: 'arrow',
          color: drawColor,
        });
        setConnectingFromId(null);
      }
      return;
    }

    if (activeTool === 'dottedConnector') {
      if (!dottedConnectingFromId) {
        setDottedConnectingFromId(iconId);
      } else if (dottedConnectingFromId !== iconId) {
        addDottedConnection({
          id: `dotted-${Date.now()}`,
          sourceId: dottedConnectingFromId,
          targetId: iconId,
          color: drawColor,
          strokeWidth,
        });
        setDottedConnectingFromId(null);
      }
      return;
    }
  }, [activeTool, connectingFromId, addConnection, drawColor, dottedConnectingFromId, addDottedConnection, strokeWidth]);

  // Reset connecting state when tool changes
  useEffect(() => {
    setConnectingFromId(null);
    setDottedConnectingFromId(null);
  }, [activeTool]);

  // ── Keyboard: delete selected ───────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIconId) {
          removeIcon(selectedIconId);
          onIconSelect?.(null);
        }
        if (selectedConnectionId) {
          removeConnection(selectedConnectionId);
          setSelectedConnectionId(null);
        }
        if (selectedDottedConnectionId) {
          removeDottedConnection(selectedDottedConnectionId);
          setSelectedDottedConnectionId(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIconId, selectedConnectionId, selectedDottedConnectionId, removeIcon, removeConnection, removeDottedConnection, onIconSelect]);

  // ── Helper: get icon center ─────────────────────────────────────────────
  const getIconCenter = useCallback((iconId: string): Position | null => {
    const icon = icons.find(i => i.id === iconId);
    if (!icon) return null;
    return {
      x: icon.position.x + ICON_SIZE / 2,
      y: icon.position.y + ICON_SIZE / 2,
    };
  }, [icons]);

  // ── Build SVG path from freehand points ─────────────────────────────────
  const buildPath = (points: Position[]) => {
    if (points.length < 2) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  };

  // ── Box preview rect ─────────────────────────────────────────────────────
  const getBoxPreviewRect = () => {
    if (!boxStart || !boxPreview) return null;
    const x = Math.min(boxStart.x, boxPreview.x);
    const y = Math.min(boxStart.y, boxPreview.y);
    const w = Math.abs(boxPreview.x - boxStart.x);
    const h = Math.abs(boxPreview.y - boxStart.y);
    return { x, y, w, h };
  };

  const boxPreviewRect = getBoxPreviewRect();

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full overflow-hidden"
      style={{ background: '#ffffff', cursor: activeTool === 'draw' ? 'crosshair' : activeTool === 'box' ? 'crosshair' : activeTool === 'text' ? 'text' : 'default' }}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onMouseLeave={handleMouseUp}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag-over overlay */}
      {isDragOver && (
        <div className="absolute inset-0 border-2 border-dashed border-primary/50 bg-primary/5 pointer-events-none z-50 rounded" />
      )}

      {/* ── Layer 1: Uploaded images (bottom) ─────────────────────────── */}
      {images.map(img => (
        <img
          key={img.id}
          src={img.url}
          alt={img.name}
          style={{
            position: 'absolute',
            left: img.position.x,
            top: img.position.y,
            width: img.size.width,
            height: img.size.height,
            cursor: activeTool === 'select' ? 'move' : 'default',
            userSelect: 'none',
            zIndex: 1,
          }}
          draggable={false}
          onMouseDown={e => handleImageMouseDown(e, img.id)}
        />
      ))}

      {/* ── Layer 2: Lines / SVG drawings ─────────────────────────────── */}
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 2 }}
      >
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="oklch(0.65 0.18 150)" />
          </marker>
          <marker id="arrowhead-dotted" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="oklch(0.50 0.20 30)" />
          </marker>
        </defs>

        {/* Committed lines */}
        {lines.map(line => {
          const dx = line.endPosition.x - line.startPosition.x;
          const dy = line.endPosition.y - line.startPosition.y;
          const angle = Math.atan2(dy, dx);
          const arrowSize = 10;
          const arrowPoint1X = line.endPosition.x - arrowSize * Math.cos(angle - Math.PI / 6);
          const arrowPoint1Y = line.endPosition.y - arrowSize * Math.sin(angle - Math.PI / 6);
          const arrowPoint2X = line.endPosition.x - arrowSize * Math.cos(angle + Math.PI / 6);
          const arrowPoint2Y = line.endPosition.y - arrowSize * Math.sin(angle + Math.PI / 6);
          return (
            <g key={line.id}>
              <line
                x1={line.startPosition.x}
                y1={line.startPosition.y}
                x2={line.endPosition.x}
                y2={line.endPosition.y}
                stroke={line.color}
                strokeWidth={line.strokeWidth}
              />
              {line.isArrow && (
                <polygon
                  points={`${line.endPosition.x},${line.endPosition.y} ${arrowPoint1X},${arrowPoint1Y} ${arrowPoint2X},${arrowPoint2Y}`}
                  fill={line.color}
                />
              )}
            </g>
          );
        })}

        {/* Line preview */}
        {isDrawingLine && lineStart && linePreview && (
          <line
            x1={lineStart.x}
            y1={lineStart.y}
            x2={linePreview.x}
            y2={linePreview.y}
            stroke={drawColor}
            strokeWidth={strokeWidth}
            strokeDasharray="4,4"
            opacity={0.7}
          />
        )}

        {/* Box shapes (committed) */}
        {boxShapes.map(box => (
          <rect
            key={box.id}
            x={box.position.x}
            y={box.position.y}
            width={box.dimensions.width}
            height={box.dimensions.height}
            fill="none"
            stroke={box.strokeColor}
            strokeWidth={box.strokeWidth}
            rx={2}
          />
        ))}

        {/* Box preview */}
        {isDrawingBox && boxPreviewRect && (
          <rect
            x={boxPreviewRect.x}
            y={boxPreviewRect.y}
            width={boxPreviewRect.w}
            height={boxPreviewRect.h}
            fill="none"
            stroke={drawColor}
            strokeWidth={strokeWidth}
            strokeDasharray="4,4"
            opacity={0.7}
            rx={2}
          />
        )}
      </svg>

      {/* ── Layer 3: Icon images ───────────────────────────────────────── */}
      {icons.map(icon => {
        const isConnectingSource =
          (activeTool === 'connect' && connectingFromId === icon.id) ||
          (activeTool === 'dottedConnector' && dottedConnectingFromId === icon.id);
        return (
          <div
            key={icon.id}
            style={{
              position: 'absolute',
              left: icon.position.x,
              top: icon.position.y,
              width: ICON_SIZE,
              height: ICON_SIZE,
              cursor: activeTool === 'select' ? 'move' : (activeTool === 'connect' || activeTool === 'dottedConnector') ? 'pointer' : 'default',
              zIndex: 3,
              outline: isConnectingSource ? '2px solid oklch(0.55 0.25 250)' : selectedIconId === icon.id ? '2px solid oklch(0.65 0.18 150)' : 'none',
              borderRadius: 4,
            }}
            onMouseDown={e => handleIconMouseDown(e, icon.id)}
            onClick={() => handleIconConnectClick(icon.id)}
          >
            <AttackPathIcon iconType={icon.iconType as IconType} size={ICON_SIZE} />
          </div>
        );
      })}

      {/* ── Layer 4: Connections SVG ───────────────────────────────────── */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 4, pointerEvents: 'none' }}
      >
        <defs>
          <marker id="arrowhead2" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="oklch(0.65 0.18 150)" />
          </marker>
        </defs>
        <g style={{ pointerEvents: 'all' }}>
          {/* Solid connections */}
          {connections.map(conn => {
            const src = getIconCenter(conn.sourceId);
            const tgt = getIconCenter(conn.targetId);
            if (!src || !tgt) return null;
            return (
              <AttackPathConnector
                key={conn.id}
                id={conn.id}
                sourceX={src.x}
                sourceY={src.y}
                targetX={tgt.x}
                targetY={tgt.y}
                rotation={conn.rotation ?? 0}
                isSelected={selectedConnectionId === conn.id}
                isDotted={false}
                onClick={id => {
                  if (activeTool === 'select') {
                    setSelectedConnectionId(prev => prev === id ? null : id);
                    setSelectedDottedConnectionId(null);
                    onIconSelect?.(null);
                  }
                }}
              />
            );
          })}

          {/* Dotted connections */}
          {dottedConnections.map(conn => {
            const src = getIconCenter(conn.sourceId);
            const tgt = getIconCenter(conn.targetId);
            if (!src || !tgt) return null;
            return (
              <AttackPathConnector
                key={conn.id}
                id={conn.id}
                sourceX={src.x}
                sourceY={src.y}
                targetX={tgt.x}
                targetY={tgt.y}
                rotation={0}
                isSelected={selectedDottedConnectionId === conn.id}
                isDotted={true}
                onClick={id => {
                  if (activeTool === 'select') {
                    setSelectedDottedConnectionId(prev => prev === id ? null : id);
                    setSelectedConnectionId(null);
                    onIconSelect?.(null);
                  }
                }}
              />
            );
          })}
        </g>
      </svg>

      {/* ── Layer 5: Text labels + icon name labels ────────────────────── */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
        {/* Icon name labels */}
        {icons.map(icon => (
          <div
            key={`label-${icon.id}`}
            style={{
              position: 'absolute',
              left: icon.position.x,
              top: icon.position.y + ICON_SIZE + 2,
              width: ICON_SIZE,
              textAlign: 'center',
              fontSize: 11,
              color: '#333333',
              fontWeight: 500,
              pointerEvents: 'none',
              userSelect: 'none',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {icon.name}
          </div>
        ))}

        {/* User text labels */}
        {textLabels.map(label => (
          <div
            key={label.id}
            style={{
              position: 'absolute',
              left: label.position.x,
              top: label.position.y,
              fontSize: label.fontSize,
              color: label.color,
              fontWeight: label.fontWeight,
              cursor: activeTool === 'select' ? 'move' : 'default',
              pointerEvents: activeTool === 'select' ? 'all' : 'none',
              userSelect: 'none',
              padding: '2px 4px',
              border: '1px dashed transparent',
            }}
            onMouseDown={e => handleLabelMouseDown(e, label.id)}
          >
            {label.content}
          </div>
        ))}
      </div>

      {/* ── Layer 6: Freehand drawings (top) ──────────────────────────── */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 6 }}
      >
        {freehandDrawings.map(drawing => (
          <path
            key={drawing.id}
            d={buildPath(drawing.points)}
            stroke={drawing.color}
            strokeWidth={drawing.strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {isDrawing && currentPath.length > 1 && (
          <path
            d={buildPath(currentPath)}
            stroke={drawColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.7}
          />
        )}
      </svg>

      {/* ── Status hints ──────────────────────────────────────────────── */}
      {activeTool === 'connect' && connectingFromId && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none z-50">
          Click a target icon to connect
        </div>
      )}
      {activeTool === 'dottedConnector' && !dottedConnectingFromId && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none z-50">
          Click a source icon to start dotted connector
        </div>
      )}
      {activeTool === 'dottedConnector' && dottedConnectingFromId && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none z-50">
          Click a target icon to complete dotted connector
        </div>
      )}
    </div>
  );
}
