/**
 * Shared NutriBot-style UML 2.5 Monochrome State Machine Renderer
 * Outputs BOTH Draw.io XML (.drawio) and crisp Monochrome SVG + 2x PNG from ONE layout spec.
 * Enforces strict geometry & anti-slop invariants:
 *   - Pure monochrome (#FFFFFF fill, #000000 stroke/text)
 *   - 90-degree orthogonal transitions anchored to node borders
 *   - Bold UPPERCASE normal states in rounded rectangles
 *   - Filled start circle, concentric bullseye end circle(s)
 *   - Explicit white background boxes behind every transition label
 *   - Zero edge crossings & zero label/node collisions (verified programmatically)
 */

const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

function escXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getPort(node, side, offset = 0) {
  const cx = node.x;
  const cy = node.y;
  const hw = node.w / 2;
  const hh = node.h / 2;
  if (side === 'top') {
    const px = cx + offset;
    return { x: px, y: cy - hh, nx: (px - (cx - hw)) / node.w, ny: 0 };
  }
  if (side === 'bottom') {
    const px = cx + offset;
    return { x: px, y: cy + hh, nx: (px - (cx - hw)) / node.w, ny: 1 };
  }
  if (side === 'left') {
    const py = cy + offset;
    return { x: cx - hw, y: py, nx: 0, ny: (py - (cy - hh)) / node.h };
  }
  if (side === 'right') {
    const py = cy + offset;
    return { x: cx + hw, y: py, nx: 1, ny: (py - (cy - hh)) / node.h };
  }
  throw new Error(`Unknown port side "${side}" on node "${node.id}"`);
}

function segmentsIntersect(a1, a2, b1, b2) {
  const aHoriz = a1.y === a2.y;
  const bHoriz = b1.y === b2.y;
  if (aHoriz === bHoriz) {
    // Check colinear overlap
    if (aHoriz && a1.y === b1.y) {
      const aMin = Math.min(a1.x, a2.x);
      const aMax = Math.max(a1.x, a2.x);
      const bMin = Math.min(b1.x, b2.x);
      const bMax = Math.max(b1.x, b2.x);
      return Math.max(aMin, bMin) < Math.min(aMax, bMax) - 1;
    }
    if (!aHoriz && a1.x === b1.x) {
      const aMin = Math.min(a1.y, a2.y);
      const aMax = Math.max(a1.y, a2.y);
      const bMin = Math.min(b1.y, b2.y);
      const bMax = Math.max(b1.y, b2.y);
      return Math.max(aMin, bMin) < Math.min(aMax, bMax) - 1;
    }
    return false;
  }
  const h = aHoriz ? [a1, a2] : [b1, b2];
  const v = aHoriz ? [b1, b2] : [a1, a2];
  const hxMin = Math.min(h[0].x, h[1].x);
  const hxMax = Math.max(h[0].x, h[1].x);
  const vyMin = Math.min(v[0].y, v[1].y);
  const vyMax = Math.max(v[0].y, v[1].y);
  return v[0].x > hxMin + 1 && v[0].x < hxMax - 1 && h[0].y > vyMin + 1 && h[0].y < vyMax - 1;
}

function boxesOverlap(a, b) {
  return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
}

