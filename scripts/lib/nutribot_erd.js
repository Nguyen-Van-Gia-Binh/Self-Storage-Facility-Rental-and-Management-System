const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const dataDir = path.resolve('docs/diagrams/report/data');
const drawioDir = path.resolve('docs/diagrams/report/drawio');

function escXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function measureTextWidth(text, fontSize = 11, bold = false) {
  const factor = bold ? 0.62 : 0.56;
  return String(text).length * fontSize * factor;
}

/**
 * Compute dimensions of each table/entity card dynamically from its rows
 * so bottom rows never overflow or clip.
 */
function layoutNodes(specNodes, mode = 'physical') {
  const rowH = 18;
  const headerH = 26;
  const bottomPad = 6;
  const map = new Map();

  for (const n of specNodes) {
    const rows = n.rows || [];
    let minW = measureTextWidth(n.title, 12.5, true) + 32;
    for (const r of rows) {
      if (mode === 'physical') {
        const lineW = 24 + measureTextWidth(r.name, 10.5, r.pk) + 18 + measureTextWidth(r.type, 10.5) + 42;
        if (lineW > minW) minW = lineW;
      } else {
        const lineW = 16 + measureTextWidth(r.name, 11, r.pk) + 16;
        if (lineW > minW) minW = lineW;
      }
    }
    const w = Math.max(n.w || 0, Math.ceil(minW / 10) * 10);
    const h = rows.length > 0 ? headerH + rows.length * rowH + bottomPad : (n.h || 42);
    // Align top-left on 10px grid for ultra-clean orthogonal corridors
    const x = Math.round((n.cx - w / 2) / 10) * 10;
    const y = Math.round((n.cy - h / 2) / 10) * 10;
    map.set(n.id, { ...n, x, y, w, h, cx: x + w / 2, cy: y + h / 2, headerH, rowH });
  }
  return map;
}

/**
 * Assign spread-out attachment ports on card borders so multiple FKs never stack on one point.
 */
function allocatePorts(edges, nodeMap) {
  const buckets = new Map();
  for (let i = 0; i < edges.length; i++) {
    const e = edges[i];
    const fromKey = `${e.from}:${e.fromSide}`;
    const toKey = `${e.to}:${e.toSide}`;
    if (!buckets.has(fromKey)) buckets.set(fromKey, []);
    if (!buckets.has(toKey)) buckets.set(toKey, []);
    const fn = nodeMap.get(e.from);
    const tn = nodeMap.get(e.to);
    buckets.get(fromKey).push({ idx: i, role: 'from', otherPos: (e.fromSide === 'top' || e.fromSide === 'bottom') ? tn.cx : tn.cy });
    buckets.get(toKey).push({ idx: i, role: 'to', otherPos: (e.toSide === 'top' || e.toSide === 'bottom') ? fn.cx : fn.cy });
  }

  const ports = edges.map(() => ({ fromPt: null, toPt: null }));

  for (const [key, list] of buckets.entries()) {
    const [nodeId, side] = key.split(':');
    const n = nodeMap.get(nodeId);
    list.sort((a, b) => a.otherPos - b.otherPos || a.idx - b.idx);
    const len = (side === 'top' || side === 'bottom') ? n.w : n.h;
    const usable = Math.max(20, len - 32);
    const count = list.length;

    list.forEach((item, k) => {
      const frac = count === 1 ? 0.5 : (k + 0.5) / count;
      const offset = (len - usable) / 2 + frac * usable;
      let px, py;
      if (side === 'top') { px = Math.round((n.x + offset) / 5) * 5; py = n.y; }
      else if (side === 'bottom') { px = Math.round((n.x + offset) / 5) * 5; py = n.y + n.h; }
      else if (side === 'left') { px = n.x; py = Math.round((n.y + offset) / 5) * 5; }
      else { px = n.x + n.w; py = Math.round((n.y + offset) / 5) * 5; }

      if (item.role === 'from') ports[item.idx].fromPt = [px, py];
      else ports[item.idx].toPt = [px, py];
    });
  }
  return ports;
}

