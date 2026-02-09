import { useState, useCallback, useRef } from 'react';
import { bresenhamLine } from '@/lib/vectorRenderer';

export type Tool = 'pencil' | 'eraser' | 'line' | 'rectangle';

function createEmptyGrid(size: number): boolean[][] {
  return Array.from({ length: size }, () => Array(size).fill(false));
}

function cloneGrid(grid: boolean[][]): boolean[][] {
  return grid.map(row => [...row]);
}

export function useGridState() {
  const [gridSize, setGridSizeRaw] = useState(16);
  const [grid, setGrid] = useState(() => createEmptyGrid(16));
  const [tool, setTool] = useState<Tool>('pencil');
  const [cornerRadius, setCornerRadius] = useState(0.25);
  const [stretchX, setStretchX] = useState(1);
  const [stretchY, setStretchY] = useState(1);

  const [history, setHistory] = useState<boolean[][][]>([]);
  const [future, setFuture] = useState<boolean[][][]>([]);

  const [previewCells, setPreviewCells] = useState<{ r: number; c: number }[]>([]);
  const drawingRef = useRef(false);
  const drawStartRef = useRef<{ r: number; c: number } | null>(null);
  const snapshotRef = useRef<boolean[][] | null>(null);

  const pushHistory = useCallback((g: boolean[][]) => {
    setHistory(h => [...h.slice(-50), g]);
    setFuture([]);
  }, []);

  const setGridSize = useCallback((size: number) => {
    setGrid(prev => {
      const newGrid = createEmptyGrid(size);
      const minR = Math.min(prev.length, size);
      const minC = Math.min(prev[0]?.length || 0, size);
      for (let r = 0; r < minR; r++)
        for (let c = 0; c < minC; c++)
          newGrid[r][c] = prev[r][c];
      pushHistory(prev);
      return newGrid;
    });
    setGridSizeRaw(size);
  }, [pushHistory]);

  const clearGrid = useCallback(() => {
    setGrid(prev => {
      pushHistory(prev);
      return createEmptyGrid(prev.length);
    });
  }, [pushHistory]);

  const undo = useCallback(() => {
    setHistory(h => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setFuture(f => [...f, grid]);
      setGrid(prev);
      setGridSizeRaw(prev.length);
      return h.slice(0, -1);
    });
  }, [grid]);

  const redo = useCallback(() => {
    setFuture(f => {
      if (f.length === 0) return f;
      const next = f[f.length - 1];
      setHistory(h => [...h, grid]);
      setGrid(next);
      setGridSizeRaw(next.length);
      return f.slice(0, -1);
    });
  }, [grid]);

  const handleCellDown = useCallback((r: number, c: number) => {
    if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) return;
    drawingRef.current = true;
    drawStartRef.current = { r, c };
    snapshotRef.current = cloneGrid(grid);

    if (tool === 'pencil' || tool === 'eraser') {
      pushHistory(grid);
      const newGrid = cloneGrid(grid);
      newGrid[r][c] = tool === 'pencil';
      setGrid(newGrid);
    }
  }, [grid, gridSize, tool, pushHistory]);

  const handleCellMove = useCallback((r: number, c: number) => {
    if (!drawingRef.current) return;
    if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) return;

    if (tool === 'pencil' || tool === 'eraser') {
      setGrid(prev => {
        if (prev[r][c] === (tool === 'pencil')) return prev;
        const ng = cloneGrid(prev);
        ng[r][c] = tool === 'pencil';
        return ng;
      });
    } else if ((tool === 'line' || tool === 'rectangle') && drawStartRef.current) {
      const s = drawStartRef.current;
      if (tool === 'line') {
        setPreviewCells(
          bresenhamLine(s.c, s.r, c, r).map(([x, y]) => ({ r: y, c: x }))
        );
      } else {
        const cells: { r: number; c: number }[] = [];
        const rMin = Math.min(s.r, r), rMax = Math.max(s.r, r);
        const cMin = Math.min(s.c, c), cMax = Math.max(s.c, c);
        for (let ri = rMin; ri <= rMax; ri++)
          for (let ci = cMin; ci <= cMax; ci++)
            cells.push({ r: ri, c: ci });
        setPreviewCells(cells);
      }
    }
  }, [gridSize, tool]);

  const handleCellUp = useCallback(() => {
    if (!drawingRef.current) return;
    drawingRef.current = false;

    if ((tool === 'line' || tool === 'rectangle') && previewCells.length > 0 && snapshotRef.current) {
      pushHistory(snapshotRef.current);
      setGrid(prev => {
        const ng = cloneGrid(prev);
        for (const { r, c } of previewCells) {
          if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
            ng[r][c] = true;
          }
        }
        return ng;
      });
      setPreviewCells([]);
    }

    drawStartRef.current = null;
    snapshotRef.current = null;
  }, [tool, previewCells, gridSize, pushHistory]);

  return {
    grid, gridSize, tool, cornerRadius, stretchX, stretchY, previewCells,
    setTool, setGridSize, setCornerRadius, setStretchX, setStretchY,
    clearGrid, undo, redo,
    canUndo: history.length > 0,
    canRedo: future.length > 0,
    handleCellDown, handleCellMove, handleCellUp,
  };
}
