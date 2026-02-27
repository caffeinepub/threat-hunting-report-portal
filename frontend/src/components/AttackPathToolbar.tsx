import React, { useRef } from 'react';
import { MousePointer2, Pencil, Minus, ArrowRight, Type, Eraser, Link, Upload, Undo2, Trash2, Square, GitBranch } from 'lucide-react';
import AttackPathIcon, { IconType } from './AttackPathIcon';
import { ToolType } from '../hooks/useAttackPathState';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AttackPathToolbarProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  drawColor: string;
  onColorChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
  onUndo: () => void;
  onClear: () => void;
  onAddImage: (file: File) => void;
}

const ICON_LIST: { type: IconType; label: string }[] = [
  { type: 'attacker', label: 'Attacker' },
  { type: 'computer', label: 'Computer' },
  { type: 'server', label: 'Server' },
  { type: 'cloudserver', label: 'Cloud Server' },
  { type: 'multipleservers', label: 'Multiple Servers' },
  { type: 'multipleusers', label: 'Multiple Users' },
  { type: 'router', label: 'Router' },
  { type: 'firewall', label: 'Firewall' },
  { type: 'domain', label: 'Domain' },
  { type: 'email', label: 'Email' },
  { type: 'phishing', label: 'Phishing' },
  { type: 'powershell', label: 'PowerShell' },
  { type: 'backdoor', label: 'Backdoor' },
  { type: 'scheduledtask', label: 'Scheduled Task' },
  { type: 'dll', label: 'DLL' },
  { type: 'exe', label: 'EXE' },
  { type: 'script', label: 'Script' },
  { type: 'webbrowser', label: 'Web Browser' },
  { type: 'excel', label: 'Excel' },
  { type: 'word', label: 'Word' },
  { type: 'pdf', label: 'PDF' },
  { type: 'zip', label: 'ZIP' },
  { type: 'c2', label: 'C2' },
];

const TOOLS: { type: ToolType; icon: React.ReactNode; label: string }[] = [
  { type: 'select', icon: <MousePointer2 size={16} />, label: 'Select & Move' },
  { type: 'connect', icon: <Link size={16} />, label: 'Connect Icons' },
  { type: 'dottedConnector', icon: <GitBranch size={16} />, label: 'Dotted Connector' },
  { type: 'box', icon: <Square size={16} />, label: 'Draw Box' },
  { type: 'draw', icon: <Pencil size={16} />, label: 'Freehand Draw' },
  { type: 'line', icon: <Minus size={16} />, label: 'Draw Line' },
  { type: 'arrow', icon: <ArrowRight size={16} />, label: 'Draw Arrow' },
  { type: 'text', icon: <Type size={16} />, label: 'Add Text' },
  { type: 'eraser', icon: <Eraser size={16} />, label: 'Eraser' },
];

export default function AttackPathToolbar({
  activeTool,
  onToolChange,
  drawColor,
  onColorChange,
  strokeWidth,
  onStrokeWidthChange,
  onUndo,
  onClear,
  onAddImage,
}: AttackPathToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAddImage(file);
      e.target.value = '';
    }
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-sidebar border-r border-border overflow-y-auto">
        {/* Tools section */}
        <div className="p-3 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tools</p>
          <div className="grid grid-cols-2 gap-1">
            {TOOLS.map(tool => (
              <Tooltip key={tool.type}>
                <TooltipTrigger asChild>
                  <Button
                    variant={activeTool === tool.type ? 'default' : 'ghost'}
                    size="sm"
                    className="w-full justify-start gap-2 text-xs"
                    onClick={() => onToolChange(tool.type)}
                  >
                    {tool.icon}
                    <span className="truncate">{tool.label}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">{tool.label}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>

        {/* Color & stroke */}
        <div className="p-3 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Style</p>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-xs text-muted-foreground">Color</label>
            <input
              type="color"
              value={drawColor}
              onChange={e => onColorChange(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Width</label>
            <input
              type="range"
              min={1}
              max={10}
              value={strokeWidth}
              onChange={e => onStrokeWidthChange(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-4">{strokeWidth}</span>
          </div>
        </div>

        {/* Upload image */}
        <div className="p-3 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Image</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 text-xs"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={14} />
            Upload Image
          </Button>
        </div>

        {/* Actions */}
        <div className="p-3 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Actions</p>
          <div className="flex flex-col gap-1">
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-xs" onClick={onUndo}>
              <Undo2 size={14} />
              Undo
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-xs text-destructive hover:text-destructive" onClick={onClear}>
              <Trash2 size={14} />
              Clear All
            </Button>
          </div>
        </div>

        {/* Icons palette */}
        <div className="p-3 flex-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Icons</p>
          <p className="text-xs text-muted-foreground mb-3">Drag icons onto the canvas</p>
          <div className="grid grid-cols-2 gap-2">
            {ICON_LIST.map(({ type, label }) => (
              <Tooltip key={type}>
                <TooltipTrigger asChild>
                  <div
                    draggable
                    onDragStart={e => {
                      e.dataTransfer.setData('iconType', type);
                      e.dataTransfer.setData('iconName', label);
                    }}
                    className="flex flex-col items-center gap-1 p-2 rounded cursor-grab hover:bg-accent border border-transparent hover:border-border transition-colors"
                  >
                    <AttackPathIcon iconType={type} size={32} />
                    <span className="text-xs text-muted-foreground text-center leading-tight">{label}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
