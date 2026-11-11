/**
 * Generator for all 9 Activity Swimlane Diagrams
 * Format: Draw.io Monochrome UML Activity Swimlanes (Black & White, clean orthogonal connectors)
 */

const fs = require('fs');
const path = require('path');

const swimlaneDir = path.resolve('docs/diagrams/report/swimlane');

function buildSwimlaneSvg(width, height, lanes, elements, caption) {
  const laneWidth = width / lanes.length;
  let laneHeaders = '';
  let laneDividers = '';

  lanes.forEach((lane, i) => {
    const x = i * laneWidth;
    // Header box
    laneHeaders += `
      <rect x="${x}" y="30" width="${laneWidth}" height="35" stroke="#000000" stroke-width="1.5" fill="#f8f9fa" />
      <text x="${x + laneWidth / 2}" y="52" class="lane-title">${lane}</text>
    `;
    // Outer boundary & vertical dividers
    laneDividers += `
      <line x1="${x}" y1="30" x2="${x}" y2="${height - 45}" stroke="#000000" stroke-width="1.2" />
    `;
  });
  // Last border
  laneDividers += `
    <line x1="${width}" y1="30" x2="${width}" y2="${height - 45}" stroke="#000000" stroke-width="1.2" />
    <line x1="0" y1="${height - 45}" x2="${width}" y2="${height - 45}" stroke="#000000" stroke-width="1.2" />
  `;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <style>
    .lane-title { font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; text-anchor: middle; fill: #000000; }
    .act-text { font-family: Arial, sans-serif; font-size: 11px; text-anchor: middle; fill: #000000; }
    .act-desc { font-family: Arial, sans-serif; font-size: 10px; text-anchor: middle; fill: #444444; }
    .edge-label { font-family: Arial, sans-serif; font-size: 10px; fill: #000000; text-anchor: middle; }
    .edge-label-start { font-family: Arial, sans-serif; font-size: 10px; fill: #000000; text-anchor: start; }
    .caption { font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; text-anchor: middle; fill: #000000; }
  </style>
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#000000" />
    </marker>
  </defs>
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="#ffffff" />
  <!-- Lanes -->
  ${laneHeaders}
  ${laneDividers}
  <!-- Diagram Elements -->
  ${elements}
  <!-- Figure Caption -->
  <text x="${width / 2}" y="${height - 15}" class="caption">${caption}</text>
</svg>`;
}

// 0. End-to-End Operational Lifecycle Overview
function generateEndToEndSwimlane() {
  const lanes = ['Storage Customer', 'Facility Staff', 'Facility Manager', 'System Schedulers'];
  const width = 900;
  const height = 750;
  const elements = `
    <!-- Start -->
    <circle cx="112" cy="85" r="10" fill="#000000" />
    <path d="M 112 95 L 112 120" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />

    <rect x="25" y="120" width="175" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="112" y="145" class="act-text">1. Reserve Unit &amp; Pay Deposit</text>

    <!-- Transition to FM -->
    <path d="M 200 142 L 562 142 L 562 170" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="350" y="135" class="edge-label">Deposit Confirmed</text>

    <rect x="475" y="170" width="175" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="562" y="195" class="act-text">2. Allocate Storage Unit</text>

    <!-- Transition to Staff -->
    <path d="M 562 215 L 562 250 L 337 250" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="450" y="245" class="edge-label">Move-in Pass Issued</text>

    <rect x="250" y="235" width="175" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="337" y="260" class="act-text">3. 4-Point Handover &amp; PIN</text>

    <!-- Transition to Customer Active -->
    <path d="M 250 257 L 112 257 L 112 320" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="160" y="250" class="edge-label">PIN Issued</text>

    <rect x="25" y="320" width="175" height="50" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="112" y="342" class="act-text">4. Occupy &amp; Store Goods</text>
    <text x="112" y="358" class="act-desc">(Customer Self-Service)</text>

    <!-- Path to System Overdue Cron -->
    <path d="M 200 345 L 787 345 L 787 400" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="490" y="338" class="edge-label">Lease Expiry without Renewal</text>

    <rect x="700" y="400" width="175" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="787" y="425" class="act-text">5. Daily Midnight Overdue Scan</text>

    <!-- Lock PIN -->
    <path d="M 700 422 L 337 422 L 337 460" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="500" y="415" class="edge-label">Lock PIN Day D+1 (BR-OVD-01)</text>

    <rect x="250" y="460" width="175" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="337" y="485" class="act-text">6. Overdue Handling / Return</text>

    <!-- Exit Settlement -->
    <path d="M 337 505 L 337 540 L 562 540" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="420" y="533" class="edge-label">Checkout Complete</text>

    <rect x="475" y="520" width="175" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="562" y="545" class="act-text">7. Approve Final Settlement</text>

    <!-- Complete End -->
    <circle cx="562" cy="620" r="13" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <circle cx="562" cy="620" r="7" fill="#000000" />
    <path d="M 562 565 L 562 607" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="575" y="590" class="edge-label-start">Contract Completed</text>
  `;
  return buildSwimlaneSvg(width, height, lanes, elements, 'Swimlane 0: End_To_End_Operational_Lifecycle');
}

// 1. Flow 1: Storage Unit Reservation & Payment
function generateFlow1Reservation() {
  const lanes = ['Storage Customer', 'System (Portal & VNPay)', 'Facility Manager'];
  const width = 850;
  const height = 750;
  const laneW = width / 3;
  const elements = `
    <circle cx="${laneW / 2}" cy="80" r="10" fill="#000000" />
    <path d="M ${laneW / 2} 90 L ${laneW / 2} 115" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />

    <rect x="40" y="115" width="200" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="140" y="135" class="act-text">Select Facility &amp; Unit Type</text>
    <text x="140" y="150" class="act-desc">(BR-PRI-01, BR-GEN-03)</text>

    <!-- To System -->
    <path d="M 240 137 L ${laneW + 40} 137" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="280" y="130" class="edge-label">Check Slot</text>

    <!-- Decision: Available? -->
    <polygon points="${laneW + 140},180 ${laneW + 210},215 ${laneW + 140},250 ${laneW + 70},215" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${laneW + 140}" y="218" class="edge-label">Capacity &gt; 0?</text>

    <path d="M ${laneW + 140} 160 L ${laneW + 140} 180" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />

    <!-- Branch: Yes -->
    <path d="M ${laneW + 140} 250 L ${laneW + 140} 280" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="${laneW + 155}" y="268" class="edge-label-start">Yes (Available)</text>

    <rect x="${laneW + 40}" y="280" width="200" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${laneW + 140}" y="300" class="act-text">Generate Invoice &amp; Hold 48h</text>
    <text x="${laneW + 140}" y="315" class="act-desc">(Deposit + Rent, BR-DEP-01)</text>

    <!-- To Customer Pay -->
    <path d="M ${laneW + 40} 302 L 240 302" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="280" y="295" class="edge-label">VNPay URL</text>

    <rect x="40" y="280" width="200" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="140" y="300" class="act-text">Complete VNPay Payment</text>
    <text x="140" y="315" class="act-desc">(Sandbox Callback)</text>

    <!-- Back to System IPN -->
    <path d="M 140 325 L 140 370 L ${laneW + 40} 370" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="220" y="365" class="edge-label">Payment Success</text>

    <rect x="${laneW + 40}" y="350" width="200" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${laneW + 140}" y="370" class="act-text">Confirm Reservation</text>
    <text x="${laneW + 140}" y="385" class="act-desc">(Status: CONFIRMED)</text>

    <!-- To FM Allocate -->
    <path d="M ${laneW + 240} 372 L ${2 * laneW + 40} 372" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="${laneW + 260}" y="365" class="edge-label">Dispatch</text>

    <rect x="${2 * laneW + 40}" y="350" width="200" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${2 * laneW + 140}" y="370" class="act-text">Allocate Physical Unit</text>
    <text x="${2 * laneW + 140}" y="385" class="act-desc">(Late Binding, BR-AVL-04)</text>

    <!-- Back to System Create Contract -->
    <path d="M ${2 * laneW + 140} 395 L ${2 * laneW + 140} 440 L ${laneW + 240} 440" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="${2 * laneW}" y="430" class="edge-label">Unit Assigned</text>

    <rect x="${laneW + 40}" y="420" width="200" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${laneW + 140}" y="440" class="act-text">Issue Move-in Pass &amp; QR</text>
    <text x="${laneW + 140}" y="455" class="act-desc">(PENDING_CHECK_IN)</text>

    <!-- To Customer Pass -->
    <path d="M ${laneW + 40} 442 L 240 442" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="280" y="435" class="edge-label">Notify App</text>

    <rect x="40" y="420" width="200" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="140" y="440" class="act-text">Receive Move-in Pass</text>
    <text x="140" y="455" class="act-desc">(Ready for Handover)</text>

    <circle cx="140" cy="510" r="13" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <circle cx="140" cy="510" r="7" fill="#000000" />
    <path d="M 140 465 L 140 497" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />

    <!-- Branch: No -> Waitlist -->
    <path d="M ${laneW + 70} 215 L 140 215 L 140 230" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="190" y="208" class="edge-label">No (Full)</text>

    <rect x="40" y="230" width="200" height="35" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="140" y="252" class="act-text">Opt-in FIFO Waitlist (BR-WAT-01)</text>
  `;
  return buildSwimlaneSvg(width, height, lanes, elements, 'Swimlane 1: Flow_1_Storage_Unit_Reservation_And_Payment');
}

// 2. Flow 2: Check-in, Physical Handover & PIN Activation
function generateFlow2Checkin() {
  const lanes = ['Storage Customer', 'Facility Staff', 'Smart Lock & System'];
  const width = 850;
  const height = 650;
  const laneW = width / 3;
  const elements = `
    <circle cx="140" cy="80" r="10" fill="#000000" />
    <path d="M 140 90 L 140 115" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />

    <rect x="40" y="115" width="200" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="140" y="135" class="act-text">Present Move-in Pass QR</text>
    <text x="140" y="150" class="act-desc">(Arrive at Facility)</text>

    <!-- To Staff -->
    <path d="M 240 137 L ${laneW + 40} 137" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="280" y="130" class="edge-label">Scan Pass</text>

    <rect x="${laneW + 40}" y="115" width="200" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${laneW + 140}" y="135" class="act-text">Verify Citizen ID &amp; Booking</text>
    <text x="${laneW + 140}" y="150" class="act-desc">(Staff Desk Terminal)</text>

    <!-- Inspection -->
    <path d="M ${laneW + 140} 160 L ${laneW + 140} 200" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />

    <rect x="${laneW + 40}" y="200" width="200" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${laneW + 140}" y="220" class="act-text">Execute 4-Point Inspection</text>
    <text x="${laneW + 140}" y="235" class="act-desc">(Lock, Clean, Light, Climate)</text>

    <!-- Customer Co-Sign -->
    <path d="M ${laneW + 40} 222 L 240 222" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="280" y="215" class="edge-label">Digital Sign</text>

    <rect x="40" y="200" width="200" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="140" y="220" class="act-text">Sign Handover Protocol</text>
    <text x="140" y="235" class="act-desc">(Accept Compartment)</text>

    <!-- To Smart Lock System -->
    <path d="M 240 245 L ${2 * laneW + 40} 245" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="${laneW + 140}" y="260" class="edge-label">Protocol Submitted</text>

    <rect x="${2 * laneW + 40}" y="225" width="200" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${2 * laneW + 140}" y="245" class="act-text">Generate 6-Digit PIN</text>
    <text x="${2 * laneW + 140}" y="260" class="act-desc">(Activate on Keypad)</text>

    <!-- Update Contract ACTIVE -->
    <path d="M ${2 * laneW + 140} 270 L ${2 * laneW + 140} 320" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />

    <rect x="${2 * laneW + 40}" y="320" width="200" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${2 * laneW + 140}" y="340" class="act-text">Transition Contract ACTIVE</text>
    <text x="${2 * laneW + 140}" y="355" class="act-desc">(Unit: OCCUPIED)</text>

    <!-- Send PIN to Customer -->
    <path d="M ${2 * laneW + 40} 342 L 140 342 L 140 380" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="${laneW}" y="335" class="edge-label">Deliver Secure PIN</text>

    <rect x="40" y="380" width="200" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="140" y="400" class="act-text">Store PIN in Portal &amp; Move-in</text>
    <text x="140" y="415" class="act-desc">(Access Authorized)</text>

    <circle cx="140" cy="470" r="13" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <circle cx="140" cy="470" r="7" fill="#000000" />
    <path d="M 140 425 L 140 457" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
  `;
  return buildSwimlaneSvg(width, height, lanes, elements, 'Swimlane 2: Flow_2_Checkin_Physical_Handover_And_PIN_Activation');
}

// 3. Flow 3: Checkout Return & Final Settlement
function generateFlow3Return() {
  const lanes = ['Storage Customer', 'Facility Staff', 'Facility Manager', 'Finance Ledger System'];
  const width = 900;
  const height = 650;
  const laneW = width / 4;
  const elements = `
    <circle cx="${laneW / 2}" cy="80" r="10" fill="#000000" />
    <path d="M ${laneW / 2} 90 L ${laneW / 2} 115" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />

    <rect x="20" y="115" width="180" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="110" y="135" class="act-text">Schedule Return Date</text>
    <text x="110" y="150" class="act-desc">(Normal / Early Return)</text>

    <!-- To Staff Inspection -->
    <path d="M 200 137 L ${laneW + 20} 137" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="210" y="130" class="edge-label">Check-out Day</text>

    <rect x="${laneW + 20}" y="115" width="180" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${laneW + 110}" y="135" class="act-text">Exit Inspection &amp; Photos</text>
    <text x="${laneW + 110}" y="150" class="act-desc">(Assess Damage &amp; Trash)</text>

    <!-- To Unit CLEANING -->
    <path d="M ${laneW + 110} 160 L ${laneW + 110} 200" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />

    <rect x="${laneW + 20}" y="200" width="180" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${laneW + 110}" y="220" class="act-text">Set Unit: CLEANING</text>
    <text x="${laneW + 110}" y="235" class="act-desc">(BR-RET-09 Sanitization)</text>

    <!-- To FM Approval -->
    <path d="M ${laneW + 200} 137 L ${2 * laneW + 20} 137" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="${2 * laneW - 20}" y="130" class="edge-label">Damage Protocol</text>

    <rect x="${2 * laneW + 20}" y="115" width="180" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${2 * laneW + 110}" y="135" class="act-text">Review &amp; Approve Voucher</text>
    <text x="${2 * laneW + 110}" y="150" class="act-desc">(Net Balance Formula)</text>

    <!-- To Ledger System -->
    <path d="M ${2 * laneW + 200} 137 L ${3 * laneW + 20} 137" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="${3 * laneW - 20}" y="130" class="edge-label">Authorize</text>

    <rect x="${3 * laneW + 20}" y="115" width="180" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${3 * laneW + 110}" y="135" class="act-text">Record Double-Entry Ledger</text>
    <text x="${3 * laneW + 110}" y="150" class="act-desc">(LedgerEntry Immutable)</text>

    <!-- Refund Disbursed to Customer -->
    <path d="M ${3 * laneW + 110} 160 L ${3 * laneW + 110} 290 L 110 290 L 110 320" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="${2 * laneW}" y="280" class="edge-label">Disburse Net Refund (3-5 days)</text>

    <rect x="20" y="320" width="180" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="110" y="340" class="act-text">Receive Deposit Refund</text>
    <text x="110" y="355" class="act-desc">(Contract CLOSED)</text>

    <circle cx="110" cy="410" r="13" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <circle cx="110" cy="410" r="7" fill="#000000" />
    <path d="M 110 365 L 110 397" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
  `;
  return buildSwimlaneSvg(width, height, lanes, elements, 'Swimlane 3: Flow_3_Checkout_Return_And_Final_Settlement');
}

// 4. Flow 4: BOM Catalog Pricing & Policy
function generateFlow4BOM() {
  const lanes = ['Business Operations Manager (BOM)', 'Policy & Pricing Engine', 'Branch Operations'];
  const width = 850;
  const height = 550;
  const laneW = width / 3;
  const elements = `
    <circle cx="140" cy="80" r="10" fill="#000000" />
    <path d="M 140 90 L 140 115" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />

    <rect x="40" y="115" width="200" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="140" y="135" class="act-text">Configure Master Types</text>
    <text x="140" y="150" class="act-desc">(Dimensions, Base Rates)</text>

    <path d="M 140 160 L 140 200" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />

    <rect x="40" y="200" width="200" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="140" y="220" class="act-text">Set Regional Surcharges</text>
    <text x="140" y="235" class="act-desc">(Prime Location / Tier)</text>

    <!-- To Policy Engine -->
    <path d="M 240 222 L ${laneW + 40} 222" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="280" y="215" class="edge-label">Publish</text>

    <rect x="${laneW + 40}" y="200" width="200" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${laneW + 140}" y="220" class="act-text">Create Policy &amp; Price Version</text>
    <text x="${laneW + 140}" y="235" class="act-desc">(Immutable Snapshot)</text>

    <!-- To Branch Ops -->
    <path d="M ${laneW + 240} 222 L ${2 * laneW + 40} 222" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="${laneW + 260}" y="215" class="edge-label">Propagate</text>

    <rect x="${2 * laneW + 40}" y="200" width="200" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${2 * laneW + 140}" y="220" class="act-text">Enforce on New Bookings</text>
    <text x="${2 * laneW + 140}" y="235" class="act-desc">(Non-retroactive BR-GEN-02)</text>

    <circle cx="${2 * laneW + 140}" cy="290" r="13" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <circle cx="${2 * laneW + 140}" cy="290" r="7" fill="#000000" />
    <path d="M ${2 * laneW + 140} 245 L ${2 * laneW + 140} 277" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
  `;
  return buildSwimlaneSvg(width, height, lanes, elements, 'Swimlane 4: Flow_4_BOM_Catalog_Pricing_And_Policy');
}

// 5. Flow 5: Facility Layout & Staff Scheduling
function generateFlow5Staff() {
  const lanes = ['Facility Manager (FM)', 'Shift Dispatcher', 'Facility Staff'];
  const width = 850;
  const height = 550;
  const laneW = width / 3;
  const elements = `
    <circle cx="140" cy="80" r="10" fill="#000000" />
    <path d="M 140 90 L 140 115" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />

    <rect x="40" y="115" width="200" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="140" y="135" class="act-text">Configure Floorplan Layout</text>
    <text x="140" y="150" class="act-desc">(Zone, Row, Unit Coordinates)</text>

    <path d="M 140 160 L 140 200" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />

    <rect x="40" y="200" width="200" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="140" y="220" class="act-text">Build Weekly Shift Roster</text>
    <text x="140" y="235" class="act-desc">(Morning &amp; Afternoon Shifts)</text>

    <!-- To Dispatcher -->
    <path d="M 240 222 L ${laneW + 40} 222" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="280" y="215" class="edge-label">Dispatch</text>

    <rect x="${laneW + 40}" y="200" width="200" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${laneW + 140}" y="220" class="act-text">Generate Daily Worklist</text>
    <text x="${laneW + 140}" y="235" class="act-desc">(Check-ins, Returns, Cleaning)</text>

    <!-- To Staff -->
    <path d="M ${laneW + 240} 222 L ${2 * laneW + 40} 222" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="${laneW + 260}" y="215" class="edge-label">Assign</text>

    <rect x="${2 * laneW + 40}" y="200" width="200" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${2 * laneW + 140}" y="220" class="act-text">Execute Operations &amp; Sign-off</text>
    <text x="${2 * laneW + 140}" y="235" class="act-desc">(Staff Desk Terminal)</text>

    <circle cx="${2 * laneW + 140}" cy="290" r="13" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <circle cx="${2 * laneW + 140}" cy="290" r="7" fill="#000000" />
    <path d="M ${2 * laneW + 140} 245 L ${2 * laneW + 140} 277" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
  `;
  return buildSwimlaneSvg(width, height, lanes, elements, 'Swimlane 5: Flow_5_Facility_Layout_And_Staff_Scheduling');
}

// 6. Flow 6.1: Customer Online Renewal
function generateFlow61Renewal() {
  const lanes = ['Storage Customer', 'Facility Manager', 'Billing & Contract Engine'];
  const width = 850;
  const height = 550;
  const laneW = width / 3;
  const elements = `
    <circle cx="140" cy="80" r="10" fill="#000000" />
    <path d="M 140 90 L 140 115" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />

    <rect x="40" y="115" width="200" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="140" y="135" class="act-text">Open Renewal Portal</text>
    <text x="140" y="150" class="act-desc">(Window: T-30 to T-20 days)</text>

    <path d="M 140 160 L 140 200" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />

    <rect x="40" y="200" width="200" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="140" y="220" class="act-text">Select Extension (1-12 Mos)</text>
    <text x="140" y="235" class="act-desc">(Deposit Carries Forward)</text>

    <!-- Pay VNPay -->
    <path d="M 240 222 L ${2 * laneW + 40} 222" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="${laneW + 140}" y="215" class="edge-label">Pay Rent via VNPay</text>

    <rect x="${2 * laneW + 40}" y="200" width="200" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${2 * laneW + 140}" y="220" class="act-text">Extend Contract End Date</text>
    <text x="${2 * laneW + 140}" y="235" class="act-desc">(Contract Remains ACTIVE)</text>

    <circle cx="${2 * laneW + 140}" cy="290" r="13" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <circle cx="${2 * laneW + 140}" cy="290" r="7" fill="#000000" />
    <path d="M ${2 * laneW + 140} 245 L ${2 * laneW + 140} 277" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
  `;
  return buildSwimlaneSvg(width, height, lanes, elements, 'Swimlane 6.1: Flow_6_1_Customer_Online_Renewal');
}

// 7. Flow 6.2: Overdue Escalation & Eviction
function generateFlow62Overdue() {
  const lanes = ['System Schedulers (Cron)', 'Storage Customer', 'Staff & Central Warehouse'];
  const width = 850;
  const height = 650;
  const laneW = width / 3;
  const elements = `
    <circle cx="140" cy="80" r="10" fill="#000000" />
    <path d="M 140 90 L 140 115" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />

    <rect x="40" y="115" width="200" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="140" y="135" class="act-text">Midnight Scan at Day D+1</text>
    <text x="140" y="150" class="act-desc">(Transition to OVERDUE)</text>

    <path d="M 140 160 L 140 200" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />

    <rect x="40" y="200" width="200" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="140" y="220" class="act-text">Suspend Smart Lock PIN</text>
    <text x="140" y="235" class="act-desc">("No Pay, No PIN" BR-OVD-01)</text>

    <!-- Notify Customer -->
    <path d="M 240 222 L ${laneW + 40} 222" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="280" y="215" class="edge-label">Alert SMS/Email</text>

    <rect x="${laneW + 40}" y="200" width="200" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${laneW + 140}" y="220" class="act-text">Receive Daily Debt Notices</text>
    <text x="${laneW + 140}" y="235" class="act-desc">(Grace D+1..D+3, Penalty D+4..D+6)</text>

    <!-- D+7 Eviction -->
    <path d="M 140 245 L 140 320" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />

    <rect x="40" y="320" width="200" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="140" y="340" class="act-text">Day D+7: Terminate Contract</text>
    <text x="140" y="355" class="act-desc">(100% Deposit Liquidated)</text>

    <!-- Dispatch to Staff -->
    <path d="M 240 342 L ${2 * laneW + 40} 342" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="${laneW + 140}" y="335" class="edge-label">Eviction Order</text>

    <rect x="${2 * laneW + 40}" y="320" width="200" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${2 * laneW + 140}" y="340" class="act-text">Seal Unit &amp; Impound Goods</text>
    <text x="${2 * laneW + 140}" y="355" class="act-desc">(Transfer to Central Wh 30 days)</text>

    <!-- Unit Available D+8 -->
    <path d="M ${2 * laneW + 140} 365 L ${2 * laneW + 140} 420" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />

    <rect x="${2 * laneW + 40}" y="420" width="200" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${2 * laneW + 140}" y="440" class="act-text">Release Unit: AVAILABLE</text>
    <text x="${2 * laneW + 140}" y="455" class="act-desc">(Day D+8, Buffer: 8 days)</text>

    <circle cx="${2 * laneW + 140}" cy="510" r="13" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <circle cx="${2 * laneW + 140}" cy="510" r="7" fill="#000000" />
    <path d="M ${2 * laneW + 140} 465 L ${2 * laneW + 140} 497" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
  `;
  return buildSwimlaneSvg(width, height, lanes, elements, 'Swimlane 6.2: Flow_6_2_Overdue_Escalation_And_Eviction');
}

// 8. Flow 7: Customer Support & Incident Resolution
function generateFlow7Support() {
  const lanes = ['Storage Customer', 'Facility Staff', 'Facility Manager'];
  const width = 850;
  const height = 550;
  const laneW = width / 3;
  const elements = `
    <circle cx="140" cy="80" r="10" fill="#000000" />
    <path d="M 140 90 L 140 115" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />

    <rect x="40" y="115" width="200" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="140" y="135" class="act-text">Submit Support Ticket</text>
    <text x="140" y="150" class="act-desc">(Lock / Leak / Billing / Damage)</text>

    <!-- To Staff -->
    <path d="M 240 137 L ${laneW + 40} 137" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="280" y="130" class="edge-label">Claim Ticket</text>

    <rect x="${laneW + 40}" y="115" width="200" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${laneW + 140}" y="135" class="act-text">Investigate &amp; Resolve Issue</text>
    <text x="${laneW + 140}" y="150" class="act-desc">(Temp PIN / Battery Swap)</text>

    <!-- If Major -> FM -->
    <path d="M ${laneW + 240} 137 L ${2 * laneW + 40} 137" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="${laneW + 260}" y="130" class="edge-label">Escalate</text>

    <rect x="${2 * laneW + 40}" y="115" width="200" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${2 * laneW + 140}" y="135" class="act-text">Approve Compensation</text>
    <text x="${2 * laneW + 140}" y="150" class="act-desc">(Insurance Cap: 10M / 50M)</text>

    <!-- Close Ticket -->
    <path d="M ${laneW + 140} 160 L ${laneW + 140} 220" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />

    <rect x="${laneW + 40}" y="220" width="200" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${laneW + 140}" y="240" class="act-text">Mark Ticket: RESOLVED</text>
    <text x="${laneW + 140}" y="255" class="act-desc">(Auto-close after 72 hours)</text>

    <circle cx="${laneW + 140}" cy="320" r="13" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <circle cx="${laneW + 140}" cy="320" r="7" fill="#000000" />
    <path d="M ${laneW + 140} 265 L ${laneW + 140} 307" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
  `;
  return buildSwimlaneSvg(width, height, lanes, elements, 'Swimlane 7: Flow_7_Customer_Support_And_Incident_Resolution');
}

// Generate all swimlanes
const swimlaneMap = [
  { file: 'sl-00-end-to-end.svg', gen: generateEndToEndSwimlane },
  { file: 'sl-01-reservation.svg', gen: generateFlow1Reservation },
  { file: 'sl-02-checkin-handover.svg', gen: generateFlow2Checkin },
  { file: 'sl-03-return-settlement.svg', gen: generateFlow3Return },
  { file: 'sl-04-bom-operations.svg', gen: generateFlow4BOM },
  { file: 'sl-05-facility-staff.svg', gen: generateFlow5Staff },
  { file: 'sl-06-1-renewal.svg', gen: generateFlow61Renewal },
  { file: 'sl-06-2-overdue.svg', gen: generateFlow62Overdue },
  { file: 'sl-07-support.svg', gen: generateFlow7Support }
];

swimlaneMap.forEach(({ file, gen }) => {
  const svg = gen();
  fs.writeFileSync(path.join(swimlaneDir, file), svg);
  console.log(`Generated: ${file}`);
});
