const path = require('path');
const { parsePostgresMigrations, UNUSED_DB_ONLY_TABLES } = require('../lib/postgres_schema_parser');
const { generateErdDiagram } = require('../lib/nutribot_erd');

// 5 Enterprise Domain Clusters (Rule 1: Domain-Driven Grouping)
const CLUSTERS = [
  {
    id: 'cl_user_auth',
    title: '1. User, Auth & Staff Ops',
    x: 40, y: 40, w: 960, h: 990,
    fill: '#F8FAFC', stroke: '#64748B',
  },
  {
    id: 'cl_catalog_policy',
    title: '2. Facility Catalog, Pricing & Policy',
    x: 40, y: 1110, w: 960, h: 1260,
    fill: '#F8FAFC', stroke: '#64748B',
  },
  {
    id: 'cl_tx_contract',
    title: '3. Space Inventory, Booking & Contract Core',
    x: 1200, y: 40, w: 540, h: 2330,
    fill: '#FFFBEB', stroke: '#D97706',
  },
  {
    id: 'cl_support_log',
    title: '5. Support, Execution & Audit Logs',
    x: 1900, y: 40, w: 1120, h: 1190,
    fill: '#F8FAFC', stroke: '#64748B',
  },
  {
    id: 'cl_payment_finance',
    title: '4. Payment, Renewal & Pricing Rules',
    x: 1900, y: 1330, w: 1120, h: 1040,
    fill: '#F8FAFC', stroke: '#64748B',
  },
];

// Coordinates inside the 5 domain clusters (>= 100px card corridors)
const TABLE_COORDS = {
  // Cluster 1: User, Auth & Staff Ops
  registration_otp:                 { cx: 230, cy: 145 },
  password_reset_otp:               { cx: 230, cy: 365 },
  login_history:                    { cx: 230, cy: 605 },
  attachment:                       { cx: 230, cy: 870 },
  staff_daily_assignment:           { cx: 790, cy: 175 },
  user_facility_assignment:         { cx: 790, cy: 425 },
  app_user:                         { cx: 790, cy: 735 },

  // Cluster 2: Facility Catalog, Pricing & Policy
  facility_unit_type_price_version: { cx: 230, cy: 1255 },
  facility_unit_type_price:         { cx: 230, cy: 1530 },
  extra_fee_version:                { cx: 230, cy: 1825 },
  extra_fee_type:                   { cx: 230, cy: 2165 },
  facility:                         { cx: 790, cy: 1260 },
  unit_type:                        { cx: 790, cy: 1595 },
  policy_version:                   { cx: 790, cy: 2070 },

  // Cluster 3: Space Inventory, Booking & Contract Core
  waitlist:                         { cx: 1470, cy: 265 },
  storage_unit:                     { cx: 1470, cy: 730 },
  reservation:                      { cx: 1470, cy: 1265 },
  rental_contract:                  { cx: 1470, cy: 2005 },

  // Cluster 5: Support, Execution & Audit Logs
  audit_log:                        { cx: 2130, cy: 185 },
  support_request:                  { cx: 2130, cy: 555 },
  handover_record:                  { cx: 2130, cy: 965 },
  access_log:                       { cx: 2760, cy: 330 },
  return_request:                   { cx: 2760, cy: 830 },

  // Cluster 4: Payment, Renewal & Pricing Rules
  discount_program:                 { cx: 2130, cy: 1510 },
  contract_renewal:                 { cx: 2130, cy: 1875 },
  contract_extra_charge:            { cx: 2130, cy: 2195 },
  payment_transaction:              { cx: 2760, cy: 1680 },
};

/**
 * Curated high-signal Crow's Foot relationships (Rule 2 & 4: eliminate hub-and-spoke
 * audit spaghetti into app_user and transitive shortcuts; keep 100% FK columns in boxes).
 */