function stepOutPoint(pt, side, dist = 20) {
  if (side === 'top') return [pt[0], pt[1] - dist];
  if (side === 'bottom') return [pt[0], pt[1] + dist];
  if (side === 'left') return [pt[0] - dist, pt[1]];
  return [pt[0] + dist, pt[1]];
}

/**
 * Grid A* orthogonal router guaranteed never to intersect any node box.
 */
function routeEdges(edges, nodeMap, canvasW, canvasH, clusters = []) {
  const step = 10;
  const cols = Math.ceil(canvasW / step);
  const rows = Math.ceil(canvasH / step);
  const blocked = new Uint8Array(cols * rows);
  const usedEdge = new Uint8Array(cols * rows); // 1=horiz, 2=vert, 3=both

  const pad = 14;
  for (const n of nodeMap.values()) {
    const gx0 = Math.max(0, Math.floor((n.x - pad) / step));
    const gx1 = Math.min(cols - 1, Math.ceil((n.x + n.w + pad) / step));
    const gy0 = Math.max(0, Math.floor((n.y - pad) / step));
    const gy1 = Math.min(rows - 1, Math.ceil((n.y + n.h + pad) / step));
    for (let gy = gy0; gy <= gy1; gy++) {
      for (let gx = gx0; gx <= gx1; gx++) {
        blocked[gy * cols + gx] = 1;
      }
    }
  }
  // Keep cluster title badges free of crossing wires
  for (const cl of clusters) {
    const bw = measureTextWidth(cl.title, 12.5, true) + 28;
    const gx0 = Math.max(0, Math.floor((cl.x + 10) / step));
    const gx1 = Math.min(cols - 1, Math.ceil((cl.x + 16 + bw) / step));
    const gy0 = Math.max(0, Math.floor((cl.y - 18) / step));
    const gy1 = Math.min(rows - 1, Math.ceil((cl.y + 18) / step));
    for (let gy = gy0; gy <= gy1; gy++) {
      for (let gx = gx0; gx <= gx1; gx++) blocked[gy * cols + gx] = 1;
    }
  }
  // Keep bottom caption band free of wires
  const capGuardRow = Math.max(0, rows - Math.ceil(65 / step));
  for (let gy = capGuardRow; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) blocked[gy * cols + gx] = 1;
  }

  const ports = allocatePorts(edges, nodeMap);
  const routed = [];
  const dirs = [[1, 0, 1], [-1, 0, 1], [0, 1, 2], [0, -1, 2]];

  for (let ei = 0; ei < edges.length; ei++) {
    const e = edges[ei];
    const { fromPt, toPt } = ports[ei];
    const sPt = stepOutPoint(fromPt, e.fromSide, 20);
    const tPt = stepOutPoint(toPt, e.toSide, 20);

    const sx = Math.max(1, Math.min(cols - 2, Math.round(sPt[0] / step)));
    const sy = Math.max(1, Math.min(rows - 2, Math.round(sPt[1] / step)));
    const tx = Math.max(1, Math.min(cols - 2, Math.round(tPt[0] / step)));
    const ty = Math.max(1, Math.min(rows - 2, Math.round(tPt[1] / step)));

    // Minimal binary heap A*
    const totalStates = cols * rows * 2;
    const dist = new Float32Array(totalStates).fill(Infinity);
    const parent = new Int32Array(totalStates).fill(-1);
    const heap = [];
    const push = (f, s) => {
      heap.push([f, s]);
      let i = heap.length - 1;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (heap[p][0] <= heap[i][0]) break;
        [heap[p], heap[i]] = [heap[i], heap[p]];
        i = p;
      }
    };
    const pop = () => {
      const top = heap[0];
      const last = heap.pop();
      if (heap.length > 0) {
        heap[0] = last;
        let i = 0;
        while (true) {
          let l = i * 2 + 1, r = l + 1, m = i;
          if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
          if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
          if (m === i) break;
          [heap[i], heap[m]] = [heap[m], heap[i]];
          i = m;
        }
      }
      return top;
    };

    const sDir0 = (e.fromSide === 'left' || e.fromSide === 'right') ? 0 : 1;
    const startState = (sy * cols + sx) * 2 + sDir0;
    dist[startState] = 0;
    push(Math.abs(tx - sx) + Math.abs(ty - sy), startState);

    let bestEnd = -1;
    while (heap.length > 0) {
      const [curF, state] = pop();
      const d = dist[state];
      if (curF - (Math.abs(tx - ((state >> 1) % cols)) + Math.abs(ty - Math.floor((state >> 1) / cols))) > d + 0.5) continue;
      const cell = state >> 1;
      const cx = cell % cols;
      const cy = Math.floor(cell / cols);
      const curDir = state & 1; // 0=horiz, 1=vert

      if (cx === tx && cy === ty) {
        bestEnd = state;
        break;
      }

      for (const [dx, dy, bit] of dirs) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx <= 0 || nx >= cols - 1 || ny <= 0 || ny >= rows - 1) continue;
        const nCell = ny * cols + nx;
        if (blocked[nCell] && !(nx === tx && ny === ty)) continue;

        const nextDir = bit === 1 ? 0 : 1;
        let cost = 1;
        if (nextDir !== curDir) cost += 28; // prefer fewer bends
        const occ = usedEdge[nCell];
        if (occ & bit) cost += 35;          // strongly avoid overlapping collinear tracks
        else if (occ) cost += 55;           // discourage crossings
        // Track separation buffer so adjacent parallel wires stay >= 20px apart
        if (bit === 1) {
          if (ny > 1 && (usedEdge[(ny - 1) * cols + nx] & 1)) cost += 8;
          if (ny < rows - 2 && (usedEdge[(ny + 1) * cols + nx] & 1)) cost += 8;
        } else {
          if (nx > 1 && (usedEdge[ny * cols + (nx - 1)] & 2)) cost += 8;
          if (nx < cols - 2 && (usedEdge[ny * cols + (nx + 1)] & 2)) cost += 8;
        }

        const nd = d + cost;
        const nState = nCell * 2 + nextDir;
        if (nd < dist[nState]) {
          dist[nState] = nd;
          parent[nState] = state;
          push(nd + Math.abs(tx - nx) + Math.abs(ty - ny), nState);
        }
      }
    }

    let pts = [];
    if (bestEnd >= 0) {
      let cur = bestEnd;
      const gridPts = [];
      while (cur !== -1) {
        const cell = cur >> 1;
        const gx = cell % cols;
        const gy = Math.floor(cell / cols);
        gridPts.push([gx * step, gy * step]);
        if (parent[cur] !== -1) {
          const pCell = parent[cur] >> 1;
          const px = pCell % cols;
          const bit = px !== gx ? 1 : 2;
          usedEdge[cell] |= bit;
        }
        cur = parent[cur];
      }
      gridPts.reverse();
      pts = [fromPt, [sx * step, sy * step], ...gridPts, [tx * step, ty * step], toPt];
    } else {
      // Fallback orthogonal L/Z
      const mx = Math.round(((sPt[0] + tPt[0]) / 2) / 10) * 10;
      pts = [fromPt, sPt, [mx, sPt[1]], [mx, tPt[1]], tPt, toPt];
    }

    // Simplify collinear points cleanly
    const clean = [];
    for (const p of pts) {
      if (clean.length > 0 && clean[clean.length - 1][0] === p[0] && clean[clean.length - 1][1] === p[1]) continue;
      clean.push(p);
      while (clean.length >= 3) {
        const a = clean[clean.length - 3], b = clean[clean.length - 2], c = clean[clean.length - 1];
        if ((a[0] === b[0] && b[0] === c[0]) || (a[1] === b[1] && b[1] === c[1])) {
          clean.splice(clean.length - 2, 1);
        } else {
          break;
        }
      }
    }
    routed.push({ ...e, pts: clean });
  }
  return routed;
}

