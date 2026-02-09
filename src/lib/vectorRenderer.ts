type Point = { x: number; y: number };
type Direction = { dx: number; dy: number };
interface Edge { start: Point; end: Point; dir: Direction; }

function ptKey(p: Point): string { return `${p.x},${p.y}`; }
function edgeKey(e: Edge): string { return `${e.start.x},${e.start.y}-${e.end.x},${e.end.y}`; }
function round(n: number): string { return Number(n.toFixed(4)).toString(); }

function findBoundaryEdges(grid: boolean[][]): Edge[] {
  const rows = grid.length;
  const cols = grid[0]?.length || 0;
  const edges: Edge[] = [];
  const isFilled = (r: number, c: number) =>
    r >= 0 && r < rows && c >= 0 && c < cols && grid[r][c];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!grid[r][c]) continue;
      if (!isFilled(r - 1, c))
        edges.push({ start: { x: c, y: r }, end: { x: c + 1, y: r }, dir: { dx: 1, dy: 0 } });
      if (!isFilled(r, c + 1))
        edges.push({ start: { x: c + 1, y: r }, end: { x: c + 1, y: r + 1 }, dir: { dx: 0, dy: 1 } });
      if (!isFilled(r + 1, c))
        edges.push({ start: { x: c + 1, y: r + 1 }, end: { x: c, y: r + 1 }, dir: { dx: -1, dy: 0 } });
      if (!isFilled(r, c - 1))
        edges.push({ start: { x: c, y: r + 1 }, end: { x: c, y: r }, dir: { dx: 0, dy: -1 } });
    }
  }
  return edges;
}

function turnPriority(incoming: Direction, outgoing: Direction): number {
  const { dx, dy } = incoming;
  if (outgoing.dx === -dy && outgoing.dy === dx) return 0; // right turn
  if (outgoing.dx === dx && outgoing.dy === dy) return 1; // straight
  if (outgoing.dx === dy && outgoing.dy === -dx) return 2; // left turn
  return 3; // back
}

function traceContours(edges: Edge[]): Edge[][] {
  const edgesByStart = new Map<string, Edge[]>();
  for (const edge of edges) {
    const key = ptKey(edge.start);
    if (!edgesByStart.has(key)) edgesByStart.set(key, []);
    edgesByStart.get(key)!.push(edge);
  }

  const used = new Set<string>();
  const contours: Edge[][] = [];

  for (const startEdge of edges) {
    const sk = edgeKey(startEdge);
    if (used.has(sk)) continue;

    const contour: Edge[] = [];
    let current = startEdge;

    while (true) {
      const ck = edgeKey(current);
      if (used.has(ck)) break;
      used.add(ck);
      contour.push(current);

      const candidates = edgesByStart.get(ptKey(current.end))?.filter(e => !used.has(edgeKey(e))) || [];
      if (candidates.length === 0) break;

      const inDir = current.dir;
      current = candidates.reduce((best, cand) =>
        turnPriority(inDir, cand.dir) < turnPriority(inDir, best.dir) ? cand : best
      );
    }

    if (contour.length >= 4) contours.push(contour);
  }

  return contours;
}

