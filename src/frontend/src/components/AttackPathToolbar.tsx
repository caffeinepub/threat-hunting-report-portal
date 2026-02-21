import AttackPathIcon from './AttackPathIcon';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Pencil, Minus, ArrowRight, Eraser, Type, Undo, Save, FolderOpen, Download, Move, Trash2 } from 'lucide-react';
import { DrawingTool } from '@/hooks/useAttackPathState';

export type IconType = 'email' | 'attacker' | 'computer' | 'server' | 'domain' | 'fileFolder' | 'exe' | 'dll' | 'pdf' | 'ppt' | 'csv' | 'zip' | 'doc' | 'c2' | 'script' | 'user';

const iconTypes: { type: IconType; label: string }[] = [
  { type: 'user', label: 'User' },
  { type: 'email', label: 'Email' },
  { type: 'attacker', label: 'Attacker' },
  { type: 'computer', label: 'Computer' },
  { type: 'server', label: 'Server' },
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
  onExport: () => void;
  onClear: () => void;
  isSaving: boolean;
  textColor: string;
  onTextColorChange: (color: string) => void;
}

export default function AttackPathToolbar({ 
  activeDrawingTool, 
  onDrawingToolChange,
  onUndo,
  canUndo,
  onSave,
  onLoad,
  onExport,
  onClear,
  isSaving,
  textColor,
  onTextColorChange,
}: AttackPathToolbarProps) {
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
        {activeDrawingTool === 'text' && (
          <div className="ml-6 space-y-2">
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
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={onExport}
        >
          <Download className="h-4 w-4 mr-2" />
          Export as PNG
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
