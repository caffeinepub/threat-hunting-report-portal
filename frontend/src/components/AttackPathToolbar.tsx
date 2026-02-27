import React, { useRef, useState } from 'react';
import { Pencil, Minus, ArrowRight, Eraser, Type, MousePointer, RotateCcw, RotateCw, Save, FolderOpen, Move, Trash2, Image } from 'lucide-react';
import { ToolType } from './AttackPathCanvas';
import { toast } from 'sonner';

const ICON_DEFINITIONS: { type: string; label: string; src: string }[] = [
  { type: 'attacker', label: 'Attacker', src: '/assets/attacker.png' },
  { type: 'computer', label: 'Computer', src: '/assets/Computer.png' },
  { type: 'server', label: 'Server', src: '/assets/server icon.png' },
  { type: 'multipleservers', label: 'Multi-Server', src: '/assets/Multiple Server Icon.png' },
  { type: 'cloudserver', label: 'Cloud', src: '/assets/Cloud Server.png' },
  { type: 'router', label: 'Router', src: '/assets/Router Device Icon.jpg' },
  { type: 'firewall', label: 'Firewall', src: '/assets/Firewall.png' },
  { type: 'domain', label: 'Domain', src: '/assets/Domain.png' },
  { type: 'multiplecomputers', label: 'Multi-PC', src: '/assets/multiple computer.png' },
  { type: 'multipleusers', label: 'Users', src: '/assets/multiple users icon.png' },
  { type: 'email', label: 'Email', src: '/assets/email.png' },
  { type: 'phishing', label: 'Phishing', src: '/assets/phishing email icon-2.jpg' },
  { type: 'powershell', label: 'PowerShell', src: '/assets/powershell-2.png' },
  { type: 'backdoor', label: 'Backdoor', src: '/assets/backdoor-1.jpg' },
  { type: 'dll', label: 'DLL', src: '/assets/dll.png' },
  { type: 'exe', label: 'EXE', src: '/assets/exe.png' },
  { type: 'script', label: 'Script', src: '/assets/script.png' },
  { type: 'scheduledtask', label: 'Sched. Task', src: '/assets/Scheduled Task.jpg' },
  { type: 'c2', label: 'C2', src: '/assets/Command and Control.png' },
  { type: 'webbrowser', label: 'Browser', src: '/assets/web browser.png' },
  { type: 'word', label: 'Word', src: '/assets/word.png' },
  { type: 'excel', label: 'Excel', src: '/assets/excel.png' },
  { type: 'pdf', label: 'PDF', src: '/assets/pdf.png' },
  { type: 'zip', label: 'ZIP', src: '/assets/zip.png' },
  { type: 'ppt', label: 'PPT', src: '/assets/ppt.png' },
];

interface AttackPathToolbarProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  onSave: () => void;
  onLoad: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onAddImage: (file: File) => void;
  canUndo: boolean;
  canRedo: boolean;
}

const AttackPathToolbar: React.FC<AttackPathToolbarProps> = ({
  activeTool,
  onToolChange,
  onSave,
  onLoad,
  onUndo,
  onRedo,
  onClear,
  onAddImage,
  canUndo,
  canRedo,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragStart = (e: React.DragEvent<HTMLImageElement>, iconType: string) => {
    e.dataTransfer.setData('iconType', iconType);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
      toast.error('Please upload a PNG, JPG, or JPEG image');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }
    try {
      setIsUploading(true);
      onAddImage(file);
      toast.success('Image added successfully');
    } catch {
      toast.error('Failed to add image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toolButtons: { tool: ToolType; icon: React.ReactNode; label: string }[] = [
    { tool: 'select', icon: <MousePointer size={15} />, label: 'Select' },
    { tool: 'connect', icon: <ArrowRight size={15} />, label: 'Connect' },
    { tool: 'pen', icon: <Pencil size={15} />, label: 'Draw' },
    { tool: 'line', icon: <Minus size={15} />, label: 'Line' },
    { tool: 'arrow', icon: <ArrowRight size={15} />, label: 'Arrow' },
    { tool: 'text', icon: <Type size={15} />, label: 'Text' },
    { tool: 'freeTransform', icon: <Move size={15} />, label: 'Transform' },
    { tool: 'eraser', icon: <Eraser size={15} />, label: 'Eraser' },
  ];

  return (
    <div className="flex flex-col h-full bg-card border-r border-border overflow-hidden" style={{ width: '11rem' }}>
      {/* Header */}
      <div className="px-3 py-2 border-b border-border">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tools</h2>
      </div>

      {/* Drawing Tools */}
      <div className="px-2 py-2 border-b border-border">
        <div className="grid grid-cols-2 gap-1">
          {toolButtons.map(({ tool, icon, label }) => (
            <button
              key={tool}
              onClick={() => onToolChange(tool)}
              title={label}
              className={`flex flex-col items-center gap-0.5 px-1 py-1.5 rounded text-xs transition-colors ${
                activeTool === tool
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              {icon}
              <span className="text-[10px] leading-none">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-2 py-2 border-b border-border">
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo"
            className="flex flex-col items-center gap-0.5 px-1 py-1.5 rounded text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCcw size={15} />
            <span className="text-[10px] leading-none">Undo</span>
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo"
            className="flex flex-col items-center gap-0.5 px-1 py-1.5 rounded text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCw size={15} />
            <span className="text-[10px] leading-none">Redo</span>
          </button>
          <button
            onClick={onSave}
            title="Save Diagram"
            className="flex flex-col items-center gap-0.5 px-1 py-1.5 rounded text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Save size={15} />
            <span className="text-[10px] leading-none">Save</span>
          </button>
          <button
            onClick={onLoad}
            title="Load Diagram"
            className="flex flex-col items-center gap-0.5 px-1 py-1.5 rounded text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <FolderOpen size={15} />
            <span className="text-[10px] leading-none">Load</span>
          </button>
          <button
            onClick={handleImageUploadClick}
            disabled={isUploading}
            title="Upload Image"
            className="flex flex-col items-center gap-0.5 px-1 py-1.5 rounded text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Image size={15} />
            <span className="text-[10px] leading-none">{isUploading ? 'Adding…' : 'Image'}</span>
          </button>
          <button
            onClick={onClear}
            title="Clear Canvas"
            className="flex flex-col items-center gap-0.5 px-1 py-1.5 rounded text-xs text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 size={15} />
            <span className="text-[10px] leading-none">Clear</span>
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Icons Section */}
      <div className="px-2 py-2 flex-1 overflow-y-auto">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
          Drag to Canvas
        </p>
        <div className="grid grid-cols-3 gap-1">
          {ICON_DEFINITIONS.map((iconDef) => (
            <div
              key={iconDef.type}
              className="flex flex-col items-center gap-0.5 p-1 rounded hover:bg-accent cursor-default"
              title={iconDef.label}
            >
              {/* Only the image is draggable — not the label */}
              <img
                src={iconDef.src}
                alt={iconDef.label}
                draggable
                onDragStart={(e) => handleDragStart(e, iconDef.type)}
                className="w-8 h-8 object-contain cursor-grab active:cursor-grabbing select-none"
              />
              <span className="text-[9px] text-muted-foreground leading-none text-center truncate w-full pointer-events-none select-none">
                {iconDef.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AttackPathToolbar;
