const { generateSwimlane } = require('../lib/nutribot_swimlane');

const sl02 = {
  svgBase: 'sl-02-checkin-handover',
  drawioBase: 'activity-diagram-flow-2-checkin-handover',
  poolTitle: 'Self-Storage Platform',
  caption: 'Swimlane 2: Flow_2_Checkin_Physical_Handover_And_Auto_Activation',
  lanes: [
    { id: 'customer', title: 'Storage Customer', width: 270 },
    { id: 'system', title: 'System', width: 290 },
    { id: 'staff', title: 'Facility Manager & Staff', width: 280 }
  ],
  nodes: [
    { id: 'start', lane: 'staff', type: 'start', y: 66 },
    { id: 'alloc_unit', lane: 'staff', type: 'action', y: 130, w: 184, h: 46, text: 'Allocate physical unit &\nassign check-in staff' },
    { id: 'bind_unit', lane: 'system', type: 'action', y: 130, w: 176, h: 46, text: 'Bind unit (RESERVED) &\nissue move-in pass' },

    { id: 'd_grace', lane: 'system', type: 'decision', y: 212, w: 132, h: 64, text: 'Checked in within\n10-day grace?' },
    { id: 'auto_act', lane: 'system', type: 'action', y: 286, w: 192, h: 46, text: 'Auto-activate ACTIVE, set\nOCCUPIED & email PIN' },
    { id: 'end_auto', lane: 'system', type: 'end', y: 340 },

    { id: 'arrive', lane: 'customer', type: 'action', y: 212, w: 172, h: 46, text: 'Arrive or open portal\nwith Citizen ID & pass' },
    { id: 'verify_id', lane: 'staff', type: 'action', y: 382, w: 184, h: 46, text: 'Verify Citizen ID &\nmove-in pass status' },
    { id: 'd_id', lane: 'staff', type: 'decision', y: 468, w: 118, h: 64, text: 'ID & pass\nvalid?' },
    { id: 'show_id_err', lane: 'customer', type: 'action', y: 468, w: 172, h: 46, text: 'Pause check-in &\nshow ID mismatch' },

    { id: 'inspect_4pt', lane: 'staff', type: 'action', y: 560, w: 188, h: 48, text: 'Execute 4-point inspect\n(lock, clean, light, air)' },
    { id: 'd_pass', lane: 'staff', type: 'decision', y: 648, w: 126, h: 66, text: 'Passes 4-point\ninspection?' },

    { id: 'sign_handover', lane: 'customer', type: 'action', y: 648, w: 172, h: 46, text: 'Co-sign digital\nhandover protocol' },
    { id: 'activate', lane: 'system', type: 'action', y: 728, w: 188, h: 48, text: 'Set ACTIVE & OCCUPIED,\ngenerate 6-digit PIN' },
    { id: 'receive_pin', lane: 'customer', type: 'action', y: 808, w: 172, h: 46, text: 'Receive 6-digit PIN &\nunlock unit 24/7' },
    { id: 'end_ok', lane: 'customer', type: 'end', y: 874 },

    { id: 'mark_maint', lane: 'system', type: 'action', y: 936, w: 184, h: 46, text: 'Mark unit MAINTENANCE\n& log handover defects' },
    { id: 'd_relocate', lane: 'customer', type: 'decision', y: 936, w: 122, h: 64, text: 'Accept unit\nrelocation?' },
    { id: 'term_refund', lane: 'system', type: 'action', y: 1026, w: 188, h: 48, text: 'Terminate contract &\nissue 100% refund' },
    { id: 'end_refund', lane: 'system', type: 'end', y: 1090 }
  ],
  edges: [
    { from: 'start', to: 'alloc_unit', exit: 'bottom', entry: 'top' },
    { from: 'alloc_unit', to: 'bind_unit', exit: 'left', entry: 'right' },
    { from: 'bind_unit', to: 'd_grace', exit: 'bottom', entry: 'top' },

    { from: 'd_grace', to: 'auto_act', exit: 'bottom', entry: 'top', label: 'No (T+11)', labelPos: [494, 250] },
    { from: 'auto_act', to: 'end_auto', exit: 'bottom', entry: 'top' },

    { from: 'd_grace', to: 'arrive', exit: 'left', entry: 'right', label: 'Yes', labelPos: [365, 202] },
    { from: 'arrive', to: 'verify_id', exit: 'bottom', entry: 'left', points: [[179, 382]] },
    { from: 'verify_id', to: 'd_id', exit: 'bottom', entry: 'top' },

    { from: 'd_id', to: 'show_id_err', exit: 'left', entry: 'right', label: 'No', labelPos: [656, 458] },
    { from: 'show_id_err', to: 'arrive', exit: 'left', entry: 'left', points: [[72, 468], [72, 212]] },

    { from: 'd_id', to: 'inspect_4pt', exit: 'bottom', entry: 'top', label: 'Yes', labelPos: [764, 514] },
    { from: 'inspect_4pt', to: 'd_pass', exit: 'bottom', entry: 'top' },

    { from: 'd_pass', to: 'sign_handover', exit: 'left', entry: 'right', label: 'Yes', labelPos: [648, 638] },
    { from: 'sign_handover', to: 'activate', exit: 'bottom', entry: 'left', points: [[179, 728]] },
    { from: 'activate', to: 'receive_pin', exit: 'bottom', entry: 'right', points: [[459, 808]] },
    { from: 'receive_pin', to: 'end_ok', exit: 'bottom', entry: 'top' },

    { from: 'd_pass', to: 'mark_maint', exit: 'bottom', entry: 'right', points: [[744, 936]], label: 'No (Defect)', labelPos: [786, 710] },
    { from: 'mark_maint', to: 'd_relocate', exit: 'left', entry: 'right' },
    { from: 'd_relocate', to: 'alloc_unit', exit: 'left', entry: 'top', points: [[52, 936], [52, 90], [744, 90]], label: 'Yes', labelPos: [92, 926] },
    { from: 'd_relocate', to: 'term_refund', exit: 'bottom', entry: 'left', points: [[179, 1026]], label: 'No (Refund)', labelPos: [222, 1016] },
    { from: 'term_refund', to: 'end_refund', exit: 'bottom', entry: 'top' }
  ]
};

generateSwimlane(sl02);

