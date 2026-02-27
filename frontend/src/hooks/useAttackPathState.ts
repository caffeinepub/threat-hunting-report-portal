import { useState, useCallback } from 'react';

export interface Position {
  x: number;
  y: number;
}

export interface CanvasIcon {
  id: string;
  iconType: string;
  position: Position;
  name: string;
}

export interface CanvasConnection {
  id: string;
  sourceId: string;
  targetId: string;
  connectionType: string;
  color: string;
  rotation?: number;
}

export interface FreehandDrawing {
  id: string;
  points: Position[];
  color: string;
  strokeWidth: number;
}

export interface CanvasLine {
  id: string;
  startPosition: Position;
  endPosition: Position;
  color: string;
  strokeWidth: number;
  isArrow: boolean;
}

export interface CanvasTextLabel {
  id: string;
  content: string;
  position: Position;
  fontSize: number;
  color: string;
  fontWeight: string;
}

export interface CanvasImage {
  id: string;
  url: string;
  position: Position;
  size: { width: number; height: number };
  name: string;
  description: string;
}

export interface CanvasBoxShape {
  id: string;
  position: Position;
  dimensions: { width: number; height: number };
  strokeColor: string;
  strokeWidth: number;
}

export interface CanvasDottedConnection {
  id: string;
  sourceId: string;
  targetId: string;
  color: string;
  strokeWidth: number;
}

export type ToolType = 'select' | 'draw' | 'line' | 'arrow' | 'text' | 'eraser' | 'connect' | 'box' | 'dottedConnector';

type HistoryEntry =
  | { type: 'addIcon'; iconId: string }
  | { type: 'moveIcon'; iconId: string; prevPosition: Position }
  | { type: 'addConnection'; connectionId: string }
  | { type: 'addDrawing'; drawingId: string }
  | { type: 'removeDrawing'; drawing: FreehandDrawing }
  | { type: 'addLine'; lineId: string }
  | { type: 'addTextLabel'; labelId: string }
  | { type: 'moveTextLabel'; labelId: string; prevPosition: Position }
  | { type: 'addImage'; imageId: string }
  | { type: 'removeIcon'; icon: CanvasIcon }
  | { type: 'removeConnection'; connection: CanvasConnection }
  | { type: 'addBoxShape'; boxId: string }
  | { type: 'removeBoxShape'; box: CanvasBoxShape }
  | { type: 'addDottedConnection'; dottedConnectionId: string }
  | { type: 'removeDottedConnection'; dottedConnection: CanvasDottedConnection };

