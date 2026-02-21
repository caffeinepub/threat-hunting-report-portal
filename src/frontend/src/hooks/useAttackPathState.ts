import { useState } from 'react';
import { IconType } from '@/components/AttackPathToolbar';
import { ExternalBlob } from '@/backend';

export interface PlacedIcon {
  id: string;
  type: IconType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  name?: string;
  labelId?: string; // Associated text label ID
}

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  color?: string;
  rotation?: number;
}

export interface DrawingPath {
  id: string;
  type: 'freehand' | 'line' | 'arrow';
  points: { x: number; y: number }[];
  color?: string;
  strokeWidth?: number;
  rotation?: number;
}

export interface TextLabel {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize?: number;
  fontWeight?: string;
  rotation?: number;
  width?: number;
  height?: number;
  iconId?: string; // Associated icon ID
}

export interface UploadedImage {
  id: string;
  file: ExternalBlob;
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  description: string;
}

export type DrawingTool = 'freehand' | 'line' | 'arrow' | 'text' | 'eraser' | null;

interface AttackPathState {
  placedIcons: PlacedIcon[];
  connections: Connection[];
  drawings: DrawingPath[];
  textLabels: TextLabel[];
  images: UploadedImage[];
}

export function useAttackPathState() {
  const [placedIcons, setPlacedIcons] = useState<PlacedIcon[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [drawings, setDrawings] = useState<DrawingPath[]>([]);
  const [textLabels, setTextLabels] = useState<TextLabel[]>([]);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [activeDrawingTool, setActiveDrawingTool] = useState<DrawingTool>(null);
  const [textColor, setTextColor] = useState<string>('#000000');
  const [fontSize, setFontSize] = useState<number>(16);
  const [history, setHistory] = useState<AttackPathState[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedElementType, setSelectedElementType] = useState<'icon' | 'text' | 'arrow' | 'image' | null>(null);
  const [selectedArrowId, setSelectedArrowId] = useState<string | null>(null);
  const maxHistorySize = 50;

  const saveToHistory = () => {
    const currentState: AttackPathState = {
      placedIcons: [...placedIcons],
      connections: [...connections],
      drawings: [...drawings],
      textLabels: [...textLabels],
      images: [...images],
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
    setImages(previousState.images);
    setHistory((prev) => prev.slice(0, -1));
  };

  const canUndo = history.length > 0;

  const addIcon = (type: IconType, x: number, y: number) => {
    saveToHistory();
    const iconId = `icon-${Date.now()}-${Math.random()}`;
    const labelId = `text-${Date.now()}-${Math.random()}`;
    
    const newIcon: PlacedIcon = {
      id: iconId,
      type,
      x,
      y,
      width: 48,
      height: 48,
      labelId,
    };
    
    const newLabel: TextLabel = {
      id: labelId,
      text: type,
      x: x,
      y: y + 60,
      color: textColor,
      fontSize: 14,
      fontWeight: 'normal',
      iconId,
    };
    
    setPlacedIcons((prev) => [...prev, newIcon]);
    setTextLabels((prev) => [...prev, newLabel]);
  };

  const moveIcon = (id: string, x: number, y: number) => {
    const icon = placedIcons.find((i) => i.id === id);
    if (!icon) return;
    
    const oldX = icon.x;
    const oldY = icon.y;
    const deltaX = x - oldX;
    const deltaY = y - oldY;
    
    setPlacedIcons((prev) =>
      prev.map((icon) => (icon.id === id ? { ...icon, x, y } : icon))
    );
    
    // Move associated label
    if (icon.labelId) {
      setTextLabels((prev) =>
        prev.map((label) =>
          label.id === icon.labelId
            ? { ...label, x: label.x + deltaX, y: label.y + deltaY }
            : label
        )
      );
    }
  };

  const resizeIcon = (id: string, width: number, height: number) => {
    setPlacedIcons((prev) =>
      prev.map((icon) => (icon.id === id ? { ...icon, width, height } : icon))
    );
  };

  const removeIcon = (id: string) => {
    saveToHistory();
    const icon = placedIcons.find((i) => i.id === id);
    
    setPlacedIcons((prev) => prev.filter((icon) => icon.id !== id));
    
    // Remove associated label
    if (icon?.labelId) {
      setTextLabels((prev) => prev.filter((label) => label.id !== icon.labelId));
    }
    
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
        color: 'oklch(0.65 0.18 150)',
        rotation: 0,
      };
      setConnections((prev) => [...prev, newConnection]);
    }
  };

  const removeConnection = (id: string) => {
    saveToHistory();
    setConnections((prev) => prev.filter((conn) => conn.id !== id));
  };

  const updateArrowRotation = (id: string, rotation: number) => {
    setConnections((prev) =>
      prev.map((conn) => (conn.id === id ? { ...conn, rotation } : conn))
    );
  };

  const addDrawing = (type: 'freehand' | 'line' | 'arrow', points: { x: number; y: number }[]) => {
    saveToHistory();
    const newDrawing: DrawingPath = {
      id: `drawing-${Date.now()}-${Math.random()}`,
      type,
      points,
      color: textColor,
      strokeWidth: 2,
      rotation: 0,
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

  const addTextLabel = (text: string, x: number, y: number, color: string, fontSize: number) => {
    saveToHistory();
    const newLabel: TextLabel = {
      id: `text-${Date.now()}-${Math.random()}`,
      text,
      x,
      y,
      color,
      fontSize,
      fontWeight: 'normal',
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

  const addImage = (file: ExternalBlob, x: number, y: number, name: string, description: string = '') => {
    saveToHistory();
    const newImage: UploadedImage = {
      id: `image-${Date.now()}-${Math.random()}`,
      file,
      x,
      y,
      width: 200,
      height: 200,
      name,
      description,
    };
    setImages((prev) => [...prev, newImage]);
  };

  const moveImage = (id: string, x: number, y: number) => {
    setImages((prev) =>
      prev.map((image) => (image.id === id ? { ...image, x, y } : image))
    );
  };

  const resizeImage = (id: string, width: number, height: number) => {
    setImages((prev) =>
      prev.map((image) => (image.id === id ? { ...image, width, height } : image))
    );
  };

  const removeImage = (id: string) => {
    saveToHistory();
    setImages((prev) => prev.filter((image) => image.id !== id));
  };

  const clearAll = () => {
    saveToHistory();
    setPlacedIcons([]);
    setConnections([]);
    setDrawings([]);
    setTextLabels([]);
    setImages([]);
  };

  const restoreState = (state: AttackPathState) => {
    saveToHistory();
    setPlacedIcons(state.placedIcons);
    setConnections(state.connections);
    setDrawings(state.drawings);
    setTextLabels(state.textLabels);
    setImages(state.images);
  };

  return {
    placedIcons,
    connections,
    drawings,
    textLabels,
    images,
    activeDrawingTool,
    setActiveDrawingTool,
    textColor,
    setTextColor,
    fontSize,
    setFontSize,
    selectedElementId,
    setSelectedElementId,
    selectedElementType,
    setSelectedElementType,
    selectedArrowId,
    setSelectedArrowId,
    addIcon,
    moveIcon,
    resizeIcon,
    removeIcon,
    addConnection,
    removeConnection,
    updateArrowRotation,
    addDrawing,
    removeDrawing,
    moveDrawing,
    addTextLabel,
    removeTextLabel,
    updateTextLabel,
    addImage,
    moveImage,
    resizeImage,
    removeImage,
    clearAll,
    undo,
    canUndo,
    restoreState,
  };
}
