const { generateSwimlane } = require('../lib/nutribot_swimlane');

const sl00 = {
  svgBase: 'sl-00-end-to-end',
  drawioBase: 'activity-diagram-flow-0-end-to-end',
  poolTitle: 'Self-Storage Platform',
  caption: 'Swimlane 0: End_To_End_Self_Storage_Operational_Lifecycle',
  lanes: [
    { id: 'bom', title: 'Business Ops Manager', width: 210 },
    { id: 'customer', title: 'Storage Customer', width: 260 },
    { id: 'system', title: 'System', width: 290 },
    { id: 'staff', title: 'Facility Manager & Staff', width: 260 }
  ],
  nodes: [
    { id: 'start', lane: 'bom', type: 'start', y: 68 },
    { id: 'setup_catalog', lane: 'bom', type: 'action', y: 118, w: 174, h: 46, text: 'Configure facilities, policy\n& per-m2 pricing (Flow 4)' },
    { id: 'publish_catalog', lane: 'system', type: 'action', y: 118, w: 196, h: 46, text: 'Validate catalog rules &\npublish live pricing (F4)' },

    { id: 'book_pay', lane: 'customer', type: 'action', y: 204, w: 184, h: 46, text: 'Search units, hold 48h\n& pay via VNPay (Flow 1)' },
    { id: 'create_ctr', lane: 'system', type: 'action', y: 204, w: 196, h: 46, text: 'Handle waitlist / payment\n& assign staff (F1, F5)' },
    { id: 'handover_chk', lane: 'staff', type: 'action', y: 204, w: 188, h: 46, text: 'Allocate unit & execute\n4-pt handover (Flow 2)' },

    { id: 'activate_pin', lane: 'system', type: 'action', y: 294, w: 196, h: 48, text: 'Set ACTIVE/OCCUPIED &\nemail PIN (or T+11 auto)' },
    { id: 'occupy_lease', lane: 'customer', type: 'action', y: 294, w: 184, h: 48, text: 'Occupy unit; renew >=T-20\n(F6.1) or ticket (F7)' },

    { id: 'd_ret', lane: 'customer', type: 'decision', y: 386, w: 146, h: 66, text: 'Return submitted\nbefore endDate?' },
    { id: 'run_overdue', lane: 'system', type: 'action', y: 386, w: 196, h: 48, text: 'Run 00:00 cron: lock PIN\nD+1 & accrue fee (F6.2)' },

    { id: 'd_ovd', lane: 'system', type: 'decision', y: 478, w: 148, h: 66, text: 'Penalty settled\nbefore D+7?' },
    { id: 'settle_ovd', lane: 'customer', type: 'action', y: 478, w: 184, h: 48, text: 'Pay OVERDUE_PENALTY &\nget PIN (keep OVERDUE)' },
    { id: 'seal_depot', lane: 'staff', type: 'action', y: 478, w: 188, h: 48, text: 'Seal unit (MAINTENANCE 1d)\n& move goods to depot' },

    { id: 'term_d7', lane: 'system', type: 'action', y: 564, w: 196, h: 48, text: 'Liquidate 100% deposit,\nTERMINATE & release D+8' },
    { id: 'end_d7', lane: 'system', type: 'end', y: 616 },

    { id: 'submit_ret', lane: 'customer', type: 'action', y: 672, w: 184, h: 48, text: 'Submit Return Notice\n(if OVERDUE, debt == 0)' },
    { id: 'prep_ret', lane: 'system', type: 'action', y: 672, w: 214, h: 48, text: 'Revoke PIN, set PENDING_RETURN\n& route exit task (F3)' },
    { id: 'inspect_exit', lane: 'staff', type: 'action', y: 672, w: 188, h: 48, text: 'Execute exit inspection &\napprove settlement (F3)' },

    { id: 'close_ctr', lane: 'system', type: 'action', y: 762, w: 196, h: 48, text: 'Settle balance, set CLOSED\n& CLEANING -> AVAILABLE' },
    { id: 'view_done', lane: 'customer', type: 'action', y: 762, w: 184, h: 48, text: 'Receive refund/receipt &\ncomplete rental lifecycle' },
    { id: 'end_ok', lane: 'customer', type: 'end', y: 824 }
  ],
  edges: [
    { from: 'start', to: 'setup_catalog', exit: 'bottom', entry: 'top' },
    { from: 'setup_catalog', to: 'publish_catalog', exit: 'right', entry: 'left' },
    { from: 'publish_catalog', to: 'book_pay', exit: 'bottom', entry: 'top', points: [[659, 162], [384, 162]] },
    { from: 'book_pay', to: 'create_ctr', exit: 'right', entry: 'left' },
    { from: 'create_ctr', to: 'handover_chk', exit: 'right', entry: 'left' },

    { from: 'handover_chk', to: 'activate_pin', exit: 'bottom', entry: 'right', points: [[934, 294]] },
    { from: 'activate_pin', to: 'occupy_lease', exit: 'left', entry: 'right' },
    { from: 'occupy_lease', to: 'd_ret', exit: 'bottom', entry: 'top' },

    { from: 'd_ret', to: 'submit_ret', exit: 'left', entry: 'left', points: [[272, 386], [272, 672]], label: 'Yes', labelPos: [294, 376] },
    { from: 'd_ret', to: 'run_overdue', exit: 'right', entry: 'left', label: 'No', labelPos: [484, 376] },
    { from: 'run_overdue', to: 'd_ovd', exit: 'bottom', entry: 'top' },

    { from: 'd_ovd', to: 'settle_ovd', exit: 'left', entry: 'right', label: 'Yes', labelPos: [552, 468] },
    { from: 'settle_ovd', to: 'submit_ret', exit: 'bottom', entry: 'top' },

    { from: 'd_ovd', to: 'seal_depot', exit: 'right', entry: 'left', label: 'No', labelPos: [766, 468] },
    { from: 'seal_depot', to: 'term_d7', exit: 'bottom', entry: 'right', points: [[934, 564]] },
    { from: 'term_d7', to: 'end_d7', exit: 'bottom', entry: 'top' },

    { from: 'submit_ret', to: 'prep_ret', exit: 'right', entry: 'left' },
    { from: 'prep_ret', to: 'inspect_exit', exit: 'right', entry: 'left' },
    { from: 'inspect_exit', to: 'close_ctr', exit: 'bottom', entry: 'right', points: [[934, 762]] },
    { from: 'close_ctr', to: 'view_done', exit: 'left', entry: 'right' },
    { from: 'view_done', to: 'end_ok', exit: 'bottom', entry: 'top' }
  ]
};

generateSwimlane(sl00);
