import React, { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Download, Copy } from 'lucide-react';
import { exportSVG, exportPNG, copySVGToClipboard } from '@/lib/vectorRenderer';
import type { CellRadiusLookup } from '@/lib/vectorRenderer';
import { toast } from '@/hooks/use-toast';

interface ControlsPanelProps {
  grid: boolean[][];
  cornerRadius: number;
  innerRadius: number;
  onCornerRadiusChange: (v: number) => void;
  onInnerRadiusChange: (v: number) => void;
  cellRadiusLookup?: CellRadiusLookup;
}

const ControlsPanel: React.FC<ControlsPanelProps> = ({
  grid, cornerRadius, innerRadius,
  onCornerRadiusChange, onInnerRadiusChange, cellRadiusLookup,
}) => {
  const [pngScale, setPngScale] = useState('1');

  return (
    <div className="flex flex-col gap-4 p-4 bg-card rounded-lg border border-border">
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          Global Corner Radius — {Math.round(cornerRadius * 200)}%
        </label>
        <Slider
          value={[cornerRadius]}
          min={0} max={0.5} step={0.01}
          onValueChange={([v]) => onCornerRadiusChange(v)}
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          Global Inner Radius (Metaball) — {Math.round(innerRadius * 200)}%
        </label>
        <Slider
          value={[innerRadius]}
          min={0} max={0.5} step={0.01}
          onValueChange={([v]) => onInnerRadiusChange(v)}
        />
      </div>

      <div className="h-px bg-border" />

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">Export</span>
        <Button
          variant="secondary" size="sm"
          onClick={() => exportSVG(grid, cornerRadius, innerRadius, cellRadiusLookup)}
        >
          <Download className="h-4 w-4 mr-1.5" /> Download SVG
        </Button>

        <div className="flex gap-2">
          <Button
            variant="secondary" size="sm" className="flex-1"
            onClick={() => exportPNG(grid, cornerRadius, innerRadius, Number(pngScale), cellRadiusLookup)}
          >
            <Download className="h-4 w-4 mr-1.5" /> PNG
          </Button>
          <Select value={pngScale} onValueChange={setPngScale}>
            <SelectTrigger className="w-16 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1×</SelectItem>
              <SelectItem value="2">2×</SelectItem>
              <SelectItem value="4">4×</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline" size="sm"
          onClick={async () => {
            await copySVGToClipboard(grid, cornerRadius, innerRadius, cellRadiusLookup);
            toast({ title: 'SVG copied to clipboard' });
          }}
        >
          <Copy className="h-4 w-4 mr-1.5" /> Copy SVG Code
        </Button>
      </div>
    </div>
  );
};

export default ControlsPanel;
