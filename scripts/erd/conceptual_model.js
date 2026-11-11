const { generateErdDiagram } = require('../lib/nutribot_erd');

const CLUSTERS = [
  {
    id: 'cdm_identity',
    title: '1. Identity & Facility Domain',
    x: 50, y: 50, w: 940, h: 690,
    fill: '#F8FAFC', stroke: '#475569',
  },
  {
    id: 'cdm_booking',
    title: '2. Booking & Contract Domain',
    x: 1170, y: 50, w: 1100, h: 690,
    fill: '#FFFBEB', stroke: '#D97706',
  },
  {
    id: 'cdm_ops',
    title: '4. Operations & Support Domain',
    x: 50, y: 870, w: 940, h: 640,
    fill: '#F8FAFC', stroke: '#475569',
  },
  {
    id: 'cdm_finance',
    title: '3. Finance & Policy Domain',
    x: 1170, y: 870, w: 1100, h: 640,
    fill: '#F8FAFC', stroke: '#475569',
  },
];

const NODES = [
  // 1. Identity & Facility
  {
    id: 'UnitType', title: 'UnitType', cx: 260, cy: 175,
    rows: [
      { name: 'code', pk: true },
      { name: 'name' },
      { name: 'dimensions (W x L x H)' },
      { name: 'environment' },
      { name: 'isActive' },
    ],
  },
  {
    id: 'FacilityUnitTypePrice', title: 'FacilityUnitTypePrice', cx: 260, cy: 395,
    rows: [
      { name: 'monthlyPrice' },
      { name: 'pricePerM2' },
    ],
  },
  {
    id: 'Facility', title: 'Facility', cx: 260, cy: 615,
    rows: [
      { name: 'code', pk: true },
      { name: 'name' },
      { name: 'address' },
      { name: 'openingHours' },
      { name: 'status' },
    ],
  },
  {
    id: 'StorageUnit', title: 'StorageUnit', cx: 740, cy: 205,
    rows: [
      { name: 'code', pk: true },
      { name: 'floor' },
      { name: 'position' },
      { name: 'status' },
    ],
  },
  {
    id: 'AppUser', title: 'AppUser', cx: 740, cy: 590,
    rows: [
      { name: 'email', pk: true },
      { name: 'fullName' },
      { name: 'phone' },
      { name: 'role' },
      { name: 'status' },
    ],
  },

  // 2. Booking & Contract
  {
    id: 'Waitlist', title: 'Waitlist', cx: 1410, cy: 175,
    rows: [
      { name: 'targetStartDate' },
      { name: 'rentalMonths' },
      { name: 'contactPhone' },
      { name: 'status' },
    ],
  },
  {
    id: 'Reservation', title: 'Reservation', cx: 1410, cy: 395,
    rows: [
      { name: 'code', pk: true },
      { name: 'startDate' },
      { name: 'rentalMonths' },
      { name: 'totalPayable' },
      { name: 'status' },
    ],
  },
  {
    id: 'RentalContract', title: 'RentalContract', cx: 1410, cy: 625,
    rows: [
      { name: 'code', pk: true },
      { name: 'startDate' },
      { name: 'endDate' },
      { name: 'depositBalance' },
      { name: 'status' },
    ],
  },
  {
    id: 'HandoverRecord', title: 'HandoverRecord', cx: 2010, cy: 195,
    rows: [
      { name: 'handoverAt' },
      { name: 'conditionNote' },
      { name: 'customerConfirmed' },
      { name: 'status' },
    ],
  },
  {
    id: 'ContractRenewal', title: 'ContractRenewal', cx: 2010, cy: 410,
    rows: [
      { name: 'previousEndDate' },
      { name: 'newEndDate' },
      { name: 'rentalMonths' },
      { name: 'totalPaid' },
    ],
  },
  {
    id: 'ReturnRequest', title: 'ReturnRequest', cx: 2010, cy: 620,
    rows: [
      { name: 'requestedReturnDate' },
      { name: 'isIntact' },
      { name: 'damageCost' },
      { name: 'depositRefundAmount' },
      { name: 'status' },
    ],
  },

  // 4. Operations & Support
  {
    id: 'StaffDailyAssignment', title: 'StaffDailyAssignment', cx: 260, cy: 1025,
    rows: [
      { name: 'workDate' },
      { name: 'taskType' },
      { name: 'referenceType' },
    ],
  },
  {
    id: 'SupportRequest', title: 'SupportRequest', cx: 740, cy: 1030,
    rows: [
      { name: 'code', pk: true },
      { name: 'category' },
      { name: 'description' },
      { name: 'relocationRequired' },
      { name: 'status' },
    ],
  },
  {
    id: 'AccessLog', title: 'AccessLog', cx: 740, cy: 1360,
    rows: [
      { name: 'accessedAt' },
      { name: 'method' },
      { name: 'accessorName' },
      { name: 'status' },
    ],
  },

  // 3. Finance & Policy
  {
    id: 'PolicyVersion', title: 'PolicyVersion', cx: 1410, cy: 1000,
    rows: [
      { name: 'versionNo', pk: true },
      { name: 'depositMultiplier' },
      { name: 'rentalBufferDays' },
      { name: 'overdueCapRate' },
      { name: 'effectiveFrom' },
    ],
  },
  {
    id: 'DiscountProgram', title: 'DiscountProgram', cx: 1410, cy: 1230,
    rows: [
      { name: 'name', pk: true },
      { name: 'discountType' },
      { name: 'discountValue' },
      { name: 'scopeType' },
      { name: 'isActive' },
    ],
  },
  {
    id: 'ExtraFeeType', title: 'ExtraFeeType', cx: 1410, cy: 1430,
    rows: [
      { name: 'code', pk: true },
      { name: 'name' },
      { name: 'amount' },
      { name: 'category' },
    ],
  },
  {
    id: 'ContractExtraCharge', title: 'ContractExtraCharge', cx: 2010, cy: 1020,
    rows: [
      { name: 'amount' },
      { name: 'reason' },
      { name: 'status' },
    ],
  },
  {
    id: 'PaymentTransaction', title: 'PaymentTransaction', cx: 2010, cy: 1330,
    rows: [
      { name: 'orderCode', pk: true },
      { name: 'transactionType' },
      { name: 'amount' },
      { name: 'paymentMethod' },
      { name: 'status' },
    ],
  },
];

