import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { RotateCcw, X } from 'lucide-react';
import type { CellSettings } from '@/hooks/useGridState';
import { bridgeKey } from '@/hooks/useGridState';

interface CellEditorPanelProps {
  selectedCell: { r: number; c: number };
  cellSettings: CellSettings | undefined;
  globalCornerRadius: number;
  globalInnerRadius: number;
  grid: boolean[][];
  bridges: Set<string>;
  onCornerRadiusChange: (r: number, c: number, v: number) => void;
  onInnerRadiusChange: (r: number, c: number, v: number) => void;
  onReset: (r: number, c: number) => void;
  onRemoveBridge: (key: string) => void;
}

const CellEditorPanel: React.FC<CellEditorPanelProps> = ({
  selectedCell, cellSettings, globalCornerRadius, globalInnerRadius,
  grid, bridges,
  onCornerRadiusChange, onInnerRadiusChange, onReset, onRemoveBridge,
}) => {
  const cr = cellSettings?.cornerRadius ?? globalCornerRadius;
  const ir = cellSettings?.innerRadius ?? globalInnerRadius;
  const hasOverride = cellSettings !== undefined;

  // Find bridges connected to this cell
  const cellBridges: { key: string; otherR: number; otherC: number }[] = [];
  bridges.forEach(key => {
    const [a, b] = key.split('-');
    const [r1, c1] = a.split(',').map(Number);
    const [r2, c2] = b.split(',').map(Number);
    if (r1 === selectedCell.r && c1 === selectedCell.c) {
      cellBridges.push({ key, otherR: r2, otherC: c2 });
    } else if (r2 === selectedCell.r && c2 === selectedCell.c) {
      cellBridges.push({ key, otherR: r1, otherC: c1 });
    }
  });

  // Find available diagonal targets
  const diags = [[-1,-1],[-1,1],[1,-1],[1,1]];
  const availableTargets: { r: number; c: number }[] = [];
  for (const [dr, dc] of diags) {
    const nr = selectedCell.r + dr;
    const nc = selectedCell.c + dc;
    if (nr >= 0 && nr < grid.length && nc >= 0 && nc < (grid[0]?.length || 0) && grid[nr][nc]) {
      const midR1 = selectedCell.r, midC1 = nc;
      const midR2 = nr, midC2 = selectedCell.c;
      if (!grid[midR1]?.[midC1] && !grid[midR2]?.[midC2]) {
        const key = bridgeKey(selectedCell.r, selectedCell.c, nr, nc);
        if (!bridges.has(key)) {
          availableTargets.push({ r: nr, c: nc });
        }
      }
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4 bg-card border-2 border-accent/40">
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

      {(cellBridges.length > 0 || availableTargets.length > 0) && (
        <>
          <div className="h-px bg-border" />
          <div>
            <span className="text-xs font-medium text-muted-foreground block mb-1.5">Bridges</span>
            {cellBridges.map(({ key, otherR, otherC }) => (
              <div key={key} className="flex items-center justify-between text-xs py-1">
                <span className="text-foreground">↔ Cell ({otherC}, {otherR})</span>
                <Button
                  variant="ghost" size="sm" className="h-5 w-5 p-0"
                  onClick={() => onRemoveBridge(key)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {availableTargets.length > 0 && (
              <p className="text-[10px] text-muted-foreground mt-1">
                Click a dashed diagonal cell to create a bridge
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CellEditorPanel;
