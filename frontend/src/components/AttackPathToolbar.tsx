import AttackPathIcon, { IconType } from './AttackPathIcon';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Pencil, Minus, ArrowRight, Eraser, Type, Undo, Redo, Save, FolderOpen, Move, Trash2, Image, MousePointer } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

const iconTypes: { type: IconType; label: string }[] = [
  { type: 'user', label: 'User' },
  { type: 'multipleusers', label: 'Multiple Users' },
  { type: 'email', label: 'Email' },
  { type: 'attacker', label: 'Attacker' },
  { type: 'computer', label: 'Computer' },
  { type: 'multiplecomputers', label: 'Multiple Computers' },
  { type: 'server', label: 'Server' },
  { type: 'multipleservers', label: 'Multiple Servers' },
  { type: 'domain', label: 'Domain' },
  { type: 'file', label: 'File/Folder' },
  { type: 'exe', label: '.exe' },
  { type: 'dll', label: '.dll' },
  { type: 'script', label: 'Script' },
  { type: 'pdf', label: '.pdf' },
  { type: 'ppt', label: '.ppt' },
  { type: 'excel', label: 'Microsoft Excel' },
  { type: 'zip', label: '.zip' },
  { type: 'word', label: 'Microsoft Word' },
  { type: 'c2', label: 'Command & Control' },
  { type: 'backdoor', label: 'Backdoor/Virus' },
  { type: 'phishing', label: 'Phishing Email' },
  { type: 'cloudserver', label: 'Cloud Server' },
  { type: 'firewall', label: 'Firewall' },
  { type: 'router', label: 'Router Device' },
  { type: 'scheduledtask', label: 'Scheduled Task' },
  { type: 'powershell', label: 'PowerShell' },
  { type: 'javascript', label: 'JavaScript' },
  { type: 'webbrowser', label: 'Web Browser' },
];

interface AttackPathToolbarProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onSave: () => void;
  onLoad: () => void;
  onAddImage: (file: File) => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export default function AttackPathToolbar({
  activeTool,
  onToolChange,
  onUndo,
  onRedo,
  onClear,
  onSave,
  onLoad,
  onAddImage,
  canUndo = false,
  canRedo = false,
}: AttackPathToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

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
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const toolBtn = (tool: string, label: string, Icon: React.ElementType) => (
    <Button
      variant={activeTool === tool ? 'default' : 'outline'}
      size="sm"
      className="w-full justify-start"
      onClick={() => onToolChange(activeTool === tool ? 'select' : tool)}
    >
      <Icon className="h-4 w-4 mr-2" />
      {label}
    </Button>
  );

  return (
    <div className="w-56 flex-shrink-0 border-r border-border bg-card overflow-y-auto p-3 space-y-4">
      <div>
        <h3 className="font-semibold text-sm mb-1">Attack Path Elements</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Drag icons onto the canvas
        </p>
      </div>

      <div className="space-y-2">
        {iconTypes.map((icon) => (
          <div
            key={icon.type}
            className="flex items-center gap-2 cursor-grab active:cursor-grabbing rounded px-1 py-0.5 hover:bg-muted transition-colors"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('iconType', icon.type);
              e.dataTransfer.setData('iconName', icon.label);
            }}
          >
            <AttackPathIcon type={icon.type} size={28} />
            <span className="text-xs font-medium truncate">{icon.label}</span>
          </div>
        ))}
      </div>

      <Separator />

      <div>
        <h3 className="font-semibold text-sm mb-2">Tools</h3>
      </div>

      <div className="space-y-1.5">
        {toolBtn('select', 'Select / Move', MousePointer)}
        {toolBtn('connect', 'Connect Icons', ArrowRight)}
        {toolBtn('pen', 'Freehand Draw', Pencil)}
        {toolBtn('line', 'Draw Line', Minus)}
        {toolBtn('arrow', 'Draw Arrow', ArrowRight)}
        {toolBtn('text', 'Add Text', Type)}
        {toolBtn('freeTransform', 'Free Transform', Move)}
        {toolBtn('eraser', 'Eraser', Eraser)}

        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={handleImageUploadClick}
          disabled={isUploading}
        >
          <Image className="h-4 w-4 mr-2" />
          {isUploading ? 'Adding...' : 'Upload Image'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <Separator />

      <div className="space-y-1.5">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={onUndo}
          disabled={!canUndo}
        >
          <Undo className="h-4 w-4 mr-2" />
          Undo
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={onRedo}
          disabled={!canRedo}
        >
          <Redo className="h-4 w-4 mr-2" />
          Redo
        </Button>

        <Button
          variant="default"
          size="sm"
          className="w-full justify-start"
          onClick={onSave}
        >
          <Save className="h-4 w-4 mr-2" />
          Save Diagram
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={onLoad}
        >
          <FolderOpen className="h-4 w-4 mr-2" />
          Load Diagram
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start text-destructive hover:text-destructive"
          onClick={onClear}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear Canvas
        </Button>
      </div>
    </div>
  );
}