/**
 * Crow's foot endpoint SVG renderer (pointing inward away from the card border).
 */
function renderCrowsFootMarker(pt, side, kind) {
  // Vector pointing INTO open space away from border
  let ux = 0, uy = 0;
  if (side === 'left') ux = -1;
  else if (side === 'right') ux = 1;
  else if (side === 'top') uy = -1;
  else uy = 1;
  // Perpendicular vector
  const px = -uy, py = ux;

  const at = (d, o) => `${(pt[0] + ux * d + px * o).toFixed(1)},${(pt[1] + uy * d + py * o).toFixed(1)}`;
  const atX = (d, o) => (pt[0] + ux * d + px * o).toFixed(1);
  const atY = (d, o) => (pt[1] + uy * d + py * o).toFixed(1);

  let svg = '';
  if (kind === 'mandOne') {
    svg += `<line x1="${atX(5, -5)}" y1="${atY(5, -5)}" x2="${atX(5, 5)}" y2="${atY(5, 5)}" stroke="#000000" stroke-width="1.3"/>`;
    svg += `<line x1="${atX(9, -5)}" y1="${atY(9, -5)}" x2="${atX(9, 5)}" y2="${atY(9, 5)}" stroke="#000000" stroke-width="1.3"/>`;
  } else if (kind === 'optOne') {
    svg += `<line x1="${atX(5, -5)}" y1="${atY(5, -5)}" x2="${atX(5, 5)}" y2="${atY(5, 5)}" stroke="#000000" stroke-width="1.3"/>`;
    svg += `<circle cx="${atX(12, 0)}" cy="${atY(12, 0)}" r="3.4" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>`;
  } else if (kind === 'zeroToMany') {
    // 3-prong crow's foot touching border at pt
    svg += `<polyline points="${at(0, -6)} ${at(10, 0)} ${at(0, 6)}" fill="none" stroke="#000000" stroke-width="1.2"/>`;
    svg += `<circle cx="${atX(14, 0)}" cy="${atY(14, 0)}" r="3.4" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>`;
  } else if (kind === 'oneToMany') {
    svg += `<polyline points="${at(0, -6)} ${at(10, 0)} ${at(0, 6)}" fill="none" stroke="#000000" stroke-width="1.2"/>`;
    svg += `<line x1="${atX(13, -5)}" y1="${atY(13, -5)}" x2="${atX(13, 5)}" y2="${atY(13, 5)}" stroke="#000000" stroke-width="1.3"/>`;
  }
  return svg;
}

