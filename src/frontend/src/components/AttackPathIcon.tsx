import { IconType } from './AttackPathToolbar';

interface AttackPathIconProps {
  type: IconType;
  width?: number;
  height?: number;
}

export default function AttackPathIcon({ type, width = 48, height = 48 }: AttackPathIconProps) {
  const iconMap: Record<IconType, string> = {
    user: '/assets/generated/man-icon.dim_128x128.png',
    multipleUsers: '/assets/generated/multiple-users-icon.dim_128x128.png',
    multipleComputers: '/assets/generated/multiple-computers-icon.dim_128x128.png',
    attacker: '/assets/generated/icon-attacker.dim_64x64.png',
    computer: '/assets/generated/computer-icon.dim_128x128.png',
    server: '/assets/generated/icon-server.dim_64x64.png',
    domain: '/assets/generated/icon-domain.dim_64x64.png',
    email: '/assets/generated/icon-email.dim_64x64.png',
    fileFolder: '/assets/generated/icon-file.dim_64x64.png',
    exe: '/assets/generated/exe-icon.dim_64x64.png',
    dll: '/assets/generated/dll-icon.dim_64x64.png',
    script: '/assets/generated/script-icon.dim_64x64.png',
    doc: '/assets/generated/word-icon.dim_64x64.png',
    csv: '/assets/generated/excel-icon.dim_64x64.png',
    pdf: '/assets/generated/pdf-icon.dim_128x128.png',
    ppt: '/assets/generated/ppt-icon.dim_128x128.png',
    zip: '/assets/generated/zip-icon.dim_128x128.png',
    c2: '/assets/generated/c2-icon.dim_128x128.png',
  };

  const iconSrc = iconMap[type];

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('iconType', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  if (!iconSrc) {
    return (
      <div
        className="flex items-center justify-center bg-gray-200 rounded text-xs font-bold text-gray-600"
        style={{ width, height }}
        draggable
        onDragStart={handleDragStart}
      >
        {type.toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={iconSrc}
      alt={type}
      className="w-full h-full object-contain"
      style={{ width, height }}
      draggable
      onDragStart={handleDragStart}
    />
  );
}
