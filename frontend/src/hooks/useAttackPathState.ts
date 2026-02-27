import { useState, useCallback } from 'react';
import { IconType } from '../components/AttackPathIcon';
import type { DiagramState, TextLabel as BackendTextLabel, Image as BackendImage } from '../backend';

export type { IconType };

export interface Position {
  x: number;
  y: number;
}

export interface PlacedIcon {
  id: string;
  iconType: IconType;
  position: Position;
  name: string;
  size: number;
  rotation: number;
}

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  connectionType: string;
  color: string;
}

export interface FreehandDrawing {
  points: Position[];
  color: string;
  strokeWidth: number;
}

export interface LineElement {
  startPosition: Position;
  endPosition: Position;
  color: string;
  strokeWidth: number;
  isArrow: boolean;
}

export interface TextLabel {
  id: string;
  content: string;
  position: Position;
  fontSize: number;
  color: string;
  fontWeight: string;
  width: number;
  height: number;
  rotation: number;
}

export interface ImageElement {
  id: string;
  url: string;
  position: Position;
  width: number;
  height: number;
  name: string;
  description: string;
  rotation: number;
}

export interface DiagramStateLocal {
  icons: PlacedIcon[];
  connections: Connection[];
  freehandDrawings: FreehandDrawing[];
  lines: LineElement[];
  textLabels: TextLabel[];
  images: ImageElement[];
}

const DEFAULT_TEXT_WIDTH = 160;
const DEFAULT_TEXT_HEIGHT = 60;
const DEFAULT_IMAGE_WIDTH = 150;
const DEFAULT_IMAGE_HEIGHT = 150;

function createEmptyState(): DiagramStateLocal {
  return {
    icons: [],
    connections: [],
    freehandDrawings: [],
    lines: [],
    textLabels: [],
    images: [],
  };
}

