import React, { useRef, useEffect, useCallback, useState } from 'react';
import { generateSVGPathData } from '@/lib/vectorRenderer';

interface PixelGridProps {
  grid: boolean[][];
  gridSize: number;
  cornerRadius: number;
  previewCells: { r: number; c: number }[];
  onCellDown: (r: number, c: number) => void;
  onCellMove: (r: number, c: number) => void;
  onCellUp: () => void;
}

const PixelGrid: React.FC<PixelGridProps> = ({
  grid, gridSize, cornerRadius, previewCells, onCellDown, onCellMove, onCellUp,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(10);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      const size = Math.floor(Math.min(width, height) / gridSize);
      setCellSize(Math.max(size, 4));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [gridSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const canvasW = gridSize * cellSize;
    const canvasH = gridSize * cellSize;

    canvas.width = canvasW * dpr;
    canvas.height = canvasH * dpr;
    canvas.style.width = `${canvasW}px`;
    canvas.style.height = `${canvasH}px`;

    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, canvasW, canvasH);

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Filled cells as vector path with corner rounding
    const pathData = generateSVGPathData(grid, cornerRadius, cellSize, cellSize);
    if (pathData) {
      ctx.fillStyle = '#1a1b2e';
      const path = new Path2D(pathData);
      ctx.fill(path, 'evenodd');
    }

    // Preview cells
    if (previewCells.length > 0) {
      ctx.fillStyle = 'rgba(0, 190, 170, 0.35)';
      for (const { r, c } of previewCells) {
        if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        }
      }
    }

    // Grid lines
    ctx.strokeStyle = '#e0e0e6';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= gridSize; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvasH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvasW, i * cellSize);
      ctx.stroke();
    }
  }, [grid, gridSize, cellSize, previewCells, cornerRadius]);

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
        className="cursor-crosshair rounded shadow-lg"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={e => e.preventDefault()}
      />
    </div>
  );
};

export default PixelGrid;
