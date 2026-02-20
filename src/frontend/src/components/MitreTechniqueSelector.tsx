import { useState } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Check, ChevronsUpDown, X, Plus } from 'lucide-react';
import { mitreAttackData } from '@/data/mitreAttackData';
import { cn } from '@/lib/utils';

interface MitreTechniqueSelectorProps {
  selectedTechniques: string[];
  onTechniquesChange: (techniques: string[]) => void;
  customTechniques: string[];
  onCustomTechniquesChange: (techniques: string[]) => void;
}

export default function MitreTechniqueSelector({ 
  selectedTechniques, 
  onTechniquesChange,
  customTechniques,
  onCustomTechniquesChange 
}: MitreTechniqueSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [customInput, setCustomInput] = useState('');

  const addTechnique = (techniqueId: string) => {
    if (!selectedTechniques.includes(techniqueId)) {
      onTechniquesChange([...selectedTechniques, techniqueId]);
    }
    setOpen(false);
    setSearchValue('');
  };

  const removeTechnique = (techniqueId: string) => {
    onTechniquesChange(selectedTechniques.filter((id) => id !== techniqueId));
  };

  const addCustomTechnique = () => {
    const trimmed = customInput.trim();
    if (trimmed && !customTechniques.includes(trimmed)) {
      onCustomTechniquesChange([...customTechniques, trimmed]);
      setCustomInput('');
    }
  };

  const removeCustomTechnique = (technique: string) => {
    onCustomTechniquesChange(customTechniques.filter((t) => t !== technique));
  };

  const filteredTechniques = mitreAttackData.filter(
    (technique) =>
      technique.id.toLowerCase().includes(searchValue.toLowerCase()) ||
      technique.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      technique.description.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
            Select MITRE ATT&CK techniques...
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[600px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search techniques by ID, name, or description..." value={searchValue} onValueChange={setSearchValue} />
            <CommandList>
              <CommandEmpty>No technique found.</CommandEmpty>
              <CommandGroup>
                {filteredTechniques.map((technique) => (
                  <CommandItem key={technique.id} value={technique.id} onSelect={() => addTechnique(technique.id)} className="flex items-start gap-2 py-3">
                    <Check className={cn('mt-0.5 h-4 w-4 shrink-0', selectedTechniques.includes(technique.id) ? 'opacity-100' : 'opacity-0')} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="font-mono text-xs">
                          {technique.id}
                        </Badge>
                        <span className="font-semibold text-sm">{technique.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{technique.description}</p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <div className="flex gap-2">
        <Input 
          placeholder="Add custom technique or note..." 
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addCustomTechnique();
            }
          }}
        />
        <Button type="button" variant="outline" size="icon" onClick={addCustomTechnique} disabled={!customInput.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {selectedTechniques.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Predefined Techniques:</p>
          <div className="flex flex-wrap gap-2">
            {selectedTechniques.map((techniqueId) => {
              const technique = mitreAttackData.find((t) => t.id === techniqueId);
              return (
                <Badge key={techniqueId} variant="secondary" className="gap-1 pr-1">
                  <span className="font-mono text-xs">{techniqueId}</span>
                  <span className="text-xs">- {technique?.name}</span>
                  <Button variant="ghost" size="icon" className="h-4 w-4 p-0 hover:bg-transparent" onClick={() => removeTechnique(techniqueId)}>
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {customTechniques.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Custom Techniques:</p>
          <div className="flex flex-wrap gap-2">
            {customTechniques.map((technique, index) => (
              <Badge key={index} variant="outline" className="gap-1 pr-1 italic">
                <span className="text-xs">{technique}</span>
                <Button variant="ghost" size="icon" className="h-4 w-4 p-0 hover:bg-transparent" onClick={() => removeCustomTechnique(technique)}>
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
