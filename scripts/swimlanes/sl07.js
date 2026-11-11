const { generateSwimlane } = require('../lib/nutribot_swimlane');

const sl07 = {
  svgBase: 'sl-07-support',
  drawioBase: 'activity-diagram-flow-7-support-incident-handling',
  poolTitle: 'Self-Storage Platform',
  caption: 'Swimlane 7: Flow_7_Customer_Support_And_Incident_Resolution',
  lanes: [
    { id: 'customer', title: 'Storage Customer', width: 270 },
    { id: 'system', title: 'System', width: 310 },
    { id: 'staff', title: 'Facility Manager & Staff', width: 290 }
  ],
  nodes: [
    { id: 'start', lane: 'customer', type: 'start', y: 68 },
    { id: 'submit_tkt', lane: 'customer', type: 'action', y: 122, w: 184, h: 46, text: 'Submit support ticket &\n<= 5 evidence photos' },
    { id: 'create_tkt', lane: 'system', type: 'action', y: 122, w: 196, h: 46, text: 'Validate contract & create\nSUP ticket (status NEW)' },
    { id: 'assign_staff', lane: 'staff', type: 'action', y: 122, w: 192, h: 46, text: 'Review workload & assign\nACTIVE facility staff' },

    { id: 'verify_assign', lane: 'system', type: 'action', y: 204, w: 196, h: 48, text: 'Verify staff facility &\nupsert task (ASSIGNED)' },
    { id: 'start_fix', lane: 'staff', type: 'action', y: 290, w: 192, h: 46, text: 'Start on-site inspection\n(status IN_PROGRESS)' },

    { id: 'd_reloc', lane: 'staff', type: 'decision', y: 382, w: 152, h: 68, text: 'Unit relocation\nrequired?' },
    { id: 'resolve_onsite', lane: 'system', type: 'action', y: 382, w: 200, h: 48, text: 'Save note & <= 5 photos;\nclose (or 7d auto-close)' },
    { id: 'view_close', lane: 'customer', type: 'action', y: 382, w: 184, h: 48, text: 'Review resolution outcome\n& confirmation status' },
    { id: 'end_std', lane: 'customer', type: 'end', y: 444 },

    { id: 'flag_reloc', lane: 'staff', type: 'action', y: 476, w: 192, h: 48, text: 'Flag relocationRequired &\nblock premature close' },
    { id: 'reassign_unit', lane: 'staff', type: 'action', y: 560, w: 192, h: 48, text: 'Select same/larger unit &\nexecute reassign-unit' },
    { id: 'exec_reloc', lane: 'system', type: 'action', y: 560, w: 204, h: 50, text: 'Set old unit MAINTENANCE,\nbind new unit & CLOSE' },
    { id: 'view_reloc', lane: 'customer', type: 'action', y: 560, w: 184, h: 48, text: 'View relocation notice\n(rent & deposit kept)' },
    { id: 'end_reloc', lane: 'customer', type: 'end', y: 622 }
  ],
  edges: [
    { from: 'start', to: 'submit_tkt', exit: 'bottom', entry: 'top' },
    { from: 'submit_tkt', to: 'create_tkt', exit: 'right', entry: 'left' },
    { from: 'create_tkt', to: 'assign_staff', exit: 'right', entry: 'left' },

    { from: 'assign_staff', to: 'verify_assign', exit: 'bottom', entry: 'right', points: [[769, 204]] },
    { from: 'verify_assign', to: 'start_fix', exit: 'bottom', entry: 'top', points: [[469, 250], [769, 250]] },
    { from: 'start_fix', to: 'd_reloc', exit: 'bottom', entry: 'top' },

    { from: 'd_reloc', to: 'resolve_onsite', exit: 'left', entry: 'right', label: 'No', labelPos: [656, 372] },
    { from: 'resolve_onsite', to: 'view_close', exit: 'left', entry: 'right' },
    { from: 'view_close', to: 'end_std', exit: 'bottom', entry: 'top' },

    { from: 'd_reloc', to: 'flag_reloc', exit: 'bottom', entry: 'top', label: 'Yes', labelPos: [790, 432] },
    { from: 'flag_reloc', to: 'reassign_unit', exit: 'bottom', entry: 'top' },
    { from: 'reassign_unit', to: 'exec_reloc', exit: 'left', entry: 'right' },
    { from: 'exec_reloc', to: 'view_reloc', exit: 'left', entry: 'right' },
    { from: 'view_reloc', to: 'end_reloc', exit: 'bottom', entry: 'top' }
  ]
};

generateSwimlane(sl07);