export function generateSVGPathData(
  grid: boolean[][],
  radius: number,
  scaleX: number = 1,
  scaleY: number = 1
): string {
  const edges = findBoundaryEdges(grid);
  if (edges.length === 0) return '';

  const contours = traceContours(edges);
  const pathParts: string[] = [];
  const r = Math.min(Math.max(radius, 0), 0.5);

  for (const contour of contours) {
    const n = contour.length;

    type Corner = { vertex: Point; incoming: Direction; outgoing: Direction; isConvex: boolean };
    const corners: Corner[] = [];

    for (let i = 0; i < n; i++) {
      const incoming = contour[(i - 1 + n) % n].dir;
      const outgoing = contour[i].dir;
      if (incoming.dx === outgoing.dx && incoming.dy === outgoing.dy) continue;
      corners.push({
        vertex: contour[i].start,
        incoming,
        outgoing,
        isConvex: turnPriority(incoming, outgoing) === 0,
      });
    }

    if (corners.length < 3) continue;

    const segs: string[] = [];
    const first = corners[0];
    const firstDep = first.isConvex && r > 0
      ? { x: (first.vertex.x + first.outgoing.dx * r) * scaleX, y: (first.vertex.y + first.outgoing.dy * r) * scaleY }
      : { x: first.vertex.x * scaleX, y: first.vertex.y * scaleY };

    segs.push(`M${round(firstDep.x)} ${round(firstDep.y)}`);

    for (let step = 0; step < corners.length; step++) {
      const idx = (step + 1) % corners.length;
      const c = corners[idx];

      if (c.isConvex && r > 0) {
        const arr = {
          x: (c.vertex.x - c.incoming.dx * r) * scaleX,
          y: (c.vertex.y - c.incoming.dy * r) * scaleY,
        };
        const dep = {
          x: (c.vertex.x + c.outgoing.dx * r) * scaleX,
          y: (c.vertex.y + c.outgoing.dy * r) * scaleY,
        };
        const rx = r * scaleX;
        const ry = r * scaleY;
        segs.push(`L${round(arr.x)} ${round(arr.y)}`);
        segs.push(`A${round(rx)} ${round(ry)} 0 0 1 ${round(dep.x)} ${round(dep.y)}`);
      } else {
        segs.push(`L${round(c.vertex.x * scaleX)} ${round(c.vertex.y * scaleY)}`);
      }
    }

    segs.push('Z');
    pathParts.push(segs.join(' '));
  }

  return pathParts.join(' ');
}

export function generateSVGMarkup(
  grid: boolean[][],
  radius: number,
  scaleX: number,
  scaleY: number
): string {
  const rows = grid.length;
  const cols = grid[0]?.length || 0;
  const width = cols * scaleX;
  const height = rows * scaleY;
  const pathData = generateSVGPathData(grid, radius, scaleX, scaleY);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width * 20}" height="${height * 20}">
  <path d="${pathData}" fill="black" fill-rule="evenodd"/>
</svg>`;
}

export function exportSVG(grid: boolean[][], radius: number, scaleX: number, scaleY: number): void {
  const markup = generateSVGMarkup(grid, radius, scaleX, scaleY);
  const blob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'shape.svg';
  a.click();
  URL.revokeObjectURL(a.href);
}

export function exportPNG(
  grid: boolean[][],
  radius: number,
  scaleX: number,
  scaleY: number,
  pixelScale: number = 1
): void {
  const rows = grid.length;
  const cols = grid[0]?.length || 0;
  const baseSize = 512;
  const aspect = (cols * scaleX) / (rows * scaleY);
  const width = Math.round(aspect >= 1 ? baseSize * pixelScale : baseSize * pixelScale * aspect);
  const height = Math.round(aspect >= 1 ? baseSize * pixelScale / aspect : baseSize * pixelScale);
  const vbW = cols * scaleX;
  const vbH = rows * scaleY;
  const pathData = generateSVGPathData(grid, radius, scaleX, scaleY);

  const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbW} ${vbH}" width="${width}" height="${height}">
    <path d="${pathData}" fill="black" fill-rule="evenodd"/>
  </svg>`;

  const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    canvas.toBlob(b => {
      if (!b) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = 'shape.png';
      a.click();
      URL.revokeObjectURL(a.href);
    });
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

export function copySVGToClipboard(grid: boolean[][], radius: number, scaleX: number, scaleY: number): Promise<void> {
  const markup = generateSVGMarkup(grid, radius, scaleX, scaleY);
  return navigator.clipboard.writeText(markup);
}

export function bresenhamLine(x0: number, y0: number, x1: number, y1: number): [number, number][] {
  const points: [number, number][] = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  let cx = x0, cy = y0;
  while (true) {
    points.push([cx, cy]);
    if (cx === x1 && cy === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; cx += sx; }
    if (e2 < dx) { err += dx; cy += sy; }
  }
  return points;
}