function validateAndCompute(spec) {
  const padX = spec.padX ?? 48;
  const padTop = spec.padTop ?? 40;
  const captionH = spec.captionH ?? 52;

  const nodeMap = new Map();
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const nodes = spec.nodes.map((n) => {
    const w = n.type === 'start' ? 24 : n.type === 'end' ? 28 : (n.w || 190);
    const h = n.type === 'start' ? 24 : n.type === 'end' ? 28 : (n.h || 48);
    const left = n.x - w / 2;
    const right = n.x + w / 2;
    const top = n.y - h / 2;
    const bottom = n.y + h / 2;
    if (left < minX) minX = left;
    if (right > maxX) maxX = right;
    if (top < minY) minY = top;
    if (bottom > maxY) maxY = bottom;
    const computed = { ...n, w, h, left, right, top, bottom };
    nodeMap.set(n.id, computed);
    return computed;
  });

  // Check node-to-node overlaps
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (boxesOverlap(nodes[i], nodes[j])) {
        throw new Error(`Node overlap between "${nodes[i].id}" and "${nodes[j].id}"`);
      }
    }
  }

  const labelBoxes = [];
  const edges = spec.edges.map((e, idx) => {
    const src = nodeMap.get(e.from);
    const dst = nodeMap.get(e.to);
    if (!src) throw new Error(`Unknown source node "${e.from}" on edge "${e.id || idx}"`);
    if (!dst) throw new Error(`Unknown target node "${e.to}" on edge "${e.id || idx}"`);

    const start = getPort(src, e.fromSide, e.fromOffset || 0);
    const end = getPort(dst, e.toSide, e.toOffset || 0);
    const mids = (e.waypoints || []).map(([x, y]) => ({ x, y }));
    const pts = [start, ...mids, end];

    for (let k = 0; k < pts.length - 1; k++) {
      const p1 = pts[k];
      const p2 = pts[k + 1];
      if (p1.x !== p2.x && p1.y !== p2.y) {
        throw new Error(`Non-orthogonal edge "${e.id || `${e.from}->${e.to}`}" segment ${k}: (${p1.x},${p1.y})->(${p2.x},${p2.y})`);
      }
      if (p1.x < minX) minX = p1.x;
      if (p1.x > maxX) maxX = p1.x;
      if (p1.y < minY) minY = p1.y;
      if (p1.y > maxY) maxY = p1.y;
      if (p2.x < minX) minX = p2.x;
      if (p2.x > maxX) maxX = p2.x;
      if (p2.y < minY) minY = p2.y;
      if (p2.y > maxY) maxY = p2.y;
    }

    let labelBox = null;
    if (e.label) {
      const lines = String(e.label).split('\n');
      const maxChars = Math.max(...lines.map((l) => l.length));
      const lw = e.labelW || Math.max(46, Math.round(maxChars * 6.4 + 14));
      const lh = lines.length * 14 + 6;
      const lx = e.labelPos ? e.labelPos[0] : Math.round((pts[0].x + pts[1].x) / 2);
      const ly = e.labelPos ? e.labelPos[1] : Math.round((pts[0].y + pts[1].y) / 2);
      labelBox = {
        edgeId: e.id || `${e.from}_${e.to}_${idx}`,
        cx: lx,
        cy: ly,
        w: lw,
        h: lh,
        left: lx - lw / 2,
        right: lx + lw / 2,
        top: ly - lh / 2,
        bottom: ly + lh / 2,
        lines
      };
      if (labelBox.left < minX) minX = labelBox.left;
      if (labelBox.right > maxX) maxX = labelBox.right;
      if (labelBox.top < minY) minY = labelBox.top;
      if (labelBox.bottom > maxY) maxY = labelBox.bottom;

      // Ensure label never hits any node box
      for (const n of nodes) {
        if (boxesOverlap(labelBox, n)) {
          throw new Error(`Label "${e.label.replace(/\n/g, ' ')}" overlaps node "${n.id}"`);
        }
      }
      // Ensure label never hits another label
      for (const prev of labelBoxes) {
        if (boxesOverlap(labelBox, prev)) {
          throw new Error(`Label "${e.label.replace(/\n/g, ' ')}" (${labelBox.edgeId}) overlaps label "${prev.edgeId}"`);
        }
      }
      labelBoxes.push(labelBox);
    }

    return {
      ...e,
      id: e.id || `edge_${idx}_${e.from}_${e.to}`,
      start,
      end,
      pts,
      labelBox
    };
  });

  // Strict zero-crossover check across all edges
  if (!spec.allowCrossings) {
    for (let i = 0; i < edges.length; i++) {
      for (let j = i + 1; j < edges.length; j++) {
        const ei = edges[i];
        const ej = edges[j];
        for (let si = 0; si < ei.pts.length - 1; si++) {
          for (let sj = 0; sj < ej.pts.length - 1; sj++) {
            // Skip shared endpoint if edges start/end at exact same port point
            const a1 = ei.pts[si];
            const a2 = ei.pts[si + 1];
            const b1 = ej.pts[sj];
            const b2 = ej.pts[sj + 1];
            if (segmentsIntersect(a1, a2, b1, b2)) {
              throw new Error(`Edge crossing detected between "${ei.id}" seg ${si} and "${ej.id}" seg ${sj}`);
            }
          }
        }
      }
    }
  }

  // Ensure segments don't pass through non-endpoint node interiors
  for (const e of edges) {
    for (let k = 0; k < e.pts.length - 1; k++) {
      const p1 = e.pts[k];
      const p2 = e.pts[k + 1];
      const segBox = {
        left: Math.min(p1.x, p2.x) + 1,
        right: Math.max(p1.x, p2.x) - 1,
        top: Math.min(p1.y, p2.y) + 1,
        bottom: Math.max(p1.y, p2.y) - 1
      };
      if (segBox.left > segBox.right) {
        segBox.left = p1.x;
        segBox.right = p1.x;
      }
      if (segBox.top > segBox.bottom) {
        segBox.top = p1.y;
        segBox.bottom = p1.y;
      }
      for (const n of nodes) {
        if (k === 0 && n.id === e.from) continue;
        if (k === e.pts.length - 2 && n.id === e.to) continue;
        const inner = {
          left: n.left + 2,
          right: n.right - 2,
          top: n.top + 2,
          bottom: n.bottom - 2
        };
        if (boxesOverlap(segBox, inner)) {
          throw new Error(`Edge "${e.id}" segment ${k} cuts through node "${n.id}"`);
        }
      }
    }
  }

  const width = spec.width || Math.ceil(maxX + padX);
  const height = spec.height || Math.ceil(maxY + padTop + captionH);

  return { width, height, nodes, edges };
}

