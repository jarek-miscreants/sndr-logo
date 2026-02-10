type Point = { x: number; y: number };
type Direction = { dx: number; dy: number };
interface Edge { start: Point; end: Point; dir: Direction; cell: { r: number; c: number }; }

function ptKey(p: Point): string { return `${p.x},${p.y}`; }
function edgeKey(e: Edge): string { return `${e.start.x},${e.start.y}-${e.end.x},${e.end.y}`; }
function round(n: number): string { return Number(n.toFixed(4)).toString(); }

export type CellRadiusLookup = (r: number, c: number) => { cornerRadius: number; innerRadius: number };

function findBoundaryEdges(grid: boolean[][]): Edge[] {
  const rows = grid.length;
  const cols = grid[0]?.length || 0;
  const edges: Edge[] = [];
  const isFilled = (r: number, c: number) =>
    r >= 0 && r < rows && c >= 0 && c < cols && grid[r][c];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!grid[r][c]) continue;
      const cell = { r, c };
      if (!isFilled(r - 1, c))
        edges.push({ start: { x: c, y: r }, end: { x: c + 1, y: r }, dir: { dx: 1, dy: 0 }, cell });
      if (!isFilled(r, c + 1))
        edges.push({ start: { x: c + 1, y: r }, end: { x: c + 1, y: r + 1 }, dir: { dx: 0, dy: 1 }, cell });
      if (!isFilled(r + 1, c))
        edges.push({ start: { x: c + 1, y: r + 1 }, end: { x: c, y: r + 1 }, dir: { dx: -1, dy: 0 }, cell });
      if (!isFilled(r, c - 1))
        edges.push({ start: { x: c, y: r + 1 }, end: { x: c, y: r }, dir: { dx: 0, dy: -1 }, cell });
    }
  }
  return edges;
}

