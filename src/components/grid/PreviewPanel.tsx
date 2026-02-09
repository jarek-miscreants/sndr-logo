import React, { useMemo } from 'react';
import { generateSVGPathData } from '@/lib/vectorRenderer';
import type { CellRadiusLookup } from '@/lib/vectorRenderer';

interface PreviewPanelProps {
  grid: boolean[][];
  gridSize: number;
  cornerRadius: number;
  innerRadius: number;
  cellRadiusLookup?: CellRadiusLookup;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  grid, gridSize, cornerRadius, innerRadius, cellRadiusLookup,
}) => {
  const pathData = useMemo(
    () => generateSVGPathData(grid, cornerRadius, 1, 1, innerRadius, cellRadiusLookup),
    [grid, cornerRadius, innerRadius, cellRadiusLookup]
  );

  return (
    <div className="flex items-center justify-center w-full h-full bg-card border border-border p-4">
      {pathData ? (
        <svg
          viewBox={`0 0 ${gridSize} ${gridSize}`}
          className="w-full h-full max-w-full max-h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <path d={pathData} fill="hsl(var(--foreground))" fillRule="evenodd" />
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
