import { useEffect, useCallback, useMemo } from 'react';
import { useGridState } from '@/hooks/useGridState';
import PixelGrid from '@/components/grid/PixelGrid';
import PreviewPanel from '@/components/grid/PreviewPanel';
import Toolbar from '@/components/grid/Toolbar';
import ControlsPanel from '@/components/grid/ControlsPanel';
import CellEditorPanel from '@/components/grid/CellEditorPanel';
import type { Tool } from '@/hooks/useGridState';
import type { CellRadiusLookup } from '@/lib/vectorRenderer';

// Grid Shape Generator v3
const Index = () => {
  const state = useGridState();

  const cellRadiusLookup: CellRadiusLookup | undefined = useMemo(() => {
    if (state.cellSettings.size === 0) return undefined;
    return (r: number, c: number) => {
      const settings = state.cellSettings.get(`${r},${c}`);
      return {
        cornerRadius: settings?.cornerRadius ?? state.cornerRadius,
        innerRadius: settings?.innerRadius ?? state.innerRadius,
      };
    };
  }, [state.cellSettings, state.cornerRadius, state.innerRadius]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && e.shiftKey) { e.preventDefault(); state.redo(); return; }
        if (e.key === 'z') { e.preventDefault(); state.undo(); return; }
        if (e.key === 'y') { e.preventDefault(); state.redo(); return; }
      }

      const toolMap: Record<string, Tool> = { p: 'pencil', e: 'eraser', l: 'line', r: 'rectangle', v: 'edit' };
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
            selectedCell={state.selectedCell}
            cellRadiusLookup={cellRadiusLookup}
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
              cellRadiusLookup={cellRadiusLookup}
            />
          </div>

          {state.selectedCell && (
            <CellEditorPanel
              selectedCell={state.selectedCell}
              cellSettings={state.getCellSettings(state.selectedCell.r, state.selectedCell.c)}
              globalCornerRadius={state.cornerRadius}
              globalInnerRadius={state.innerRadius}
              onCornerRadiusChange={state.setCellCornerRadius}
              onInnerRadiusChange={state.setCellInnerRadius}
              onReset={state.resetCellSettings}
            />
          )}

          <ControlsPanel
            grid={state.grid}
            cornerRadius={state.cornerRadius}
            innerRadius={state.innerRadius}
            onCornerRadiusChange={state.setCornerRadius}
            onInnerRadiusChange={state.setInnerRadius}
            cellRadiusLookup={cellRadiusLookup}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