function turnPriority(incoming: Direction, outgoing: Direction): number {
  const { dx, dy } = incoming;
  if (outgoing.dx === -dy && outgoing.dy === dx) return 0; // right turn (convex)
  if (outgoing.dx === dx && outgoing.dy === dy) return 1; // straight
  if (outgoing.dx === dy && outgoing.dy === -dx) return 2; // left turn (concave)
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

function generateDiagonalBridgePaths(
  grid: boolean[][],
  bridgeRadius: number,
  scaleX: number,
  scaleY: number
): string {
  const rows = grid.length;
  const cols = grid[0]?.length || 0;
  const br = Math.min(Math.max(bridgeRadius, 0), 0.5);
  if (br === 0) return '';

  const parts: string[] = [];
  const isFilled = (r: number, c: number) =>
    r >= 0 && r < rows && c >= 0 && c < cols && grid[r][c];

  // Check each interior vertex (vx, vy) where 4 cells meet
  for (let vy = 1; vy < rows; vy++) {
    for (let vx = 1; vx < cols; vx++) {
      const tl = isFilled(vy - 1, vx - 1);
      const tr = isFilled(vy - 1, vx);
      const bl = isFilled(vy, vx - 1);
      const br2 = isFilled(vy, vx);

      // NW-SE diagonal: TL and BR filled, TR and BL empty
      if (tl && br2 && !tr && !bl) {
        // NE crescent
        parts.push(
          `M${round(vx * scaleX)} ${round(vy * scaleY)}` +
          `L${round(vx * scaleX)} ${round((vy - br) * scaleY)}` +
          `A${round(br * scaleX)} ${round(br * scaleY)} 0 0 1 ${round((vx + br) * scaleX)} ${round(vy * scaleY)}Z`
        );
        // SW crescent
        parts.push(
          `M${round(vx * scaleX)} ${round(vy * scaleY)}` +
          `L${round((vx - br) * scaleX)} ${round(vy * scaleY)}` +
          `A${round(br * scaleX)} ${round(br * scaleY)} 0 0 1 ${round(vx * scaleX)} ${round((vy + br) * scaleY)}Z`
        );
      }

      // NE-SW diagonal: TR and BL filled, TL and BR empty
      if (tr && bl && !tl && !br2) {
        // NW crescent
        parts.push(
          `M${round(vx * scaleX)} ${round(vy * scaleY)}` +
          `L${round(vx * scaleX)} ${round((vy - br) * scaleY)}` +
          `A${round(br * scaleX)} ${round(br * scaleY)} 0 0 0 ${round((vx - br) * scaleX)} ${round(vy * scaleY)}Z`
        );
        // SE crescent
        parts.push(
          `M${round(vx * scaleX)} ${round(vy * scaleY)}` +
          `L${round((vx + br) * scaleX)} ${round(vy * scaleY)}` +
          `A${round(br * scaleX)} ${round(br * scaleY)} 0 0 0 ${round(vx * scaleX)} ${round((vy + br) * scaleY)}Z`
        );
      }
    }
  }

  return parts.join(' ');
}

export function generateSVGPathData(
  grid: boolean[][],
  radius: number,
  scaleX: number = 1,
  scaleY: number = 1,
  innerRadius: number = 0,
  cellRadiusLookup?: CellRadiusLookup,
  diagonalBridge: boolean = false,
  bridgeRadius: number = 0.35
): string {
  const edges = findBoundaryEdges(grid);
  if (edges.length === 0) return '';

  const contours = traceContours(edges);
  const pathParts: string[] = [];
  const globalR = Math.min(Math.max(radius, 0), 0.5);
  const globalIR = Math.min(Math.max(innerRadius, 0), 0.5);

  for (const contour of contours) {
    const n = contour.length;

    type Corner = { vertex: Point; incoming: Direction; outgoing: Direction; isConvex: boolean; cell: { r: number; c: number }; cell2: { r: number; c: number } };
    const corners: Corner[] = [];

    for (let i = 0; i < n; i++) {
      const prevEdge = contour[(i - 1 + n) % n];
      const curEdge = contour[i];
      const incoming = prevEdge.dir;
      const outgoing = curEdge.dir;
      if (incoming.dx === outgoing.dx && incoming.dy === outgoing.dy) continue;
      corners.push({
        vertex: curEdge.start,
        incoming,
        outgoing,
        isConvex: turnPriority(incoming, outgoing) === 0,
        cell: prevEdge.cell,
        cell2: curEdge.cell,
      });
    }

    if (corners.length < 3) continue;

    const segs: string[] = [];

    const getRadius = (c: Corner) => {
      if (cellRadiusLookup) {
        if (c.isConvex) {
          const s1 = cellRadiusLookup(c.cell.r, c.cell.c);
          return Math.min(Math.max(s1.cornerRadius, 0), 0.5);
        } else {
          // For concave corners, check all 4 cells around the vertex
          const vx = c.vertex.x;
          const vy = c.vertex.y;
          const adjacentCells = [
            { r: vy - 1, c: vx - 1 },
            { r: vy - 1, c: vx },
            { r: vy, c: vx - 1 },
            { r: vy, c: vx },
          ];
          let maxIR = 0;
          for (const ac of adjacentCells) {
            if (ac.r >= 0 && ac.r < grid.length && ac.c >= 0 && ac.c < (grid[0]?.length || 0) && grid[ac.r][ac.c]) {
              const s = cellRadiusLookup(ac.r, ac.c);
              maxIR = Math.max(maxIR, Math.min(Math.max(s.innerRadius, 0), 0.5));
            }
          }
          return maxIR;
        }
      }
      return c.isConvex ? globalR : globalIR;
    };

    const first = corners[0];
    const firstR = getRadius(first);
    const firstDep = firstR > 0
      ? { x: (first.vertex.x + first.outgoing.dx * firstR) * scaleX, y: (first.vertex.y + first.outgoing.dy * firstR) * scaleY }
      : { x: first.vertex.x * scaleX, y: first.vertex.y * scaleY };

    segs.push(`M${round(firstDep.x)} ${round(firstDep.y)}`);

    for (let step = 0; step < corners.length; step++) {
      const idx = (step + 1) % corners.length;
      const c = corners[idx];
      const cr = getRadius(c);

      if (cr > 0) {
        const arr = {
          x: (c.vertex.x - c.incoming.dx * cr) * scaleX,
          y: (c.vertex.y - c.incoming.dy * cr) * scaleY,
        };
        const dep = {
          x: (c.vertex.x + c.outgoing.dx * cr) * scaleX,
          y: (c.vertex.y + c.outgoing.dy * cr) * scaleY,
        };
        const rx = cr * scaleX;
        const ry = cr * scaleY;
        const sweep = c.isConvex ? 1 : 0;
        segs.push(`L${round(arr.x)} ${round(arr.y)}`);
        segs.push(`A${round(rx)} ${round(ry)} 0 0 ${sweep} ${round(dep.x)} ${round(dep.y)}`);
      } else {
        segs.push(`L${round(c.vertex.x * scaleX)} ${round(c.vertex.y * scaleY)}`);
      }
    }

    segs.push('Z');
    pathParts.push(segs.join(' '));
  }

  const mainPath = pathParts.join(' ');

  if (diagonalBridge) {
    const bridgePaths = generateDiagonalBridgePaths(grid, bridgeRadius, scaleX, scaleY);
    return bridgePaths ? `${mainPath} ${bridgePaths}` : mainPath;
  }

  return mainPath;
}

export interface FilledBounds {
  minR: number; maxR: number; minC: number; maxC: number;
}

export function getFilledBounds(grid: boolean[][]): FilledBounds | null {
  const rows = grid.length;
  const cols = grid[0]?.length || 0;
  let minR = rows, maxR = -1, minC = cols, maxC = -1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c]) {
        if (r < minR) minR = r;
        if (r > maxR) maxR = r;
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
      }
    }
  }
  if (maxR === -1) return null;
  return { minR, maxR: maxR + 1, minC, maxC: maxC + 1 };
}

