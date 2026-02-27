import { useState, useCallback } from 'react';

export type ToolType = 'select' | 'draw' | 'shape' | 'text' | 'icon';
export type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'arrow' | 'line' | 'star' | 'diamond' | 'hexagon';

export interface Position {
  x: number;
  y: number;
}

export interface FreehandPath {
  id: string;
  points: Position[];
  color: string;
  strokeWidth: number;
}

export interface CanvasShape {
  id: string;
  shapeType: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
}

export interface CanvasTextLabel {
  id: string;
  content: string;
  position: Position;
  fontSize: number;
  color: string;
}

export interface CanvasIcon {
  id: string;
  iconPath: string;
  iconName: string;
  position: Position;
  size: number;
}

type HistoryEntry =
  | { type: 'addPath'; pathId: string }
  | { type: 'addShape'; shapeId: string }
  | { type: 'moveShape'; shapeId: string; prevX: number; prevY: number }
  | { type: 'resizeShape'; shapeId: string; prev: { x: number; y: number; width: number; height: number } }
  | { type: 'addText'; textId: string }
  | { type: 'moveText'; textId: string; prevPosition: Position }
  | { type: 'addIcon'; iconId: string }
  | { type: 'moveIcon'; iconId: string; prevPosition: Position }
  | { type: 'resizeIcon'; iconId: string; prevSize: number; prevPosition: Position }
  | { type: 'deleteElement'; elementType: string; element: FreehandPath | CanvasShape | CanvasTextLabel | CanvasIcon };

const MAX_HISTORY = 20;

