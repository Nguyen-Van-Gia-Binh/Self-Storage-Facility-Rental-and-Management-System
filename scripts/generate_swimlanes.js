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
    <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto" markerUnits="userSpaceOnUse">
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
  const height = 840;
  
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
    ${edgeLabelBox('Deposit Confirmed (48h)', (c0 + nw/2 + c2) / 2, 150, 150)}

    <!-- 2. FM: Allocate Unit -->
    <rect x="${c2 - nw/2}" y="200" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c2}" y="225" class="act-title">2. Allocate Storage Unit</text>
    <text x="${c2}" y="243" class="act-desc">(Late Binding, BR-AVL-04)</text>

    <!-- Transition to Staff -->
    <path d="M ${c2 - nw/2} 230 L ${c1} 230 L ${c1} 280" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Move-in Pass Issued', (c2 - nw/2 + c1) / 2, 230, 130)}

    <!-- 3. Staff: Handover & Inspection -->
    <rect x="${c1 - nw/2}" y="280" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c1}" y="305" class="act-title">3. 4-Point Handover &amp; PIN</text>
    <text x="${c1}" y="323" class="act-desc">(Check Lock, Clean, Light, Air)</text>

    <!-- Transition to Customer Active -->
    <path d="M ${c1 - nw/2} 310 L ${c0} 310 L ${c0} 360" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('PIN Delivered &amp; Active', (c1 - nw/2 + c0) / 2, 310, 130)}

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
    ${edgeLabelBox('Lock PIN Day D+1 (BR-OVD-01)', (c3 - nw/2 + c1) / 2 + 20, 470, 175)}

    <!-- 6. Staff: Overdue Handling / Return -->
    <rect x="${c1 - nw/2}" y="520" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c1}" y="545" class="act-title">6. Overdue Handling / Return</text>
    <text x="${c1}" y="563" class="act-desc">(Inspection &amp; Settlement)</text>

    <!-- Transition to FM: Exit Settlement -->
    <path d="M ${c1 + nw/2} 550 L ${c2} 550 L ${c2} 600" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Inspection Passed', (c1 + nw/2 + c2) / 2, 550, 120)}

    <!-- 7. FM: Approve Final Settlement -->
    <rect x="${c2 - nw/2}" y="600" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c2}" y="625" class="act-title">7. Approve Final Settlement</text>
    <text x="${c2}" y="643" class="act-desc">(Refund Deposit, BR-DEP-03)</text>

    <!-- Complete End -->
    <circle cx="${c2}" cy="730" r="13" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <circle cx="${c2}" cy="730" r="7" fill="#000000" />
    <path d="M ${c2} 660 L ${c2} 717" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Contract Completed', c2, 688, 125)}
  `;
  return buildSwimlaneSvg(width, height, lanes, elements, 'Swimlane 0: End_To_End_Operational_Lifecycle');
}

// 1. Flow 1: Storage Unit Reservation & Payment
function generateFlow1Reservation() {
  const lanes = ['Storage Customer', 'System (Portal &amp; VNPay)', 'Facility Manager'];
  const width = 840;
  const height = 920;
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
    <path d="M ${c1} 260 L ${c1} 310" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('[Yes] Slot Available', c1, 283, 120)}

    <rect x="${c1 - nw/2}" y="310" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c1}" y="335" class="act-title">Hold Unit 48h &amp; Calc Rent</text>
    <text x="${c1}" y="353" class="act-desc">(Deposit + 1st Month, BR-DEP-01)</text>

    <!-- To Customer Pay (Routed cleanly below Waitlist End Circle) -->
    <path d="M ${c1} 370 L ${c1} 398 L ${c0} 398 L ${c0} 430" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Redirect to VNPay URL', (c1 + c0) / 2, 398, 150)}

    <rect x="${c0 - nw/2}" y="430" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c0}" y="455" class="act-title">Complete VNPay Payment</text>
    <text x="${c0}" y="473" class="act-desc">(Secure Sandbox Callback)</text>

    <!-- Back to System IPN -->
    <path d="M ${c0 + nw/2} 460 L ${c1} 460 L ${c1} 510" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('IPN Payment Success', (c0 + nw/2 + c1) / 2, 460, 140)}

    <rect x="${c1 - nw/2}" y="510" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c1}" y="535" class="act-title">Confirm Reservation</text>
    <text x="${c1}" y="553" class="act-desc">(Status: CONFIRMED)</text>

    <!-- To FM Allocate -->
    <path d="M ${c1 + nw/2} 540 L ${c2} 540 L ${c2} 590" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Dispatch Physical Binding', (c1 + nw/2 + c2) / 2, 540, 150)}

    <rect x="${c2 - nw/2}" y="590" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c2}" y="615" class="act-title">Allocate Physical Unit</text>
    <text x="${c2}" y="633" class="act-desc">(Late Binding, BR-AVL-04)</text>

    <!-- Back to System Create Pass -->
    <path d="M ${c2 - nw/2} 620 L ${c1} 620 L ${c1} 670" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Unit Assigned (Comp ID)', (c2 - nw/2 + c1) / 2, 620, 145)}

    <rect x="${c1 - nw/2}" y="670" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c1}" y="695" class="act-title">Issue Move-in Pass &amp; QR</text>
    <text x="${c1}" y="713" class="act-desc">(PENDING_CHECK_IN)</text>

    <!-- To Customer Pass -->
    <path d="M ${c1 - nw/2} 700 L ${c0} 700 L ${c0} 750" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Push Notification &amp; Pass', (c1 - nw/2 + c0) / 2, 700, 145)}

    <rect x="${c0 - nw/2}" y="750" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c0}" y="775" class="act-title">Receive Move-in Pass</text>
    <text x="${c0}" y="793" class="act-desc">(Ready for Physical Handover)</text>

    <circle cx="${c0}" cy="850" r="13" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <circle cx="${c0}" cy="850" r="7" fill="#000000" />
    <path d="M ${c0} 810 L ${c0} 837" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
  `;
  return buildSwimlaneSvg(width, height, lanes, elements, 'Swimlane 1: Flow_1_Storage_Unit_Reservation_And_Payment');
}

