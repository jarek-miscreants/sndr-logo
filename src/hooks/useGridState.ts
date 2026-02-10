import { useState, useCallback, useRef } from 'react';
import { bresenhamLine } from '@/lib/vectorRenderer';

export type Tool = 'pencil' | 'eraser' | 'line' | 'rectangle' | 'edit';

export interface CellSettings {
  cornerRadius: number;
  innerRadius: number;
}

export type CellSettingsMap = Map<string, CellSettings>;

export interface GridPreset {
  label: string;
  rows: number;
  cols: number;
}

export const gridPresets: GridPreset[] = [
  { label: '4×4', rows: 4, cols: 4 },
];

function cellKey(r: number, c: number): string {
  return `${r},${c}`;
}

function createEmptyGrid(rows: number, cols: number): boolean[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(false));
}

function cloneGrid(grid: boolean[][]): boolean[][] {
  return grid.map(row => [...row]);
}

export function useGridState() {
  const [grid, setGrid] = useState(() => createEmptyGrid(4, 4));
  const [tool, setTool] = useState<Tool>('pencil');
  const [cornerRadius, setCornerRadius] = useState(0.25);
  const [innerRadius, setInnerRadius] = useState(0);
  const [diagonalBridge, setDiagonalBridge] = useState(false);
  const [bridgeRadius, setBridgeRadius] = useState(0.35);

  const [cellSettings, setCellSettings] = useState<CellSettingsMap>(new Map());
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);

  const [history, setHistory] = useState<boolean[][][]>([]);
  const [future, setFuture] = useState<boolean[][][]>([]);

  const [previewCells, setPreviewCells] = useState<{ r: number; c: number }[]>([]);
  const drawingRef = useRef(false);
  const drawStartRef = useRef<{ r: number; c: number } | null>(null);
  const snapshotRef = useRef<boolean[][] | null>(null);

  const gridRows = grid.length;
  const gridCols = grid[0]?.length || 0;

  const pushHistory = useCallback((g: boolean[][]) => {
    setHistory(h => [...h.slice(-50), g]);
    setFuture([]);
  }, []);

  const setGridSize = useCallback((rows: number, cols: number) => {
    setGrid(prev => {
      const newGrid = createEmptyGrid(rows, cols);
      const minR = Math.min(prev.length, rows);
      const minC = Math.min(prev[0]?.length || 0, cols);
      for (let r = 0; r < minR; r++)
        for (let c = 0; c < minC; c++)
          newGrid[r][c] = prev[r][c];
      pushHistory(prev);
      return newGrid;
    });
  }, [pushHistory]);

  const clearGrid = useCallback(() => {
    setGrid(prev => {
      pushHistory(prev);
      return createEmptyGrid(prev.length, prev[0]?.length || 0);
    });
    setCellSettings(new Map());
    setSelectedCell(null);
  }, [pushHistory]);

  const undo = useCallback(() => {
    setHistory(h => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setFuture(f => [...f, grid]);
      setGrid(prev);
      return h.slice(0, -1);
    });
  }, [grid]);

  const redo = useCallback(() => {
    setFuture(f => {
      if (f.length === 0) return f;
      const next = f[f.length - 1];
      setHistory(h => [...h, grid]);
      setGrid(next);
      return f.slice(0, -1);
    });
  }, [grid]);

  const setCellCornerRadius = useCallback((r: number, c: number, value: number) => {
    setCellSettings(prev => {
      const next = new Map(prev);
      const key = cellKey(r, c);
      const existing = next.get(key) || { cornerRadius: cornerRadius, innerRadius: innerRadius };
      next.set(key, { ...existing, cornerRadius: value });
      return next;
    });
  }, [cornerRadius, innerRadius]);

  const setCellInnerRadius = useCallback((r: number, c: number, value: number) => {
    setCellSettings(prev => {
      const next = new Map(prev);
      const key = cellKey(r, c);
      const existing = next.get(key) || { cornerRadius: cornerRadius, innerRadius: innerRadius };
      next.set(key, { ...existing, innerRadius: value });
      return next;
    });
  }, [cornerRadius, innerRadius]);

  const resetCellSettings = useCallback((r: number, c: number) => {
    setCellSettings(prev => {
      const next = new Map(prev);
      next.delete(cellKey(r, c));
      return next;
    });
  }, []);

  const getCellSettings = useCallback((r: number, c: number): CellSettings | undefined => {
    return cellSettings.get(cellKey(r, c));
  }, [cellSettings]);

  const handleCellDown = useCallback((r: number, c: number) => {
    if (r < 0 || r >= gridRows || c < 0 || c >= gridCols) return;

    if (tool === 'edit') {
      if (grid[r][c]) {
        setSelectedCell({ r, c });
      } else {
        setSelectedCell(null);
      }
      return;
    }

    drawingRef.current = true;
    drawStartRef.current = { r, c };
    snapshotRef.current = cloneGrid(grid);

    if (tool === 'pencil' || tool === 'eraser') {
      pushHistory(grid);
      const newGrid = cloneGrid(grid);
      newGrid[r][c] = tool === 'pencil';
      setGrid(newGrid);
    }
  }, [grid, gridRows, gridCols, tool, pushHistory]);

  const handleCellMove = useCallback((r: number, c: number) => {
    if (!drawingRef.current) return;
    if (r < 0 || r >= gridRows || c < 0 || c >= gridCols) return;

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
  }, [gridRows, gridCols, tool]);

  const handleCellUp = useCallback(() => {
    if (!drawingRef.current) return;
    drawingRef.current = false;

    if ((tool === 'line' || tool === 'rectangle') && previewCells.length > 0 && snapshotRef.current) {
      pushHistory(snapshotRef.current);
      setGrid(prev => {
        const ng = cloneGrid(prev);
        for (const { r, c } of previewCells) {
          if (r >= 0 && r < gridRows && c >= 0 && c < gridCols) {
            ng[r][c] = true;
          }
        }
        return ng;
      });
      setPreviewCells([]);
    }

    drawStartRef.current = null;
    snapshotRef.current = null;
  }, [tool, previewCells, gridRows, gridCols, pushHistory]);

  const generateRandomPattern = useCallback(() => {
    pushHistory(grid);
    setGrid(prev => {
      const ng = createEmptyGrid(prev.length, prev[0]?.length || 0);
      for (let r = 0; r < prev.length; r++) {
        for (let c = 0; c < (prev[0]?.length || 0); c++) {
          ng[r][c] = Math.random() > 0.4;
        }
      }
      return ng;
    });
  }, [grid, pushHistory]);

  return {
    grid, gridRows, gridCols, tool, cornerRadius, innerRadius, previewCells,
    cellSettings, selectedCell, diagonalBridge, bridgeRadius,
    setTool, setGridSize, setCornerRadius, setInnerRadius,
    setSelectedCell, setDiagonalBridge, setBridgeRadius,
    setCellCornerRadius, setCellInnerRadius, resetCellSettings, getCellSettings,
    clearGrid, undo, redo,
    generateRandomPattern,
    canUndo: history.length > 0,
    canRedo: future.length > 0,
    handleCellDown, handleCellMove, handleCellUp,
  };
}
