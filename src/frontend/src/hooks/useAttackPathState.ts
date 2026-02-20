import { useState } from 'react';
import { IconType } from '@/components/AttackPathToolbar';

export interface PlacedIcon {
  id: string;
  type: IconType;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
}

export interface DrawingPath {
  id: string;
  type: 'freehand' | 'line' | 'arrow';
  points: { x: number; y: number }[];
}

export interface TextLabel {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  rotation?: number;
  width?: number;
  height?: number;
}

export type DrawingTool = 'freehand' | 'line' | 'arrow' | 'text' | 'eraser' | 'transform' | null;

interface AttackPathState {
  placedIcons: PlacedIcon[];
  connections: Connection[];
  drawings: DrawingPath[];
  textLabels: TextLabel[];
}

export function useAttackPathState() {
  const [placedIcons, setPlacedIcons] = useState<PlacedIcon[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [drawings, setDrawings] = useState<DrawingPath[]>([]);
  const [textLabels, setTextLabels] = useState<TextLabel[]>([]);
  const [activeDrawingTool, setActiveDrawingTool] = useState<DrawingTool>(null);
  const [textColor, setTextColor] = useState<string>('#000000');
  const [history, setHistory] = useState<AttackPathState[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedElementType, setSelectedElementType] = useState<'icon' | 'text' | null>(null);
  const maxHistorySize = 50;

  const saveToHistory = () => {
    const currentState: AttackPathState = {
      placedIcons: [...placedIcons],
      connections: [...connections],
      drawings: [...drawings],
      textLabels: [...textLabels],
    };
    setHistory((prev) => {
      const newHistory = [...prev, currentState];
      // Limit history size
      if (newHistory.length > maxHistorySize) {
        return newHistory.slice(1);
      }
      return newHistory;
    });
  };

  const undo = () => {
    if (history.length === 0) return;

    const previousState = history[history.length - 1];
    setPlacedIcons(previousState.placedIcons);
    setConnections(previousState.connections);
    setDrawings(previousState.drawings);
    setTextLabels(previousState.textLabels);
    setHistory((prev) => prev.slice(0, -1));
  };

  const canUndo = history.length > 0;

  const addIcon = (type: IconType, x: number, y: number) => {
    saveToHistory();
    const newIcon: PlacedIcon = {
      id: `icon-${Date.now()}-${Math.random()}`,
      type,
      x,
      y,
      width: 48,
      height: 48,
    };
    setPlacedIcons((prev) => [...prev, newIcon]);
  };

  const moveIcon = (id: string, x: number, y: number) => {
    setPlacedIcons((prev) =>
      prev.map((icon) => (icon.id === id ? { ...icon, x, y } : icon))
    );
  };

  const resizeIcon = (id: string, width: number, height: number) => {
    setPlacedIcons((prev) =>
      prev.map((icon) => (icon.id === id ? { ...icon, width, height } : icon))
    );
  };

  const removeIcon = (id: string) => {
    saveToHistory();
    setPlacedIcons((prev) => prev.filter((icon) => icon.id !== id));
    // Also remove connections involving this icon
    setConnections((prev) =>
      prev.filter((conn) => conn.sourceId !== id && conn.targetId !== id)
    );
  };

  const addConnection = (sourceId: string, targetId: string) => {
    // Check if connection already exists
    const exists = connections.some(
      (conn) =>
        (conn.sourceId === sourceId && conn.targetId === targetId) ||
        (conn.sourceId === targetId && conn.targetId === sourceId)
    );

    if (!exists) {
      saveToHistory();
      const newConnection: Connection = {
        id: `conn-${Date.now()}-${Math.random()}`,
        sourceId,
        targetId,
      };
      setConnections((prev) => [...prev, newConnection]);
    }
  };

  const removeConnection = (id: string) => {
    saveToHistory();
    setConnections((prev) => prev.filter((conn) => conn.id !== id));
  };

  const addDrawing = (type: 'freehand' | 'line' | 'arrow', points: { x: number; y: number }[]) => {
    saveToHistory();
    const newDrawing: DrawingPath = {
      id: `drawing-${Date.now()}-${Math.random()}`,
      type,
      points,
    };
    setDrawings((prev) => [...prev, newDrawing]);
  };

  const removeDrawing = (id: string) => {
    saveToHistory();
    setDrawings((prev) => prev.filter((drawing) => drawing.id !== id));
  };

  const moveDrawing = (id: string, offsetX: number, offsetY: number) => {
    setDrawings((prev) =>
      prev.map((drawing) => {
        if (drawing.id === id) {
          return {
            ...drawing,
            points: drawing.points.map((point) => ({
              x: point.x + offsetX,
              y: point.y + offsetY,
            })),
          };
        }
        return drawing;
      })
    );
  };

  const addTextLabel = (text: string, x: number, y: number, color: string) => {
    saveToHistory();
    const newLabel: TextLabel = {
      id: `text-${Date.now()}-${Math.random()}`,
      text,
      x,
      y,
      color,
      rotation: 0,
      width: undefined,
      height: undefined,
    };
    setTextLabels((prev) => [...prev, newLabel]);
  };

  const removeTextLabel = (id: string) => {
    saveToHistory();
    setTextLabels((prev) => prev.filter((label) => label.id !== id));
  };

  const updateTextLabel = (id: string, updates: Partial<TextLabel>) => {
    setTextLabels((prev) =>
      prev.map((label) => (label.id === id ? { ...label, ...updates } : label))
    );
  };

  const clearAll = () => {
    saveToHistory();
    setPlacedIcons([]);
    setConnections([]);
    setDrawings([]);
    setTextLabels([]);
  };

  const restoreState = (state: AttackPathState) => {
    saveToHistory();
    setPlacedIcons(state.placedIcons);
    setConnections(state.connections);
    setDrawings(state.drawings);
    setTextLabels(state.textLabels);
  };

  return {
    placedIcons,
    connections,
    drawings,
    textLabels,
    activeDrawingTool,
    setActiveDrawingTool,
    textColor,
    setTextColor,
    selectedElementId,
    setSelectedElementId,
    selectedElementType,
    setSelectedElementType,
    addIcon,
    moveIcon,
    resizeIcon,
    removeIcon,
    addConnection,
    removeConnection,
    addDrawing,
    removeDrawing,
    moveDrawing,
    addTextLabel,
    removeTextLabel,
    updateTextLabel,
    clearAll,
    undo,
    canUndo,
    restoreState,
  };
}