function chooseLabelPosition(edge, nodeMap, placedLabels, clusters = [], allEdges = []) {
  if (edge.labelPos) return edge.labelPos;
  const pts = edge.pts;
  const tw = measureTextWidth(edge.label, 10, true) + 14;
  const th = 16;

  // Rank candidate segments (prefer horizontal segments & longest interior segments away from other lines)
  const candidates = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const isHoriz = Math.abs(b[1] - a[1]) < 1;
    const len = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);
    if (len < 36) continue;
    const isEndSeg = (i === 0 || i === pts.length - 2);
    for (const frac of [0.5, 0.35, 0.65, 0.25, 0.75]) {
      const lx = Math.round(a[0] + (b[0] - a[0]) * frac);
      const ly = Math.round(a[1] + (b[1] - a[1]) * frac);
      let otherLinePenalty = 0;
      const x0 = lx - tw / 2, x1 = lx + tw / 2, y0 = ly - th / 2, y1 = ly + th / 2;
      for (const oe of allEdges) {
        if (oe === edge) continue;
        for (let k = 0; k < oe.pts.length - 1; k++) {
          const [p1x, p1y] = oe.pts[k], [p2x, p2y] = oe.pts[k + 1];
          const sx0 = Math.min(p1x, p2x), sx1 = Math.max(p1x, p2x);
          const sy0 = Math.min(p1y, p2y), sy1 = Math.max(p1y, p2y);
          if (x0 < sx1 && x1 > sx0 && y0 < sy1 && y1 > sy0) otherLinePenalty += 90;
        }
      }
      candidates.push({ lx, ly, score: len + (isHoriz ? 160 : 0) - (isEndSeg ? 70 : 0) - otherLinePenalty });
    }
  }
  candidates.sort((a, b) => b.score - a.score);

  const overlapsAny = (lx, ly) => {
    const x0 = lx - tw / 2 - 4, x1 = lx + tw / 2 + 4;
    const y0 = ly - th / 2 - 4, y1 = ly + th / 2 + 4;
    for (const n of nodeMap.values()) {
      if (x0 < n.x + n.w && x1 > n.x && y0 < n.y + n.h && y1 > n.y) return true;
    }
    for (const cl of clusters) {
      const bw = measureTextWidth(cl.title, 12.5, true) + 28;
      if (x0 < cl.x + 16 + bw && x1 > cl.x + 12 && y0 < cl.y + 16 && y1 > cl.y - 16) return true;
    }
    for (const pl of placedLabels) {
      if (x0 < pl.x1 && x1 > pl.x0 && y0 < pl.y1 && y1 > pl.y0) return true;
    }
    return false;
  };

  for (const c of candidates) {
    if (!overlapsAny(c.lx, c.ly)) {
      placedLabels.push({ x0: c.lx - tw / 2, x1: c.lx + tw / 2, y0: c.ly - th / 2, y1: c.ly + th / 2 });
      return [c.lx, c.ly];
    }
  }
  const mid = pts[Math.floor(pts.length / 2)];
  return [mid[0], mid[1]];
}