export function useCanvasState() {
  const [paths, setPaths] = useState<FreehandPath[]>([]);
  const [shapes, setShapes] = useState<CanvasShape[]>([]);
  const [textLabels, setTextLabels] = useState<CanvasTextLabel[]>([]);
  const [icons, setIcons] = useState<CanvasIcon[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const pushHistory = useCallback((entry: HistoryEntry) => {
    setHistory(prev => {
      const next = [...prev, entry];
      return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
    });
  }, []);

  const addPath = useCallback((path: FreehandPath) => {
    setPaths(prev => [...prev, path]);
    pushHistory({ type: 'addPath', pathId: path.id });
  }, [pushHistory]);

  const addShape = useCallback((shape: CanvasShape) => {
    setShapes(prev => [...prev, shape]);
    pushHistory({ type: 'addShape', shapeId: shape.id });
  }, [pushHistory]);

  const updateShapePosition = useCallback((shapeId: string, x: number, y: number) => {
    setShapes(prev => {
      const shape = prev.find(s => s.id === shapeId);
      if (shape) pushHistory({ type: 'moveShape', shapeId, prevX: shape.x, prevY: shape.y });
      return prev.map(s => s.id === shapeId ? { ...s, x, y } : s);
    });
  }, [pushHistory]);

  const updateShapeGeometry = useCallback((shapeId: string, x: number, y: number, width: number, height: number) => {
    setShapes(prev => {
      const shape = prev.find(s => s.id === shapeId);
      if (shape) pushHistory({ type: 'resizeShape', shapeId, prev: { x: shape.x, y: shape.y, width: shape.width, height: shape.height } });
      return prev.map(s => s.id === shapeId ? { ...s, x, y, width, height } : s);
    });
  }, [pushHistory]);

  const deleteShape = useCallback((shapeId: string) => {
    setShapes(prev => {
      const shape = prev.find(s => s.id === shapeId);
      if (shape) pushHistory({ type: 'deleteElement', elementType: 'shape', element: shape });
      return prev.filter(s => s.id !== shapeId);
    });
  }, [pushHistory]);

  const addTextLabel = useCallback((label: CanvasTextLabel) => {
    setTextLabels(prev => [...prev, label]);
    pushHistory({ type: 'addText', textId: label.id });
  }, [pushHistory]);

  const updateTextPosition = useCallback((textId: string, position: Position) => {
    setTextLabels(prev => {
      const label = prev.find(l => l.id === textId);
      if (label) pushHistory({ type: 'moveText', textId, prevPosition: { ...label.position } });
      return prev.map(l => l.id === textId ? { ...l, position } : l);
    });
  }, [pushHistory]);

  const updateTextContent = useCallback((textId: string, content: string) => {
    setTextLabels(prev => prev.map(l => l.id === textId ? { ...l, content } : l));
  }, []);

  const deleteText = useCallback((textId: string) => {
    setTextLabels(prev => {
      const label = prev.find(l => l.id === textId);
      if (label) pushHistory({ type: 'deleteElement', elementType: 'text', element: label });
      return prev.filter(l => l.id !== textId);
    });
  }, [pushHistory]);

  const addIcon = useCallback((icon: CanvasIcon) => {
    setIcons(prev => [...prev, icon]);
    pushHistory({ type: 'addIcon', iconId: icon.id });
  }, [pushHistory]);

  const updateIconPosition = useCallback((iconId: string, position: Position) => {
    setIcons(prev => {
      const icon = prev.find(i => i.id === iconId);
      if (icon) pushHistory({ type: 'moveIcon', iconId, prevPosition: { ...icon.position } });
      return prev.map(i => i.id === iconId ? { ...i, position } : i);
    });
  }, [pushHistory]);

  const updateIconSize = useCallback((iconId: string, size: number, position: Position) => {
    setIcons(prev => {
      const icon = prev.find(i => i.id === iconId);
      if (icon) pushHistory({ type: 'resizeIcon', iconId, prevSize: icon.size, prevPosition: { ...icon.position } });
      return prev.map(i => i.id === iconId ? { ...i, size, position } : i);
    });
  }, [pushHistory]);

  const deleteIcon = useCallback((iconId: string) => {
    setIcons(prev => {
      const icon = prev.find(i => i.id === iconId);
      if (icon) pushHistory({ type: 'deleteElement', elementType: 'icon', element: icon });
      return prev.filter(i => i.id !== iconId);
    });
  }, [pushHistory]);

  const deletePath = useCallback((pathId: string) => {
    setPaths(prev => {
      const path = prev.find(p => p.id === pathId);
      if (path) pushHistory({ type: 'deleteElement', elementType: 'path', element: path });
      return prev.filter(p => p.id !== pathId);
    });
  }, [pushHistory]);

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      const newHistory = prev.slice(0, -1);

      switch (last.type) {
        case 'addPath':
          setPaths(ps => ps.filter(p => p.id !== last.pathId));
          break;
        case 'addShape':
          setShapes(ss => ss.filter(s => s.id !== last.shapeId));
          break;
        case 'moveShape':
          setShapes(ss => ss.map(s => s.id === last.shapeId ? { ...s, x: last.prevX, y: last.prevY } : s));
          break;
        case 'resizeShape':
          setShapes(ss => ss.map(s => s.id === last.shapeId ? { ...s, ...last.prev } : s));
          break;
        case 'addText':
          setTextLabels(ls => ls.filter(l => l.id !== last.textId));
          break;
        case 'moveText':
          setTextLabels(ls => ls.map(l => l.id === last.textId ? { ...l, position: last.prevPosition } : l));
          break;
        case 'addIcon':
          setIcons(is => is.filter(i => i.id !== last.iconId));
          break;
        case 'moveIcon':
          setIcons(is => is.map(i => i.id === last.iconId ? { ...i, position: last.prevPosition } : i));
          break;
        case 'resizeIcon':
          setIcons(is => is.map(i => i.id === last.iconId ? { ...i, size: last.prevSize, position: last.prevPosition } : i));
          break;
        case 'deleteElement': {
          const el = last.element;
          if (last.elementType === 'path') setPaths(ps => [...ps, el as FreehandPath]);
          else if (last.elementType === 'shape') setShapes(ss => [...ss, el as CanvasShape]);
          else if (last.elementType === 'text') setTextLabels(ls => [...ls, el as CanvasTextLabel]);
          else if (last.elementType === 'icon') setIcons(is => [...is, el as CanvasIcon]);
          break;
        }
      }

      return newHistory;
    });
  }, []);

  const clearAll = useCallback(() => {
    setPaths([]);
    setShapes([]);
    setTextLabels([]);
    setIcons([]);
    setHistory([]);
  }, []);

  return {
    paths,
    shapes,
    textLabels,
    icons,
    addPath,
    addShape,
    updateShapePosition,
    updateShapeGeometry,
    deleteShape,
    addTextLabel,
    updateTextPosition,
    updateTextContent,
    deleteText,
    addIcon,
    updateIconPosition,
    updateIconSize,
    deleteIcon,
    deletePath,
    undo,
    clearAll,
    canUndo: history.length > 0,
  };
}
