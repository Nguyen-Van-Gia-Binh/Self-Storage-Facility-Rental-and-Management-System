const { generateSwimlane } = require('../lib/nutribot_swimlane');

const sl01 = {
  svgBase: 'sl-01-reservation',
  drawioBase: 'activity-diagram-flow-1-storage-reservation',
  poolTitle: 'Self-Storage Platform',
  caption: 'Swimlane 1: Flow_1_Storage_Unit_Reservation_And_Payment',
  lanes: [
    { id: 'customer', title: 'Storage Customer', width: 280 },
    { id: 'system', title: 'System', width: 390 },
    { id: 'vnpay', title: 'VNPay Gateway', width: 230 }
  ],
  nodes: [
    { id: 'start', lane: 'customer', type: 'start', y: 74 },
    { id: 'browse', lane: 'customer', type: 'action', y: 128, w: 172, h: 46, text: 'Select facility, unit type\n& rental period' },
    { id: 'submit_book', lane: 'customer', type: 'action', y: 200, w: 172, h: 42, text: 'Submit booking request' },

    { id: 'validate', lane: 'system', type: 'action', y: 200, w: 184, h: 52, text: 'Validate account, debt,\nspam & 30-day window' },
    { id: 'd_eligible', lane: 'system', type: 'decision', y: 286, w: 120, h: 66, text: 'Booking\neligible?' },
    { id: 'show_err', lane: 'customer', type: 'action', y: 286, w: 172, h: 46, text: 'Show booking error &\nadjust selection' },

    { id: 'lock_check', lane: 'system', type: 'action', y: 378, w: 184, h: 48, text: 'Lock & check quota,\ncalculate rent & deposit' },
    { id: 'd_capacity', lane: 'system', type: 'decision', y: 466, w: 116, h: 64, text: 'Capacity\n> 0?' },
    { id: 'join_waitlist', lane: 'customer', type: 'action', y: 466, w: 168, h: 46, text: 'Join FIFO waitlist\nqueue' },
    { id: 'end_waitlist', lane: 'customer', type: 'end', y: 534 },

    { id: 'create_hold', lane: 'system', type: 'action', y: 562, w: 198, h: 50, text: 'Create hold (48h) &\ngenerate VNPay checkout' },
    { id: 'open_vnpay', lane: 'customer', type: 'action', y: 646, w: 172, h: 46, text: 'Open VNPay checkout\n& select bank method' },
    { id: 'vnpay_process', lane: 'vnpay', type: 'action', y: 646, w: 168, h: 48, text: 'Process bank/card &\nsend IPN / return' },

    { id: 'verify_ipn', lane: 'system', type: 'action', y: 730, w: 192, h: 48, text: 'Verify VNPay checksum,\namount & 48h hold' },
    { id: 'd_paid', lane: 'system', type: 'decision', y: 818, w: 124, h: 66, text: 'Paid & within\n48h hold?' },
    { id: 'd_retry', lane: 'customer', type: 'decision', y: 818, w: 118, h: 64, text: 'Retry within\n48h?' },

    { id: 'expire_hold', lane: 'system', type: 'action', dx: -95, y: 906, w: 160, h: 48, text: 'Mark EXPIRED &\nrelease held quota' },
    { id: 'end_expired', lane: 'system', type: 'end', dx: -95, y: 974 },

    { id: 'confirm_rsv', lane: 'system', type: 'action', dx: 95, y: 906, w: 166, h: 50, text: 'Confirm reservation &\ncreate rental contract' },
    { id: 'view_confirm', lane: 'customer', type: 'action', y: 1020, w: 172, h: 48, text: 'Receive confirmation &\nawait unit check-in' },
    { id: 'end_ok', lane: 'customer', type: 'end', y: 1086 }
  ],
  edges: [
    { from: 'start', to: 'browse', exit: 'bottom', entry: 'top' },
    { from: 'browse', to: 'submit_book', exit: 'bottom', entry: 'top' },
    { from: 'submit_book', to: 'validate', exit: 'right', entry: 'left' },
    { from: 'validate', to: 'd_eligible', exit: 'bottom', entry: 'top' },

    { from: 'd_eligible', to: 'show_err', exit: 'left', entry: 'right', label: 'No', labelPos: [400, 276] },
    { from: 'show_err', to: 'browse', exit: 'left', entry: 'left', points: [[64, 286], [64, 128]] },

    { from: 'd_eligible', to: 'lock_check', exit: 'bottom', entry: 'top', label: 'Yes', labelPos: [536, 332] },
    { from: 'lock_check', to: 'd_capacity', exit: 'bottom', entry: 'top' },

    { from: 'd_capacity', to: 'join_waitlist', exit: 'left', entry: 'right', label: 'No', labelPos: [402, 456] },
    { from: 'join_waitlist', to: 'end_waitlist', exit: 'bottom', entry: 'top' },

    { from: 'd_capacity', to: 'create_hold', exit: 'bottom', entry: 'top', label: 'Yes', labelPos: [536, 514] },
    { from: 'create_hold', to: 'open_vnpay', exit: 'bottom', entry: 'top', points: [[519, 602], [184, 602]] },
    { from: 'open_vnpay', to: 'vnpay_process', exit: 'right', entry: 'left', label: 'Checkout URL', labelPos: [519, 636] },
    { from: 'vnpay_process', to: 'verify_ipn', exit: 'bottom', entry: 'right', points: [[829, 730]], label: 'IPN / Return', labelPos: [765, 720] },
    { from: 'verify_ipn', to: 'd_paid', exit: 'bottom', entry: 'top' },

    { from: 'd_paid', to: 'd_retry', exit: 'left', entry: 'right', label: 'No', labelPos: [402, 808] },
    { from: 'd_retry', to: 'open_vnpay', exit: 'left', entry: 'left', points: [[64, 818], [64, 646]], label: 'Yes', labelPos: [95, 808] },
    { from: 'd_retry', to: 'expire_hold', exit: 'bottom', entry: 'left', points: [[184, 906]], label: 'No / Timeout', labelPos: [232, 896] },
    { from: 'expire_hold', to: 'end_expired', exit: 'bottom', entry: 'top' },

    { from: 'd_paid', to: 'confirm_rsv', exit: 'right', entry: 'top', points: [[614, 818]], label: 'Yes', labelPos: [596, 808] },
    { from: 'confirm_rsv', to: 'view_confirm', exit: 'bottom', entry: 'right', points: [[614, 1020]] },
    { from: 'view_confirm', to: 'end_ok', exit: 'bottom', entry: 'top' }
  ]
};

generateSwimlane(sl01);

