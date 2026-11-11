/**
 * Shared NutriBot-style UML Activity Swimlane Renderer
 * Outputs BOTH Draw.io XML (.drawio) and crisp Monochrome SVG + 2x PNG from ONE spec.
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

function getPort(node, side) {
  const cx = node.absX;
  const cy = node.absY;
  const hw = node.w / 2;
  const hh = node.h / 2;
  if (side === 'top') return { x: cx, y: cy - hh, nx: 0.5, ny: 0 };
  if (side === 'bottom') return { x: cx, y: cy + hh, nx: 0.5, ny: 1 };
  if (side === 'left') return { x: cx - hw, y: cy, nx: 0, ny: 0.5 };
  if (side === 'right') return { x: cx + hw, y: cy, nx: 1, ny: 0.5 };
  throw new Error(`Unknown port side "${side}" on node "${node.id}"`);
}

function defaultDims(node) {
  if (node.type === 'start') return { w: 20, h: 20 };
  if (node.type === 'end') return { w: 24, h: 24 };
  if (node.type === 'decision') return { w: node.w || 108, h: node.h || 64 };
  return { w: node.w || 160, h: node.h || 46 };
}

function validateAndCompute(spec) {
  const padX = 16;
  const padTop = 16;
  const poolBarW = 28;
  const headerH = 30;
  const captionH = 44;

  const laneMap = new Map();
  let curX = padX + poolBarW;
  const lanes = spec.lanes.map((lane, index) => {
    const l = {
      ...lane,
      index,
      absX: curX,
      relX: poolBarW + (curX - (padX + poolBarW)),
      centerX: curX + lane.width / 2
    };
    curX += lane.width;
    laneMap.set(lane.id, l);
    return l;
  });

  const poolWidth = curX - padX;
  const poolBodyTop = padTop + headerH;

  let maxBottom = poolBodyTop + 120;
  const nodeMap = new Map();
  const nodes = spec.nodes.map((n) => {
    const lane = laneMap.get(n.lane);
    if (!lane) throw new Error(`Unknown lane "${n.lane}" on node "${n.id}"`);
    const dims = defaultDims(n);
    const absX = lane.centerX + (n.dx || 0);
    const absY = n.y;
    const left = absX - dims.w / 2;
    const right = absX + dims.w / 2;
    const top = absY - dims.h / 2;
    const bottom = absY + dims.h / 2;

    if (left < lane.absX + 6 || right > lane.absX + lane.width - 6) {
      throw new Error(`Node "${n.id}" exceeds lane "${lane.id}" horizontal boundaries (${left}..${right} vs ${lane.absX}..${lane.absX + lane.width})`);
    }
    if (top < poolBodyTop + 6) {
      throw new Error(`Node "${n.id}" overlaps lane header (${top} < ${poolBodyTop + 6})`);
    }
    if (bottom > maxBottom) maxBottom = bottom;

    const computed = {
      ...n,
      ...dims,
      laneObj: lane,
      absX,
      absY,
      left,
      right,
      top,
      bottom,
      relToLaneX: left - lane.absX,
      relToLaneY: top - padTop
    };
    nodeMap.set(n.id, computed);
    return computed;
  });

  const bodyBottom = spec.poolBottom || (maxBottom + 36);
  const poolHeight = bodyBottom - padTop;
  const totalWidth = padX * 2 + poolWidth;
  const totalHeight = bodyBottom + captionH;

  const edges = spec.edges.map((e, idx) => {
    const fromNode = nodeMap.get(e.from);
    const toNode = nodeMap.get(e.to);
    if (!fromNode || !toNode) throw new Error(`Invalid edge ${e.from} -> ${e.to}`);

    const start = getPort(fromNode, e.exit);
    const end = getPort(toNode, e.entry);
    const pts = [start, ...(e.points || []).map(([x, y]) => ({ x, y })), end];

    // Strict orthogonal check
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      if (Math.abs(a.x - b.x) > 0.5 && Math.abs(a.y - b.y) > 0.5) {
        throw new Error(`Non-orthogonal edge segment in ${e.from} -> ${e.to}: (${a.x},${a.y}) -> (${b.x},${b.y})`);
      }
      // Check segment does not pass through intermediate nodes
      for (const node of nodes) {
        if (node.id === e.from || node.id === e.to) continue;
        const minX = Math.min(a.x, b.x);
        const maxX = Math.max(a.x, b.x);
        const minY = Math.min(a.y, b.y);
        const maxY = Math.max(a.y, b.y);
        if (maxX > node.left + 2 && minX < node.right - 2 && maxY > node.top + 2 && minY < node.bottom - 2) {
          throw new Error(`Edge ${e.from} -> ${e.to} crosses node "${node.id}"`);
        }
      }
    }

    return {
      ...e,
      id: `edge_${idx}`,
      start,
      end,
      pts
    };
  });

  return {
    padX,
    padTop,
    poolBarW,
    headerH,
    poolWidth,
    poolHeight,
    bodyBottom,
    totalWidth,
    totalHeight,
    lanes,
    nodes,
    edges
  };
}

function renderSvg(spec, layout) {
  const parts = [];

  // Pool outer frame & rotated pool header bar
  const poolTitleCx = layout.padX + layout.poolBarW / 2;
  const poolTitleCy = layout.padTop + layout.poolHeight / 2;
  parts.push(
    `<rect x="${layout.padX}" y="${layout.padTop}" width="${layout.poolWidth}" height="${layout.poolHeight}" fill="#ffffff" stroke="#000000" stroke-width="1.2" />`,
    `<rect x="${layout.padX}" y="${layout.padTop}" width="${layout.poolBarW}" height="${layout.poolHeight}" fill="#ffffff" stroke="#000000" stroke-width="1.2" />`,
    `<text x="${poolTitleCx}" y="${poolTitleCy}" transform="rotate(-90 ${poolTitleCx} ${poolTitleCy})" class="pool-title" dominant-baseline="central">${escXml(spec.poolTitle || 'Self-Storage System')}</text>`
  );

  // Lanes
  for (const lane of layout.lanes) {
    parts.push(
      `<rect x="${lane.absX}" y="${layout.padTop}" width="${lane.width}" height="${layout.poolHeight}" fill="none" stroke="#000000" stroke-width="1.1" />`,
      `<rect x="${lane.absX}" y="${layout.padTop}" width="${lane.width}" height="${layout.headerH}" fill="#ffffff" stroke="#000000" stroke-width="1.1" />`,
      `<text x="${lane.centerX}" y="${layout.padTop + layout.headerH / 2}" class="lane-title" dominant-baseline="central">${escXml(lane.title)}</text>`
    );
  }

  // Nodes
  for (const n of layout.nodes) {
    if (n.type === 'start') {
      parts.push(`<circle cx="${n.absX}" cy="${n.absY}" r="10" fill="#000000" />`);
    } else if (n.type === 'end') {
      parts.push(
        `<circle cx="${n.absX}" cy="${n.absY}" r="12" fill="#ffffff" stroke="#000000" stroke-width="1.2" />`,
        `<circle cx="${n.absX}" cy="${n.absY}" r="7" fill="#000000" />`
      );
    } else if (n.type === 'decision') {
      const pts = `${n.absX},${n.top} ${n.right},${n.absY} ${n.absX},${n.bottom} ${n.left},${n.absY}`;
      parts.push(`<polygon points="${pts}" fill="#ffffff" stroke="#000000" stroke-width="1.1" />`);
      parts.push(renderMultilineText(n.text, n.absX, n.absY, 'node-text', 13));
    } else {
      parts.push(`<rect x="${n.left}" y="${n.top}" width="${n.w}" height="${n.h}" fill="#ffffff" stroke="#000000" stroke-width="1.1" />`);
      parts.push(renderMultilineText(n.text, n.absX, n.absY, 'node-text', 14));
    }
  }

  // Edges & Labels
  for (const e of layout.edges) {
    const d = e.pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    parts.push(`<path d="${d}" fill="none" stroke="#000000" stroke-width="1.1" marker-end="url(#arrow)" />`);
    if (e.label) {
      const lx = e.labelPos ? e.labelPos[0] : (e.pts[0].x + e.pts[1].x) / 2;
      const ly = e.labelPos ? e.labelPos[1] : (e.pts[0].y + e.pts[1].y) / 2;
      parts.push(`<text x="${lx}" y="${ly}" class="edge-label" dominant-baseline="central">${escXml(e.label)}</text>`);
    }
  }

  // Caption
  parts.push(`<text x="${layout.totalWidth / 2}" y="${layout.totalHeight - 16}" class="caption">${escXml(spec.caption)}</text>`);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${layout.totalWidth} ${layout.totalHeight}" width="${layout.totalWidth}" height="${layout.totalHeight}">
  <style>
    .pool-title { font-family: Arial, sans-serif; font-size: 12px; font-weight: bold; text-anchor: middle; fill: #000000; }
    .lane-title { font-family: Arial, sans-serif; font-size: 11.5px; font-weight: bold; text-anchor: middle; fill: #000000; }
    .node-text { font-family: Arial, sans-serif; font-size: 11px; text-anchor: middle; fill: #000000; }
    .edge-label { font-family: Arial, sans-serif; font-size: 10.5px; text-anchor: middle; fill: #000000; paint-order: stroke; stroke: #ffffff; stroke-width: 4px; stroke-linejoin: round; }
    .caption { font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; text-anchor: middle; fill: #000000; }
  </style>
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto" markerUnits="userSpaceOnUse">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#000000" />
    </marker>
  </defs>
  <rect width="${layout.totalWidth}" height="${layout.totalHeight}" fill="#ffffff" />
  ${parts.join('\n  ')}
</svg>`;
}

function renderMultilineText(text, cx, cy, className, lineH) {
  const lines = String(text).split('\n');
  const startY = cy - ((lines.length - 1) * lineH) / 2;
  return lines
    .map((line, i) => `<text x="${cx}" y="${startY + i * lineH}" class="${className}" dominant-baseline="central">${escXml(line)}</text>`)
    .join('');
}

function renderDrawio(spec, layout) {
  const cells = [];

  // Pool container
  cells.push(
    `<mxCell id="pool" value="${escXml(spec.poolTitle || 'Self-Storage System')}" style="swimlane;childLayout=stackLayout;resizeParent=1;resizeParentMax=0;horizontal=0;startSize=${layout.poolBarW};horizontalStack=1;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;" vertex="1" parent="1">
      <mxGeometry x="${layout.padX}" y="${layout.padTop}" width="${layout.poolWidth}" height="${layout.poolHeight}" as="geometry" />
    </mxCell>`
  );

  // Lanes inside Pool
  for (const lane of layout.lanes) {
    cells.push(
      `<mxCell id="lane_${lane.id}" value="${escXml(lane.title)}" style="swimlane;startSize=${layout.headerH};fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.1;fontFamily=Arial;fontSize=11;fontStyle=1;" vertex="1" parent="pool">
        <mxGeometry x="${lane.relX}" y="0" width="${lane.width}" height="${layout.poolHeight}" as="geometry" />
      </mxCell>`
    );
  }

  // Nodes inside Lanes
  for (const n of layout.nodes) {
    const parentId = `lane_${n.lane}`;
    const labelVal = escXml(String(n.text || '').replace(/\n/g, '<br>'));
    if (n.type === 'start') {
      cells.push(
        `<mxCell id="${n.id}" value="" style="ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#000000;strokeColor=#000000;" vertex="1" parent="${parentId}">
          <mxGeometry x="${n.relToLaneX}" y="${n.relToLaneY}" width="${n.w}" height="${n.h}" as="geometry" />
        </mxCell>`
      );
    } else if (n.type === 'end') {
      cells.push(
        `<mxCell id="${n.id}" value="" style="ellipse;html=1;shape=endState;fillColor=#000000;strokeColor=#000000;strokeWidth=1.2;" vertex="1" parent="${parentId}">
          <mxGeometry x="${n.relToLaneX}" y="${n.relToLaneY}" width="${n.w}" height="${n.h}" as="geometry" />
        </mxCell>`
      );
    } else if (n.type === 'decision') {
      cells.push(
        `<mxCell id="${n.id}" value="${labelVal}" style="rhombus;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.1;fontFamily=Arial;fontSize=11;align=center;verticalAlign=middle;" vertex="1" parent="${parentId}">
          <mxGeometry x="${n.relToLaneX}" y="${n.relToLaneY}" width="${n.w}" height="${n.h}" as="geometry" />
        </mxCell>`
      );
    } else {
      cells.push(
        `<mxCell id="${n.id}" value="${labelVal}" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.1;fontFamily=Arial;fontSize=11;align=center;verticalAlign=middle;" vertex="1" parent="${parentId}">
          <mxGeometry x="${n.relToLaneX}" y="${n.relToLaneY}" width="${n.w}" height="${n.h}" as="geometry" />
        </mxCell>`
      );
    }
  }

  // Orthogonal Edges (parent="1" so waypoints use exact canvas coordinates)
  for (const e of layout.edges) {
    const waypointsXml = e.pts.length > 2
      ? `<Array as="points">${e.pts.slice(1, -1).map(p => `<mxPoint x="${p.x}" y="${p.y}" />`).join('')}</Array>`
      : '';
    const style = `edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;` +
      `exitX=${e.start.nx};exitY=${e.start.ny};exitDx=0;exitDy=0;` +
      `entryX=${e.end.nx};entryY=${e.end.ny};entryDx=0;entryDy=0;` +
      `strokeColor=#000000;strokeWidth=1.1;endArrow=classic;endFill=1;` +
      `fontFamily=Arial;fontSize=10;labelBackgroundColor=#ffffff;labelBorderColor=none;`;
    cells.push(
      `<mxCell id="${e.id}" value="${escXml(e.label || '')}" style="${style}" edge="1" parent="1" source="${e.from}" target="${e.to}">
        <mxGeometry relative="1" as="geometry">${waypointsXml}</mxGeometry>
      </mxCell>`
    );
  }

  return `<mxfile host="Electron" modified="2026-11-11T00:00:00.000Z" agent="draw.io" version="21.0.0" type="device">
  <diagram name="${escXml(spec.caption)}" id="${escXml(spec.svgBase)}">
    <mxGraphModel dx="${layout.totalWidth + 100}" dy="${layout.totalHeight + 100}" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${layout.totalWidth + 60}" pageHeight="${layout.totalHeight + 60}" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        ${cells.join('\n        ')}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
}

function generateSwimlane(spec) {
  const layout = validateAndCompute(spec);
  const svg = renderSvg(spec, layout);
  const drawio = renderDrawio(spec, layout);

  const svgDir = path.resolve('docs/diagrams/report/swimlane');
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

  console.log(`Generated ${spec.svgBase}: SVG + PNG (${(pngBuffer.length / 1024).toFixed(1)} KB) + Draw.io`);
}

module.exports = { generateSwimlane };

