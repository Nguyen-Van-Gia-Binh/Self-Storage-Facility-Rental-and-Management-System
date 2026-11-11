/**
 * Generator script for industrial-grade Draw.io XML and Vector SVG diagrams
 * Matching FPT University Software Engineering (SWP391) standards
 * Black & White Monochrome, clean orthogonal connectors, strict UML shapes.
 */

const fs = require('fs');
const path = require('path');

// Ensure output directories exist
const swimlaneDir = path.resolve('docs/diagrams/report/swimlane');
const stateDir = path.resolve('docs/diagrams/report/state');
const dataDir = path.resolve('docs/diagrams/report/data');
const drawioDir = path.resolve('docs/diagrams/report/drawio');

[swimlaneDir, stateDir, dataDir, drawioDir].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

/**
 * Helper to build an SVG wrapper
 */
function buildSvg(width, height, content, caption) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <style>
    .lane-title { font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; text-anchor: middle; fill: #000000; }
    .box-title { font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; text-anchor: middle; fill: #000000; }
    .box-desc { font-family: Arial, sans-serif; font-size: 11px; text-anchor: middle; fill: #222222; }
    .edge-label { font-family: Arial, sans-serif; font-size: 11px; fill: #000000; }
    .caption { font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; text-anchor: middle; fill: #000000; }
  </style>
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto" markerUnits="userSpaceOnUse">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#000000" />
    </marker>
  </defs>
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="#ffffff" />
  ${content}
  <!-- Figure Caption -->
  <text x="${width / 2}" y="${height - 20}" class="caption">${caption}</text>
</svg>`;
}

/**
 * Helper to build Draw.io XML
 */
function buildDrawioXml(diagramName, cellsXml) {
  return `<mxfile host="Electron" modified="${new Date().toISOString()}" agent="draw.io-generator" version="21.0.0" type="device">
  <diagram name="${diagramName}" id="${Math.random().toString(36).substring(2, 12)}">
    <mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="850" pageHeight="1100" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        ${cellsXml}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
}

console.log('Diagram generator framework initialized.');

