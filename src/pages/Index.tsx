import { useEffect } from 'react';
import { useGridState } from '@/hooks/useGridState';
import PixelGrid from '@/components/grid/PixelGrid';
import PreviewPanel from '@/components/grid/PreviewPanel';
import Toolbar from '@/components/grid/Toolbar';
import ControlsPanel from '@/components/grid/ControlsPanel';
import type { Tool } from '@/hooks/useGridState';

const Index = () => {
  const state = useGridState();

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && e.shiftKey) { e.preventDefault(); state.redo(); return; }
        if (e.key === 'z') { e.preventDefault(); state.undo(); return; }
        if (e.key === 'y') { e.preventDefault(); state.redo(); return; }
      }

      const toolMap: Record<string, Tool> = { p: 'pencil', e: 'eraser', l: 'line', r: 'rectangle' };
      if (toolMap[e.key.toLowerCase()]) {
        state.setTool(toolMap[e.key.toLowerCase()]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state]);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <Toolbar
        tool={state.tool}
        gridSize={state.gridSize}
        canUndo={state.canUndo}
        canRedo={state.canRedo}
        onToolChange={state.setTool}
        onGridSizeChange={state.setGridSize}
        onUndo={state.undo}
        onRedo={state.redo}
        onClear={state.clearGrid}
      />

      <div className="flex flex-1 min-h-0">
        {/* Grid Editor */}
        <div className="flex-1 min-w-0">
          <PixelGrid
            grid={state.grid}
            gridSize={state.gridSize}
            cornerRadius={state.cornerRadius}
            innerRadius={state.innerRadius}
            previewCells={state.previewCells}
            onCellDown={state.handleCellDown}
            onCellMove={state.handleCellMove}
            onCellUp={state.handleCellUp}
          />
        </div>

        {/* Right Panel */}
        <div className="w-80 flex flex-col gap-3 p-3 border-l border-border overflow-y-auto">
          <div className="flex-1 min-h-[200px]">
            <PreviewPanel
              grid={state.grid}
              gridSize={state.gridSize}
              cornerRadius={state.cornerRadius}
              innerRadius={state.innerRadius}
            />
          </div>
          <ControlsPanel
            grid={state.grid}
            cornerRadius={state.cornerRadius}
            innerRadius={state.innerRadius}
            onCornerRadiusChange={state.setCornerRadius}
            onInnerRadiusChange={state.setInnerRadius}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