// 2. Flow 2: Check-in, Physical Handover & PIN Activation
function generateFlow2Checkin() {
  const lanes = ['Storage Customer', 'Facility Staff', 'Smart Lock &amp; System'];
  const width = 840;
  const height = 830;
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
    <path d="M ${c1} 250 L ${c1} 305" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('ID Matched', c1, 276, 85)}

    <rect x="${c1 - nw/2}" y="305" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c1}" y="330" class="act-title">Execute 4-Point Inspection</text>
    <text x="${c1}" y="348" class="act-desc">(Lock, Cleanliness, Light, Air)</text>

    <!-- Customer Co-Sign -->
    <path d="M ${c1 - nw/2} 335 L ${c0} 335 L ${c0} 385" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Request Signature', (c1 - nw/2 + c0) / 2, 335, 125)}

    <!-- 4. Customer: Sign Protocol -->
    <rect x="${c0 - nw/2}" y="385" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c0}" y="410" class="act-title">Sign Handover Protocol</text>
    <text x="${c0}" y="428" class="act-desc">(Digital Sign on Tablet)</text>

    <!-- To Smart Lock System -->
    <path d="M ${c0 + nw/2} 415 L ${c2} 415 L ${c2} 465" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Protocol Co-Signed &amp; Stored', (c0 + nw/2 + c2) / 2, 415, 180)}

    <!-- 5. System: Generate PIN -->
    <rect x="${c2 - nw/2}" y="465" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c2}" y="490" class="act-title">Generate 6-Digit PIN</text>
    <text x="${c2}" y="508" class="act-desc">(Sync to Smart Lock Keypad)</text>

    <!-- 6. System: Contract ACTIVE -->
    <path d="M ${c2} 525 L ${c2} 580" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Keypad Provisioned', c2, 550, 125)}

    <rect x="${c2 - nw/2}" y="580" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c2}" y="605" class="act-title">Transition Contract ACTIVE</text>
    <text x="${c2}" y="623" class="act-desc">(Storage Unit: OCCUPIED)</text>

    <!-- Send PIN to Customer -->
    <path d="M ${c2 - nw/2} 610 L ${c0} 610 L ${c0} 660" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Deliver Secure Access PIN', (c2 - nw/2 + c0) / 2, 610, 170)}

    <!-- 7. Customer: Store PIN & Move-in -->
    <rect x="${c0 - nw/2}" y="660" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c0}" y="685" class="act-title">Store PIN in App &amp; Move-in</text>
    <text x="${c0}" y="703" class="act-desc">(24/7 Gate &amp; Unit Access)</text>

    <!-- End -->
    <circle cx="${c0}" cy="760" r="13" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <circle cx="${c0}" cy="760" r="7" fill="#000000" />
    <path d="M ${c0} 720 L ${c0} 747" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
  `;
  return buildSwimlaneSvg(width, height, lanes, elements, 'Swimlane 2: Flow_2_Checkin_Physical_Handover_And_PIN_Activation');
}

// 3. Flow 3: Checkout Return & Final Settlement
function generateFlow3Return() {
  const lanes = ['Storage Customer', 'Facility Staff', 'Facility Manager', 'Finance Ledger System'];
  const width = 1040;
  const height = 760;
  const c0 = 130, c1 = 390, c2 = 650, c3 = 910;
  const nw = 200, nh = 60;

  const elements = `
    <!-- Start -->
    <circle cx="${c0}" cy="80" r="10" fill="#000000" />
    <path d="M ${c0} 90 L ${c0} 115" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />

    <!-- 1. Customer: Schedule Return -->
    <rect x="${c0 - nw/2}" y="115" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c0}" y="140" class="act-title">1. Schedule Return Date</text>
    <text x="${c0}" y="158" class="act-desc">(Normal or Win-Win Early Return)</text>

    <!-- To Staff Inspection -->
    <path d="M ${c0 + nw/2} 145 L ${c1} 145 L ${c1} 200" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Check-out Request', (c0 + nw/2 + c1) / 2, 145, 125)}

    <!-- 2. Staff: Exit Inspection -->
    <rect x="${c1 - nw/2}" y="200" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c1}" y="225" class="act-title">2. Exit Inspection &amp; Photos</text>
    <text x="${c1}" y="243" class="act-desc">(Assess Damage, Trash &amp; Lock)</text>

    <!-- To Unit CLEANING -->
    <path d="M ${c1} 260 L ${c1} 315" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Inspection Logged', c1, 286, 120)}

    <!-- 3. Staff: Set CLEANING -->
    <rect x="${c1 - nw/2}" y="315" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c1}" y="340" class="act-title">3. Set Unit: CLEANING</text>
    <text x="${c1}" y="358" class="act-desc">(Sanitization Queue, BR-RET-09)</text>

    <!-- To FM Approval -->
    <path d="M ${c1 + nw/2} 345 L ${c2} 345 L ${c2} 400" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Damage Protocol', (c1 + nw/2 + c2) / 2, 345, 120)}

    <!-- 4. FM: Approve Voucher -->
    <rect x="${c2 - nw/2}" y="400" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c2}" y="425" class="act-title">4. Review &amp; Approve Voucher</text>
    <text x="${c2}" y="443" class="act-desc">(Net Settlement Formula)</text>

    <!-- To Ledger System -->
    <path d="M ${c2 + nw/2} 430 L ${c3} 430 L ${c3} 485" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Authorize Ledger', (c2 + nw/2 + c3) / 2, 430, 115)}

    <!-- 5. Ledger System: Double Entry -->
    <rect x="${c3 - nw/2}" y="485" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c3}" y="510" class="act-title">5. Record Double-Entry Ledger</text>
    <text x="${c3}" y="528" class="act-desc">(LedgerEntry Immutable Audit)</text>

    <!-- Refund Disbursed to Customer -->
    <path d="M ${c3 - nw/2} 515 L ${c0} 515 L ${c0} 570" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Disburse Net Refund (3-5 days)', (c3 - nw/2 + c0) / 2, 515, 190)}

    <!-- 6. Customer: Receive Refund -->
    <rect x="${c0 - nw/2}" y="570" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c0}" y="595" class="act-title">6. Receive Deposit Refund</text>
    <text x="${c0}" y="613" class="act-desc">(Contract CLOSED, Unit Available)</text>

    <!-- End -->
    <circle cx="${c0}" cy="675" r="13" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <circle cx="${c0}" cy="675" r="7" fill="#000000" />
    <path d="M ${c0} 630 L ${c0} 662" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
  `;
  return buildSwimlaneSvg(width, height, lanes, elements, 'Swimlane 3: Flow_3_Checkout_Return_And_Final_Settlement');
}

// 4. Flow 4: BOM Catalog Pricing & Policy
function generateFlow4BOM() {
  const lanes = ['Business Operations Manager', 'Policy &amp; Pricing Engine', 'Branch Operations'];
  const width = 840;
  const height = 650;
  const c0 = 140, c1 = 420, c2 = 700;
  const nw = 200, nh = 60;

  const elements = `
    <!-- Start -->
    <circle cx="${c0}" cy="80" r="10" fill="#000000" />
    <path d="M ${c0} 90 L ${c0} 115" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />

    <!-- 1. BOM: Configure Master Types -->
    <rect x="${c0 - nw/2}" y="115" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c0}" y="140" class="act-title">1. Configure Master Types</text>
    <text x="${c0}" y="158" class="act-desc">(Dimensions &amp; Base Monthly Rates)</text>

    <!-- Vertical Link -->
    <path d="M ${c0} 175 L ${c0} 230" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Catalog Defined', c0, 201, 110)}

    <!-- 2. BOM: Regional Surcharges -->
    <rect x="${c0 - nw/2}" y="230" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c0}" y="255" class="act-title">2. Set Regional Surcharges</text>
    <text x="${c0}" y="273" class="act-desc">(Prime Location / Branch Tier)</text>

    <!-- To Policy Engine -->
    <path d="M ${c0 + nw/2} 260 L ${c1} 260 L ${c1} 315" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Publish Pricing', (c0 + nw/2 + c1) / 2, 260, 115)}

    <!-- 3. Engine: Price & Policy Version -->
    <rect x="${c1 - nw/2}" y="315" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c1}" y="340" class="act-title">3. Create Price &amp; Policy Version</text>
    <text x="${c1}" y="358" class="act-desc">(Immutable Version Snapshot)</text>

    <!-- To Branch Ops -->
    <path d="M ${c1 + nw/2} 345 L ${c2} 345 L ${c2} 400" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Propagate Rules', (c1 + nw/2 + c2) / 2, 345, 115)}

    <!-- 4. Branch Ops: Enforce on New Bookings -->
    <rect x="${c2 - nw/2}" y="400" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c2}" y="425" class="act-title">4. Enforce on New Bookings</text>
    <text x="${c2}" y="443" class="act-desc">(Non-retroactive BR-GEN-02)</text>

    <!-- End -->
    <circle cx="${c2}" cy="530" r="13" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <circle cx="${c2}" cy="530" r="7" fill="#000000" />
    <path d="M ${c2} 460 L ${c2} 517" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Version Active', c2, 488, 100)}
  `;
  return buildSwimlaneSvg(width, height, lanes, elements, 'Swimlane 4: Flow_4_BOM_Catalog_Pricing_And_Policy');
}

// 5. Flow 5: Facility Layout & Staff Scheduling
function generateFlow5Staff() {
  const lanes = ['Facility Manager (FM)', 'Shift Dispatcher', 'Facility Staff'];
  const width = 840;
  const height = 650;
  const c0 = 140, c1 = 420, c2 = 700;
  const nw = 200, nh = 60;

  const elements = `
    <!-- Start -->
    <circle cx="${c0}" cy="80" r="10" fill="#000000" />
    <path d="M ${c0} 90 L ${c0} 115" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />

    <!-- 1. FM: Configure Floorplan -->
    <rect x="${c0 - nw/2}" y="115" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c0}" y="140" class="act-title">1. Configure Floorplan Layout</text>
    <text x="${c0}" y="158" class="act-desc">(Zone, Row, Unit Coordinates)</text>

    <!-- Vertical Link -->
    <path d="M ${c0} 175 L ${c0} 230" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Floorplan Saved', c0, 201, 110)}

    <!-- 2. FM: Weekly Shift Roster -->
    <rect x="${c0 - nw/2}" y="230" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c0}" y="255" class="act-title">2. Build Weekly Shift Roster</text>
    <text x="${c0}" y="273" class="act-desc">(Morning &amp; Afternoon Shifts)</text>

    <!-- To Dispatcher -->
    <path d="M ${c0 + nw/2} 260 L ${c1} 260 L ${c1} 315" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Publish Roster', (c0 + nw/2 + c1) / 2, 260, 110)}

    <!-- 3. Dispatcher: Generate Daily Worklist -->
    <rect x="${c1 - nw/2}" y="315" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c1}" y="340" class="act-title">3. Generate Daily Worklist</text>
    <text x="${c1}" y="358" class="act-desc">(Check-ins, Returns, Cleaning)</text>

    <!-- To Staff -->
    <path d="M ${c1 + nw/2} 345 L ${c2} 345 L ${c2} 400" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Assign Daily Tasks', (c1 + nw/2 + c2) / 2, 345, 125)}

    <!-- 4. Staff: Execute Operations -->
    <rect x="${c2 - nw/2}" y="400" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c2}" y="425" class="act-title">4. Execute Operations &amp; Sign</text>
    <text x="${c2}" y="443" class="act-desc">(Staff Desk Terminal Portal)</text>

    <!-- End -->
    <circle cx="${c2}" cy="530" r="13" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <circle cx="${c2}" cy="530" r="7" fill="#000000" />
    <path d="M ${c2} 460 L ${c2} 517" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Shift Logged', c2, 488, 95)}
  `;
  return buildSwimlaneSvg(width, height, lanes, elements, 'Swimlane 5: Flow_5_Facility_Layout_And_Staff_Scheduling');
}

// 6. Flow 6.1: Customer Online Renewal
function generateFlow61Renewal() {
  const lanes = ['Storage Customer', 'Billing &amp; Contract Engine', 'Facility Manager'];
  const width = 840;
  const height = 740;
  const c0 = 140, c1 = 420, c2 = 700;
  const nw = 200, nh = 60;

  const elements = `
    <!-- Start -->
    <circle cx="${c0}" cy="80" r="10" fill="#000000" />
    <path d="M ${c0} 90 L ${c0} 115" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />

    <!-- 1. Customer: Open Renewal Portal -->
    <rect x="${c0 - nw/2}" y="115" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c0}" y="140" class="act-title">1. Open Renewal Portal</text>
    <text x="${c0}" y="158" class="act-desc">(Window: T-30 to T-20 days)</text>

    <!-- Vertical Link -->
    <path d="M ${c0} 175 L ${c0} 230" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Eligible Lease', c0, 201, 105)}

    <!-- 2. Customer: Select Extension -->
    <rect x="${c0 - nw/2}" y="230" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c0}" y="255" class="act-title">2. Select Extension (1-12 Mos)</text>
    <text x="${c0}" y="273" class="act-desc">(Deposit Carries Forward)</text>

    <!-- To Billing Engine: Check Conflict -->
    <path d="M ${c0 + nw/2} 260 L ${c1} 260 L ${c1} 315" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Check Unit Conflict', (c0 + nw/2 + c1) / 2, 260, 125)}

    <!-- 3. Engine: Verify Next Reservation -->
    <rect x="${c1 - nw/2}" y="315" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c1}" y="340" class="act-title">3. Verify No Next Reservation</text>
    <text x="${c1}" y="358" class="act-desc">(Anti-Overlap Check, BR-REN-02)</text>

    <!-- To FM: Re-allocate if Conflict -->
    <path d="M ${c1 + nw/2} 345 L ${c2} 345 L ${c2} 400" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Resolve Conflict', (c1 + nw/2 + c2) / 2, 345, 115)}

    <!-- 4. FM: Re-allocate Next Booking -->
    <rect x="${c2 - nw/2}" y="400" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c2}" y="425" class="act-title">4. Resolve Unit Conflict</text>
    <text x="${c2}" y="443" class="act-desc">(Reassign Same-Type Unit)</text>

    <!-- Back to Customer: VNPay -->
    <path d="M ${c2 - nw/2} 430 L ${c0} 430 L ${c0} 485" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Clear to Pay Extension', (c2 - nw/2 + c0) / 2, 430, 150)}

    <!-- 5. Customer: Pay VNPay -->
    <rect x="${c0 - nw/2}" y="485" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c0}" y="510" class="act-title">5. Complete VNPay Renewal</text>
    <text x="${c0}" y="528" class="act-desc">(Extension Invoice Settled)</text>

    <!-- To Engine: Extend Date -->
    <path d="M ${c0 + nw/2} 515 L ${c1} 515 L ${c1} 570" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('IPN Payment Success', (c0 + nw/2 + c1) / 2, 515, 135)}

    <!-- 6. Engine: Extend Contract End Date -->
    <rect x="${c1 - nw/2}" y="570" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c1}" y="595" class="act-title">6. Extend Contract End Date</text>
    <text x="${c1}" y="613" class="act-desc">(Contract Remains ACTIVE)</text>

    <!-- End -->
    <circle cx="${c1}" cy="675" r="13" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <circle cx="${c1}" cy="675" r="7" fill="#000000" />
    <path d="M ${c1} 630 L ${c1} 662" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
  `;
  return buildSwimlaneSvg(width, height, lanes, elements, 'Swimlane 6.1: Flow_6_1_Customer_Online_Renewal');
}

// 7. Flow 6.2: Overdue Escalation & Eviction
function generateFlow62Overdue() {
  const lanes = ['System Schedulers (Cron)', 'Storage Customer', 'Staff &amp; Central Warehouse'];
  const width = 840;
  const height = 770;
  const c0 = 140, c1 = 420, c2 = 700;
  const nw = 200, nh = 60;

  const elements = `
    <!-- Start -->
    <circle cx="${c0}" cy="80" r="10" fill="#000000" />
    <path d="M ${c0} 90 L ${c0} 115" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />

    <!-- 1. System: Midnight Scan -->
    <rect x="${c0 - nw/2}" y="115" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c0}" y="140" class="act-title">1. Midnight Scan at Day D+1</text>
    <text x="${c0}" y="158" class="act-desc">(Transition to OVERDUE)</text>

    <!-- Vertical Link -->
    <path d="M ${c0} 175 L ${c0} 230" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Unpaid Past Maturity', c0, 201, 130)}

    <!-- 2. System: Suspend PIN -->
    <rect x="${c0 - nw/2}" y="230" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c0}" y="255" class="act-title">2. Suspend Smart Lock PIN</text>
    <text x="${c0}" y="273" class="act-desc">("No Pay, No PIN" BR-OVD-01)</text>

    <!-- Notify Customer -->
    <path d="M ${c0 + nw/2} 260 L ${c1} 260 L ${c1} 315" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Alert SMS / Email', (c0 + nw/2 + c1) / 2, 260, 115)}

    <!-- 3. Customer: Receive Notices -->
    <rect x="${c1 - nw/2}" y="315" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c1}" y="340" class="act-title">3. Receive Daily Debt Notices</text>
    <text x="${c1}" y="358" class="act-desc">(Grace D+1..3, Penalty D+4..6)</text>

    <!-- Back to System: D+7 Eviction -->
    <path d="M ${c1 - nw/2} 345 L ${c0} 345 L ${c0} 400" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('No Payment by Day D+7', (c1 - nw/2 + c0) / 2, 345, 145)}

    <!-- 4. System: Terminate Contract -->
    <rect x="${c0 - nw/2}" y="400" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c0}" y="425" class="act-title">4. Day D+7: Terminate Contract</text>
    <text x="${c0}" y="443" class="act-desc">(100% Deposit Liquidated)</text>

    <!-- Dispatch to Staff -->
    <path d="M ${c0 + nw/2} 430 L ${c2} 430 L ${c2} 485" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Eviction Work Order', (c0 + nw/2 + c2) / 2, 430, 140)}

    <!-- 5. Staff: Seal Unit -->
    <rect x="${c2 - nw/2}" y="485" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c2}" y="510" class="act-title">5. Seal Unit &amp; Impound Goods</text>
    <text x="${c2}" y="528" class="act-desc">(Transfer to Central Wh 30 Days)</text>

    <!-- Vertical Link -->
    <path d="M ${c2} 545 L ${c2} 600" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Sanitization Complete', c2, 571, 135)}

    <!-- 6. Staff: Unit Available D+8 -->
    <rect x="${c2 - nw/2}" y="600" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c2}" y="625" class="act-title">6. Release Unit: AVAILABLE</text>
    <text x="${c2}" y="643" class="act-desc">(Day D+8, Buffer: 8 Days)</text>

    <!-- End -->
    <circle cx="${c2}" cy="705" r="13" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <circle cx="${c2}" cy="705" r="7" fill="#000000" />
    <path d="M ${c2} 660 L ${c2} 692" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
  `;
  return buildSwimlaneSvg(width, height, lanes, elements, 'Swimlane 6.2: Flow_6_2_Overdue_Escalation_And_Eviction');
}

// 8. Flow 7: Customer Support & Incident Resolution
function generateFlow7Support() {
  const lanes = ['Storage Customer', 'Facility Staff', 'Facility Manager'];
  const width = 840;
  const height = 680;
  const c0 = 140, c1 = 420, c2 = 700;
  const nw = 200, nh = 60;

  const elements = `
    <!-- Start -->
    <circle cx="${c0}" cy="80" r="10" fill="#000000" />
    <path d="M ${c0} 90 L ${c0} 115" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />

    <!-- 1. Customer: Submit Ticket -->
    <rect x="${c0 - nw/2}" y="115" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c0}" y="140" class="act-title">1. Submit Support Ticket</text>
    <text x="${c0}" y="158" class="act-desc">(Lock / Leak / Billing / Damage)</text>

    <!-- To Staff -->
    <path d="M ${c0 + nw/2} 145 L ${c1} 145 L ${c1} 200" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Claim Ticket', (c0 + nw/2 + c1) / 2, 145, 105)}

    <!-- 2. Staff: Investigate -->
    <rect x="${c1 - nw/2}" y="200" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c1}" y="225" class="act-title">2. Investigate &amp; Resolve Issue</text>
    <text x="${c1}" y="243" class="act-desc">(Temp PIN / Battery / Inspection)</text>

    <!-- Escalate to FM -->
    <path d="M ${c1 + nw/2} 230 L ${c2} 230 L ${c2} 285" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Escalate Major Claim', (c1 + nw/2 + c2) / 2, 230, 135)}

    <!-- 3. FM: Approve Compensation -->
    <rect x="${c2 - nw/2}" y="285" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c2}" y="310" class="act-title">3. Approve Compensation</text>
    <text x="${c2}" y="328" class="act-desc">(Insurance Cap: 10M / 50M)</text>

    <!-- Back to Staff: Mark Resolved -->
    <path d="M ${c2 - nw/2} 315 L ${c1} 315 L ${c1} 370" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Resolution Approved', (c2 - nw/2 + c1) / 2, 315, 135)}

    <!-- 4. Staff: Mark Ticket RESOLVED -->
    <rect x="${c1 - nw/2}" y="370" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c1}" y="395" class="act-title">4. Mark Ticket: RESOLVED</text>
    <text x="${c1}" y="413" class="act-desc">(Auto-close after 72 Hours)</text>

    <!-- Notify Customer -->
    <path d="M ${c1 - nw/2} 400 L ${c0} 400 L ${c0} 455" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    ${edgeLabelBox('Notify Resolution', (c1 - nw/2 + c0) / 2, 400, 120)}

    <!-- 5. Customer: Confirm & Close -->
    <rect x="${c0 - nw/2}" y="455" width="${nw}" height="${nh}" rx="6" ry="6" stroke="#000000" stroke-width="1.2" fill="#ffffff" />
    <text x="${c0}" y="480" class="act-title">5. Confirm &amp; Rate Support</text>
    <text x="${c0}" y="498" class="act-desc">(Ticket CLOSED)</text>

    <!-- End -->
    <circle cx="${c0}" cy="565" r="13" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <circle cx="${c0}" cy="565" r="7" fill="#000000" />
    <path d="M ${c0} 515 L ${c0} 552" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
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

