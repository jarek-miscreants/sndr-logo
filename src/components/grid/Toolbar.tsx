import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Pencil, Eraser, Minus, Square, Undo2, Redo2, Trash2, MousePointer } from 'lucide-react';
import type { Tool } from '@/hooks/useGridState';

interface ToolbarProps {
  tool: Tool;
  gridSize: number;
  canUndo: boolean;
  canRedo: boolean;
  onToolChange: (tool: Tool) => void;
  onGridSizeChange: (size: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
}

const tools: { id: Tool; icon: React.ElementType; label: string; shortcut: string }[] = [
  { id: 'pencil', icon: Pencil, label: 'Pencil', shortcut: 'P' },
  { id: 'eraser', icon: Eraser, label: 'Eraser', shortcut: 'E' },
  { id: 'line', icon: Minus, label: 'Line', shortcut: 'L' },
  { id: 'rectangle', icon: Square, label: 'Rectangle', shortcut: 'R' },
  { id: 'edit', icon: MousePointer, label: 'Edit Cell', shortcut: 'V' },
];

const gridSizes = [8, 16, 32, 64];

const Toolbar: React.FC<ToolbarProps> = ({
  tool, gridSize, canUndo, canRedo,
  onToolChange, onGridSizeChange, onUndo, onRedo, onClear,
}) => {
  return (
    <div className="flex items-center gap-1 p-2 bg-card border-b border-border flex-wrap">
      <div className="flex items-center gap-0.5 mr-2">
        {tools.map(t => (
          <Tooltip key={t.id}>
            <TooltipTrigger asChild>
              <Button
                variant={tool === t.id ? 'default' : 'ghost'}
                size="icon"
                className="h-9 w-9"
                onClick={() => onToolChange(t.id)}
              >
                <t.icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t.label} ({t.shortcut})</TooltipContent>
          </Tooltip>
        ))}
      </div>

      <div className="h-6 w-px bg-border mx-1" />

      <Select value={String(gridSize)} onValueChange={v => onGridSizeChange(Number(v))}>
        <SelectTrigger className="w-24 h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {gridSizes.map(s => (
            <SelectItem key={s} value={String(s)}>{s}×{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="h-6 w-px bg-border mx-1" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onUndo} disabled={!canUndo}>
            <Undo2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onRedo} disabled={!canRedo}>
            <Redo2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Redo (Ctrl+Shift+Z)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive" onClick={onClear}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Clear canvas</TooltipContent>
      </Tooltip>
    </div>
  );
};

export default Toolbar;
