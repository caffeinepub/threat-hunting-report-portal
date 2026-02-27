import React from 'react';

export type IconType =
  | 'attacker'
  | 'computer'
  | 'server'
  | 'cloudserver'
  | 'multipleservers'
  | 'multipleusers'
  | 'router'
  | 'firewall'
  | 'domain'
  | 'email'
  | 'phishing'
  | 'powershell'
  | 'backdoor'
  | 'scheduledtask'
  | 'dll'
  | 'exe'
  | 'script'
  | 'webbrowser'
  | 'excel'
  | 'word'
  | 'pdf'
  | 'zip'
  | 'c2';

const iconMap: Record<IconType, string> = {
  attacker: '/assets/attacker.png',
  computer: '/assets/Computer.png',
  server: '/assets/server icon.png',
  cloudserver: '/assets/Cloud Server.png',
  multipleservers: '/assets/Multiple Server Icon.png',
  multipleusers: '/assets/multiple users icon.png',
  router: '/assets/Router Device Icon.jpg',
  firewall: '/assets/Firewall.png',
  domain: '/assets/Domain.png',
  email: '/assets/email.png',
  phishing: '/assets/phishing email icon-2.jpg',
  powershell: '/assets/powershell-2.png',
  backdoor: '/assets/backdoor-1.jpg',
  scheduledtask: '/assets/Scheduled Task.jpg',
  dll: '/assets/dll-1.png',
  exe: '/assets/exe.png',
  script: '/assets/script-1.png',
  webbrowser: '/assets/web browser.png',
  excel: '/assets/excel.png',
  word: '/assets/word.png',
  pdf: '/assets/pdf.png',
  zip: '/assets/zip.png',
  c2: '/assets/Command and Control.png',
};

interface AttackPathIconProps {
  iconType: IconType;
  size?: number;
  className?: string;
  label?: string;
  showLabel?: boolean;
}

export default function AttackPathIcon({
  iconType,
  size = 48,
  className = '',
}: AttackPathIconProps) {
  const src = iconMap[iconType] ?? iconMap['computer'];

  return (
    <img
      src={src}
      alt={iconType}
      width={size}
      height={size}
      className={`object-contain ${className}`}
      draggable={false}
      style={{ width: size, height: size }}
    />
  );
}
