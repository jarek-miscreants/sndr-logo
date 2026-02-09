import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import type { CellSettings } from '@/hooks/useGridState';

interface CellEditorPanelProps {
  selectedCell: { r: number; c: number };
  cellSettings: CellSettings | undefined;
  globalCornerRadius: number;
  globalInnerRadius: number;
  onCornerRadiusChange: (r: number, c: number, v: number) => void;
  onInnerRadiusChange: (r: number, c: number, v: number) => void;
  onReset: (r: number, c: number) => void;
}

const CellEditorPanel: React.FC<CellEditorPanelProps> = ({
  selectedCell, cellSettings, globalCornerRadius, globalInnerRadius,
  onCornerRadiusChange, onInnerRadiusChange, onReset,
}) => {
  const cr = cellSettings?.cornerRadius ?? globalCornerRadius;
  const ir = cellSettings?.innerRadius ?? globalInnerRadius;
  const hasOverride = cellSettings !== undefined;

  return (
    <div className="flex flex-col gap-3 p-4 bg-card rounded-lg border-2 border-primary/50">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">
          Cell ({selectedCell.c}, {selectedCell.r})
        </span>
        {hasOverride && (
          <Button
            variant="ghost" size="sm" className="h-6 px-2 text-xs"
            onClick={() => onReset(selectedCell.r, selectedCell.c)}
          >
            <RotateCcw className="h-3 w-3 mr-1" /> Reset
          </Button>
        )}
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          Corner Radius — {Math.round(cr * 200)}%
          {!hasOverride && <span className="text-muted-foreground/60 ml-1">(global)</span>}
        </label>
        <Slider
          value={[cr]}
          min={0} max={0.5} step={0.01}
          onValueChange={([v]) => onCornerRadiusChange(selectedCell.r, selectedCell.c, v)}
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          Inner Radius — {Math.round(ir * 200)}%
          {!hasOverride && <span className="text-muted-foreground/60 ml-1">(global)</span>}
        </label>
        <Slider
          value={[ir]}
          min={0} max={0.5} step={0.01}
          onValueChange={([v]) => onInnerRadiusChange(selectedCell.r, selectedCell.c, v)}
        />
      </div>
    </div>
  );
};

export default CellEditorPanel;
