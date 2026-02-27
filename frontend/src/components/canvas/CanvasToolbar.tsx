import React, { useState } from 'react';
import { ToolType, ShapeType } from '../../hooks/useCanvasState';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import {
  MousePointer2,
  Pencil,
  Square,
  Type,
  Image,
  Undo2,
  Download,
  Minus,
  Circle,
  Triangle,
  ArrowRight,
  Star,
  Diamond,
  Hexagon,
  Trash2,
  ChevronDown,
} from 'lucide-react';

interface CanvasToolbarProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  activeShape: ShapeType;
  onShapeChange: (shape: ShapeType) => void;
  strokeColor: string;
  onStrokeColorChange: (color: string) => void;
  fillColor: string;
  onFillColorChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  textColor: string;
  onTextColorChange: (color: string) => void;
  onUndo: () => void;
  canUndo: boolean;
  onExportPng: () => void;
  isExporting: boolean;
  onToggleIconPanel: () => void;
  iconPanelOpen: boolean;
}

const SHAPES: { type: ShapeType; label: string; icon: React.ReactNode }[] = [
  { type: 'rectangle', label: 'Rectangle', icon: <Square size={14} /> },
  { type: 'circle', label: 'Circle', icon: <Circle size={14} /> },
  { type: 'triangle', label: 'Triangle', icon: <Triangle size={14} /> },
  { type: 'arrow', label: 'Arrow', icon: <ArrowRight size={14} /> },
  { type: 'line', label: 'Line', icon: <Minus size={14} /> },
  { type: 'star', label: 'Star', icon: <Star size={14} /> },
  { type: 'diamond', label: 'Diamond', icon: <Diamond size={14} /> },
  { type: 'hexagon', label: 'Hexagon', icon: <Hexagon size={14} /> },
];

const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 64];

