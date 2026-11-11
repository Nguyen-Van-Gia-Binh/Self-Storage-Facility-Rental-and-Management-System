const { generateSwimlane } = require('../lib/nutribot_swimlane');

const sl06_1 = {
  svgBase: 'sl-06-1-renewal',
  drawioBase: 'activity-diagram-flow-6-1-storage-renewal',
  poolTitle: 'Self-Storage Platform',
  caption: 'Swimlane 6.1: Flow_6_1_Contract_Renewal_And_Conflict_Check',
  lanes: [
    { id: 'customer', title: 'Storage Customer', width: 280 },
    { id: 'system', title: 'System', width: 340 },
    { id: 'vnpay', title: 'VNPay Gateway', width: 240 }
  ],
  nodes: [
    { id: 'start', lane: 'customer', type: 'start', y: 68 },
    { id: 'choose_term', lane: 'customer', type: 'action', y: 122, w: 184, h: 46, text: 'Open renewal page &\nselect N months (1..12)' },
    { id: 'chk_elig', lane: 'system', type: 'action', y: 122, w: 204, h: 46, text: 'Validate ACTIVE, UnitType,\nT-20 rule & term bounds' },

    { id: 'd_elig', lane: 'system', type: 'decision', y: 206, w: 152, h: 68, text: 'ACTIVE, >= T-20\n& type active?' },
    { id: 'show_block', lane: 'customer', type: 'action', y: 206, w: 184, h: 46, text: 'Show T-20 / OVERDUE block\n& contact FM or exit' },
    { id: 'end_blk', lane: 'customer', type: 'end', y: 268 },

    { id: 'chk_conflict', lane: 'system', type: 'action', y: 296, w: 204, h: 48, text: 'Check unit overlap (with\nbuffer) & live price' },
    { id: 'd_conflict', lane: 'system', type: 'decision', y: 384, w: 152, h: 68, text: 'Next period\nconflict-free?' },
    { id: 'show_conflict', lane: 'customer', type: 'action', y: 384, w: 184, h: 48, text: 'Show unit conflict alert &\npick shorter N or return' },

    { id: 'prep_quote', lane: 'system', type: 'action', y: 468, w: 204, h: 46, text: 'Build itemized quote\n(no extra deposit)' },
    { id: 'confirm_pay', lane: 'customer', type: 'action', y: 468, w: 184, h: 48, text: 'Review quote & click\nProceed to Payment' },

    { id: 'create_txn', lane: 'system', type: 'action', y: 552, w: 204, h: 48, text: 'Re-verify quote & create\nCONTRACT_RENEWAL txn' },
    { id: 'vnpay_pay', lane: 'vnpay', type: 'action', y: 552, w: 184, h: 48, text: 'Process VNPay checkout\n& send IPN callback' },

    { id: 'd_paid', lane: 'vnpay', type: 'decision', y: 640, w: 136, h: 66, text: 'Payment\nsucceeded?' },
    { id: 'apply_renew', lane: 'system', type: 'action', y: 640, w: 204, h: 48, text: 'Extend endDate idempotently\n& log ContractRenewal' },
    { id: 'view_receipt', lane: 'customer', type: 'action', y: 640, w: 184, h: 46, text: 'View extended endDate\n& E-Receipt modal' },
    { id: 'end_ok', lane: 'customer', type: 'end', y: 694 },

    { id: 'mark_fail', lane: 'system', type: 'action', y: 762, w: 204, h: 46, text: 'Mark txn FAILED/EXPIRED\n& keep contract unchanged' },
    { id: 'show_fail', lane: 'customer', type: 'action', y: 762, w: 184, h: 46, text: 'Show payment failure /\ntimeout & retry option' }
  ],
  edges: [
    { from: 'start', to: 'choose_term', exit: 'bottom', entry: 'top' },
    { from: 'choose_term', to: 'chk_elig', exit: 'right', entry: 'left' },
    { from: 'chk_elig', to: 'd_elig', exit: 'bottom', entry: 'top' },

    { from: 'd_elig', to: 'show_block', exit: 'left', entry: 'right', label: 'No', labelPos: [388, 196] },
    { from: 'show_block', to: 'end_blk', exit: 'bottom', entry: 'top' },

    { from: 'd_elig', to: 'chk_conflict', exit: 'bottom', entry: 'top', label: 'Yes', labelPos: [516, 254] },
    { from: 'chk_conflict', to: 'd_conflict', exit: 'bottom', entry: 'top' },

    { from: 'd_conflict', to: 'show_conflict', exit: 'left', entry: 'right', label: 'No', labelPos: [388, 374] },
    { from: 'show_conflict', to: 'choose_term', exit: 'left', entry: 'left', points: [[66, 384], [66, 122]] },

    { from: 'd_conflict', to: 'prep_quote', exit: 'bottom', entry: 'top', label: 'Yes', labelPos: [516, 430] },
    { from: 'prep_quote', to: 'confirm_pay', exit: 'left', entry: 'right' },
    { from: 'confirm_pay', to: 'create_txn', exit: 'bottom', entry: 'left', points: [[184, 552]] },
    { from: 'create_txn', to: 'vnpay_pay', exit: 'right', entry: 'left' },

    { from: 'vnpay_pay', to: 'd_paid', exit: 'bottom', entry: 'top' },
    { from: 'd_paid', to: 'apply_renew', exit: 'left', entry: 'right', label: 'Yes', labelPos: [684, 630] },
    { from: 'apply_renew', to: 'view_receipt', exit: 'left', entry: 'right' },
    { from: 'view_receipt', to: 'end_ok', exit: 'bottom', entry: 'top' },

    { from: 'd_paid', to: 'mark_fail', exit: 'bottom', entry: 'right', points: [[784, 762]], label: 'No', labelPos: [806, 692] },
    { from: 'mark_fail', to: 'show_fail', exit: 'left', entry: 'right' },
    { from: 'show_fail', to: 'confirm_pay', exit: 'left', entry: 'left', points: [[66, 762], [66, 468]] }
  ]
};

generateSwimlane(sl06_1);
