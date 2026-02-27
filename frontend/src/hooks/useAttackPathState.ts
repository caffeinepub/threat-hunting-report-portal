import { useState, useCallback } from 'react';
import { ExternalBlob } from '../backend';

export type IconType =
  | 'attacker'
  | 'phishing'
  | 'computer'
  | 'server'
  | 'domain'
  | 'firewall'
  | 'cloudserver'
  | 'multipleservers'
  | 'multiplecomputers'
  | 'router'
  | 'user'
  | 'multipleusers'
  | 'email'
  | 'file'
  | 'pdf'
  | 'word'
  | 'excel'
  | 'ppt'
  | 'zip'
  | 'exe'
  | 'dll'
  | 'script'
  | 'csv'
  | 'c2'
  | 'scheduledtask'
  | 'backdoor'
  | 'powershell'
  | 'javascript'
  | 'webbrowser';

export interface CanvasIcon {
  id: string;
  type: IconType;
  x: number;
  y: number;
  name: string;
  width?: number;
  height?: number;
  rotation?: number;
}

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  connectionType: string;
  color: string;
  rotation?: number;
}

export interface DrawingPath {
  id: string;
  type: 'freehand' | 'line' | 'arrow';
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
}

export interface TextLabel {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
}

export interface CanvasImage {
  id: string;
  blob: ExternalBlob;
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  description: string;
}

export interface SelectedElements {
  icons: Set<string>;
  textLabels: Set<string>;
  images: Set<string>;
}

interface AttackPathState {
  icons: CanvasIcon[];
  connections: Connection[];
  drawings: DrawingPath[];
  textLabels: TextLabel[];
  images: CanvasImage[];
  selectedElements: SelectedElements;
}

type HistoryEntry = Omit<AttackPathState, 'selectedElements'>;