export function generateSVGMarkup(
  grid: boolean[][],
  radius: number,
  innerRadius: number = 0,
  cellRadiusLookup?: CellRadiusLookup,
  diagonalBridge: boolean = false,
  bridgeRadius: number = 0.35
): string {
  const pathData = generateSVGPathData(grid, radius, 1, 1, innerRadius, cellRadiusLookup, diagonalBridge, bridgeRadius);
  const bounds = getFilledBounds(grid);
  if (!bounds || !pathData) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1" width="20" height="20"></svg>`;
  }
  const w = bounds.maxC - bounds.minC;
  const h = bounds.maxR - bounds.minR;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bounds.minC} ${bounds.minR} ${w} ${h}" width="${w * 20}" height="${h * 20}">
  <path d="${pathData}" fill="black" fill-rule="evenodd"/>
</svg>`;
}

export function exportSVG(grid: boolean[][], radius: number, innerRadius: number = 0, cellRadiusLookup?: CellRadiusLookup, diagonalBridge: boolean = false, bridgeRadius: number = 0.35): void {
  const markup = generateSVGMarkup(grid, radius, innerRadius, cellRadiusLookup, diagonalBridge, bridgeRadius);
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
  innerRadius: number = 0,
  pixelScale: number = 1,
  cellRadiusLookup?: CellRadiusLookup,
  diagonalBridge: boolean = false,
  bridgeRadius: number = 0.35
): void {
  const bounds = getFilledBounds(grid);
  if (!bounds) return;
  const bw = bounds.maxC - bounds.minC;
  const bh = bounds.maxR - bounds.minR;
  const baseSize = 512;
  const aspect = bw / bh;
  const width = Math.round(aspect >= 1 ? baseSize * pixelScale : baseSize * pixelScale * aspect);
  const height = Math.round(aspect >= 1 ? baseSize * pixelScale / aspect : baseSize * pixelScale);
  const pathData = generateSVGPathData(grid, radius, 1, 1, innerRadius, cellRadiusLookup, diagonalBridge, bridgeRadius);

  const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bounds.minC} ${bounds.minR} ${bw} ${bh}" width="${width}" height="${height}">
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

export function copySVGToClipboard(grid: boolean[][], radius: number, innerRadius: number = 0, cellRadiusLookup?: CellRadiusLookup, diagonalBridge: boolean = false, bridgeRadius: number = 0.35): Promise<void> {
  const markup = generateSVGMarkup(grid, radius, innerRadius, cellRadiusLookup, diagonalBridge, bridgeRadius);
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