// (from=child side, to=parent side) for Crow's Foot consistency
const RAW_RELATIONS = [
  ['FacilityUnitTypePrice', 'Facility', 'sets rate', 'zeroToMany', 'mandOne'],
  ['FacilityUnitTypePrice', 'UnitType', 'priced by', 'zeroToMany', 'mandOne'],
  ['StorageUnit', 'Facility', 'houses', 'zeroToMany', 'mandOne'],
  ['StorageUnit', 'UnitType', 'classifies', 'zeroToMany', 'mandOne'],
  ['Facility', 'AppUser', 'assigned staff', 'zeroToMany', 'zeroToMany'],

  ['Waitlist', 'AppUser', 'joins', 'zeroToMany', 'mandOne'],
  ['Waitlist', 'Facility', 'waits at', 'zeroToMany', 'mandOne'],
  ['Waitlist', 'UnitType', 'requests', 'zeroToMany', 'mandOne'],
  ['Waitlist', 'Reservation', 'converts to', 'optOne', 'optOne'],

  ['Reservation', 'AppUser', 'places', 'zeroToMany', 'mandOne'],
  ['Reservation', 'UnitType', 'reserves type', 'zeroToMany', 'mandOne'],
  ['Reservation', 'StorageUnit', 'holds unit', 'zeroToMany', 'optOne'],
  ['Reservation', 'PolicyVersion', 'governed by', 'zeroToMany', 'mandOne'],
  ['Reservation', 'DiscountProgram', 'applies promo', 'zeroToMany', 'optOne'],

  ['RentalContract', 'Reservation', 'converts to', 'optOne', 'mandOne'],
  ['RentalContract', 'AppUser', 'signs', 'zeroToMany', 'mandOne'],
  ['RentalContract', 'StorageUnit', 'occupies', 'zeroToMany', 'optOne'],
  ['RentalContract', 'PolicyVersion', 'governed by', 'zeroToMany', 'mandOne'],

  ['HandoverRecord', 'RentalContract', 'handed over', 'optOne', 'mandOne'],
  ['ContractRenewal', 'RentalContract', 'extends', 'zeroToMany', 'mandOne'],
  ['ReturnRequest', 'RentalContract', 'exits via', 'zeroToMany', 'mandOne'],

  ['PaymentTransaction', 'Reservation', 'pays deposit', 'zeroToMany', 'optOne'],
  ['PaymentTransaction', 'RentalContract', 'settles', 'zeroToMany', 'optOne'],
  ['ContractRenewal', 'PaymentTransaction', 'paid via', 'optOne', 'optOne'],
  ['ContractExtraCharge', 'RentalContract', 'incurs', 'zeroToMany', 'mandOne'],
  ['ContractExtraCharge', 'ExtraFeeType', 'categorized by', 'zeroToMany', 'optOne'],

  ['SupportRequest', 'AppUser', 'submits', 'zeroToMany', 'mandOne'],
  ['SupportRequest', 'RentalContract', 'relates to', 'zeroToMany', 'optOne'],
  ['SupportRequest', 'StorageUnit', 'reports issue', 'zeroToMany', 'optOne'],
  ['AccessLog', 'RentalContract', 'logs entry', 'zeroToMany', 'mandOne'],
  ['StaffDailyAssignment', 'AppUser', 'assigned to', 'zeroToMany', 'mandOne'],
  ['StaffDailyAssignment', 'Facility', 'works at', 'zeroToMany', 'mandOne'],
];

const nodeById = Object.fromEntries(NODES.map(n => [n.id, n]));

function pickSides(fromPos, toPos) {
  const dx = toPos.cx - fromPos.cx;
  const dy = toPos.cy - fromPos.cy;
  if (Math.abs(dx) < 80 && Math.abs(dy) > 520) {
    const side = fromPos.cx <= 900 ? 'left' : 'right';
    return { fromSide: side, toSide: side };
  }
  if (Math.abs(dx) >= Math.abs(dy) * 0.8) {
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

function buildConceptualSpec() {
  const edges = RAW_RELATIONS.map(([from, to, label, fromMarker, toMarker], idx) => {
    const { fromSide, toSide } = pickSides(nodeById[from], nodeById[to]);
    return {
      id: `cdm_e${idx + 1}`,
      from,
      fromSide,
      fromMarker,
      to,
      toSide,
      toMarker,
      label,
    };
  });

  return {
    svgBase: 'conceptual-model',
    drawioBase: 'conceptual-model',
    diagramName: 'Conceptual Data Model - Core Business Entities',
    caption: 'Conceptual Data Model (19 Core Domain Entities across 4 Functional Domains)',
    mode: 'conceptual',
    width: 2340,
    height: 1600,
    pngWidth: 3200,
    clusters: CLUSTERS,
    nodes: NODES,
    edges,
  };
}

if (require.main === module) {
  generateErdDiagram(buildConceptualSpec());
}

module.exports = { buildConceptualSpec };