const RELATIONS = [
  // Cluster 1: Auth, Staff & User
  { col: 'login_history.user_id', verb: 'logs sign-in' },
  { col: 'user_facility_assignment.user_id', verb: 'assigned to' },
  { col: 'user_facility_assignment.facility_id', verb: 'covers branch' },
  { col: 'staff_daily_assignment.staff_id', verb: 'assigned / dispatches' },
  { col: 'staff_daily_assignment.facility_id', verb: 'works at' },

  // Cluster 2: Facility Catalog & Policy
  { col: 'facility_unit_type_price.facility_id', verb: 'prices at' },
  { col: 'facility_unit_type_price.unit_type_id', verb: 'prices type' },
  { col: 'facility_unit_type_price_version.facility_id', verb: 'versions at' },
  { col: 'facility_unit_type_price_version.unit_type_id', verb: 'versions type' },
  { col: 'extra_fee_type.facility_id', verb: 'applies to' },
  { col: 'extra_fee_version.extra_fee_type_id', verb: 'versions' },
  { col: 'policy_version.published_by', verb: 'publishes' },

  // Cluster 3: Booking, Storage & Contract Core
  { col: 'storage_unit.facility_id', verb: 'contains' },
  { col: 'storage_unit.unit_type_id', verb: 'classifies' },
  { col: 'waitlist.customer_id', verb: 'joins / contacts' },
  { col: 'waitlist.facility_id', verb: 'waits at' },
  { col: 'waitlist.unit_type_id', verb: 'requests type' },
  { col: 'waitlist.converted_reservation_id', verb: 'converts to' },
  { col: 'reservation.customer_id', verb: 'places' },
  { col: 'reservation.unit_type_id', verb: 'reserves type' },
  { col: 'reservation.storage_unit_id', verb: 'holds unit' },
  { col: 'reservation.policy_version_id', verb: 'governs' },
  { col: 'reservation.discount_program_id', verb: 'applies promo' },
  { col: 'rental_contract.reservation_id', verb: 'converts to' },
  { col: 'rental_contract.customer_id', verb: 'signs' },
  { col: 'rental_contract.storage_unit_id', verb: 'occupies' },
  { col: 'rental_contract.policy_version_id', verb: 'governs' },

  // Cluster 4: Payment, Renewal & Extra Charges
  { col: 'discount_program.facility_id', verb: 'targets branch' },
  { col: 'discount_program.unit_type_id', verb: 'targets type' },
  { col: 'payment_transaction.reservation_id', verb: 'pays deposit' },
  { col: 'payment_transaction.contract_id', verb: 'settles' },
  { col: 'contract_renewal.contract_id', verb: 'extends' },
  { col: 'contract_renewal.payment_transaction_id', verb: 'paid via' },
  { col: 'contract_renewal.policy_version_id', verb: 'applies' },
  { col: 'contract_extra_charge.contract_id', verb: 'incurs' },
  { col: 'contract_extra_charge.extra_fee_type_id', verb: 'categorizes' },

  // Cluster 5: Execution, Access, Support & Logs
  { col: 'audit_log.user_id', verb: 'performs' },
  { col: 'audit_log.facility_id', verb: 'scopes' },
  { col: 'attachment.uploaded_by', verb: 'uploads' },
  { col: 'support_request.customer_id', verb: 'submits / handles' },
  { col: 'support_request.contract_id', verb: 'relates to' },
  { col: 'support_request.storage_unit_id', verb: 'reports unit' },
  { col: 'handover_record.contract_id', verb: 'hands over' },
  { col: 'return_request.contract_id', verb: 'initiates exit' },
  { col: 'access_log.contract_id', verb: 'authorizes' },
];

function pickSides(fromPos, toPos) {
  const dx = toPos.cx - fromPos.cx;
  const dy = toPos.cy - fromPos.cy;
  if (Math.abs(dx) < 80 && Math.abs(dy) > 480) {
    const side = fromPos.cx <= 900 ? 'left' : 'right';
    return { fromSide: side, toSide: side };
  }
  if (Math.abs(dx) >= Math.abs(dy) * 0.75) {
    return {
      fromSide: dx >= 0 ? 'right' : 'left',
      toSide: dx >= 0 ? 'left' : 'right',
    };
  }
  return {
    fromSide: dy >= 0 ? 'bottom' : 'top',
    toSide: dy >= 0 ? 'top' : 'bottom',
  };
}

function buildUnifiedErdSpec() {
  const migDir = path.resolve('backend/src/main/resources/db/migration');
  const tables = parsePostgresMigrations(migDir);
  const nodes = [];
  const edges = [];

  for (const [name, coord] of Object.entries(TABLE_COORDS)) {
    const t = tables.get(name);
    if (!t || UNUSED_DB_ONLY_TABLES.has(name)) {
      throw new Error(`Missing active Flyway table: ${name}`);
    }
    nodes.push({
      id: name,
      title: name,
      cx: coord.cx,
      cy: coord.cy,
      rows: t.columns,
    });
  }

  for (const rel of RELATIONS) {
    const [childName, colName] = rel.col.split('.');
    const t = tables.get(childName);
    const col = t && t.columns.find(c => c.name === colName);
    if (!col || !col.fk) {
      throw new Error(`Invalid relation key in RELATIONS: ${rel.col}`);
    }
    const parentName = col.fk.table;
    const { fromSide, toSide } = pickSides(TABLE_COORDS[childName], TABLE_COORDS[parentName]);
    edges.push({
      id: `fk_${childName}_${colName}`,
      from: childName,
      fromSide,
      fromMarker: col.unique ? 'optOne' : 'zeroToMany',
      to: parentName,
      toSide,
      toMarker: col.nullable ? 'optOne' : 'mandOne',
      label: rel.verb,
    });
  }

  return {
    svgBase: 'erd-unified',
    drawioBase: 'erd-unified',
    diagramName: 'Physical ERD - Self-Storage System (27 Tables, 5 Clusters)',
    caption: 'Physical Entity-Relationship Diagram (PostgreSQL 16 — 27 Active Tables in 5 Domain Clusters)',
    mode: 'physical',
    width: 3080,
    height: 2480,
    pngWidth: 4000,
    clusters: CLUSTERS,
    nodes,
    edges,
  };
}

if (require.main === module) {
  const spec = buildUnifiedErdSpec();
  generateErdDiagram(spec);
}

module.exports = { buildUnifiedErdSpec };
