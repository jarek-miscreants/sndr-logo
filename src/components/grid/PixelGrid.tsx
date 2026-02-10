import React, { useRef, useEffect, useCallback, useState } from 'react';
import { generateSVGPathData, generateBridgePathData } from '@/lib/vectorRenderer';
import type { CellRadiusLookup } from '@/lib/vectorRenderer';

interface PixelGridProps {
  grid: boolean[][];
  gridRows: number;
  gridCols: number;
  cornerRadius: number;
  innerRadius: number;
  previewCells: { r: number; c: number }[];
  selectedCell: { r: number; c: number } | null;
  cellRadiusLookup?: CellRadiusLookup;
  diagonalBridge: boolean;
  bridgeRadius: number;
  onCellDown: (r: number, c: number) => void;
  onCellMove: (r: number, c: number) => void;
  onCellUp: () => void;
}

const PixelGrid: React.FC<PixelGridProps> = ({
  grid, gridRows, gridCols, cornerRadius, innerRadius, previewCells, selectedCell, cellRadiusLookup,
  diagonalBridge, bridgeRadius, onCellDown, onCellMove, onCellUp,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(10);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      const sizeByW = Math.floor(width / gridCols);
      const sizeByH = Math.floor(height / gridRows);
      setCellSize(Math.max(Math.min(sizeByW, sizeByH), 4));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [gridRows, gridCols]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const canvasW = gridCols * cellSize;
    const canvasH = gridRows * cellSize;

    canvas.width = canvasW * dpr;
    canvas.height = canvasH * dpr;
    canvas.style.width = `${canvasW}px`;
    canvas.style.height = `${canvasH}px`;

    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, canvasW, canvasH);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasW, canvasH);

    const pathData = generateSVGPathData(grid, cornerRadius, cellSize, cellSize, innerRadius, cellRadiusLookup);
    if (pathData) {
      ctx.fillStyle = '#1a1b2e';
      const path = new Path2D(pathData);
      ctx.fill(path);
    }

    if (diagonalBridge) {
      const bridgeData = generateBridgePathData(grid, bridgeRadius, cellSize, cellSize);
      if (bridgeData) {
        ctx.fillStyle = '#1a1b2e';
        const bridgePath = new Path2D(bridgeData);
        ctx.fill(bridgePath);
      }
    }

    if (previewCells.length > 0) {
      ctx.fillStyle = 'rgba(0, 190, 170, 0.35)';
      for (const { r, c } of previewCells) {
        if (r >= 0 && r < gridRows && c >= 0 && c < gridCols) {
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        }
      }
    }

    if (selectedCell && selectedCell.r >= 0 && selectedCell.r < gridRows && selectedCell.c >= 0 && selectedCell.c < gridCols) {
      ctx.strokeStyle = '#569378';
      ctx.lineWidth = 2;
      ctx.strokeRect(selectedCell.c * cellSize + 1, selectedCell.r * cellSize + 1, cellSize - 2, cellSize - 2);
    }

    ctx.strokeStyle = '#e0e0e6';
    ctx.lineWidth = 0.5;
    for (let c = 0; c <= gridCols; c++) {
      ctx.beginPath();
      ctx.moveTo(c * cellSize, 0);
      ctx.lineTo(c * cellSize, canvasH);
      ctx.stroke();
    }
    for (let r = 0; r <= gridRows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * cellSize);
      ctx.lineTo(canvasW, r * cellSize);
      ctx.stroke();
    }
  }, [grid, gridRows, gridCols, cellSize, previewCells, cornerRadius, innerRadius, selectedCell, cellRadiusLookup, diagonalBridge, bridgeRadius]);

  const getCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const c = Math.floor((e.clientX - rect.left) / cellSize);
    const r = Math.floor((e.clientY - rect.top) / cellSize);
    return { r, c };
  }, [cellSize]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { r, c } = getCoords(e);
    onCellDown(r, c);
  }, [getCoords, onCellDown]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.buttons === 0) return;
    const { r, c } = getCoords(e);
    onCellMove(r, c);
  }, [getCoords, onCellMove]);

  const handleMouseUp = useCallback(() => {
    onCellUp();
  }, [onCellUp]);

  useEffect(() => {
    const handleGlobalUp = () => onCellUp();
    window.addEventListener('mouseup', handleGlobalUp);
    return () => window.removeEventListener('mouseup', handleGlobalUp);
  }, [onCellUp]);

  return (
    <div ref={containerRef} className="flex items-center justify-center w-full h-full p-4 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="cursor-crosshair shadow-sm"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={e => e.preventDefault()}
      />
    </div>
  );
};

export default PixelGrid;