export function useAttackPathState() {
  const [state, setState] = useState<DiagramStateLocal>(createEmptyState());
  const [history, setHistory] = useState<DiagramStateLocal[]>([createEmptyState()]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const pushHistory = useCallback((newState: DiagramStateLocal) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newState);
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
    setState(newState);
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setState(history[newIndex]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setState(history[newIndex]);
    }
  }, [history, historyIndex]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const addIcon = useCallback((iconType: IconType, position: Position) => {
    const newIcon: PlacedIcon = {
      id: `icon-${Date.now()}-${Math.random()}`,
      iconType,
      position,
      name: iconType,
      size: 64,
      rotation: 0,
    };
    const newState = { ...state, icons: [...state.icons, newIcon] };
    pushHistory(newState);
  }, [state, pushHistory]);

  const updateIconPosition = useCallback((id: string, position: Position) => {
    const newState = {
      ...state,
      icons: state.icons.map(icon => icon.id === id ? { ...icon, position } : icon),
    };
    pushHistory(newState);
  }, [state, pushHistory]);

  const updateIconPositionImmediate = useCallback((id: string, position: Position) => {
    setState(prev => ({
      ...prev,
      icons: prev.icons.map(icon => icon.id === id ? { ...icon, position } : icon),
    }));
  }, []);

  const updateIconRotation = useCallback((id: string, rotation: number) => {
    const newState = {
      ...state,
      icons: state.icons.map(icon => icon.id === id ? { ...icon, rotation } : icon),
    };
    pushHistory(newState);
  }, [state, pushHistory]);

  const updateIconRotationImmediate = useCallback((id: string, rotation: number) => {
    setState(prev => ({
      ...prev,
      icons: prev.icons.map(icon => icon.id === id ? { ...icon, rotation } : icon),
    }));
  }, []);

  const updateIconSize = useCallback((id: string, size: number) => {
    const newState = {
      ...state,
      icons: state.icons.map(icon => icon.id === id ? { ...icon, size } : icon),
    };
    pushHistory(newState);
  }, [state, pushHistory]);

  const updateIconSizeImmediate = useCallback((id: string, size: number) => {
    setState(prev => ({
      ...prev,
      icons: prev.icons.map(icon => icon.id === id ? { ...icon, size } : icon),
    }));
  }, []);

  const deleteIcon = useCallback((id: string) => {
    const newState = {
      ...state,
      icons: state.icons.filter(icon => icon.id !== id),
      connections: state.connections.filter(c => c.sourceId !== id && c.targetId !== id),
    };
    pushHistory(newState);
  }, [state, pushHistory]);

  const addConnection = useCallback((sourceId: string, targetId: string, color: string = '#ef4444') => {
    const newConnection: Connection = {
      id: `conn-${Date.now()}-${Math.random()}`,
      sourceId,
      targetId,
      connectionType: 'arrow',
      color,
    };
    const newState = { ...state, connections: [...state.connections, newConnection] };
    pushHistory(newState);
  }, [state, pushHistory]);

  const deleteConnection = useCallback((id: string) => {
    const newState = {
      ...state,
      connections: state.connections.filter(c => c.id !== id),
    };
    pushHistory(newState);
  }, [state, pushHistory]);

  const addFreehandDrawing = useCallback((drawing: FreehandDrawing) => {
    const newState = { ...state, freehandDrawings: [...state.freehandDrawings, drawing] };
    pushHistory(newState);
  }, [state, pushHistory]);

  const deleteFreehandDrawing = useCallback((idx: number) => {
    const newState = {
      ...state,
      freehandDrawings: state.freehandDrawings.filter((_, i) => i !== idx),
    };
    pushHistory(newState);
  }, [state, pushHistory]);

  const addLine = useCallback((line: LineElement) => {
    const newState = { ...state, lines: [...state.lines, line] };
    pushHistory(newState);
  }, [state, pushHistory]);

  const deleteLine = useCallback((idx: number) => {
    const newState = {
      ...state,
      lines: state.lines.filter((_, i) => i !== idx),
    };
    pushHistory(newState);
  }, [state, pushHistory]);

  const addTextLabel = useCallback((content: string, position: Position, fontSize: number = 16, color: string = '#1e293b', fontWeight: string = 'normal') => {
    const newLabel: TextLabel = {
      id: `text-${Date.now()}-${Math.random()}`,
      content,
      position,
      fontSize,
      color,
      fontWeight,
      width: DEFAULT_TEXT_WIDTH,
      height: DEFAULT_TEXT_HEIGHT,
      rotation: 0,
    };
    const newState = { ...state, textLabels: [...state.textLabels, newLabel] };
    pushHistory(newState);
  }, [state, pushHistory]);

  const updateTextLabel = useCallback((id: string, updates: Partial<TextLabel>) => {
    const newState = {
      ...state,
      textLabels: state.textLabels.map(label => label.id === id ? { ...label, ...updates } : label),
    };
    pushHistory(newState);
  }, [state, pushHistory]);

  const updateTextLabelImmediate = useCallback((id: string, updates: Partial<TextLabel>) => {
    setState(prev => ({
      ...prev,
      textLabels: prev.textLabels.map(label => label.id === id ? { ...label, ...updates } : label),
    }));
  }, []);

  const deleteTextLabel = useCallback((id: string) => {
    const newState = {
      ...state,
      textLabels: state.textLabels.filter(label => label.id !== id),
    };
    pushHistory(newState);
  }, [state, pushHistory]);

  const addImage = useCallback((url: string, position: Position, name: string = '', description: string = '') => {
    const newImage: ImageElement = {
      id: `img-${Date.now()}-${Math.random()}`,
      url,
      position,
      width: DEFAULT_IMAGE_WIDTH,
      height: DEFAULT_IMAGE_HEIGHT,
      name,
      description,
      rotation: 0,
    };
    const newState = { ...state, images: [...state.images, newImage] };
    pushHistory(newState);
  }, [state, pushHistory]);

  const updateImage = useCallback((id: string, updates: Partial<ImageElement>) => {
    const newState = {
      ...state,
      images: state.images.map(img => img.id === id ? { ...img, ...updates } : img),
    };
    pushHistory(newState);
  }, [state, pushHistory]);

  const updateImageImmediate = useCallback((id: string, updates: Partial<ImageElement>) => {
    setState(prev => ({
      ...prev,
      images: prev.images.map(img => img.id === id ? { ...img, ...updates } : img),
    }));
  }, []);

  const deleteImage = useCallback((id: string) => {
    const newState = {
      ...state,
      images: state.images.filter(img => img.id !== id),
    };
    pushHistory(newState);
  }, [state, pushHistory]);

  const clearDiagram = useCallback(() => {
    const empty = createEmptyState();
    pushHistory(empty);
  }, [pushHistory]);

  const loadDiagram = useCallback((backendState: DiagramState) => {
    const loaded: DiagramStateLocal = {
      icons: backendState.icons.map(icon => ({
        id: icon.id,
        iconType: icon.iconType as IconType,
        position: { x: icon.position.x, y: icon.position.y },
        name: icon.name,
        size: 64,
        rotation: 0,
      })),
      connections: backendState.connections.map((conn, idx) => ({
        id: `conn-loaded-${idx}`,
        sourceId: conn.sourceId,
        targetId: conn.targetId,
        connectionType: conn.connectionType,
        color: conn.color,
      })),
      freehandDrawings: backendState.freehandDrawings.map(d => ({
        points: d.points.map(p => ({ x: p.x, y: p.y })),
        color: d.color,
        strokeWidth: d.strokeWidth,
      })),
      lines: backendState.lines.map(l => ({
        startPosition: { x: l.startPosition.x, y: l.startPosition.y },
        endPosition: { x: l.endPosition.x, y: l.endPosition.y },
        color: l.color,
        strokeWidth: l.strokeWidth,
        isArrow: l.isArrow,
      })),
      textLabels: backendState.textLabels.map((label, idx) => ({
        id: `text-loaded-${idx}`,
        content: label.content,
        position: { x: label.position.x, y: label.position.y },
        fontSize: label.fontSize,
        color: label.color,
        fontWeight: label.fontWeight,
        width: DEFAULT_TEXT_WIDTH,
        height: DEFAULT_TEXT_HEIGHT,
        rotation: 0,
      })),
      images: backendState.images.map(img => ({
        id: img.id,
        url: img.file.getDirectURL(),
        position: { x: img.position.x, y: img.position.y },
        width: img.size.width || DEFAULT_IMAGE_WIDTH,
        height: img.size.height || DEFAULT_IMAGE_HEIGHT,
        name: img.name,
        description: img.description,
        rotation: 0,
      })),
    };
    const empty = createEmptyState();
    setHistory([empty, loaded]);
    setHistoryIndex(1);
    setState(loaded);
  }, []);

  const serializeForBackend = useCallback((): DiagramState => {
    return {
      icons: state.icons.map(icon => ({
        id: icon.id,
        iconType: icon.iconType,
        position: { x: icon.position.x, y: icon.position.y },
        name: icon.name,
      })),
      connections: state.connections.map(conn => ({
        sourceId: conn.sourceId,
        targetId: conn.targetId,
        connectionType: conn.connectionType,
        color: conn.color,
      })),
      freehandDrawings: state.freehandDrawings.map(d => ({
        points: d.points.map(p => ({ x: p.x, y: p.y })),
        color: d.color,
        strokeWidth: d.strokeWidth,
      })),
      lines: state.lines.map(l => ({
        startPosition: { x: l.startPosition.x, y: l.startPosition.y },
        endPosition: { x: l.endPosition.x, y: l.endPosition.y },
        color: l.color,
        strokeWidth: l.strokeWidth,
        isArrow: l.isArrow,
      })),
      textLabels: state.textLabels.map(label => ({
        content: label.content,
        position: { x: label.position.x, y: label.position.y },
        fontSize: label.fontSize,
        color: label.color,
        fontWeight: label.fontWeight,
      })),
      images: state.images.map(img => ({
        id: img.id,
        file: { getDirectURL: () => img.url, getBytes: async () => new Uint8Array(), withUploadProgress: () => ({ getDirectURL: () => img.url, getBytes: async () => new Uint8Array(), withUploadProgress: () => ({} as any), static: {} as any }) } as any,
        position: { x: img.position.x, y: img.position.y },
        size: { width: img.width, height: img.height },
        name: img.name,
        description: img.description,
      })),
      lastModified: BigInt(Date.now()),
    };
  }, [state]);

  return {
    state,
    canUndo,
    canRedo,
    undo,
    redo,
    addIcon,
    updateIconPosition,
    updateIconPositionImmediate,
    updateIconRotation,
    updateIconRotationImmediate,
    updateIconSize,
    updateIconSizeImmediate,
    deleteIcon,
    addConnection,
    deleteConnection,
    addFreehandDrawing,
    deleteFreehandDrawing,
    addLine,
    deleteLine,
    addTextLabel,
    updateTextLabel,
    updateTextLabelImmediate,
    deleteTextLabel,
    addImage,
    updateImage,
    updateImageImmediate,
    deleteImage,
    clearDiagram,
    loadDiagram,
    serializeForBackend,
  };
}
