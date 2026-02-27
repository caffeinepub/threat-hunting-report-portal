import React from 'react';

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

interface AttackPathIconProps {
  type: IconType;
  size?: number;
  className?: string;
  label?: string;
  source?: 'toolbar' | 'canvas';
}

const iconImageMap: Record<IconType, string> = {
  attacker: '/assets/generated/icon-attacker.dim_64x64.png',
  phishing: '/assets/phishing email icon-2.jpg',
  computer: '/assets/generated/icon-computer.dim_64x64.png',
  server: '/assets/generated/icon-server.dim_64x64.png',
  domain: '/assets/generated/icon-domain.dim_64x64.png',
  firewall: '/assets/generated/firewall.dim_256x256.png',
  cloudserver: '/assets/generated/cloud-server.dim_256x256.png',
  multipleservers: '/assets/generated/multiple-servers.dim_128x128.png',
  multiplecomputers: '/assets/generated/multiple-computers-icon.dim_128x128.png',
  router: '/assets/generated/router-device-icon.dim_256x256.jpg',
  user: '/assets/generated/user-single.dim_128x128.png',
  multipleusers: '/assets/generated/multiple-users-icon.dim_128x128.png',
  email: '/assets/generated/icon-email.dim_64x64.png',
  file: '/assets/generated/icon-file.dim_64x64.png',
  pdf: '/assets/generated/pdf-icon.dim_128x128.png',
  word: '/assets/generated/word-icon.dim_64x64.png',
  excel: '/assets/generated/excel-icon.dim_64x64.png',
  ppt: '/assets/generated/ppt-icon.dim_128x128.png',
  zip: '/assets/generated/zip-icon.dim_128x128.png',
  exe: '/assets/generated/exe-icon.dim_128x128.png',
  dll: '/assets/generated/dll-icon.dim_128x128.png',
  script: '/assets/generated/script-icon.dim_64x64.png',
  csv: '/assets/generated/csv-icon.dim_128x128.png',
  c2: '/assets/generated/c2-icon.dim_128x128.png',
  scheduledtask: '/assets/generated/scheduled-task.dim_256x256.jpg',
  backdoor: '/assets/backdoor-1.jpg',
  powershell: '/assets/powershell-2.png',
  javascript: '/assets/generated/script-icon.dim_64x64.png',
  webbrowser: '/assets/generated/web-browser.dim_256x256.png',
};

export default function AttackPathIcon({ type, size = 40, className = '', label, source }: AttackPathIconProps) {
  const imgSrc = iconImageMap[type];

  return (
    <div
      className={`flex flex-col items-center justify-center gap-1 ${className}`}
      draggable={source === 'toolbar'}
      style={{ userSelect: 'none' }}
    >
      <img
        src={imgSrc}
        alt={type}
        width={size}
        height={size}
        style={{ objectFit: 'contain', display: 'block' }}
        draggable={false}
      />
      {label && (
        <span
          style={{
            fontSize: Math.max(10, size * 0.28),
            color: '#1e293b',
            fontWeight: 500,
            textAlign: 'center',
            maxWidth: size * 1.5,
            wordBreak: 'break-word',
            lineHeight: 1.2,
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