function renderSvg(spec, layout) {
  const parts = [];

  // 1. Orthogonal edges first
  for (const e of layout.edges) {
    const d = e.pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    parts.push(`<path d="${d}" fill="none" stroke="#000000" stroke-width="1.2" stroke-linejoin="miter" marker-end="url(#arrow)" />`);
  }

  // 2. Nodes on top
  for (const n of layout.nodes) {
    if (n.type === 'start') {
      parts.push(`<circle cx="${n.x}" cy="${n.y}" r="11" fill="#000000" />`);
    } else if (n.type === 'end') {
      parts.push(
        `<circle cx="${n.x}" cy="${n.y}" r="13" fill="#ffffff" stroke="#000000" stroke-width="1.3" />`,
        `<circle cx="${n.x}" cy="${n.y}" r="8" fill="#000000" />`
      );
    } else {
      parts.push(
        `<rect x="${n.left}" y="${n.top}" width="${n.w}" height="${n.h}" rx="4" ry="4" fill="#ffffff" stroke="#000000" stroke-width="1.3" />`,
        `<text x="${n.x}" y="${n.y}" class="state-name" dominant-baseline="central">${escXml(n.label)}</text>`
      );
    }
  }

  // 3. Explicit white-backed labels on top so lines never slice text
  for (const e of layout.edges) {
    if (!e.labelBox) continue;
    const lb = e.labelBox;
    parts.push(`<rect x="${lb.left}" y="${lb.top}" width="${lb.w}" height="${lb.h}" rx="2" ry="2" fill="#ffffff" stroke="none" />`);
    const startY = lb.cy - ((lb.lines.length - 1) * 14) / 2;
    lb.lines.forEach((line, idx) => {
      parts.push(`<text x="${lb.cx}" y="${startY + idx * 14}" class="edge-label" dominant-baseline="central">${escXml(line)}</text>`);
    });
  }

  // 4. Figure Caption
  parts.push(`<text x="${layout.width / 2}" y="${layout.height - 20}" class="caption">${escXml(spec.caption)}</text>`);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${layout.width} ${layout.height}" width="${layout.width}" height="${layout.height}">
  <style>
    .state-name { font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: bold; text-anchor: middle; fill: #000000; }
    .edge-label { font-family: Arial, Helvetica, sans-serif; font-size: 11px; text-anchor: middle; fill: #000000; }
    .caption { font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: bold; text-anchor: middle; fill: #000000; }
  </style>
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto" markerUnits="userSpaceOnUse">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#000000" />
    </marker>
  </defs>
  <rect width="${layout.width}" height="${layout.height}" fill="#ffffff" />
  ${parts.join('\n  ')}
</svg>`;
}

function renderDrawio(spec, layout) {
  const cells = [];

  for (const n of layout.nodes) {
    if (n.type === 'start') {
      cells.push(
        `<mxCell id="${n.id}" value="" style="ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#000000;strokeColor=#000000;" vertex="1" parent="1">
          <mxGeometry x="${n.left}" y="${n.top}" width="${n.w}" height="${n.h}" as="geometry" />
        </mxCell>`
      );
    } else if (n.type === 'end') {
      cells.push(
        `<mxCell id="${n.id}" value="" style="ellipse;html=1;shape=endState;fillColor=#000000;strokeColor=#000000;strokeWidth=1.5;" vertex="1" parent="1">
          <mxGeometry x="${n.left}" y="${n.top}" width="${n.w}" height="${n.h}" as="geometry" />
        </mxCell>`
      );
    } else {
      cells.push(
        `<mxCell id="${n.id}" value="${escXml(n.label)}" style="rounded=1;arcSize=8;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.3;fontFamily=Arial;fontSize=13;fontStyle=1;fontColor=#000000;align=center;verticalAlign=middle;" vertex="1" parent="1">
          <mxGeometry x="${n.left}" y="${n.top}" width="${n.w}" height="${n.h}" as="geometry" />
        </mxCell>`
      );
    }
  }

  for (const e of layout.edges) {
    const waypointsXml = e.pts.length > 2
      ? `<Array as="points">${e.pts.slice(1, -1).map(p => `<mxPoint x="${p.x}" y="${p.y}" />`).join('')}</Array>`
      : '';
    const style = `edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;` +
      `exitX=${e.start.nx};exitY=${e.start.ny};exitDx=0;exitDy=0;` +
      `entryX=${e.end.nx};entryY=${e.end.ny};entryDx=0;entryDy=0;` +
      `strokeColor=#000000;strokeWidth=1.2;endArrow=classic;endFill=1;` +
      `fontFamily=Arial;fontSize=11;fontColor=#000000;labelBackgroundColor=#ffffff;labelBorderColor=none;`;
    const labelHtml = escXml(String(e.label || '').replace(/\n/g, '<br>'));
    cells.push(
      `<mxCell id="${e.id}" value="${labelHtml}" style="${style}" edge="1" parent="1" source="${e.from}" target="${e.to}">
        <mxGeometry relative="1" as="geometry">${waypointsXml}</mxGeometry>
      </mxCell>`
    );
  }

  return `<mxfile host="Electron" modified="2026-11-12T00:00:00.000Z" agent="draw.io" version="21.0.0" type="device">
  <diagram name="${escXml(spec.caption)}" id="${escXml(spec.svgBase)}">
    <mxGraphModel dx="${layout.width + 80}" dy="${layout.height + 80}" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${layout.width + 40}" pageHeight="${layout.height + 40}" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        ${cells.join('\n        ')}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
}

function generateStateMachine(spec) {
  const layout = validateAndCompute(spec);
  const svg = renderSvg(spec, layout);
  const drawio = renderDrawio(spec, layout);

  const svgDir = path.resolve('docs/diagrams/report/state');
  const drawioDir = path.resolve('docs/diagrams/report/drawio');
  fs.mkdirSync(svgDir, { recursive: true });
  fs.mkdirSync(drawioDir, { recursive: true });

  const svgPath = path.join(svgDir, `${spec.svgBase}.svg`);
  const pngPath = path.join(svgDir, `${spec.svgBase}.png`);
  const drawioPath = path.join(drawioDir, `${spec.drawioBase}.drawio`);

  fs.writeFileSync(svgPath, svg, 'utf8');
  fs.writeFileSync(drawioPath, drawio, 'utf8');

  const resvg = new Resvg(svg, { fitTo: { mode: 'zoom', value: 2 } });
  const pngBuffer = resvg.render().asPng();
  fs.writeFileSync(pngPath, pngBuffer);

  console.log(`Generated ${spec.svgBase}: ${layout.nodes.length - 2} states, ${layout.edges.length} edges | PNG (${(pngBuffer.length / 1024).toFixed(1)} KB) + SVG + Draw.io`);
}

module.exports = { generateStateMachine };

