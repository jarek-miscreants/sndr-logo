import React, { useMemo } from 'react';
import { generateSVGPathData } from '@/lib/vectorRenderer';

interface PreviewPanelProps {
  grid: boolean[][];
  gridSize: number;
  cornerRadius: number;
  stretchX: number;
  stretchY: number;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  grid, gridSize, cornerRadius, stretchX, stretchY,
}) => {
  const pathData = useMemo(
    () => generateSVGPathData(grid, cornerRadius, stretchX, stretchY),
    [grid, cornerRadius, stretchX, stretchY]
  );

  const viewBoxW = gridSize * stretchX;
  const viewBoxH = gridSize * stretchY;

  return (
    <div className="flex items-center justify-center w-full h-full bg-card rounded-lg border border-border p-4">
      {pathData ? (
        <svg
          viewBox={`0 0 ${viewBoxW} ${viewBoxH}`}
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
