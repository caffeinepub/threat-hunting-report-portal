import AttackPathIcon from './AttackPathIcon';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Pencil, Minus, ArrowRight, Eraser, Type, Undo, Save, FolderOpen, Move, Trash2, Image } from 'lucide-react';
import { DrawingTool } from '@/hooks/useAttackPathState';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ExternalBlob } from '@/backend';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

export type IconType = 'email' | 'attacker' | 'computer' | 'server' | 'domain' | 'fileFolder' | 'exe' | 'dll' | 'pdf' | 'ppt' | 'csv' | 'zip' | 'doc' | 'c2' | 'script' | 'user' | 'multipleUsers' | 'multipleComputers' | 'multipleServers';

const iconTypes: { type: IconType; label: string }[] = [
  { type: 'user', label: 'Man' },
  { type: 'multipleUsers', label: 'Multiple Users' },
  { type: 'email', label: 'Email' },
  { type: 'attacker', label: 'Attacker' },
  { type: 'computer', label: 'Computer' },
  { type: 'multipleComputers', label: 'Multiple Computers' },
  { type: 'server', label: 'Server' },
  { type: 'multipleServers', label: 'Multiple Servers' },
  { type: 'domain', label: 'Domain' },
  { type: 'fileFolder', label: 'File/Folder' },
  { type: 'exe', label: '.exe' },
  { type: 'dll', label: '.dll' },
  { type: 'script', label: 'Script' },
  { type: 'pdf', label: '.pdf' },
  { type: 'ppt', label: '.ppt' },
  { type: 'csv', label: 'Microsoft Excel' },
  { type: 'zip', label: '.zip' },
  { type: 'doc', label: 'Microsoft Word' },
  { type: 'c2', label: 'Command & Control' },
];

interface AttackPathToolbarProps {
  activeDrawingTool: DrawingTool;
  onDrawingToolChange: (tool: DrawingTool) => void;
  onUndo: () => void;
  canUndo: boolean;
  onSave: () => void;
  onLoad: () => void;
  onClear: () => void;
  isSaving: boolean;
  textColor: string;
  onTextColorChange: (color: string) => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  onImageUpload: (file: ExternalBlob, name: string) => void;
  selectedElementId: string | null;
  selectedElementType: 'icon' | 'text' | 'arrow' | 'image' | null;
  textRotation: number;
  onTextRotationChange: (rotation: number) => void;
}

