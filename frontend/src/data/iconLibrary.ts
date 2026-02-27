export type IconCategory = 'network' | 'files' | 'users' | 'security' | 'system' | 'communication';

export interface IconEntry {
  id: string;
  name: string;
  category: IconCategory;
  path: string;
}

export const ICON_LIBRARY: IconEntry[] = [
  // Network
  { id: 'computer', name: 'Computer', category: 'network', path: '/assets/generated/computer-icon.dim_128x128.png' },
  { id: 'multiple-computers', name: 'Multiple Computers', category: 'network', path: '/assets/generated/multiple-computers-icon.dim_128x128.png' },
  { id: 'cloud-server', name: 'Cloud Server', category: 'network', path: '/assets/generated/cloud-server-icon.dim_256x256.png' },
  { id: 'multiple-servers', name: 'Multiple Servers', category: 'network', path: '/assets/generated/multiple-servers.dim_128x128.png' },
  { id: 'router', name: 'Router', category: 'network', path: '/assets/generated/router-device-icon.dim_256x256.png' },
  { id: 'web-browser', name: 'Web Browser', category: 'network', path: '/assets/generated/web-browser.dim_256x256.png' },
  { id: 'c2', name: 'C2 Server', category: 'network', path: '/assets/generated/c2-icon.dim_128x128.png' },

  // Security
  { id: 'firewall', name: 'Firewall', category: 'security', path: '/assets/generated/firewall-icon.dim_256x256.png' },
  { id: 'backdoor-virus', name: 'Backdoor Virus', category: 'security', path: '/assets/generated/backdoor-virus-icon.dim_256x256.png' },
  { id: 'phishing-email', name: 'Phishing Email', category: 'security', path: '/assets/generated/phishing-email-icon.dim_256x256.png' },
  { id: 'powershell', name: 'PowerShell', category: 'security', path: '/assets/generated/powershell-icon.dim_256x256.png' },
  { id: 'scheduled-task', name: 'Scheduled Task', category: 'security', path: '/assets/generated/scheduled-task-icon.dim_256x256.png' },

  // Users
  { id: 'user', name: 'User', category: 'users', path: '/assets/generated/user-icon.dim_128x128.png' },
  { id: 'user-man', name: 'User (Man)', category: 'users', path: '/assets/generated/man-icon.dim_128x128.png' },
  { id: 'multiple-users', name: 'Multiple Users', category: 'users', path: '/assets/generated/multiple-users-icon.dim_128x128.png' },
  { id: 'attacker', name: 'Attacker', category: 'users', path: '/assets/generated/icon-attacker.dim_64x64.png' },

  // Files
  { id: 'pdf', name: 'PDF File', category: 'files', path: '/assets/generated/pdf-icon.dim_128x128.png' },
  { id: 'exe', name: 'EXE File', category: 'files', path: '/assets/generated/exe-icon.dim_128x128.png' },
  { id: 'dll', name: 'DLL File', category: 'files', path: '/assets/generated/dll-icon.dim_128x128.png' },
  { id: 'doc', name: 'Word Doc', category: 'files', path: '/assets/generated/doc-icon.dim_128x128.png' },
  { id: 'excel', name: 'Excel File', category: 'files', path: '/assets/generated/csv-icon.dim_128x128.png' },
  { id: 'ppt', name: 'PowerPoint', category: 'files', path: '/assets/generated/ppt-icon.dim_128x128.png' },
  { id: 'zip', name: 'ZIP Archive', category: 'files', path: '/assets/generated/zip-icon.dim_128x128.png' },
  { id: 'script', name: 'Script', category: 'files', path: '/assets/generated/script-icon.dim_64x64.png' },

  // System
  { id: 'icon-computer', name: 'Computer (sm)', category: 'system', path: '/assets/generated/icon-computer.dim_64x64.png' },
  { id: 'icon-server', name: 'Server (sm)', category: 'system', path: '/assets/generated/icon-server.dim_64x64.png' },
  { id: 'icon-domain', name: 'Domain', category: 'system', path: '/assets/generated/icon-domain.dim_64x64.png' },
  { id: 'icon-ip', name: 'IP Address', category: 'system', path: '/assets/generated/icon-ip.dim_64x64.png' },
  { id: 'icon-file', name: 'File', category: 'system', path: '/assets/generated/icon-file.dim_64x64.png' },
  { id: 'user-single', name: 'User Single', category: 'system', path: '/assets/generated/user-single.dim_128x128.png' },

  // Communication
  { id: 'email', name: 'Email', category: 'communication', path: '/assets/generated/icon-email.dim_64x64.png' },
];
