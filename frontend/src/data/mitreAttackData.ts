export interface MitreTechnique {
  id: string;
  name: string;
  description: string;
}

export const mitreAttackData: MitreTechnique[] = [
  // Initial Access
  { id: 'T1566.001', name: 'Phishing: Spearphishing Attachment', description: 'Adversaries may send spearphishing emails with a malicious attachment in an attempt to gain access to victim systems.' },
  { id: 'T1566.002', name: 'Phishing: Spearphishing Link', description: 'Adversaries may send spearphishing emails with a malicious link in an attempt to gain access to victim systems.' },
  { id: 'T1190', name: 'Exploit Public-Facing Application', description: 'Adversaries may attempt to exploit a weakness in an Internet-facing host or system to initially access a network.' },
  { id: 'T1133', name: 'External Remote Services', description: 'Adversaries may leverage external-facing remote services to initially access and/or persist within a network.' },
  { id: 'T1078', name: 'Valid Accounts', description: 'Adversaries may obtain and abuse credentials of existing accounts as a means of gaining Initial Access, Persistence, Privilege Escalation, or Defense Evasion.' },

  // Execution
  { id: 'T1059.001', name: 'Command and Scripting Interpreter: PowerShell', description: 'Adversaries may abuse PowerShell commands and scripts for execution.' },
  { id: 'T1059.003', name: 'Command and Scripting Interpreter: Windows Command Shell', description: 'Adversaries may abuse the Windows command shell for execution.' },
  { id: 'T1059.005', name: 'Command and Scripting Interpreter: Visual Basic', description: 'Adversaries may abuse Visual Basic (VB) for execution.' },
  { id: 'T1059.006', name: 'Command and Scripting Interpreter: Python', description: 'Adversaries may abuse Python commands and scripts for execution.' },
  { id: 'T1204.001', name: 'User Execution: Malicious Link', description: 'An adversary may rely upon a user clicking a malicious link in order to gain execution.' },
  { id: 'T1204.002', name: 'User Execution: Malicious File', description: 'An adversary may rely upon a user opening a malicious file in order to gain execution.' },
  { id: 'T1053.005', name: 'Scheduled Task/Job: Scheduled Task', description: 'Adversaries may abuse the Windows Task Scheduler to perform task scheduling for initial or recurring execution of malicious code.' },

  // Persistence
  { id: 'T1547.001', name: 'Boot or Logon Autostart Execution: Registry Run Keys / Startup Folder', description: 'Adversaries may achieve persistence by adding a program to a startup folder or referencing it with a Registry run key.' },
  { id: 'T1053.005', name: 'Scheduled Task/Job: Scheduled Task', description: 'Adversaries may abuse the Windows Task Scheduler to perform task scheduling for initial or recurring execution of malicious code.' },
  { id: 'T1136.001', name: 'Create Account: Local Account', description: 'Adversaries may create a local account to maintain access to victim systems.' },
  { id: 'T1543.003', name: 'Create or Modify System Process: Windows Service', description: 'Adversaries may create or modify Windows services to repeatedly execute malicious payloads as part of persistence.' },
  { id: 'T1098', name: 'Account Manipulation', description: 'Adversaries may manipulate accounts to maintain access to victim systems.' },

  // Privilege Escalation
  { id: 'T1068', name: 'Exploitation for Privilege Escalation', description: 'Adversaries may exploit software vulnerabilities in an attempt to elevate privileges.' },
  { id: 'T1134', name: 'Access Token Manipulation', description: 'Adversaries may modify access tokens to operate under a different user or system security context to perform actions and bypass access controls.' },
  { id: 'T1055', name: 'Process Injection', description: 'Adversaries may inject code into processes in order to evade process-based defenses as well as possibly elevate privileges.' },
  { id: 'T1548.002', name: 'Abuse Elevation Control Mechanism: Bypass User Account Control', description: 'Adversaries may bypass UAC mechanisms to elevate process privileges on system.' },

  // Defense Evasion
  { id: 'T1070.001', name: 'Indicator Removal: Clear Windows Event Logs', description: 'Adversaries may clear Windows Event Logs to hide the activity of an intrusion.' },
  { id: 'T1070.004', name: 'Indicator Removal: File Deletion', description: 'Adversaries may delete files left behind by the actions of their intrusion activity.' },
  { id: 'T1027', name: 'Obfuscated Files or Information', description: 'Adversaries may attempt to make an executable or file difficult to discover or analyze by encrypting, encoding, or otherwise obfuscating its contents.' },
  { id: 'T1036', name: 'Masquerading', description: 'Adversaries may attempt to manipulate features of their artifacts to make them appear legitimate or benign to users and/or security tools.' },
  { id: 'T1562.001', name: 'Impair Defenses: Disable or Modify Tools', description: 'Adversaries may modify and/or disable security tools to avoid possible detection of their malware/tools and activities.' },
  { id: 'T1218.011', name: 'System Binary Proxy Execution: Rundll32', description: 'Adversaries may abuse rundll32.exe to proxy execution of malicious code.' },

  // Credential Access
  { id: 'T1003.001', name: 'OS Credential Dumping: LSASS Memory', description: 'Adversaries may attempt to access credential material stored in the process memory of the Local Security Authority Subsystem Service (LSASS).' },
  { id: 'T1003.002', name: 'OS Credential Dumping: Security Account Manager', description: 'Adversaries may attempt to extract credential material from the Security Account Manager (SAM) database.' },
  { id: 'T1110.001', name: 'Brute Force: Password Guessing', description: 'Adversaries may use a single or small list of commonly used passwords against many different accounts to attempt to acquire valid account credentials.' },
  { id: 'T1110.003', name: 'Brute Force: Password Spraying', description: 'Adversaries may use a single or small list of commonly used passwords against many different accounts to attempt to acquire valid account credentials.' },
  { id: 'T1555', name: 'Credentials from Password Stores', description: 'Adversaries may search for common password storage locations to obtain user credentials.' },
  { id: 'T1056.001', name: 'Input Capture: Keylogging', description: 'Adversaries may log user keystrokes to intercept credentials as the user types them.' },

  // Discovery
  { id: 'T1087.001', name: 'Account Discovery: Local Account', description: 'Adversaries may attempt to get a listing of local system accounts.' },
  { id: 'T1087.002', name: 'Account Discovery: Domain Account', description: 'Adversaries may attempt to get a listing of domain accounts.' },
  { id: 'T1083', name: 'File and Directory Discovery', description: 'Adversaries may enumerate files and directories or may search in specific locations of a host or network share for certain information within a file system.' },
  { id: 'T1082', name: 'System Information Discovery', description: 'An adversary may attempt to get detailed information about the operating system and hardware, including version, patches, hotfixes, service packs, and architecture.' },
  { id: 'T1016', name: 'System Network Configuration Discovery', description: 'Adversaries may look for details about the network configuration and settings of systems they access or through information discovery of remote systems.' },
  { id: 'T1049', name: 'System Network Connections Discovery', description: 'Adversaries may attempt to get a listing of network connections to or from the compromised system they are currently accessing or from remote systems.' },
  { id: 'T1057', name: 'Process Discovery', description: 'Adversaries may attempt to get information about running processes on a system.' },

  // Lateral Movement
  { id: 'T1021.001', name: 'Remote Services: Remote Desktop Protocol', description: 'Adversaries may use Valid Accounts to log into a computer using the Remote Desktop Protocol (RDP).' },
  { id: 'T1021.002', name: 'Remote Services: SMB/Windows Admin Shares', description: 'Adversaries may use Valid Accounts to interact with a remote network share using Server Message Block (SMB).' },
  { id: 'T1021.006', name: 'Remote Services: Windows Remote Management', description: 'Adversaries may use Valid Accounts to interact with remote systems using Windows Remote Management (WinRM).' },
  { id: 'T1080', name: 'Taint Shared Content', description: 'Adversaries may deliver payloads to remote systems by adding content to shared storage locations.' },
  { id: 'T1550.002', name: 'Use Alternate Authentication Material: Pass the Hash', description: 'Adversaries may "pass the hash" using stolen password hashes to move laterally within an environment.' },

  // Collection
  { id: 'T1005', name: 'Data from Local System', description: 'Adversaries may search local system sources, such as file systems and configuration files or local databases, to find files of interest and sensitive data prior to Exfiltration.' },
  { id: 'T1039', name: 'Data from Network Shared Drive', description: 'Adversaries may search network shares on computers they have compromised to find files of interest.' },
  { id: 'T1113', name: 'Screen Capture', description: 'Adversaries may attempt to take screen captures of the desktop to gather information over the course of an operation.' },
  { id: 'T1115', name: 'Clipboard Data', description: 'Adversaries may collect data stored in the clipboard from users copying information within or between applications.' },
  { id: 'T1119', name: 'Automated Collection', description: 'Once established within a system or network, an adversary may use automated techniques for collecting internal data.' },

  // Command and Control
  { id: 'T1071.001', name: 'Application Layer Protocol: Web Protocols', description: 'Adversaries may communicate using application layer protocols associated with web traffic to avoid detection/network filtering by blending in with existing traffic.' },
  { id: 'T1071.004', name: 'Application Layer Protocol: DNS', description: 'Adversaries may communicate using the Domain Name System (DNS) application layer protocol to avoid detection/network filtering by blending in with existing traffic.' },
  { id: 'T1573.001', name: 'Encrypted Channel: Symmetric Cryptography', description: 'Adversaries may employ a known symmetric encryption algorithm to conceal command and control traffic rather than relying on any inherent protections provided by a communication protocol.' },
  { id: 'T1090', name: 'Proxy', description: 'Adversaries may use a connection proxy to direct network traffic between systems or act as an intermediary for network communications to a command and control server.' },
  { id: 'T1105', name: 'Ingress Tool Transfer', description: 'Adversaries may transfer tools or other files from an external system into a compromised environment.' },

  // Exfiltration
  { id: 'T1041', name: 'Exfiltration Over C2 Channel', description: 'Adversaries may steal data by exfiltrating it over an existing command and control channel.' },
  { id: 'T1048.003', name: 'Exfiltration Over Alternative Protocol: Exfiltration Over Unencrypted Non-C2 Protocol', description: 'Adversaries may steal data by exfiltrating it over an un-encrypted network protocol other than that of the existing command and control channel.' },
  { id: 'T1567.002', name: 'Exfiltration Over Web Service: Exfiltration to Cloud Storage', description: 'Adversaries may exfiltrate data to a cloud storage service rather than over their primary command and control channel.' },
  { id: 'T1020', name: 'Automated Exfiltration', description: 'Adversaries may exfiltrate data, such as sensitive documents, through the use of automated processing after being gathered during Collection.' },

  // Impact
  { id: 'T1486', name: 'Data Encrypted for Impact', description: 'Adversaries may encrypt data on target systems or on large numbers of systems in a network to interrupt availability to system and network resources.' },
  { id: 'T1490', name: 'Inhibit System Recovery', description: 'Adversaries may delete or remove built-in data and turn off services designed to aid in the recovery of a corrupted system to prevent recovery.' },
  { id: 'T1489', name: 'Service Stop', description: 'Adversaries may stop or disable services on a system to render those services unavailable to legitimate users.' },
  { id: 'T1491', name: 'Defacement', description: 'Adversaries may modify visual content available internally or externally to an enterprise network, thus affecting the integrity of the original content.' },
];