function renderKeyIcon(x, y, type) {
  if (type === 'pk') {
    // Crisp gold key icon
    return `<g transform="translate(${x},${y})">
      <circle cx="3.5" cy="4.5" r="2.8" fill="#FACC15" stroke="#854D0E" stroke-width="0.9"/>
      <circle cx="3.5" cy="4.5" r="0.9" fill="#FFFBEB"/>
      <path d="M 6.2 4.5 L 11.5 4.5 L 11.5 7 M 9.3 4.5 L 9.3 6.5" stroke="#854D0E" stroke-width="1.2" fill="none"/>
    </g>`;
  }
  if (type === 'fk') {
    // Crisp blue FK key/diamond icon
    return `<g transform="translate(${x},${y})">
      <circle cx="3.5" cy="4.5" r="2.5" fill="#93C5FD" stroke="#1E40AF" stroke-width="0.9"/>
      <path d="M 6 4.5 L 11 4.5 L 11 6.8" stroke="#1E40AF" stroke-width="1.1" fill="none"/>
    </g>`;
  }
  // Normal column tiny square bullet
  return `<rect x="${x + 3}" y="${y + 3}" width="4" height="4" rx="0.8" fill="#FFFFFF" stroke="#6B7280" stroke-width="0.8"/>`;
}

