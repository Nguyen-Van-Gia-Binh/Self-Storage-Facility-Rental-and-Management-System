/**
 * Generator for Conceptual Data Model and 4 Physical ERDs
 * Format: Draw.io Monochrome UML / Relational Database Diagram (Black & White, clean orthogonal connectors)
 */

const fs = require('fs');
const path = require('path');

const dataDir = path.resolve('docs/diagrams/report/data');

function cleanXml(str) {
  return str.replace(/&(?!(amp|lt|gt|quot|apos);)/g, '&amp;');
}

function buildDataSvg(width, height, content, caption) {
  const safeContent = cleanXml(content);
  const safeCaption = cleanXml(caption);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <style>
    .entity-header { font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; text-anchor: middle; fill: #000000; }
    .domain-title { font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; fill: #000000; }
    .attr-pk { font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; fill: #000000; }
    .attr-text { font-family: Arial, sans-serif; font-size: 11px; fill: #222222; }
    .edge-label { font-family: Arial, sans-serif; font-size: 10px; fill: #000000; text-anchor: middle; }
    .caption { font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; text-anchor: middle; fill: #000000; }
  </style>
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#000000" />
    </marker>
    <marker id="crow" viewBox="0 0 12 12" refX="12" refY="6" markerWidth="8" markerHeight="8" orient="auto">
      <path d="M 0 0 L 12 6 L 0 12 M 12 0 L 12 12" stroke="#000000" stroke-width="1.2" fill="none" />
    </marker>
  </defs>
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="#ffffff" />
  ${safeContent}
  <!-- Figure Caption -->
  <text x="${width / 2}" y="${height - 15}" class="caption">${safeCaption}</text>
</svg>`;
}

function entityBox(x, y, w, h, title, rows) {
  let rowsSvg = '';
  rows.forEach((r, idx) => {
    const ry = y + 42 + idx * 18;
    const isPk = r.startsWith('PK') || r.startsWith('FK');
    rowsSvg += `<text x="${x + 8}" y="${ry}" class="${isPk ? 'attr-pk' : 'attr-text'}">${r}</text>`;
  });

  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" ry="4" stroke="#000000" stroke-width="1.5" fill="#ffffff" />
    <rect x="${x}" y="${y}" width="${w}" height="26" rx="4" ry="4" stroke="#000000" stroke-width="1.5" fill="#f4f4f4" />
    <line x1="${x}" y1="${y + 26}" x2="${x + w}" y2="${y + 26}" stroke="#000000" stroke-width="1.2" />
    <text x="${x + w / 2}" y="${y + 18}" class="entity-header">${title}</text>
    ${rowsSvg}
  `;
}

// 1. Conceptual Model
function generateConceptualModel() {
  const width = 880;
  const height = 650;
  const content = `
    <!-- Domain Groups -->
    <rect x="20" y="30" width="400" height="260" rx="6" ry="6" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 4" fill="none" />
    <text x="35" y="52" class="domain-title">Identity &amp; Facility Domain</text>

    ${entityBox(40, 70, 160, 95, 'AppUser', ['id : UUID', 'email : string', 'role : Role', 'status : Status'])}
    ${entityBox(240, 70, 160, 95, 'Facility', ['id : UUID', 'name : string', 'city : string', 'status : Status'])}
    ${entityBox(40, 185, 160, 95, 'UnitType', ['id : UUID', 'type_code : string', 'area_sqm : decimal', 'base_price : decimal'])}
    ${entityBox(240, 185, 160, 95, 'StorageUnit', ['id : UUID', 'unit_number : string', 'status : UnitStatus', 'facility_id : UUID'])}

    <rect x="450" y="30" width="410" height="260" rx="6" ry="6" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 4" fill="none" />
    <text x="465" y="52" class="domain-title">Booking &amp; Contract Domain</text>

    ${entityBox(470, 70, 180, 95, 'Reservation', ['id : UUID', 'booking_code : string', 'status : ResStatus', 'customer_id : UUID'])}
    ${entityBox(670, 70, 170, 95, 'RentalContract', ['id : UUID', 'contract_code : string', 'status : ContractStatus', 'start_date : date'])}
    ${entityBox(470, 185, 180, 95, 'Waitlist', ['id : UUID', 'priority_seq : int', 'status : WaitlistStatus', 'customer_id : UUID'])}
    ${entityBox(670, 185, 170, 95, 'HandoverRecord', ['id : UUID', 'handover_date : timestamp', 'pin_code_hash : string', 'checklist_ok : bool'])}

    <rect x="20" y="315" width="400" height="270" rx="6" ry="6" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 4" fill="none" />
    <text x="35" y="337" class="domain-title">Finance &amp; Policy Domain</text>

    ${entityBox(40, 355, 175, 105, 'PaymentTransaction', ['id : UUID', 'order_code : long', 'amount : decimal', 'status : PayStatus'])}
    ${entityBox(235, 355, 170, 105, 'PolicyVersion', ['id : UUID', 'version_number : int', 'deposit_mult : decimal', 'buffer_days : int'])}
    ${entityBox(40, 480, 175, 95, 'ContractExtraCharge', ['id : UUID', 'charge_type : ChargeType', 'amount : decimal', 'settled : bool'])}
    ${entityBox(235, 480, 170, 95, 'LedgerEntry', ['id : UUID', 'entry_type : EntryType', 'amount : decimal', 'created_at : timestamp'])}

    <rect x="450" y="315" width="410" height="270" rx="6" ry="6" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 4" fill="none" />
    <text x="465" y="337" class="domain-title">Operations &amp; Support Domain</text>

    ${entityBox(470, 355, 180, 105, 'SupportRequest', ['id : UUID', 'ticket_code : string', 'category : TicketCat', 'status : TicketStatus'])}
    ${entityBox(670, 355, 170, 105, 'StaffDailyAssignment', ['id : UUID', 'assignment_date : date', 'shift : ShiftType', 'staff_id : UUID'])}
    ${entityBox(470, 480, 180, 95, 'ReturnRequest', ['id : UUID', 'scheduled_date : date', 'damage_fee : decimal', 'approved : bool'])}
    ${entityBox(670, 480, 170, 95, 'OverdueLog', ['id : UUID', 'overdue_day : int', 'penalty_accrued : decimal', 'pin_locked : bool'])}

    <!-- Connecting Edges -->
    <path d="M 200 115 L 470 115" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="330" y="108" class="edge-label">places reservation</text>

    <path d="M 650 115 L 670 115" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="660" y="108" class="edge-label">converts</text>

    <path d="M 320 280 L 320 315 L 560 315 L 560 165" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <text x="440" y="308" class="edge-label">allocates unit to contract</text>
  `;
  return buildDataSvg(width, height, content, 'Conceptual Data Model: Core_Business_Entities');
}

// 2. ERD Part 1: Identity & Facility
function generateErd1IdentityFacility() {
  const width = 850;
  const height = 550;
  const content = `
    ${entityBox(40, 50, 220, 140, 'app_user', [
      'PK id : uuid',
      '   email : varchar(255) UNIQUE',
      '   password_hash : varchar(255)',
      '   full_name : varchar(100)',
      '   phone_number : varchar(20)',
      '   role : varchar(20)',
      '   status : varchar(20)'
    ])}

    ${entityBox(330, 50, 220, 140, 'user_facility_assignment', [
      'PK id : uuid',
      'FK user_id : uuid',
      'FK facility_id : uuid',
      '   assigned_at : timestamp',
      '   role_at_facility : varchar(20)',
      '   status : varchar(20)'
    ])}

    ${entityBox(600, 50, 220, 140, 'facility', [
      'PK id : uuid',
      '   facility_code : varchar(50)',
      '   name : varchar(100)',
      '   address_line : varchar(255)',
      '   city : varchar(50)',
      '   total_units : int',
      '   status : varchar(20)'
    ])}

    ${entityBox(600, 260, 220, 150, 'storage_unit', [
      'PK id : uuid',
      'FK facility_id : uuid',
      'FK unit_type_id : uuid',
      '   unit_number : varchar(20)',
      '   floor : int',
      '   zone : varchar(20)',
      '   status : varchar(20)'
    ])}

    ${entityBox(330, 260, 220, 150, 'unit_type', [
      'PK id : uuid',
      '   type_code : varchar(50)',
      '   name : varchar(100)',
      '   width_m : decimal(5,2)',
      '   length_m : decimal(5,2)',
      '   height_m : decimal(5,2)',
      '   base_monthly_rate : decimal(12,2)'
    ])}

    ${entityBox(40, 260, 240, 150, 'facility_unit_type_price', [
      'PK id : uuid',
      'FK facility_id : uuid',
      'FK unit_type_id : uuid',
      '   override_monthly_rate : decimal(12,2)',
      '   location_surcharge : decimal(12,2)',
      '   effective_from : timestamp',
      '   status : varchar(20)'
    ])}

    <!-- Relations -->
    <path d="M 260 120 L 330 120" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <path d="M 600 120 L 550 120" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <path d="M 710 190 L 710 260" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <path d="M 550 335 L 600 335" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <path d="M 330 335 L 280 335" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
  `;
  return buildDataSvg(width, height, content, 'ERD Part 1: Identity_Security_And_Facility_Domain');
}

// 3. ERD Part 2: Booking & Contract
function generateErd2BookingContract() {
  const width = 850;
  const height = 550;
  const content = `
    ${entityBox(40, 50, 230, 150, 'reservation', [
      'PK id : uuid',
      '   booking_code : varchar(50)',
      'FK customer_id : uuid',
      'FK facility_id : uuid',
      'FK unit_type_id : uuid',
      '   start_date : date',
      '   rental_months : int',
      '   status : varchar(20)'
    ])}

    ${entityBox(330, 50, 230, 150, 'rental_contract', [
      'PK id : uuid',
      '   contract_code : varchar(50)',
      'FK customer_id : uuid',
      'FK storage_unit_id : uuid',
      'FK reservation_id : uuid',
      '   start_date : date',
      '   end_date : date',
      '   status : varchar(20)'
    ])}

    ${entityBox(610, 50, 210, 150, 'handover_record', [
      'PK id : uuid',
      'FK contract_id : uuid',
      'FK staff_id : uuid',
      '   handover_timestamp : timestamp',
      '   pin_code_hash : varchar(255)',
      '   inspection_checklist : jsonb',
      '   status : varchar(20)'
    ])}

    ${entityBox(40, 260, 230, 140, 'waitlist', [
      'PK id : uuid',
      'FK customer_id : uuid',
      'FK facility_id : uuid',
      'FK unit_type_id : uuid',
      '   priority_seq : int',
      '   status : varchar(20)',
      '   created_at : timestamp'
    ])}

    ${entityBox(330, 260, 230, 140, 'contract_renewal', [
      'PK id : uuid',
      'FK contract_id : uuid',
      '   extension_months : int',
      '   new_end_date : date',
      '   renewal_fee : decimal(12,2)',
      '   status : varchar(20)'
    ])}

    ${entityBox(610, 260, 210, 140, 'return_request', [
      'PK id : uuid',
      'FK contract_id : uuid',
      '   requested_date : date',
      '   actual_return_date : date',
      '   damage_assessed : decimal(12,2)',
      '   status : varchar(20)'
    ])}

    <path d="M 270 120 L 330 120" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <path d="M 560 120 L 610 120" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <path d="M 445 200 L 445 260" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <path d="M 530 200 L 610 280" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
  `;
  return buildDataSvg(width, height, content, 'ERD Part 2: Booking_Waitlist_Contract_And_Handover_Domain');
}

// 4. ERD Part 3: Finance & Policy
function generateErd3FinancePolicy() {
  const width = 850;
  const height = 550;
  const content = `
    ${entityBox(40, 50, 230, 150, 'payment_transaction', [
      'PK id : uuid',
      '   order_code : bigint UNIQUE',
      'FK reservation_id : uuid',
      'FK contract_id : uuid',
      '   amount : decimal(12,2)',
      '   payment_gateway : varchar(20)',
      '   status : varchar(20)'
    ])}

    ${entityBox(330, 50, 230, 150, 'ledger_entry', [
      'PK id : uuid',
      'FK transaction_id : uuid',
      'FK contract_id : uuid',
      '   entry_type : varchar(50)',
      '   debit_amount : decimal(12,2)',
      '   credit_amount : decimal(12,2)',
      '   recorded_at : timestamp'
    ])}

    ${entityBox(610, 50, 210, 150, 'policy_version', [
      'PK id : uuid',
      '   version_code : varchar(50)',
      '   deposit_multiplier : decimal(3,2)',
      '   buffer_days : int',
      '   grace_days : int',
      '   daily_penalty_rate : decimal(5,4)',
      '   is_active : boolean'
    ])}

    ${entityBox(40, 260, 230, 140, 'contract_extra_charge', [
      'PK id : uuid',
      'FK contract_id : uuid',
      '   charge_category : varchar(50)',
      '   amount : decimal(12,2)',
      '   reason : varchar(255)',
      '   is_settled : boolean'
    ])}

    ${entityBox(330, 260, 230, 140, 'deposit_settlement_voucher', [
      'PK id : uuid',
      'FK contract_id : uuid',
      '   original_deposit : decimal(12,2)',
      '   deductions : decimal(12,2)',
      '   net_refund_amount : decimal(12,2)',
      '   approval_status : varchar(20)'
    ])}

    <path d="M 270 120 L 330 120" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
    <path d="M 445 200 L 445 260" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
  `;
  return buildDataSvg(width, height, content, 'ERD Part 3: Financial_Ledger_Payment_And_Policy_Domain');
}

// 5. ERD Part 4: Support & Operations
function generateErd4SupportOps() {
  const width = 850;
  const height = 550;
  const content = `
    ${entityBox(40, 50, 230, 150, 'support_request', [
      'PK id : uuid',
      '   ticket_code : varchar(50)',
      'FK customer_id : uuid',
      'FK facility_id : uuid',
      'FK unit_id : uuid',
      '   category : varchar(50)',
      '   priority : varchar(20)',
      '   status : varchar(20)'
    ])}

    ${entityBox(330, 50, 230, 150, 'staff_shift_roster', [
      'PK id : uuid',
      'FK facility_id : uuid',
      'FK staff_id : uuid',
      '   shift_date : date',
      '   shift_type : varchar(20)',
      '   check_in_time : timestamp',
      '   status : varchar(20)'
    ])}

    ${entityBox(610, 50, 210, 150, 'activity_log', [
      'PK id : uuid',
      'FK actor_id : uuid',
      '   action : varchar(100)',
      '   entity_name : varchar(50)',
      '   entity_id : uuid',
      '   ip_address : varchar(45)',
      '   created_at : timestamp'
    ])}

    ${entityBox(40, 260, 230, 140, 'overdue_log', [
      'PK id : uuid',
      'FK contract_id : uuid',
      '   overdue_day_index : int',
      '   fee_applied : decimal(12,2)',
      '   pin_locked : boolean',
      '   logged_at : timestamp'
    ])}

    ${entityBox(330, 260, 230, 140, 'inspection_attachment', [
      'PK id : uuid',
      'FK inspection_id : uuid',
      '   file_url : varchar(500)',
      '   file_type : varchar(20)',
      '   uploaded_at : timestamp'
    ])}

    <path d="M 155 200 L 155 260" stroke="#000000" stroke-width="1.2" fill="none" marker-end="url(#arrow)" />
  `;
  return buildDataSvg(width, height, content, 'ERD Part 4: Operations_Attachments_And_Support_Domain');
}

const dataMap = [
  { file: 'conceptual-model.svg', gen: generateConceptualModel },
  { file: 'erd-1-identity-facility.svg', gen: generateErd1IdentityFacility },
  { file: 'erd-2-booking-contract.svg', gen: generateErd2BookingContract },
  { file: 'erd-3-finance-policy.svg', gen: generateErd3FinancePolicy },
  { file: 'erd-4-support-ops.svg', gen: generateErd4SupportOps }
];

dataMap.forEach(({ file, gen }) => {
  const svg = gen();
  fs.writeFileSync(path.join(dataDir, file), svg);
  console.log(`Generated: ${file}`);
});

