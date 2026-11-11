const { generateErdDiagram } = require('./lib/nutribot_erd');
const { buildUnifiedErdSpec } = require('./erd/erd_unified');
const { buildConceptualSpec } = require('./erd/conceptual_model');

function main() {
  generateErdDiagram(buildUnifiedErdSpec());
  generateErdDiagram(buildConceptualSpec());
}

if (require.main === module) {
  main();
}

module.exports = { main };
