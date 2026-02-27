import AttackPathIcon, { IconType } from './AttackPathIcon';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Pencil, Minus, ArrowRight, Eraser, Type, Undo, Save, FolderOpen, Move, Trash2, Image, MousePointer } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  drawColor: string;
  onDrawColorChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
  textColor: string;
  onTextColorChange: (color: string) => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  onUndo: () => void;
  onClear: () => void;
  onSave: () => void;
  onAddImage: (file: File) => void;
}

export default function AttackPathToolbar({
  activeTool,
  onToolChange,
  drawColor,
  onDrawColorChange,
  strokeWidth,
  onStrokeWidthChange,
  textColor,
  onTextColorChange,
  fontSize,
  onFontSizeChange,
  onUndo,
  onClear,
  onSave,
  onAddImage,
}: AttackPathToolbarProps) {
  const fontSizes = [12, 14, 16, 18, 20, 24, 28, 32, 36, 48];
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
    } catch (error) {
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

  const showDrawOptions = activeTool === 'draw' || activeTool === 'line' || activeTool === 'arrow';
  const showTextOptions = activeTool === 'text';

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
        {toolBtn('draw', 'Freehand Draw', Pencil)}
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

      {showDrawOptions && (
        <>
          <Separator />
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Draw Options</h3>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={drawColor}
                  onChange={(e) => onDrawColorChange(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-border"
                />
                <span className="text-xs text-muted-foreground">{drawColor}</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Stroke Width: {strokeWidth}px</label>
              <input
                type="range"
                min={1}
                max={10}
                value={strokeWidth}
                onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </>
      )}

      {showTextOptions && (
        <>
          <Separator />
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Text Options</h3>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Font Size</label>
              <Select
                value={String(fontSize)}
                onValueChange={(val) => onFontSizeChange(Number(val))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontSizes.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}px
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Text Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => onTextColorChange(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-border"
                />
                <span className="text-xs text-muted-foreground">{textColor}</span>
              </div>
            </div>
          </div>
        </>
      )}

      <Separator />

      <div className="space-y-1.5">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={onUndo}
        >
          <Undo className="h-4 w-4 mr-2" />
          Undo
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
