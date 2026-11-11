/**
 * Generator for all 6 Entity State Machine Diagrams
 * Format: Draw.io Monochrome UML State Machine
 */

const fs = require('fs');
const path = require('path');

const stateDir = path.resolve('docs/diagrams/report/state');
const drawioDir = path.resolve('docs/diagrams/report/drawio');

function buildStateSvg(width, height, elements, caption) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <style>
    .state-title { font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; text-anchor: middle; fill: #000000; }
    .state-desc { font-family: Arial, sans-serif; font-size: 11px; text-anchor: middle; fill: #444444; }
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
  ${elements}
  <!-- Figure Caption -->
  <text x="${width / 2}" y="${height - 25}" class="caption">${caption}</text>
</svg>`;
}

// 1. RentalContract Entity State Machine (9 States)
function generateRentalContractState() {
  const width = 850;
  const height = 580;
  const elements = `
    <!-- Initial State -->
    <circle cx="100" cy="50" r="12" fill="#000000" />
    <path d="M 100 62 L 100 100" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="110" y="85" class="edge-label-start">Deposit confirmed (BR-DEP-01)</text>

    <!-- State: PENDING_CHECK_IN -->
    <rect x="30" y="100" width="140" height="50" rx="4" ry="4" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <text x="100" y="125" class="state-title">Pending Check-in</text>
    <text x="100" y="140" class="state-desc">(Unit Allocated)</text>

    <!-- State: CANCELLED -->
    <rect x="250" y="100" width="130" height="50" rx="4" ry="4" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <text x="315" y="130" class="state-title">Cancelled</text>

    <!-- PENDING_CHECK_IN -> CANCELLED -->
    <path d="M 170 125 L 250 125" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="210" y="118" class="edge-label">Cancel / No-show</text>

    <!-- State: ACTIVE -->
    <rect x="30" y="220" width="140" height="55" rx="4" ry="4" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <text x="100" y="245" class="state-title">Active</text>
    <text x="100" y="262" class="state-desc">(Smart Lock PIN Active)</text>

    <!-- PENDING_CHECK_IN -> ACTIVE -->
    <path d="M 100 150 L 100 220" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="105" y="185" class="edge-label-start">Check-in signed / Auto-act T+11</text>

    <!-- State: PENDING_RETURN -->
    <rect x="250" y="220" width="140" height="55" rx="4" ry="4" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <text x="320" y="245" class="state-title">Pending Return</text>
    <text x="320" y="262" class="state-desc">(Inspection Booked)</text>

    <!-- ACTIVE -> PENDING_RETURN -->
    <path d="M 170 240 L 250 240" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="210" y="233" class="edge-label">Request Return</text>

    <!-- PENDING_RETURN -> ACTIVE -->
    <path d="M 250 260 L 170 260" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="210" y="275" class="edge-label">Cancel Return</text>

    <!-- State: OVERDUE -->
    <rect x="30" y="350" width="140" height="55" rx="4" ry="4" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <text x="100" y="375" class="state-title">Overdue</text>
    <text x="100" y="392" class="state-desc">(PIN Locked D+1)</text>

    <!-- ACTIVE -> OVERDUE -->
    <path d="M 100 275 L 100 350" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="105" y="315" class="edge-label-start">Midnight cron D+1 (BR-OVD-01)</text>

    <!-- OVERDUE -> ACTIVE -->
    <path d="M 70 350 L 70 275" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="65" y="315" class="edge-label-start">Pay Debt &amp; Renew</text>

    <!-- State: RETURNED -->
    <rect x="470" y="220" width="140" height="55" rx="4" ry="4" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <text x="540" y="245" class="state-title">Returned</text>
    <text x="540" y="262" class="state-desc">(Unit Vacated)</text>

    <!-- PENDING_RETURN -> RETURNED -->
    <path d="M 390 247 L 470 247" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="430" y="240" class="edge-label">Staff Sign-off</text>

    <!-- State: CLOSED -->
    <rect x="680" y="220" width="130" height="55" rx="4" ry="4" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <text x="745" y="245" class="state-title">Closed</text>
    <text x="745" y="262" class="state-desc">(Deposit Settled)</text>

    <!-- RETURNED -> CLOSED -->
    <path d="M 610 247 L 680 247" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="645" y="240" class="edge-label">FM Settle</text>

    <!-- State: TERMINATED -->
    <rect x="250" y="350" width="140" height="55" rx="4" ry="4" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <text x="320" y="375" class="state-title">Terminated</text>
    <text x="320" y="392" class="state-desc">(Eviction D+7)</text>

    <!-- OVERDUE -> TERMINATED -->
    <path d="M 170 377 L 250 377" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="210" y="370" class="edge-label">D+7 Liquidate</text>

    <!-- Final States End Circles -->
    <!-- CANCELLED -> End -->
    <circle cx="430" cy="125" r="13" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <circle cx="430" cy="125" r="7" fill="#000000" />
    <path d="M 380 125 L 417 125" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />

    <!-- TERMINATED -> End -->
    <circle cx="440" cy="377" r="13" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <circle cx="440" cy="377" r="7" fill="#000000" />
    <path d="M 390 377 L 427 377" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />

    <!-- CLOSED -> End -->
    <circle cx="745" cy="330" r="13" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <circle cx="745" cy="330" r="7" fill="#000000" />
    <path d="M 745 275 L 745 317" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
  `;
  return buildStateSvg(width, height, elements, 'State Chart 1: Rental_Contract_Lifecycle');
}

// 2. StorageUnit Entity State Machine (7 States)
function generateStorageUnitState() {
  const width = 820;
  const height = 480;
  const elements = `
    <!-- Initial State -->
    <circle cx="80" cy="50" r="12" fill="#000000" />
    <path d="M 80 62 L 80 100" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="90" y="85" class="edge-label-start">Unit Created from Master Type</text>

    <!-- State: AVAILABLE -->
    <rect x="20" y="100" width="120" height="50" rx="4" ry="4" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <text x="80" y="130" class="state-title">AVAILABLE</text>

    <!-- State: RESERVED -->
    <rect x="220" y="100" width="120" height="50" rx="4" ry="4" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <text x="280" y="130" class="state-title">RESERVED</text>

    <path d="M 140 125 L 220 125" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="180" y="118" class="edge-label">FM Allocate</text>

    <!-- State: OCCUPIED -->
    <rect x="420" y="100" width="120" height="50" rx="4" ry="4" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <text x="480" y="130" class="state-title">OCCUPIED</text>

    <path d="M 340 125 L 420 125" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="380" y="118" class="edge-label">Check-in Signed</text>

    <!-- State: CLEANING -->
    <rect x="420" y="240" width="120" height="50" rx="4" ry="4" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <text x="480" y="270" class="state-title">CLEANING</text>

    <path d="M 480 150 L 480 240" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="490" y="200" class="edge-label-start">Checkout Return</text>

    <!-- CLEANING -> AVAILABLE -->
    <path d="M 420 265 L 80 265 L 80 150" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="230" y="258" class="edge-label">Sanitization Finished (BR-RET-09)</text>

    <!-- State: MAINTENANCE -->
    <rect x="220" y="340" width="130" height="50" rx="4" ry="4" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <text x="285" y="370" class="state-title">MAINTENANCE</text>

    <path d="M 480 290 L 480 365 L 350 365" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="420" y="358" class="edge-label">Damage Found / D+7 Eviction</text>

    <!-- MAINTENANCE -> AVAILABLE -->
    <path d="M 220 365 L 50 365 L 50 150" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="120" y="358" class="edge-label">Repairs Complete</text>

    <!-- State: OUT_OF_SERVICE -->
    <rect x="620" y="100" width="150" height="50" rx="4" ry="4" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <text x="695" y="130" class="state-title">OUT_OF_SERVICE</text>

    <path d="M 540 125 L 620 125" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="580" y="118" class="edge-label">Decommission</text>
  `;
  return buildStateSvg(width, height, elements, 'State Chart 2: Storage_Unit_Physical_Status');
}

// 3. Reservation Entity State Machine (5 States)
function generateReservationState() {
  const width = 800;
  const height = 450;
  const elements = `
    <circle cx="80" cy="50" r="12" fill="#000000" />
    <path d="M 80 62 L 80 100" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="90" y="85" class="edge-label-start">Select Unit Type (BR-RES-01)</text>

    <!-- State: PENDING_PAYMENT -->
    <rect x="15" y="100" width="130" height="50" rx="4" ry="4" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <text x="80" y="125" class="state-title">Pending Payment</text>
    <text x="80" y="140" class="state-desc">(Hold 48h)</text>

    <!-- State: EXPIRED -->
    <rect x="15" y="230" width="130" height="50" rx="4" ry="4" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <text x="80" y="260" class="state-title">Expired</text>

    <path d="M 80 150 L 80 230" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="90" y="190" class="edge-label-start">48h timeout (BR-DEP-03)</text>

    <!-- State: CONFIRMED -->
    <rect x="250" y="100" width="130" height="50" rx="4" ry="4" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <text x="315" y="130" class="state-title">Confirmed</text>

    <path d="M 145 125 L 250 125" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="195" y="118" class="edge-label">VNPay IPN OK</text>

    <!-- State: CANCELLED -->
    <rect x="250" y="230" width="130" height="50" rx="4" ry="4" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <text x="315" y="260" class="state-title">Cancelled</text>

    <path d="M 315 150 L 315 230" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="325" y="190" class="edge-label-start">Refund policy (BR-CAN)</text>

    <!-- State: FULFILLED -->
    <rect x="480" y="100" width="130" height="50" rx="4" ry="4" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <text x="545" y="130" class="state-title">Fulfilled</text>

    <path d="M 380 125 L 480 125" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="430" y="118" class="edge-label">Check-in Signed</text>

    <!-- Final State End Circles -->
    <circle cx="670" cy="125" r="13" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <circle cx="670" cy="125" r="7" fill="#000000" />
    <path d="M 610 125 L 657 125" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />

    <circle cx="80" cy="340" r="13" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <circle cx="80" cy="340" r="7" fill="#000000" />
    <path d="M 80 280 L 80 327" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
  `;
  return buildStateSvg(width, height, elements, 'State Chart 3: Reservation_Booking_Status');
}

// 4. SupportRequest Entity State Machine (5 States)
function generateSupportRequestState() {
  const width = 800;
  const height = 400;
  const elements = `
    <circle cx="70" cy="50" r="12" fill="#000000" />
    <path d="M 70 62 L 70 100" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="80" y="85" class="edge-label-start">Submit Ticket (BR-SUP-01)</text>

    <rect x="15" y="100" width="110" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <text x="70" y="127" class="state-title">NEW</text>

    <rect x="190" y="100" width="110" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <text x="245" y="127" class="state-title">ASSIGNED</text>
    <path d="M 125 122 L 190 122" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="155" y="115" class="edge-label">FM Dispatch</text>

    <rect x="370" y="100" width="120" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <text x="430" y="127" class="state-title">IN_PROGRESS</text>
    <path d="M 300 122 L 370 122" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="335" y="115" class="edge-label">Staff Claim</text>

    <rect x="560" y="100" width="110" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <text x="615" y="127" class="state-title">RESOLVED</text>
    <path d="M 490 122 L 560 122" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="525" y="115" class="edge-label">Fix Applied</text>

    <rect x="560" y="220" width="110" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <text x="615" y="247" class="state-title">CLOSED</text>
    <path d="M 615 145 L 615 220" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="625" y="185" class="edge-label-start">72h auto-close (BR-SUP-05)</text>

    <!-- Reopen -->
    <path d="M 560 135 L 430 135 L 430 145" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="495" y="150" class="edge-label">Customer Dispute</text>

    <circle cx="740" cy="242" r="13" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <circle cx="740" cy="242" r="7" fill="#000000" />
    <path d="M 670 242 L 727 242" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
  `;
  return buildStateSvg(width, height, elements, 'State Chart 4: Support_Request_Ticket_Status');
}

// 5. Waitlist Entity State Machine (5 States)
function generateWaitlistState() {
  const width = 800;
  const height = 400;
  const elements = `
    <circle cx="80" cy="50" r="12" fill="#000000" />
    <path d="M 80 62 L 80 100" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="90" y="85" class="edge-label-start">FIFO Join (BR-WAT-01)</text>

    <rect x="20" y="100" width="120" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <text x="80" y="127" class="state-title">WAITING</text>

    <rect x="220" y="100" width="120" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <text x="280" y="127" class="state-title">CONTACTING</text>
    <path d="M 140 122 L 220 122" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="180" y="115" class="edge-label">FM Lock 2h</text>

    <rect x="420" y="100" width="120" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <text x="480" y="127" class="state-title">CONVERTED</text>
    <path d="M 340 122 L 420 122" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="380" y="115" class="edge-label">Client Agree</text>

    <rect x="220" y="220" width="120" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <text x="280" y="247" class="state-title">EXPIRED</text>
    <path d="M 280 145 L 280 220" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="290" y="185" class="edge-label-start">2h Timeout</text>

    <rect x="420" y="220" width="120" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <text x="480" y="247" class="state-title">REJECTED</text>
    <path d="M 340 135 L 420 225" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="400" y="175" class="edge-label">Declined</text>

    <circle cx="610" cy="122" r="13" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <circle cx="610" cy="122" r="7" fill="#000000" />
    <path d="M 540 122 L 597 122" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
  `;
  return buildStateSvg(width, height, elements, 'State Chart 5: Waitlist_CRM_Status');
}

// 6. PaymentTransaction Entity State Machine (4 States)
function generatePaymentTransactionState() {
  const width = 800;
  const height = 400;
  const elements = `
    <circle cx="80" cy="50" r="12" fill="#000000" />
    <path d="M 80 62 L 80 100" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="90" y="85" class="edge-label-start">Init VNPay (BR-PAY-01)</text>

    <rect x="20" y="100" width="120" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <text x="80" y="127" class="state-title">PENDING</text>

    <rect x="250" y="100" width="120" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <text x="310" y="127" class="state-title">SUCCESS</text>
    <path d="M 140 122 L 250 122" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="195" y="115" class="edge-label">IPN Checksum OK</text>

    <rect x="20" y="230" width="120" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <text x="80" y="257" class="state-title">FAILED</text>
    <path d="M 80 145 L 80 230" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="90" y="190" class="edge-label-start">User Cancel / Timeout</text>

    <rect x="470" y="100" width="120" height="45" rx="4" ry="4" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <text x="530" y="127" class="state-title">REFUNDED</text>
    <path d="M 370 122 L 470 122" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="420" y="115" class="edge-label">Settlement Voucher</text>

    <circle cx="660" cy="122" r="13" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <circle cx="660" cy="122" r="7" fill="#000000" />
    <path d="M 590 122 L 647 122" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
  `;
  return buildStateSvg(width, height, elements, 'State Chart 6: Payment_Transaction_Status');
}

// Generate files
const stateMap = [
  { file: 'st-rental-contract.svg', gen: generateRentalContractState },
  { file: 'st-storage-unit.svg', gen: generateStorageUnitState },
  { file: 'st-reservation.svg', gen: generateReservationState },
  { file: 'st-support-request.svg', gen: generateSupportRequestState },
  { file: 'st-waitlist.svg', gen: generateWaitlistState },
  { file: 'st-payment-transaction.svg', gen: generatePaymentTransactionState }
];

stateMap.forEach(({ file, gen }) => {
  const svg = gen();
  fs.writeFileSync(path.join(stateDir, file), svg);
  console.log(`Generated: ${file}`);
});
