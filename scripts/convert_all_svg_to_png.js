/**
 * Batch SVG-to-PNG renderer using Rust-backed Resvg engine
 * Generates crisp 2x retina PNGs from clean Vector SVGs
 * Ensures 100% instant display in VS Code Markdown Preview, GitHub, and PDF exports.
 */

const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const directories = [
  path.resolve('docs/diagrams/report/swimlane'),
  path.resolve('docs/diagrams/report/state'),
  path.resolve('docs/diagrams/report/data')
];

let totalConverted = 0;

directories.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.svg'));
  files.forEach(file => {
    const svgPath = path.join(dir, file);
    const pngPath = path.join(dir, file.replace(/\.svg$/, '.png'));
    const svgBuffer = fs.readFileSync(svgPath);

    const resvg = new Resvg(svgBuffer, {
      fitTo: { mode: 'zoom', value: 2 }, // 2x high-resolution retina rendering
      font: {
        loadSystemFonts: true,
        defaultFontFamily: 'Arial'
      }
    });

    const pngData = resvg.render().asPng();
    fs.writeFileSync(pngPath, pngData);
    console.log(`Converted: ${file} -> ${path.basename(pngPath)} (${(pngData.length / 1024).toFixed(1)} KB)`);
    totalConverted++;
  });
});

console.log(`\nSuccessfully converted ${totalConverted} diagrams to crisp 2x Retina PNGs.`);

