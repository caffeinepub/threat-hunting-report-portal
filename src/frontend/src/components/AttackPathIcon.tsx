import { IconType } from './AttackPathToolbar';

interface AttackPathIconProps {
  type: IconType;
  width?: number;
  height?: number;
}

export default function AttackPathIcon({ type, width = 48, height = 48 }: AttackPathIconProps) {
  const iconMap: Record<IconType, string> = {
    user: '/assets/generated/user-single.dim_128x128.png',
    multipleUsers: '/assets/multiple users icon.png',
    multipleComputers: '/assets/multiple computer.png',
    multipleServers: '/assets/Multiple Server Icon.png',
    attacker: '/assets/attacker.png',
    computer: '/assets/Computer.png',
    server: '/assets/server icon.png',
    domain: '/assets/Domain.png',
    email: '/assets/email.png',
    fileFolder: '/assets/generated/icon-file.dim_64x64.png',
    exe: '/assets/exe.png',
    dll: '/assets/dll-1.png',
    script: '/assets/script-1.png',
    doc: '/assets/word.png',
    csv: '/assets/excel.png',
    pdf: '/assets/pdf.png',
    ppt: '/assets/ppt.png',
    zip: '/assets/zip.png',
    c2: '/assets/Command and Control.png',
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
