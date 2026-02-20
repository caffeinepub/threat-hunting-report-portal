import { IconType } from './AttackPathToolbar';
import { ArrowUpDown } from 'lucide-react';

interface AttackPathIconProps {
  type: IconType;
  isDraggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  style?: React.CSSProperties;
  className?: string;
  width?: number;
  height?: number;
}

const iconPaths: Record<IconType, string> = {
  email: '/assets/generated/icon-email.dim_64x64.png',
  attacker: '/assets/generated/icon-attacker.dim_64x64.png',
  computer: '/assets/generated/icon-computer.dim_64x64.png',
  server: '/assets/generated/icon-server.dim_64x64.png',
  domain: '/assets/generated/icon-domain.dim_64x64.png',
  fileFolder: '/assets/generated/icon-file.dim_64x64.png',
  exe: '', // Text-based
  dll: '/assets/generated/dll-icon.dim_64x64.png',
  script: '/assets/generated/script-icon.dim_64x64.png',
  pdf: '/assets/generated/pdf-icon.dim_128x128.png',
  ppt: '/assets/generated/ppt-icon.dim_128x128.png',
  csv: '', // Text-based
  zip: '/assets/generated/zip-icon.dim_128x128.png',
  doc: '', // Text-based
  c2: '/assets/generated/c2-icon.dim_128x128.png',
  'bidirectional-arrow': '', // SVG-based
};

export default function AttackPathIcon({ 
  type, 
  isDraggable = false, 
  onDragStart, 
  style, 
  className = '',
  width,
  height,
}: AttackPathIconProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('iconType', type);
    e.dataTransfer.effectAllowed = 'copy';
    if (onDragStart) {
      onDragStart(e);
    }
  };

  const displayWidth = width || 48;
  const displayHeight = height || 48;

  // Text-based .exe icon
  if (type === 'exe') {
    return (
      <div
        draggable={isDraggable}
        onDragStart={handleDragStart}
        style={{ width: displayWidth, height: displayHeight, ...style }}
        className={`flex items-center justify-center text-sm font-bold text-foreground bg-background border-2 border-border rounded ${isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-move'} ${className}`}
      >
        <span className="text-center">.exe</span>
      </div>
    );
  }

  // Text-based Microsoft Excel icon
  if (type === 'csv') {
    return (
      <div
        draggable={isDraggable}
        onDragStart={handleDragStart}
        style={{ width: displayWidth, height: displayHeight, ...style }}
        className={`flex items-center justify-center text-[9px] font-bold text-foreground bg-background border-2 border-border rounded ${isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-move'} ${className}`}
      >
        <span className="text-center leading-tight">Microsoft Excel</span>
      </div>
    );
  }

  // Text-based Microsoft Word icon
  if (type === 'doc') {
    return (
      <div
        draggable={isDraggable}
        onDragStart={handleDragStart}
        style={{ width: displayWidth, height: displayHeight, ...style }}
        className={`flex items-center justify-center text-[9px] font-bold text-foreground bg-background border-2 border-border rounded ${isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-move'} ${className}`}
      >
        <span className="text-center leading-tight">Microsoft Word</span>
      </div>
    );
  }

  // Bidirectional arrow icon
  if (type === 'bidirectional-arrow') {
    return (
      <div
        draggable={isDraggable}
        onDragStart={handleDragStart}
        style={{ width: displayWidth, height: displayHeight, ...style }}
        className={`flex items-center justify-center ${isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-move'} ${className}`}
      >
        <ArrowUpDown className="w-full h-full text-foreground" strokeWidth={2} />
      </div>
    );
  }

  return (
    <img
      src={iconPaths[type]}
      alt={type}
      draggable={isDraggable}
      onDragStart={handleDragStart}
      style={{ width: displayWidth, height: displayHeight, ...style }}
      className={`object-contain ${isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-move'} ${className}`}
    />
  );
}
