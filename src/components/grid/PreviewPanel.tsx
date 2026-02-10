import React, { useMemo } from 'react';
import { generateSVGPathData, generateBridgePathData, getFilledBounds } from '@/lib/vectorRenderer';
import type { CellRadiusLookup } from '@/lib/vectorRenderer';

interface PreviewPanelProps {
  grid: boolean[][];
  cornerRadius: number;
  innerRadius: number;
  cellRadiusLookup?: CellRadiusLookup;
  diagonalBridge: boolean;
  bridgeRadius: number;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  grid, cornerRadius, innerRadius, cellRadiusLookup, diagonalBridge, bridgeRadius,
}) => {
  const { pathData, bridgeData, bounds } = useMemo(() => {
    const b = getFilledBounds(grid);
    if (!b) return { pathData: '', bridgeData: '', bounds: null };
    const pd = generateSVGPathData(grid, cornerRadius, 1, 1, innerRadius, cellRadiusLookup);
    const bd = diagonalBridge ? generateBridgePathData(grid, bridgeRadius) : '';
    return { pathData: pd, bridgeData: bd, bounds: b };
  }, [grid, cornerRadius, innerRadius, cellRadiusLookup, diagonalBridge, bridgeRadius]);

  return (
    <div className="flex items-center justify-center w-full h-full bg-card border border-border p-4">
      {pathData && bounds ? (
        <svg
          viewBox={`${bounds.minC} ${bounds.minR} ${bounds.maxC - bounds.minC + 1} ${bounds.maxR - bounds.minR + 1}`}
          className="w-full h-full max-w-full max-h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <path d={pathData} fill="hsl(var(--foreground))" />
          {bridgeData && <path d={bridgeData} fill="hsl(var(--foreground))" />}
        </svg>
      ) : (
        <p className="text-muted-foreground text-sm select-none">
          Draw on the grid to see the vector preview
        </p>
      )}
    </div>
  );
};

export default PreviewPanel;
