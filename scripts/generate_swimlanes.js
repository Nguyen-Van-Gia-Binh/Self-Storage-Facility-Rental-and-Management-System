/**
 * Generator for all 9 Activity Swimlane Diagrams
 * Format: Draw.io Monochrome UML Activity Swimlanes (Black & White, clean orthogonal connectors)
 */

const fs = require('fs');
const path = require('path');

const swimlaneDir = path.resolve('docs/diagrams/report/swimlane');

function cleanXml(str) {
  return str.replace(/&(?!(amp|lt|gt|quot|apos);)/g, '&amp;');
}

function edgeLabelBox(text, x, y, width = 130, height = 20) {
  const safeText = cleanXml(text);
  const halfW = width / 2;
  return `
    <rect x="${x - halfW}" y="${y - 13}" width="${width}" height="${height}" fill="#ffffff" stroke="#cccccc" stroke-width="0.5" rx="3" ry="3" />
    <text x="${x}" y="${y + 1}" class="edge-label">${safeText}</text>
  `;
}

function buildSwimlaneSvg(width, height, lanes, elements, caption) {
  const laneWidth = width / lanes.length;
  let laneHeaders = '';
  let laneDividers = '';

  lanes.forEach((lane, i) => {
    const x = i * laneWidth;
    const safeLane = cleanXml(lane);
    // Header box
    laneHeaders += `
      <rect x="${x}" y="30" width="${laneWidth}" height="35" stroke="#000000" stroke-width="1.5" fill="#f8f9fa" />
      <text x="${x + laneWidth / 2}" y="52" class="lane-title">${safeLane}</text>
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

  const safeElements = elements;
  const safeCaption = cleanXml(caption);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <style>
    .lane-title { font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; text-anchor: middle; fill: #000000; }
    .act-title { font-family: Arial, sans-serif; font-size: 12px; font-weight: bold; text-anchor: middle; fill: #000000; }
    .act-desc { font-family: Arial, sans-serif; font-size: 10px; text-anchor: middle; fill: #555555; }
    .edge-label { font-family: Arial, sans-serif; font-size: 10.5px; fill: #000000; text-anchor: middle; }
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
  ${safeElements}
  <!-- Figure Caption -->
  <text x="${width / 2}" y="${height - 15}" class="caption">${safeCaption}</text>
</svg>`;
}

// 0. End-to-End Operational Lifecycle Overview
function generateEndToEndSwimlane() {
  const lanes = ['Storage Customer', 'Facility Staff', 'Facility Manager', 'System Schedulers'];
  const width = 1040;
  const height = 820;
  const laneW = 260;
  
  // Centers: Lane 0 = 130, Lane 1 = 390, Lane 2 = 650, Lane 3 = 910
  const c0 = 130, c1 = 390, c2 = 650, c3 = 910;
  const nw = 200, nh = 60; // 200x60 strict anti-overlap

  const elements = `
    <!-- Start -->
    <circle cx="${c0}" cy="85" r="10" fill="#000000" />
    <path d="M ${c0} 95 L ${c0} 120" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />

    <!-- 1. Customer: Reserve Unit -->
    <rect x="${c0 - nw/2}" y="120" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c0}" y="145" class="act-title">1. Reserve Unit &amp; Pay Deposit</text>
    <text x="${c0}" y="163" class="act-desc">(BR-PRI-01, BR-DEP-01)</text>

    <!-- Transition to FM -->
    <path d="M ${c0 + nw/2} 150 L ${c2} 150 L ${c2} 200" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Deposit Confirmed (48h)', (c0 + nw/2 + c2) / 2, 150, 160)}

    <!-- 2. FM: Allocate Unit -->
    <rect x="${c2 - nw/2}" y="200" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c2}" y="225" class="act-title">2. Allocate Storage Unit</text>
    <text x="${c2}" y="243" class="act-desc">(Late Binding, BR-AVL-04)</text>

    <!-- Transition to Staff -->
    <path d="M ${c2 - nw/2} 230 L ${c1} 230 L ${c1} 280" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Move-in Pass Issued', (c2 - nw/2 + c1) / 2, 230, 140)}

    <!-- 3. Staff: Handover & Inspection -->
    <rect x="${c1 - nw/2}" y="280" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c1}" y="305" class="act-title">3. 4-Point Handover &amp; PIN</text>
    <text x="${c1}" y="323" class="act-desc">(Check Lock, Clean, Light, Air)</text>

    <!-- Transition to Customer Active -->
    <path d="M ${c1 - nw/2} 310 L ${c0} 310 L ${c0} 360" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('PIN Delivered &amp; Active', (c1 - nw/2 + c0) / 2, 310, 150)}

    <!-- 4. Customer: Occupy & Store Goods -->
    <rect x="${c0 - nw/2}" y="360" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c0}" y="385" class="act-title">4. Occupy &amp; Store Goods</text>
    <text x="${c0}" y="403" class="act-desc">(24/7 Keypad Access Portal)</text>

    <!-- Path to System Schedulers Overdue Cron -->
    <path d="M ${c0 + nw/2} 390 L ${c3} 390 L ${c3} 440" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Lease Expiry without Renewal', (c0 + nw/2 + c3) / 2, 390, 180)}

    <!-- 5. System: Daily Overdue Scan -->
    <rect x="${c3 - nw/2}" y="440" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c3}" y="465" class="act-title">5. Daily Midnight Overdue Scan</text>
    <text x="${c3}" y="483" class="act-desc">(Cron 00:00:00, BR-OVD-01)</text>

    <!-- Transition to Staff: Lock PIN -->
    <path d="M ${c3 - nw/2} 470 L ${c1} 470 L ${c1} 520" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Lock PIN Day D+1 (BR-OVD-01)', (c3 - nw/2 + c1) / 2 + 30, 470, 180)}

    <!-- 6. Staff: Overdue Handling / Return -->
    <rect x="${c1 - nw/2}" y="520" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c1}" y="545" class="act-title">6. Overdue Handling / Return</text>
    <text x="${c1}" y="563" class="act-desc">(Inspection &amp; Settlement)</text>

    <!-- Transition to FM: Exit Settlement -->
    <path d="M ${c1 + nw/2} 550 L ${c2} 550 L ${c2} 600" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Checkout Inspection Passed', (c1 + nw/2 + c2) / 2, 550, 170)}

    <!-- 7. FM: Approve Final Settlement -->
    <rect x="${c2 - nw/2}" y="600" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c2}" y="625" class="act-title">7. Approve Final Settlement</text>
    <text x="${c2}" y="643" class="act-desc">(Refund Deposit, BR-DEP-03)</text>

    <!-- Complete End -->
    <circle cx="${c2}" cy="710" r="13" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <circle cx="${c2}" cy="710" r="7" fill="#000000" />
    <path d="M ${c2} 660 L ${c2} 697" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Contract Completed', c2 + 90, 680, 130)}
  `;
  return buildSwimlaneSvg(width, height, lanes, elements, 'Swimlane 0: End_To_End_Operational_Lifecycle');
}

// 1. Flow 1: Storage Unit Reservation & Payment
function generateFlow1Reservation() {
  const lanes = ['Storage Customer', 'System (Portal &amp; VNPay)', 'Facility Manager'];
  const width = 840;
  const height = 880;
  const laneW = 280;
  const c0 = 140, c1 = 420, c2 = 700;
  const nw = 200, nh = 60;

  const elements = `
    <!-- Start -->
    <circle cx="${c0}" cy="80" r="10" fill="#000000" />
    <path d="M ${c0} 90 L ${c0} 115" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />

    <!-- 1. Customer: Select Facility -->
    <rect x="${c0 - nw/2}" y="115" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c0}" y="140" class="act-title">Select Facility &amp; Unit Type</text>
    <text x="${c0}" y="158" class="act-desc">(BR-PRI-01, BR-GEN-03)</text>

    <!-- To System: Check Slot -->
    <path d="M ${c0 + nw/2} 145 L ${c1} 145 L ${c1} 190" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Check Capacity', (c0 + nw/2 + c1) / 2, 145, 110)}

    <!-- Decision: Available? -->
    <polygon points="${c1},190 ${c1 + 55},225 ${c1},260 ${c1 - 55},225" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c1}" y="229" class="edge-label">Capacity &gt; 0?</text>

    <!-- Branch [No] -> Waitlist -->
    <path d="M ${c1 - 55} 225 L ${c0} 225 L ${c0} 255" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('[No] Full Capacity', (c1 - 55 + c0) / 2, 225, 110)}

    <rect x="${c0 - nw/2}" y="255" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c0}" y="280" class="act-title">Opt-in FIFO Waitlist</text>
    <text x="${c0}" y="298" class="act-desc">(Queue Position, BR-WAT-01)</text>

    <circle cx="${c0}" cy="355" r="13" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <circle cx="${c0}" cy="355" r="7" fill="#000000" />
    <path d="M ${c0} 315 L ${c0} 342" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />

    <!-- Branch [Yes] -> Generate Invoice & Hold 48h -->
    <path d="M ${c1} 260 L ${c1} 300" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('[Yes] Slot Available', c1 + 70, 280, 120)}

    <rect x="${c1 - nw/2}" y="300" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c1}" y="325" class="act-title">Hold Unit 48h &amp; Calc Rent</text>
    <text x="${c1}" y="343" class="act-desc">(Deposit + 1st Month, BR-DEP-01)</text>

    <!-- To Customer Pay -->
    <path d="M ${c1 - nw/2} 330 L 210 330 L 210 390 L ${c0} 390 L ${c0} 400" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Redirect to VNPay URL', 255, 330, 140)}

    <rect x="${c0 - nw/2}" y="400" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c0}" y="425" class="act-title">Complete VNPay Payment</text>
    <text x="${c0}" y="443" class="act-desc">(Secure Sandbox Callback)</text>

    <!-- Back to System IPN -->
    <path d="M ${c0 + nw/2} 430 L ${c1} 430 L ${c1} 480" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('IPN Payment Success', (c0 + nw/2 + c1) / 2, 430, 140)}

    <rect x="${c1 - nw/2}" y="480" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c1}" y="505" class="act-title">Confirm Reservation</text>
    <text x="${c1}" y="523" class="act-desc">(Status: CONFIRMED)</text>

    <!-- To FM Allocate -->
    <path d="M ${c1 + nw/2} 510 L ${c2} 510 L ${c2} 560" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Dispatch Physical Binding', (c1 + nw/2 + c2) / 2, 510, 160)}

    <rect x="${c2 - nw/2}" y="560" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c2}" y="585" class="act-title">Allocate Physical Unit</text>
    <text x="${c2}" y="603" class="act-desc">(Late Binding, BR-AVL-04)</text>

    <!-- Back to System Create Pass -->
    <path d="M ${c2 - nw/2} 590 L ${c1} 590 L ${c1} 640" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Unit Assigned (Comp ID)', (c2 - nw/2 + c1) / 2, 590, 150)}

    <rect x="${c1 - nw/2}" y="640" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c1}" y="665" class="act-title">Issue Move-in Pass &amp; QR</text>
    <text x="${c1}" y="683" class="act-desc">(PENDING_CHECK_IN)</text>

    <!-- To Customer Pass -->
    <path d="M ${c1 - nw/2} 670 L ${c0} 670 L ${c0} 720" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Push Notification &amp; Pass', (c1 - nw/2 + c0) / 2, 670, 160)}

    <rect x="${c0 - nw/2}" y="720" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c0}" y="745" class="act-title">Receive Move-in Pass</text>
    <text x="${c0}" y="763" class="act-desc">(Ready for Physical Handover)</text>

    <circle cx="${c0}" cy="820" r="13" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <circle cx="${c0}" cy="820" r="7" fill="#000000" />
    <path d="M ${c0} 780 L ${c0} 807" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
  `;
  return buildSwimlaneSvg(width, height, lanes, elements, 'Swimlane 1: Flow_1_Storage_Unit_Reservation_And_Payment');
}

// 2. Flow 2: Check-in, Physical Handover & PIN Activation
function generateFlow2Checkin() {
  const lanes = ['Storage Customer', 'Facility Staff', 'Smart Lock &amp; System'];
  const width = 840;
  const height = 780;
  const laneW = 280;
  const c0 = 140, c1 = 420, c2 = 700;
  const nw = 200, nh = 60;

  const elements = `
    <!-- Start -->
    <circle cx="${c0}" cy="80" r="10" fill="#000000" />
    <path d="M ${c0} 90 L ${c0} 115" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />

    <!-- 1. Customer: Present QR -->
    <rect x="${c0 - nw/2}" y="115" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c0}" y="140" class="act-title">Present Move-in Pass QR</text>
    <text x="${c0}" y="158" class="act-desc">(Arrive at Facility on Start Date)</text>

    <!-- To Staff: Scan Pass -->
    <path d="M ${c0 + nw/2} 145 L ${c1} 145 L ${c1} 190" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Scan QR Pass', (c0 + nw/2 + c1) / 2, 145, 110)}

    <!-- 2. Staff: Verify Booking -->
    <rect x="${c1 - nw/2}" y="190" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c1}" y="215" class="act-title">Verify Citizen ID &amp; Pass</text>
    <text x="${c1}" y="233" class="act-desc">(Staff Desk Terminal, BR-CHK-01)</text>

    <!-- 3. Staff: Inspection -->
    <path d="M ${c1} 250 L ${c1} 280" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('ID Matched', c1 + 55, 265, 80)}

    <rect x="${c1 - nw/2}" y="280" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c1}" y="305" class="act-title">Execute 4-Point Inspection</text>
    <text x="${c1}" y="323" class="act-desc">(Lock, Cleanliness, Light, Air)</text>

    <!-- Customer Co-Sign -->
    <path d="M ${c1 - nw/2} 310 L ${c0} 310 L ${c0} 360" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Request Signature', (c1 - nw/2 + c0) / 2, 310, 130)}

    <!-- 4. Customer: Sign Protocol -->
    <rect x="${c0 - nw/2}" y="360" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c0}" y="385" class="act-title">Sign Handover Protocol</text>
    <text x="${c0}" y="403" class="act-desc">(Digital Sign on Tablet)</text>

    <!-- To Smart Lock System -->
    <path d="M ${c0 + nw/2} 390 L ${c2} 390 L ${c2} 440" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Protocol Co-Signed &amp; Stored', (c0 + nw/2 + c2) / 2, 390, 180)}

    <!-- 5. System: Generate PIN -->
    <rect x="${c2 - nw/2}" y="440" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c2}" y="465" class="act-title">Generate 6-Digit PIN</text>
    <text x="${c2}" y="483" class="act-desc">(Sync to Smart Lock Keypad)</text>

    <!-- 6. System: Contract ACTIVE -->
    <path d="M ${c2} 500 L ${c2} 530" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Keypad Provisioned', c2 + 75, 515, 120)}

    <rect x="${c2 - nw/2}" y="530" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c2}" y="555" class="act-title">Transition Contract ACTIVE</text>
    <text x="${c2}" y="573" class="act-desc">(Storage Unit: OCCUPIED)</text>

    <!-- Send PIN to Customer -->
    <path d="M ${c2 - nw/2} 560 L ${c0} 560 L ${c0} 610" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Deliver Secure Access PIN', (c2 - nw/2 + c0) / 2, 560, 170)}

    <!-- 7. Customer: Store PIN & Move-in -->
    <rect x="${c0 - nw/2}" y="610" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c0}" y="635" class="act-title">Store PIN in App &amp; Move-in</text>
    <text x="${c0}" y="653" class="act-desc">(24/7 Gate &amp; Unit Access)</text>

    <!-- End -->
    <circle cx="${c0}" cy="710" r="13" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <circle cx="${c0}" cy="710" r="7" fill="#000000" />
    <path d="M ${c0} 670 L ${c0} 697" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
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