export function useAttackPathState() {
  const emptySelected: SelectedElements = {
    icons: new Set(),
    textLabels: new Set(),
    images: new Set(),
  };

  const [state, setState] = useState<AttackPathState>({
    icons: [],
    connections: [],
    drawings: [],
    textLabels: [],
    images: [],
    selectedElements: emptySelected,
  });

  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const pushHistory = useCallback((current: AttackPathState) => {
    setHistory(prev => [
      ...prev.slice(-49),
      {
        icons: current.icons,
        connections: current.connections,
        drawings: current.drawings,
        textLabels: current.textLabels,
        images: current.images,
      },
    ]);
  }, []);

  const onAddIcon = useCallback(
    (type: IconType, x: number, y: number, name: string) => {
      setState(prev => {
        pushHistory(prev);
        return {
          ...prev,
          icons: [
            ...prev.icons,
            {
              id: `icon-${Date.now()}-${Math.random()}`,
              type,
              x,
              y,
              name,
              width: 56,
              height: 56,
              rotation: 0,
            },
          ],
        };
      });
    },
    [pushHistory]
  );

  const onMoveIcon = useCallback(
    (id: string, x: number, y: number) => {
      setState(prev => ({
        ...prev,
        icons: prev.icons.map(icon => (icon.id === id ? { ...icon, x, y } : icon)),
      }));
    },
    []
  );

  const onResizeIcon = useCallback(
    (id: string, width: number, height: number) => {
      setState(prev => ({
        ...prev,
        icons: prev.icons.map(icon => (icon.id === id ? { ...icon, width, height } : icon)),
      }));
    },
    []
  );

  const onRotateIcon = useCallback(
    (id: string, rotation: number) => {
      setState(prev => ({
        ...prev,
        icons: prev.icons.map(icon => (icon.id === id ? { ...icon, rotation } : icon)),
      }));
    },
    []
  );

  const onRemoveIcon = useCallback(
    (id: string) => {
      setState(prev => {
        pushHistory(prev);
        return {
          ...prev,
          icons: prev.icons.filter(icon => icon.id !== id),
          connections: prev.connections.filter(
            conn => conn.sourceId !== id && conn.targetId !== id
          ),
        };
      });
    },
    [pushHistory]
  );

  const onAddConnection = useCallback(
    (sourceId: string, targetId: string, connectionType: string, color: string) => {
      setState(prev => {
        pushHistory(prev);
        return {
          ...prev,
          connections: [
            ...prev.connections,
            {
              id: `conn-${Date.now()}`,
              sourceId,
              targetId,
              connectionType,
              color,
            },
          ],
        };
      });
    },
    [pushHistory]
  );

  const onRemoveConnection = useCallback(
    (id: string) => {
      setState(prev => {
        pushHistory(prev);
        return {
          ...prev,
          connections: prev.connections.filter(conn => conn.id !== id),
        };
      });
    },
    [pushHistory]
  );

  const onAddDrawing = useCallback(
    (type: 'freehand' | 'line' | 'arrow', points: { x: number; y: number }[], color: string, strokeWidth: number) => {
      setState(prev => {
        pushHistory(prev);
        return {
          ...prev,
          drawings: [
            ...prev.drawings,
            {
              id: `drawing-${Date.now()}-${Math.random()}`,
              type,
              points,
              color,
              strokeWidth,
            },
          ],
        };
      });
    },
    [pushHistory]
  );

  const onRemoveDrawing = useCallback(
    (id: string) => {
      setState(prev => {
        pushHistory(prev);
        return {
          ...prev,
          drawings: prev.drawings.filter(d => d.id !== id),
        };
      });
    },
    [pushHistory]
  );

  const onAddTextLabel = useCallback(
    (text: string, x: number, y: number, color: string, fontSize: number) => {
      setState(prev => {
        pushHistory(prev);
        return {
          ...prev,
          textLabels: [
            ...prev.textLabels,
            {
              id: `text-${Date.now()}-${Math.random()}`,
              text,
              x,
              y,
              color,
              fontSize,
            },
          ],
        };
      });
    },
    [pushHistory]
  );

  const onMoveTextLabel = useCallback(
    (id: string, x: number, y: number) => {
      setState(prev => ({
        ...prev,
        textLabels: prev.textLabels.map(label => (label.id === id ? { ...label, x, y } : label)),
      }));
    },
    []
  );

  const onRemoveTextLabel = useCallback(
    (id: string) => {
      setState(prev => {
        pushHistory(prev);
        return {
          ...prev,
          textLabels: prev.textLabels.filter(label => label.id !== id),
        };
      });
    },
    [pushHistory]
  );

  const onAddImage = useCallback(
    async (file: File, x: number, y: number, name: string, description: string) => {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes);
      setState(prev => {
        pushHistory(prev);
        return {
          ...prev,
          images: [
            ...prev.images,
            {
              id: `image-${Date.now()}-${Math.random()}`,
              blob,
              x,
              y,
              width: 200,
              height: 200,
              name,
              description,
            },
          ],
        };
      });
    },
    [pushHistory]
  );

  const onMoveImage = useCallback(
    (id: string, x: number, y: number) => {
      setState(prev => ({
        ...prev,
        images: prev.images.map(img => (img.id === id ? { ...img, x, y } : img)),
      }));
    },
    []
  );

  const onResizeImage = useCallback(
    (id: string, width: number, height: number) => {
      setState(prev => ({
        ...prev,
        images: prev.images.map(img => (img.id === id ? { ...img, width, height } : img)),
      }));
    },
    []
  );

  const onRemoveImage = useCallback(
    (id: string) => {
      setState(prev => {
        pushHistory(prev);
        return {
          ...prev,
          images: prev.images.filter(img => img.id !== id),
        };
      });
    },
    [pushHistory]
  );

  const onSetSelectedElements = useCallback(
    (selected: SelectedElements) => {
      setState(prev => ({ ...prev, selectedElements: selected }));
    },
    []
  );

  const onUndo = useCallback(() => {
    setHistory(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setState(current => ({
        ...last,
        selectedElements: current.selectedElements,
      }));
      return prev.slice(0, -1);
    });
  }, []);

  const onClear = useCallback(() => {
    setState(prev => {
      pushHistory(prev);
      return {
        icons: [],
        connections: [],
        drawings: [],
        textLabels: [],
        images: [],
        selectedElements: emptySelected,
      };
    });
  }, [pushHistory]);

  return {
    ...state,
    onAddIcon,
    onMoveIcon,
    onResizeIcon,
    onRotateIcon,
    onRemoveIcon,
    onAddConnection,
    onRemoveConnection,
    onAddDrawing,
    onRemoveDrawing,
    onAddTextLabel,
    onMoveTextLabel,
    onRemoveTextLabel,
    onAddImage,
    onMoveImage,
    onResizeImage,
    onRemoveImage,
    onSetSelectedElements,
    onUndo,
    onClear,
  };
}
