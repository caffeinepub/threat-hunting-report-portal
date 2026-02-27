import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, X } from 'lucide-react';
import { ICON_LIBRARY, IconCategory } from '../../data/iconLibrary';

interface IconLibraryPanelProps {
  onIconSelect: (iconPath: string, iconName: string) => void;
  onClose: () => void;
}

export default function IconLibraryPanel({ onIconSelect, onClose }: IconLibraryPanelProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<IconCategory | 'all'>('all');

  const categories = useMemo(() => {
    const cats = Array.from(new Set(ICON_LIBRARY.map(i => i.category)));
    return cats as IconCategory[];
  }, []);

  const filtered = useMemo(() => {
    return ICON_LIBRARY.filter(icon => {
      const matchesSearch = !search || icon.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === 'all' || icon.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-canvas-border">
        <span className="text-sm font-semibold text-canvas-fg">Icon Library</span>
        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={onClose}>
          <X size={14} />
        </Button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-canvas-border">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search icons..."
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeCategory} onValueChange={v => setActiveCategory(v as IconCategory | 'all')} className="flex flex-col flex-1 overflow-hidden">
        <div className="px-2 pt-2 border-b border-canvas-border">
          <TabsList className="flex flex-wrap gap-1 h-auto bg-transparent p-0">
            <TabsTrigger value="all" className="text-xs px-2 py-1 h-auto data-[state=active]:bg-canvas-accent data-[state=active]:text-white rounded">
              All
            </TabsTrigger>
            {categories.map(cat => (
              <TabsTrigger key={cat} value={cat} className="text-xs px-2 py-1 h-auto data-[state=active]:bg-canvas-accent data-[state=active]:text-white rounded capitalize">
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3 grid grid-cols-3 gap-2">
            {filtered.map(icon => (
              <button
                key={icon.id}
                className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-canvas-hover border border-transparent hover:border-canvas-border transition-all group"
                onClick={() => onIconSelect(icon.path, icon.name)}
                title={icon.name}
              >
                <img
                  src={icon.path}
                  alt={icon.name}
                  className="w-10 h-10 object-contain"
                  draggable={false}
                />
                <span className="text-[10px] text-muted-foreground text-center leading-tight line-clamp-2 group-hover:text-canvas-fg">
                  {icon.name}
                </span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-3 text-center py-8 text-xs text-muted-foreground">
                No icons found
              </div>
            )}
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
