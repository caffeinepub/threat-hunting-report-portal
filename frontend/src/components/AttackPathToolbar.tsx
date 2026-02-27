import React, { useRef } from 'react';
import {
  MousePointer2,
  Pen,
  Type,
  Minus,
  ArrowRight,
  Link,
  Eraser,
  Save,
  FolderOpen,
  Undo2,
  Redo2,
  RotateCcw,
  ImagePlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { ToolType } from './AttackPathCanvas';

const ICON_LIST = [
  { iconType: 'attacker', label: 'Attacker', src: '/assets/attacker.png' },
  { iconType: 'computer', label: 'Computer', src: '/assets/Computer.png' },
  { iconType: 'server', label: 'Server', src: '/assets/server icon.png' },
  { iconType: 'multiserver', label: 'Multi-Server', src: '/assets/Multiple Server Icon.png' },
  { iconType: 'router', label: 'Router', src: '/assets/Router Device Icon.jpg' },
  { iconType: 'firewall', label: 'Firewall', src: '/assets/Firewall.png' },
  { iconType: 'domain', label: 'Domain', src: '/assets/Domain.png' },
  { iconType: 'cloud', label: 'Cloud', src: '/assets/Cloud Server.png' },
  { iconType: 'email', label: 'Email', src: '/assets/email.png' },
  { iconType: 'phishing', label: 'Phishing', src: '/assets/phishing email icon-2.jpg' },
  { iconType: 'powershell', label: 'PowerShell', src: '/assets/powershell-2.png' },
  { iconType: 'backdoor', label: 'Backdoor', src: '/assets/backdoor-1.jpg' },
  { iconType: 'exe', label: 'EXE', src: '/assets/exe.png' },
  { iconType: 'dll', label: 'DLL', src: '/assets/dll.png' },
  { iconType: 'script', label: 'Script', src: '/assets/script.png' },
  { iconType: 'zip', label: 'ZIP', src: '/assets/zip.png' },
  { iconType: 'pdf', label: 'PDF', src: '/assets/pdf.png' },
  { iconType: 'word', label: 'Word', src: '/assets/word.png' },
  { iconType: 'excel', label: 'Excel', src: '/assets/excel.png' },
  { iconType: 'ppt', label: 'PPT', src: '/assets/ppt.png' },
  { iconType: 'webbrowser', label: 'Browser', src: '/assets/web browser.png' },
  { iconType: 'scheduledtask', label: 'Sched. Task', src: '/assets/Scheduled Task.jpg' },
  { iconType: 'multicomputer', label: 'Multi-PC', src: '/assets/multiple computer.png' },
  { iconType: 'multiuser', label: 'Multi-User', src: '/assets/multiple users icon.png' },
  { iconType: 'c2', label: 'C2', src: '/assets/Command and Control.png' },
];

interface AttackPathToolbarProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  onSave: () => void;
  onLoad: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onImageUpload: (file: File) => void;
  canUndo: boolean;
  canRedo: boolean;
}

export default function AttackPathToolbar({
  activeTool,
  onToolChange,
  onSave,
  onLoad,
  onUndo,
  onRedo,
  onClear,
  onImageUpload,
  canUndo,
  canRedo,
}: AttackPathToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tools: { type: ToolType; icon: React.ReactNode; label: string }[] = [
    { type: 'select', icon: <MousePointer2 className="w-4 h-4" />, label: 'Select' },
    { type: 'pen', icon: <Pen className="w-4 h-4" />, label: 'Freehand Draw' },
    { type: 'text', icon: <Type className="w-4 h-4" />, label: 'Text' },
    { type: 'line', icon: <Minus className="w-4 h-4" />, label: 'Line' },
    { type: 'arrow', icon: <ArrowRight className="w-4 h-4" />, label: 'Arrow' },
    { type: 'connector', icon: <Link className="w-4 h-4" />, label: 'Connector' },
    { type: 'eraser', icon: <Eraser className="w-4 h-4" />, label: 'Eraser' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
      e.target.value = '';
    }
  };

  const handleIconDragStart = (e: React.DragEvent<HTMLImageElement>, iconType: string) => {
    e.dataTransfer.setData('iconType', iconType);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-card border-r border-border w-16 items-center py-3 gap-1 overflow-y-auto shrink-0">
        {/* Drawing Tools */}
        {tools.map((tool) => (
          <Tooltip key={tool.type}>
            <TooltipTrigger asChild>
              <Button
                variant={activeTool === tool.type ? 'default' : 'ghost'}
                size="icon"
                className="w-10 h-10"
                onClick={() => onToolChange(tool.type)}
              >
                {tool.icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{tool.label}</TooltipContent>
          </Tooltip>
        ))}

        <Separator className="my-1 w-10" />

        {/* Action Buttons */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="w-10 h-10" onClick={onSave}>
              <Save className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Save Diagram</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="w-10 h-10" onClick={onLoad}>
              <FolderOpen className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Load Diagram</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="w-10 h-10" onClick={onUndo} disabled={!canUndo}>
              <Undo2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Undo</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="w-10 h-10" onClick={onRedo} disabled={!canRedo}>
              <Redo2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Redo</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="w-10 h-10" onClick={onClear}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Clear Canvas</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="w-10 h-10" onClick={() => fileInputRef.current?.click()}>
              <ImagePlus className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Upload Image</TooltipContent>
        </Tooltip>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <Separator className="my-1 w-10" />

        {/* Icon Grid — only the <img> inside each cell is draggable */}
        <div className="flex flex-col gap-1 w-full px-1">
          {ICON_LIST.map(({ iconType, label, src }) => (
            <Tooltip key={iconType}>
              <TooltipTrigger asChild>
                <div
                  draggable={false}
                  className="flex flex-col items-center gap-0.5 cursor-default select-none"
                >
                  <img
                    src={src}
                    alt={label}
                    draggable={true}
                    onDragStart={(e) => handleIconDragStart(e, iconType)}
                    className="w-10 h-10 object-contain rounded cursor-grab active:cursor-grabbing select-none hover:opacity-80 transition-opacity"
                  />
                  <span className="text-[9px] text-muted-foreground leading-tight text-center w-full truncate pointer-events-none">
                    {label}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
