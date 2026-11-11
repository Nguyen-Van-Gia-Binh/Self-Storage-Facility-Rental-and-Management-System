const { generateSwimlane } = require('../lib/nutribot_swimlane');

const sl03 = {
  svgBase: 'sl-03-return-settlement',
  drawioBase: 'activity-diagram-flow-3-return-settlement',
  poolTitle: 'Self-Storage Platform',
  caption: 'Swimlane 3: Flow_3_Checkout_Return_And_Final_Settlement',
  lanes: [
    { id: 'customer', title: 'Storage Customer', width: 270 },
    { id: 'system', title: 'System', width: 300 },
    { id: 'staff', title: 'Facility Manager & Staff', width: 290 }
  ],
  nodes: [
    { id: 'start', lane: 'customer', type: 'start', y: 68 },
    { id: 'submit_ret', lane: 'customer', type: 'action', y: 124, w: 172, h: 46, text: 'Submit return notice\n(on-time or early)' },
    { id: 'check_debt', lane: 'system', type: 'action', y: 124, w: 180, h: 46, text: 'Check contract status\n& overdue debt' },

    { id: 'd_debt', lane: 'system', type: 'decision', y: 208, w: 124, h: 64, text: 'Overdue debt\n== 0?' },
    { id: 'block_debt', lane: 'customer', type: 'action', y: 208, w: 174, h: 46, text: 'Show debt block &\nrequire penalty settlement' },
    { id: 'end_debt', lane: 'customer', type: 'end', y: 274 },

    { id: 'create_ret', lane: 'system', type: 'action', y: 302, w: 186, h: 46, text: 'Set PENDING_RETURN &\ncreate return request' },
    { id: 'inspect_exit', lane: 'staff', type: 'action', y: 302, w: 188, h: 48, text: 'Inspect unit & collect\ncustomer co-signature' },

    { id: 'd_intact', lane: 'staff', type: 'decision', y: 392, w: 118, h: 64, text: 'Unit intact\n("GOOD")?' },
    { id: 'add_fees', lane: 'staff', type: 'action', y: 482, w: 186, h: 46, text: 'Record damage/cleaning\nfees & photo evidence' },

    { id: 'calc_settle', lane: 'system', type: 'action', y: 572, w: 196, h: 50, text: 'Revoke PIN, set CLEANING\n& calc net settlement' },
    { id: 'approve_settle', lane: 'staff', type: 'action', y: 658, w: 184, h: 46, text: 'Review & approve\nfinal settlement balance' },

    { id: 'd_deficit', lane: 'system', type: 'decision', y: 744, w: 126, h: 64, text: 'Net refund\n>= 0?' },
    { id: 'pay_deficit', lane: 'customer', type: 'action', y: 744, w: 176, h: 48, text: 'Pay settlement deficit\nvia VNPay checkout' },

    { id: 'close_contract', lane: 'system', type: 'action', y: 832, w: 192, h: 48, text: 'Close contract (CLOSED),\nrecord ledger & refund' },
    { id: 'complete_clean', lane: 'staff', type: 'action', y: 832, w: 188, h: 48, text: 'Finish unit sanitation\n(AVAILABLE / RESERVED)' },
    { id: 'receive_refund', lane: 'customer', type: 'action', y: 922, w: 176, h: 46, text: 'Receive deposit refund\n(3-5 days) & receipt' },
    { id: 'end_ok', lane: 'customer', type: 'end', y: 988 }
  ],
  edges: [
    { from: 'start', to: 'submit_ret', exit: 'bottom', entry: 'top' },
    { from: 'submit_ret', to: 'check_debt', exit: 'right', entry: 'left' },
    { from: 'check_debt', to: 'd_debt', exit: 'bottom', entry: 'top' },

    { from: 'd_debt', to: 'block_debt', exit: 'left', entry: 'right', label: 'No', labelPos: [365, 198] },
    { from: 'block_debt', to: 'end_debt', exit: 'bottom', entry: 'top' },

    { from: 'd_debt', to: 'create_ret', exit: 'bottom', entry: 'top', label: 'Yes', labelPos: [484, 256] },
    { from: 'create_ret', to: 'inspect_exit', exit: 'right', entry: 'left' },
    { from: 'inspect_exit', to: 'd_intact', exit: 'bottom', entry: 'top' },

    { from: 'd_intact', to: 'add_fees', exit: 'bottom', entry: 'top', label: 'No', labelPos: [778, 438] },
    { from: 'add_fees', to: 'calc_settle', exit: 'bottom', entry: 'right', points: [[759, 572]] },
    { from: 'd_intact', to: 'calc_settle', exit: 'left', entry: 'top', points: [[464, 392]], label: 'Yes', labelPos: [656, 382] },

    { from: 'calc_settle', to: 'approve_settle', exit: 'bottom', entry: 'left', points: [[464, 658]] },
    { from: 'approve_settle', to: 'd_deficit', exit: 'bottom', entry: 'top', points: [[759, 704], [464, 704]] },

    { from: 'd_deficit', to: 'pay_deficit', exit: 'left', entry: 'right', label: 'No (Deficit)', labelPos: [348, 734] },
    { from: 'pay_deficit', to: 'close_contract', exit: 'bottom', entry: 'left', points: [[179, 832]] },

    { from: 'd_deficit', to: 'close_contract', exit: 'bottom', entry: 'top', label: 'Yes', labelPos: [484, 790] },
    { from: 'close_contract', to: 'complete_clean', exit: 'right', entry: 'left' },
    { from: 'complete_clean', to: 'receive_refund', exit: 'bottom', entry: 'right', points: [[759, 922]] },
    { from: 'receive_refund', to: 'end_ok', exit: 'bottom', entry: 'top' }
  ]
};

generateSwimlane(sl03);