function ToolBtn({
  tooltip,
  active,
  onClick,
  children,
  disabled,
}: {
  tooltip: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={active ? 'default' : 'ghost'}
          size="icon"
          className={`w-9 h-9 ${active ? 'bg-canvas-accent text-white shadow-sm' : 'text-canvas-fg hover:bg-canvas-hover'}`}
          onClick={onClick}
          disabled={disabled}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right" className="text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

function Divider() {
  return <div className="w-full h-px bg-canvas-border my-1" />;
}

export default function CanvasToolbar({
  activeTool,
  onToolChange,
  activeShape,
  onShapeChange,
  strokeColor,
  onStrokeColorChange,
  fillColor,
  onFillColorChange,
  strokeWidth,
  onStrokeWidthChange,
  fontSize,
  onFontSizeChange,
  textColor,
  onTextColorChange,
  onUndo,
  canUndo,
  onExportPng,
  isExporting,
  onToggleIconPanel,
  iconPanelOpen,
}: CanvasToolbarProps) {
  const [shapePopoverOpen, setShapePopoverOpen] = useState(false);

  const activeShapeData = SHAPES.find(s => s.type === activeShape);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="w-14 flex-shrink-0 h-full flex flex-col items-center py-3 gap-1 bg-canvas-chrome border-r border-canvas-border overflow-y-auto">
        {/* Select */}
        <ToolBtn tooltip="Select (V)" active={activeTool === 'select'} onClick={() => onToolChange('select')}>
          <MousePointer2 size={16} />
        </ToolBtn>

        <Divider />

        {/* Draw */}
        <ToolBtn tooltip="Freehand Draw (D)" active={activeTool === 'draw'} onClick={() => onToolChange('draw')}>
          <Pencil size={16} />
        </ToolBtn>

        {/* Shapes */}
        <Popover open={shapePopoverOpen} onOpenChange={setShapePopoverOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  variant={activeTool === 'shape' ? 'default' : 'ghost'}
                  size="icon"
                  className={`w-9 h-9 relative ${activeTool === 'shape' ? 'bg-canvas-accent text-white shadow-sm' : 'text-canvas-fg hover:bg-canvas-hover'}`}
                  onClick={() => onToolChange('shape')}
                >
                  {activeShapeData?.icon ?? <Square size={16} />}
                  <ChevronDown size={8} className="absolute bottom-0.5 right-0.5 opacity-60" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">Shapes (S)</TooltipContent>
          </Tooltip>
          <PopoverContent side="right" align="start" className="w-44 p-2">
            <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">Shapes</p>
            <div className="grid grid-cols-4 gap-1">
              {SHAPES.map(s => (
                <Tooltip key={s.type}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeShape === s.type ? 'default' : 'ghost'}
                      size="icon"
                      className="w-9 h-9"
                      onClick={() => {
                        onShapeChange(s.type);
                        onToolChange('shape');
                        setShapePopoverOpen(false);
                      }}
                    >
                      {s.icon}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">{s.label}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Text */}
        <ToolBtn tooltip="Text (T)" active={activeTool === 'text'} onClick={() => onToolChange('text')}>
          <Type size={16} />
        </ToolBtn>

        {/* Icons */}
        <ToolBtn tooltip="Icon Library (I)" active={iconPanelOpen} onClick={onToggleIconPanel}>
          <Image size={16} />
        </ToolBtn>

        <Divider />

        {/* Stroke Color */}
        <Tooltip>
          <TooltipTrigger asChild>
            <label className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-canvas-hover cursor-pointer relative">
              <div className="w-5 h-5 rounded border border-canvas-border shadow-sm" style={{ background: strokeColor }} />
              <input
                type="color"
                value={strokeColor}
                onChange={e => onStrokeColorChange(e.target.value)}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
            </label>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">Stroke Color</TooltipContent>
        </Tooltip>

        {/* Fill Color */}
        <Tooltip>
          <TooltipTrigger asChild>
            <label className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-canvas-hover cursor-pointer relative">
              <div className="w-5 h-5 rounded border border-canvas-border shadow-sm" style={{ background: fillColor }} />
              <div className="absolute bottom-1 right-1 w-2 h-2 rounded-sm bg-canvas-chrome border border-canvas-border" />
              <input
                type="color"
                value={fillColor}
                onChange={e => onFillColorChange(e.target.value)}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
            </label>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">Fill Color</TooltipContent>
        </Tooltip>

        {/* Stroke Width */}
        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="w-9 h-9 text-canvas-fg hover:bg-canvas-hover">
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-4 rounded-full bg-current" style={{ height: `${Math.min(strokeWidth, 4)}px` }} />
                  </div>
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">Stroke Width ({strokeWidth}px)</TooltipContent>
          </Tooltip>
          <PopoverContent side="right" align="center" className="w-48 p-3">
            <p className="text-xs font-semibold text-muted-foreground mb-3">Stroke Width: {strokeWidth}px</p>
            <Slider
              min={1}
              max={20}
              step={1}
              value={[strokeWidth]}
              onValueChange={([v]) => onStrokeWidthChange(v)}
            />
          </PopoverContent>
        </Popover>

        {/* Text Color (only when text tool active) */}
        {activeTool === 'text' && (
          <Tooltip>
            <TooltipTrigger asChild>
              <label className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-canvas-hover cursor-pointer relative">
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold" style={{ color: textColor }}>A</span>
                  <div className="w-4 h-1 rounded-sm mt-0.5" style={{ background: textColor }} />
                </div>
                <input
                  type="color"
                  value={textColor}
                  onChange={e => onTextColorChange(e.target.value)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
              </label>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">Text Color</TooltipContent>
          </Tooltip>
        )}

        {/* Font Size (only when text tool active) */}
        {activeTool === 'text' && (
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-9 h-9 text-canvas-fg hover:bg-canvas-hover text-xs font-semibold">
                    {fontSize}
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">Font Size</TooltipContent>
            </Tooltip>
            <PopoverContent side="right" align="center" className="w-32 p-2">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Font Size</p>
              <div className="flex flex-col gap-0.5">
                {FONT_SIZES.map(s => (
                  <button
                    key={s}
                    className={`text-left px-2 py-1 rounded text-xs hover:bg-accent transition-colors ${fontSize === s ? 'bg-accent font-semibold' : ''}`}
                    onClick={() => onFontSizeChange(s)}
                  >
                    {s}px
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        <Divider />

        {/* Undo */}
        <ToolBtn tooltip="Undo (Ctrl+Z)" onClick={onUndo} disabled={!canUndo}>
          <Undo2 size={16} />
        </ToolBtn>

        <Divider />

        {/* Export PNG */}
        <ToolBtn tooltip="Save as PNG" onClick={onExportPng} disabled={isExporting}>
          {isExporting ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download size={16} />
          )}
        </ToolBtn>
      </div>
    </TooltipProvider>
  );
}