export default function AttackPathToolbar({ 
  activeDrawingTool, 
  onDrawingToolChange,
  onUndo,
  canUndo,
  onSave,
  onLoad,
  onClear,
  isSaving,
  textColor,
  onTextColorChange,
  fontSize,
  onFontSizeChange,
  onImageUpload,
  selectedElementId,
  selectedElementType,
  textRotation,
  onTextRotationChange,
}: AttackPathToolbarProps) {
  const fontSizes = [12, 14, 16, 18, 20, 24, 28, 32, 36, 48];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
      toast.error('Please upload a PNG, JPG, or JPEG image');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Create ExternalBlob with upload progress tracking
      const externalBlob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
        setUploadProgress(percentage);
      });

      // Call the upload handler
      onImageUpload(externalBlob, file.name);

      toast.success('Image uploaded successfully');
      setUploadProgress(0);
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const showTextControls = activeDrawingTool === 'text' || (selectedElementId && selectedElementType === 'text');

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-sm mb-2">Attack Path Elements</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Drag icons onto the canvas to build your attack path diagram
        </p>
      </div>

      <Separator />

      <div className="space-y-3">
        {iconTypes.map((icon) => (
          <div key={icon.type} className="flex items-center gap-3">
            <AttackPathIcon type={icon.type} />
            <span className="text-sm font-medium">{icon.label}</span>
          </div>
        ))}
      </div>

      <Separator />

      <div>
        <h3 className="font-semibold text-sm mb-2">Drawing Tools</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Select a tool to draw on the canvas
        </p>
      </div>

      <div className="space-y-2">
        <Button
          variant={activeDrawingTool === 'freehand' ? 'default' : 'outline'}
          size="sm"
          className="w-full justify-start"
          onClick={() => onDrawingToolChange(activeDrawingTool === 'freehand' ? null : 'freehand')}
        >
          <Pencil className="h-4 w-4 mr-2" />
          Freehand Draw
        </Button>
        <Button
          variant={activeDrawingTool === 'line' ? 'default' : 'outline'}
          size="sm"
          className="w-full justify-start"
          onClick={() => onDrawingToolChange(activeDrawingTool === 'line' ? null : 'line')}
        >
          <Minus className="h-4 w-4 mr-2" />
          Straight Line
        </Button>
        <Button
          variant={activeDrawingTool === 'arrow' ? 'default' : 'outline'}
          size="sm"
          className="w-full justify-start"
          onClick={() => onDrawingToolChange(activeDrawingTool === 'arrow' ? null : 'arrow')}
        >
          <ArrowRight className="h-4 w-4 mr-2" />
          Arrow
        </Button>
        <Button
          variant={activeDrawingTool === 'text' ? 'default' : 'outline'}
          size="sm"
          className="w-full justify-start"
          onClick={() => onDrawingToolChange(activeDrawingTool === 'text' ? null : 'text')}
        >
          <Type className="h-4 w-4 mr-2" />
          Text Label
        </Button>
        {showTextControls && (
          <div className="ml-6 space-y-3">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Font Size:</p>
              <Select value={fontSize.toString()} onValueChange={(value) => onFontSizeChange(Number(value))}>
                <SelectTrigger className="w-full h-8">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {fontSizes.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}px
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Text Color:</p>
              <div className="flex gap-2">
                <button
                  onClick={() => onTextColorChange('#000000')}
                  className={`w-8 h-8 rounded border-2 ${
                    textColor === '#000000' ? 'border-primary ring-2 ring-primary/50' : 'border-border'
                  }`}
                  style={{ backgroundColor: '#000000' }}
                  title="Black"
                />
                <button
                  onClick={() => onTextColorChange('#FF0000')}
                  className={`w-8 h-8 rounded border-2 ${
                    textColor === '#FF0000' ? 'border-primary ring-2 ring-primary/50' : 'border-border'
                  }`}
                  style={{ backgroundColor: '#FF0000' }}
                  title="Red"
                />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Rotation: {textRotation}°</p>
              <Slider
                value={[textRotation]}
                onValueChange={(values) => onTextRotationChange(values[0])}
                min={0}
                max={360}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        )}
        <Button
          variant={activeDrawingTool === 'transform' ? 'default' : 'outline'}
          size="sm"
          className="w-full justify-start"
          onClick={() => onDrawingToolChange(activeDrawingTool === 'transform' ? null : 'transform')}
        >
          <Move className="h-4 w-4 mr-2" />
          Free Transform
        </Button>
        <Button
          variant={activeDrawingTool === 'eraser' ? 'destructive' : 'outline'}
          size="sm"
          className="w-full justify-start"
          onClick={() => onDrawingToolChange(activeDrawingTool === 'eraser' ? null : 'eraser')}
        >
          <Eraser className="h-4 w-4 mr-2" />
          Eraser
        </Button>
      </div>

      <Separator />

      <div>
        <h3 className="font-semibold text-sm mb-2">Image Upload</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Add custom images to your diagram
        </p>
      </div>

      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={handleImageUploadClick}
          disabled={isUploading}
        >
          <Image className="h-4 w-4 mr-2" />
          {isUploading ? `Uploading ${uploadProgress}%` : 'Upload Image'}
        </Button>
      </div>

      <Separator />

      <div className="space-y-2">
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
          variant="default"
          size="sm"
          className="w-full justify-start"
          onClick={onSave}
          disabled={isSaving}
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Diagram'}
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
          variant="destructive"
          size="sm"
          className="w-full justify-start"
          onClick={onClear}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear Diagram
        </Button>
      </div>
    </div>
  );
}