export function useAttackPathState() {
  const [icons, setIcons] = useState<CanvasIcon[]>([]);
  const [connections, setConnections] = useState<CanvasConnection[]>([]);
  const [freehandDrawings, setFreehandDrawings] = useState<FreehandDrawing[]>([]);
  const [lines, setLines] = useState<CanvasLine[]>([]);
  const [textLabels, setTextLabels] = useState<CanvasTextLabel[]>([]);
  const [images, setImages] = useState<CanvasImage[]>([]);
  const [boxShapes, setBoxShapes] = useState<CanvasBoxShape[]>([]);
  const [dottedConnections, setDottedConnections] = useState<CanvasDottedConnection[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const pushHistory = useCallback((entry: HistoryEntry) => {
    setHistory(prev => [...prev, entry]);
  }, []);

  const addIcon = useCallback((icon: CanvasIcon) => {
    setIcons(prev => [...prev, icon]);
    pushHistory({ type: 'addIcon', iconId: icon.id });
  }, [pushHistory]);

  const updateIconPosition = useCallback((iconId: string, newPosition: Position) => {
    setIcons(prev => {
      const icon = prev.find(i => i.id === iconId);
      if (icon) {
        pushHistory({ type: 'moveIcon', iconId, prevPosition: { ...icon.position } });
      }
      return prev.map(i => i.id === iconId ? { ...i, position: newPosition } : i);
    });
  }, [pushHistory]);

  const removeIcon = useCallback((iconId: string) => {
    setIcons(prev => {
      const icon = prev.find(i => i.id === iconId);
      if (icon) pushHistory({ type: 'removeIcon', icon });
      return prev.filter(i => i.id !== iconId);
    });
    setConnections(prev => prev.filter(c => c.sourceId !== iconId && c.targetId !== iconId));
    setDottedConnections(prev => prev.filter(c => c.sourceId !== iconId && c.targetId !== iconId));
  }, [pushHistory]);

  const addConnection = useCallback((connection: CanvasConnection) => {
    setConnections(prev => [...prev, connection]);
    pushHistory({ type: 'addConnection', connectionId: connection.id });
  }, [pushHistory]);

  const removeConnection = useCallback((connectionId: string) => {
    setConnections(prev => {
      const conn = prev.find(c => c.id === connectionId);
      if (conn) pushHistory({ type: 'removeConnection', connection: conn });
      return prev.filter(c => c.id !== connectionId);
    });
  }, [pushHistory]);

  const updateConnectionRotation = useCallback((connectionId: string, rotation: number) => {
    setConnections(prev => prev.map(c => c.id === connectionId ? { ...c, rotation } : c));
  }, []);

  const addFreehandDrawing = useCallback((drawing: FreehandDrawing) => {
    setFreehandDrawings(prev => [...prev, drawing]);
    pushHistory({ type: 'addDrawing', drawingId: drawing.id });
  }, [pushHistory]);

  const onRemoveDrawing = useCallback((drawingId: string) => {
    setFreehandDrawings(prev => {
      const drawing = prev.find(d => d.id === drawingId);
      if (drawing) pushHistory({ type: 'removeDrawing', drawing });
      return prev.filter(d => d.id !== drawingId);
    });
  }, [pushHistory]);

  const addLine = useCallback((line: CanvasLine) => {
    setLines(prev => [...prev, line]);
    pushHistory({ type: 'addLine', lineId: line.id });
  }, [pushHistory]);

  const addTextLabel = useCallback((label: CanvasTextLabel) => {
    setTextLabels(prev => [...prev, label]);
    pushHistory({ type: 'addTextLabel', labelId: label.id });
  }, [pushHistory]);

  const updateTextLabelPosition = useCallback((labelId: string, newPosition: Position) => {
    setTextLabels(prev => {
      const label = prev.find(l => l.id === labelId);
      if (label) {
        pushHistory({ type: 'moveTextLabel', labelId, prevPosition: { ...label.position } });
      }
      return prev.map(l => l.id === labelId ? { ...l, position: newPosition } : l);
    });
  }, [pushHistory]);

  const addImage = useCallback((image: CanvasImage) => {
    setImages(prev => [...prev, image]);
    pushHistory({ type: 'addImage', imageId: image.id });
  }, [pushHistory]);

  const updateImagePosition = useCallback((imageId: string, newPosition: Position) => {
    setImages(prev => prev.map(img => img.id === imageId ? { ...img, position: newPosition } : img));
  }, []);

  // Box shape methods
  const addBoxShape = useCallback((box: CanvasBoxShape) => {
    setBoxShapes(prev => [...prev, box]);
    pushHistory({ type: 'addBoxShape', boxId: box.id });
  }, [pushHistory]);

  const removeBoxShape = useCallback((boxId: string) => {
    setBoxShapes(prev => {
      const box = prev.find(b => b.id === boxId);
      if (box) pushHistory({ type: 'removeBoxShape', box });
      return prev.filter(b => b.id !== boxId);
    });
  }, [pushHistory]);

  // Dotted connection methods
  const addDottedConnection = useCallback((conn: CanvasDottedConnection) => {
    setDottedConnections(prev => [...prev, conn]);
    pushHistory({ type: 'addDottedConnection', dottedConnectionId: conn.id });
  }, [pushHistory]);

  const removeDottedConnection = useCallback((connId: string) => {
    setDottedConnections(prev => {
      const conn = prev.find(c => c.id === connId);
      if (conn) pushHistory({ type: 'removeDottedConnection', dottedConnection: conn });
      return prev.filter(c => c.id !== connId);
    });
  }, [pushHistory]);

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      const newHistory = prev.slice(0, -1);

      switch (last.type) {
        case 'addIcon':
          setIcons(icons => icons.filter(i => i.id !== last.iconId));
          break;
        case 'moveIcon':
          setIcons(icons => icons.map(i => i.id === last.iconId ? { ...i, position: last.prevPosition } : i));
          break;
        case 'removeIcon':
          setIcons(icons => [...icons, last.icon]);
          break;
        case 'addConnection':
          setConnections(conns => conns.filter(c => c.id !== last.connectionId));
          break;
        case 'removeConnection':
          setConnections(conns => [...conns, last.connection]);
          break;
        case 'addDrawing':
          setFreehandDrawings(drawings => drawings.filter(d => d.id !== last.drawingId));
          break;
        case 'removeDrawing':
          setFreehandDrawings(drawings => [...drawings, last.drawing]);
          break;
        case 'addLine':
          setLines(ls => ls.filter(l => l.id !== last.lineId));
          break;
        case 'addTextLabel':
          setTextLabels(labels => labels.filter(l => l.id !== last.labelId));
          break;
        case 'moveTextLabel':
          setTextLabels(labels => labels.map(l => l.id === last.labelId ? { ...l, position: last.prevPosition } : l));
          break;
        case 'addImage':
          setImages(imgs => imgs.filter(img => img.id !== last.imageId));
          break;
        case 'addBoxShape':
          setBoxShapes(boxes => boxes.filter(b => b.id !== last.boxId));
          break;
        case 'removeBoxShape':
          setBoxShapes(boxes => [...boxes, last.box]);
          break;
        case 'addDottedConnection':
          setDottedConnections(conns => conns.filter(c => c.id !== last.dottedConnectionId));
          break;
        case 'removeDottedConnection':
          setDottedConnections(conns => [...conns, last.dottedConnection]);
          break;
      }

      return newHistory;
    });
  }, []);

  const clearAll = useCallback(() => {
    setIcons([]);
    setConnections([]);
    setFreehandDrawings([]);
    setLines([]);
    setTextLabels([]);
    setImages([]);
    setBoxShapes([]);
    setDottedConnections([]);
    setHistory([]);
  }, []);

  const loadState = useCallback((state: {
    icons: CanvasIcon[];
    connections: CanvasConnection[];
    freehandDrawings: FreehandDrawing[];
    lines: CanvasLine[];
    textLabels: CanvasTextLabel[];
    images: CanvasImage[];
    boxShapes?: CanvasBoxShape[];
    dottedConnections?: CanvasDottedConnection[];
  }) => {
    setIcons(state.icons);
    setConnections(state.connections);
    setFreehandDrawings(state.freehandDrawings);
    setLines(state.lines);
    setTextLabels(state.textLabels);
    setImages(state.images);
    setBoxShapes(state.boxShapes ?? []);
    setDottedConnections(state.dottedConnections ?? []);
    setHistory([]);
  }, []);

  return {
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
    addImage,
    updateImagePosition,
    addBoxShape,
    removeBoxShape,
    addDottedConnection,
    removeDottedConnection,
    undo,
    clearAll,
    loadState,
  };
}
