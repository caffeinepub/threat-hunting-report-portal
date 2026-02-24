import React from 'react';
import { IconType } from './AttackPathToolbar';
import { Bug, Mail, Cloud, Shield, Wifi, Clock } from 'lucide-react';

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
    backdoor: '/assets/generated/backdoor-virus-icon.dim_256x256.png',
    phishing: '/assets/generated/phishing-email-icon.dim_256x256.png',
    cloudServer: '/assets/generated/cloud-server-icon.dim_256x256.png',
    firewall: '/assets/generated/firewall-icon.dim_256x256.png',
    router: '/assets/generated/router-device-icon.dim_256x256.png',
    scheduledTask: '/assets/generated/scheduled-task-icon.dim_256x256.png',
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('iconType', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Render Lucide React icons for the new security icon types
  const lucideIcons: Partial<Record<IconType, React.ReactElement>> = {
    backdoor: <Bug className="w-full h-full text-destructive" />,
    phishing: <Mail className="w-full h-full text-warning" />,
    cloudServer: <Cloud className="w-full h-full text-primary" />,
    firewall: <Shield className="w-full h-full text-success" />,
    router: <Wifi className="w-full h-full text-accent" />,
    scheduledTask: <Clock className="w-full h-full text-muted-foreground" />,
  };

  // Check if this is a Lucide icon type
  if (lucideIcons[type]) {
    return (
      <div
        className="flex items-center justify-center cursor-grab active:cursor-grabbing"
        style={{ width, height }}
        draggable
        onDragStart={handleDragStart}
      >
        {lucideIcons[type]}
      </div>
    );
  }

  const iconSrc = iconMap[type];

  if (!iconSrc) {
    return (
      <div
        className="flex items-center justify-center bg-gray-200 rounded text-xs font-bold text-gray-600 cursor-grab active:cursor-grabbing"
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
      className="w-full h-full object-contain cursor-grab active:cursor-grabbing"
      style={{ width, height }}
      draggable
      onDragStart={handleDragStart}
    />
  );
}