function buildSvg(spec, nodeMap, routedEdges, placedLabels) {
  const { width, height, caption, mode = 'physical', clusters = [] } = spec;
  const isPhys = mode === 'physical';
  const cardFill = isPhys ? '#FAD7A0' : '#FFFFFF';
  const headerFill = isPhys ? '#F5BC6E' : '#F3F4F6';

  let clustersSvg = '';
  for (const cl of clusters) {
    clustersSvg += `
      <g>
        <rect x="${cl.x}" y="${cl.y}" width="${cl.w}" height="${cl.h}" rx="12" ry="12" fill="${cl.fill || '#FAFAFA'}" stroke="${cl.stroke || '#94A3B8'}" stroke-width="1.5" stroke-dasharray="8 5"/>
        <rect x="${cl.x + 16}" y="${cl.y - 12}" width="${measureTextWidth(cl.title, 12.5, true) + 20}" height="24" rx="5" fill="#FFFFFF" stroke="${cl.stroke || '#94A3B8'}" stroke-width="1.1"/>
        <text x="${cl.x + 26}" y="${cl.y + 4}" class="cluster-title">${escXml(cl.title)}</text>
      </g>\n`;
  }

  let edgesSvg = '';
  let labelsSvg = '';

  for (const e of routedEdges) {
    const ptsAttr = e.pts.map(p => p.join(',')).join(' ');
    edgesSvg += `<polyline points="${ptsAttr}" fill="none" stroke="#111111" stroke-width="1.15" stroke-linejoin="round"/>\n`;
    edgesSvg += renderCrowsFootMarker(e.pts[0], e.fromSide, e.fromMarker || 'zeroToMany');
    edgesSvg += renderCrowsFootMarker(e.pts[e.pts.length - 1], e.toSide, e.toMarker || 'mandOne');

    if (e.label) {
      const [lx, ly] = chooseLabelPosition(e, nodeMap, placedLabels, clusters, routedEdges);
      const tw = measureTextWidth(e.label, 10, true) + 12;
      const th = 14;
      labelsSvg += `
        <rect x="${(lx - tw / 2).toFixed(1)}" y="${(ly - th / 2).toFixed(1)}" width="${tw.toFixed(1)}" height="${th}" rx="2" fill="#FFFFFF" opacity="0.96"/>
        <text x="${lx}" y="${ly + 3.2}" class="edge-label">${escXml(e.label)}</text>\n`;
    }
  }

  let nodesSvg = '';
  for (const n of nodeMap.values()) {
    const { x, y, w, h, headerH, rowH, title, rows = [] } = n;
    let bodySvg = '';
    rows.forEach((r, i) => {
      const ry = y + headerH + 3 + i * rowH;
      const ty = ry + 12.5;
      if (isPhys) {
        bodySvg += renderKeyIcon(x + 6, ry + 4, r.pk ? 'pk' : r.fk ? 'fk' : 'col');
        bodySvg += `<text x="${x + 22}" y="${ty}" class="${r.pk ? 'col-pk' : 'col-name'}">${escXml(r.name)}</text>`;
        bodySvg += `<text x="${x + w - 42}" y="${ty}" class="col-type">${escXml(r.type)}</text>`;
        if (r.unique && !r.pk) {
          bodySvg += `<text x="${x + w - 31}" y="${ty}" class="badge-u">U</text>`;
        }
        if (r.nullable) {
          bodySvg += `<rect x="${x + w - 21}" y="${ry + 3}" width="12" height="12" rx="1.5" fill="#FFFFFF" stroke="#374151" stroke-width="0.8"/>`;
          bodySvg += `<text x="${x + w - 15}" y="${ty - 0.3}" class="badge-n">N</text>`;
        }
      } else {
        bodySvg += `<text x="${x + 12}" y="${ty}" class="${r.pk ? 'col-pk' : 'col-name'}">${escXml(r.name)}</text>`;
      }
    });

    nodesSvg += `
      <g>
        <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" ry="7" fill="${cardFill}" stroke="#111111" stroke-width="1.3"/>
        <path d="M ${x} ${y + headerH} L ${x} ${y + 7} Q ${x} ${y} ${x + 7} ${y} L ${x + w - 7} ${y} Q ${x + w} ${y} ${x + w} ${y + 7} L ${x + w} ${y + headerH} Z" fill="${headerFill}" stroke="#111111" stroke-width="1.3"/>
        <text x="${x + w / 2}" y="${y + 17.5}" class="tbl-title">${escXml(title)}</text>
        ${bodySvg}
      </g>\n`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <style>
    .cluster-title { font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: bold; fill: #1E293B; }
    .tbl-title { font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: bold; text-anchor: middle; fill: #000000; }
    .col-pk { font-family: Arial, Helvetica, sans-serif; font-size: 10.5px; font-weight: bold; fill: #000000; }
    .col-name { font-family: Arial, Helvetica, sans-serif; font-size: 10.5px; fill: #111111; }
    .col-type { font-family: Arial, Helvetica, sans-serif; font-size: 10px; text-anchor: end; fill: #1F2937; }
    .badge-u { font-family: Arial, Helvetica, sans-serif; font-size: 9.5px; font-weight: bold; text-anchor: middle; fill: #B91C1C; }
    .badge-n { font-family: Arial, Helvetica, sans-serif; font-size: 8.5px; font-weight: bold; text-anchor: middle; fill: #111111; }
    .edge-label { font-family: Arial, Helvetica, sans-serif; font-size: 10px; font-weight: 600; text-anchor: middle; fill: #0F172A; }
    .caption { font-family: Arial, Helvetica, sans-serif; font-size: 18px; font-weight: bold; text-anchor: middle; fill: #000000; }
  </style>
  <rect width="${width}" height="${height}" fill="#FFFFFF"/>
  ${clustersSvg}
  ${edgesSvg}
  ${nodesSvg}
  ${labelsSvg}
  <text x="${width / 2}" y="${height - 20}" class="caption">${escXml(caption)}</text>
</svg>`;
}

function toDrawioArrow(marker) {
  if (marker === 'mandOne') return 'ERmandOne';
  if (marker === 'optOne') return 'ERzeroToOne';
  if (marker === 'oneToMany') return 'ERoneToMany';
  return 'ERzeroToMany';
}

function buildDrawioXml(spec, nodeMap, routedEdges) {
  const { width, height, caption, mode = 'physical', clusters = [] } = spec;
  const isPhys = mode === 'physical';
  const fill = isPhys ? '#FAD7A0' : '#FFFFFF';
  const swimFill = isPhys ? '#F5BC6E' : '#F3F4F6';
  let cells = '';
  let idSeq = 10;
  const nodeCellIds = new Map();

  for (const cl of clusters) {
    const cid = `cl_${idSeq++}`;
    const cStyle = `rounded=1;arcSize=4;whiteSpace=wrap;html=1;dashed=1;dashPattern=8 5;fillColor=${cl.fill || '#FAFAFA'};strokeColor=${cl.stroke || '#94A3B8'};strokeWidth=1.5;verticalAlign=top;align=left;spacingLeft=14;spacingTop=6;fontStyle=1;fontSize=12;fontFamily=Arial;fontColor=#1E293B;`;
    cells += `      <mxCell id="${cid}" value="${escXml(cl.title)}" style="${cStyle}" vertex="1" parent="1">\n`;
    cells += `        <mxGeometry x="${cl.x}" y="${cl.y}" width="${cl.w}" height="${cl.h}" as="geometry"/>\n`;
    cells += `      </mxCell>\n`;
  }

  for (const n of nodeMap.values()) {
    const tblId = `tbl_${idSeq++}`;
    nodeCellIds.set(n.id, tblId);
    const tblStyle = `swimlane;fontStyle=1;align=center;verticalAlign=top;childLayout=stackLayout;horizontal=1;startSize=${n.headerH};horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=0;marginBottom=0;rounded=1;arcSize=6;fillColor=${swimFill};swimlaneFillColor=${fill};strokeColor=#000000;strokeWidth=1.2;fontSize=12;fontFamily=Arial;`;
    cells += `      <mxCell id="${tblId}" value="${escXml(n.title)}" style="${tblStyle}" vertex="1" parent="1">\n`;
    cells += `        <mxGeometry x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" as="geometry"/>\n`;
    cells += `      </mxCell>\n`;

    (n.rows || []).forEach((r, idx) => {
      const rowId = `row_${idSeq++}`;
      const prefix = r.pk ? 'PK ' : r.fk ? 'FK ' : '   ';
      const suffixes = [r.unique && !r.pk ? '[U]' : '', r.nullable ? '[N]' : ''].filter(Boolean).join(' ');
      const text = isPhys
        ? `${prefix}${r.name} : ${r.type}${suffixes ? ' ' + suffixes : ''}`
        : r.name;
      const rowStyle = `text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;spacingLeft=8;spacingRight=8;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;fontSize=10;fontFamily=Arial;fontStyle=${r.pk ? 1 : 0};`;
      cells += `      <mxCell id="${rowId}" value="${escXml(text)}" style="${rowStyle}" vertex="1" parent="${tblId}">\n`;
      cells += `        <mxGeometry y="${n.headerH + idx * n.rowH}" width="${n.w}" height="${n.rowH}" as="geometry"/>\n`;
      cells += `      </mxCell>\n`;
    });
  }

  for (const e of routedEdges) {
    const eid = `edge_${idSeq++}`;
    const sId = nodeCellIds.get(e.from);
    const tId = nodeCellIds.get(e.to);
    const sArr = toDrawioArrow(e.fromMarker || 'zeroToMany');
    const eArr = toDrawioArrow(e.toMarker || 'mandOne');
    const style = `edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;startArrow=${sArr};endArrow=${eArr};startFill=0;endFill=0;labelBackgroundColor=#FFFFFF;fontSize=10;fontFamily=Arial;`;
    const innerPts = e.pts.slice(1, -1).map(p => `<mxPoint x="${p[0]}" y="${p[1]}"/>`).join('');
    cells += `      <mxCell id="${eid}" value="${escXml(e.label || '')}" style="${style}" edge="1" parent="1" source="${sId}" target="${tId}">\n`;
    cells += `        <mxGeometry relative="1" as="geometry">${innerPts ? `<Array as="points">${innerPts}</Array>` : ''}</mxGeometry>\n`;
    cells += `      </mxCell>\n`;
  }

  const capId = `cap_${idSeq++}`;
  cells += `      <mxCell id="${capId}" value="${escXml(caption)}" style="text;html=1;align=center;verticalAlign=middle;fontStyle=1;fontSize=16;fontFamily=Arial;" vertex="1" parent="1">\n`;
  cells += `        <mxGeometry x="${Math.round(width / 2 - 300)}" y="${height - 40}" width="600" height="30" as="geometry"/>\n`;
  cells += `      </mxCell>\n`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" agent="Antigravity-ERD-Generator" version="24.0.0">
  <diagram name="${escXml(spec.diagramName || spec.svgBase)}" id="${escXml(spec.svgBase)}">
    <mxGraphModel dx="${width}" dy="${height}" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${width}" pageHeight="${height}" background="#FFFFFF">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
${cells}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
}

function checkLayoutQuality(nodeMap, routedEdges) {
  let boxOverlaps = 0;
  const nodes = [...nodeMap.values()];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      if (a.x < b.x + b.w + 20 && a.x + a.w + 20 > b.x && a.y < b.y + b.h + 20 && a.y + a.h + 20 > b.y) {
        boxOverlaps++;
        console.warn(`Box collision/tight margin: ${a.id} vs ${b.id}`);
      }
    }
  }

  let segBoxHits = 0;
  for (const e of routedEdges) {
    for (let i = 0; i < e.pts.length - 1; i++) {
      const [x1, y1] = e.pts[i], [x2, y2] = e.pts[i + 1];
      const sx0 = Math.min(x1, x2), sx1 = Math.max(x1, x2);
      const sy0 = Math.min(y1, y2), sy1 = Math.max(y1, y2);
      const isEnd = (i === 0 || i === e.pts.length - 2);
      if (isEnd) continue; // border touch happens on final stub
      for (const n of nodes) {
        if (sx0 < n.x + n.w && sx1 > n.x && sy0 < n.y + n.h && sy1 > n.y) {
          segBoxHits++;
        }
      }
    }
  }
  return { boxOverlaps, segBoxHits };
}

function generateErdDiagram(spec) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(drawioDir, { recursive: true });

  const nodeMap = layoutNodes(spec.nodes, spec.mode || 'physical');
  const routedEdges = routeEdges(spec.edges, nodeMap, spec.width, spec.height, spec.clusters || []);
  const { boxOverlaps, segBoxHits } = checkLayoutQuality(nodeMap, routedEdges);

  const placedLabels = [];
  const svg = buildSvg(spec, nodeMap, routedEdges, placedLabels);
  const drawio = buildDrawioXml(spec, nodeMap, routedEdges);

  const svgPath = path.join(dataDir, `${spec.svgBase}.svg`);
  const pngPath = path.join(dataDir, `${spec.svgBase}.png`);
  const drawioPath = path.join(drawioDir, `${spec.drawioBase}.drawio`);

  fs.writeFileSync(svgPath, svg, 'utf8');
  fs.writeFileSync(drawioPath, drawio, 'utf8');

  const pngW = spec.pngWidth || Math.min(4200, Math.round(spec.width * 1.4));
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: pngW } });
  const pngBuf = resvg.render().asPng();
  fs.writeFileSync(pngPath, pngBuf);

  console.log(
    `Generated ${spec.svgBase}: ${nodeMap.size} entities, ${routedEdges.length} relations | ` +
    `boxOverlaps=${boxOverlaps}, segBoxHits=${segBoxHits} | PNG (${(pngBuf.length / 1024).toFixed(1)} KB, ${pngW}px wide) + SVG + Draw.io`
  );
  return { nodeMap, routedEdges, boxOverlaps, segBoxHits };
}

module.exports = { generateErdDiagram };
