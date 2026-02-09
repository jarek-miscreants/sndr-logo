import React, { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Download, Copy } from 'lucide-react';
import { exportSVG, exportPNG, copySVGToClipboard } from '@/lib/vectorRenderer';
import { toast } from '@/hooks/use-toast';

interface ControlsPanelProps {
  grid: boolean[][];
  cornerRadius: number;
  stretchX: number;
  stretchY: number;
  onCornerRadiusChange: (v: number) => void;
  onStretchXChange: (v: number) => void;
  onStretchYChange: (v: number) => void;
}

const ControlsPanel: React.FC<ControlsPanelProps> = ({
  grid, cornerRadius, stretchX, stretchY,
  onCornerRadiusChange, onStretchXChange, onStretchYChange,
}) => {
  const [pngScale, setPngScale] = useState('1');

  return (
    <div className="flex flex-col gap-4 p-4 bg-card rounded-lg border border-border">
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          Corner Radius — {Math.round(cornerRadius * 200)}%
        </label>
        <Slider
          value={[cornerRadius]}
          min={0} max={0.5} step={0.01}
          onValueChange={([v]) => onCornerRadiusChange(v)}
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          Stretch X — {stretchX.toFixed(2)}
        </label>
        <Slider
          value={[stretchX]}
          min={0.5} max={2} step={0.05}
          onValueChange={([v]) => onStretchXChange(v)}
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          Stretch Y — {stretchY.toFixed(2)}
        </label>
        <Slider
          value={[stretchY]}
          min={0.5} max={2} step={0.05}
          onValueChange={([v]) => onStretchYChange(v)}
        />
      </div>

      <div className="h-px bg-border" />

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">Export</span>
        <Button
          variant="secondary" size="sm"
          onClick={() => exportSVG(grid, cornerRadius, stretchX, stretchY)}
        >
          <Download className="h-4 w-4 mr-1.5" /> Download SVG
        </Button>

        <div className="flex gap-2">
          <Button
            variant="secondary" size="sm" className="flex-1"
            onClick={() => exportPNG(grid, cornerRadius, stretchX, stretchY, Number(pngScale))}
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
            await copySVGToClipboard(grid, cornerRadius, stretchX, stretchY);
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
