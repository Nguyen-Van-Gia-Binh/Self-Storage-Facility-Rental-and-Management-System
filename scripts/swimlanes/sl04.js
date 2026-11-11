const { generateSwimlane } = require('../lib/nutribot_swimlane');

const sl04 = {
  svgBase: 'sl-04-bom-operations',
  drawioBase: 'activity-diagram-flow-4-business-operations',
  poolTitle: 'Self-Storage Platform',
  caption: 'Swimlane 4: Flow_4_BOM_Policy_Pricing_And_Analytics',
  lanes: [
    { id: 'bom', title: 'Business Operations Manager', width: 310 },
    { id: 'system', title: 'System', width: 420 }
  ],
  nodes: [
    { id: 'start', lane: 'bom', type: 'start', y: 68 },
    { id: 'edit_fac', lane: 'bom', type: 'action', y: 124, w: 184, h: 46, text: 'Manage facilities, unit\ntypes & active status' },
    { id: 'chk_fac', lane: 'system', type: 'action', y: 124, w: 192, h: 46, text: 'Validate FAC code & active\ncontracts before disable' },

    { id: 'd_fac_ok', lane: 'system', type: 'decision', y: 210, w: 126, h: 64, text: 'Valid & safe\nto save?' },
    { id: 'show_fac_err', lane: 'bom', type: 'action', y: 210, w: 180, h: 46, text: 'Show active-contract or\ncode conflict error' },
    { id: 'save_fac', lane: 'system', type: 'action', y: 298, w: 192, h: 46, text: 'Persist catalog changes\n& evict facility cache' },

    { id: 'cfg_price', lane: 'bom', type: 'action', y: 382, w: 188, h: 46, text: 'Set policy version, price\n(per m2) & effective date' },
    { id: 'val_price', lane: 'system', type: 'action', y: 382, w: 196, h: 48, text: 'Validate dates, bounds,\nACTIVE branch & opt lock' },

    { id: 'd_price_ok', lane: 'system', type: 'decision', y: 470, w: 132, h: 64, text: 'Rules & version\nlock valid?' },
    { id: 'show_price_err', lane: 'bom', type: 'action', y: 470, w: 184, h: 46, text: 'Show validation or lock\nconflict & re-enter' },

    { id: 'd_apply_now', lane: 'system', type: 'decision', y: 560, w: 132, h: 64, text: 'Effective date\n<= today?' },
    { id: 'save_live', lane: 'system', type: 'action', dx: -108, y: 650, w: 170, h: 48, text: 'Save immutable version\n& update live price/policy' },
    { id: 'save_sched', lane: 'system', type: 'action', dx: 108, y: 650, w: 170, h: 48, text: 'Save future-dated\nscheduled price version' },

    { id: 'calc_kpi', lane: 'system', type: 'action', y: 744, w: 180, h: 48, text: 'Compute Usage Rate &\n4-stream revenue KPIs' },
    { id: 'view_kpi', lane: 'bom', type: 'action', y: 744, w: 184, h: 46, text: 'Review live pricing &\nsystem KPI dashboard' },
    { id: 'end_ok', lane: 'bom', type: 'end', y: 810 }
  ],
  edges: [
    { from: 'start', to: 'edit_fac', exit: 'bottom', entry: 'top' },
    { from: 'edit_fac', to: 'chk_fac', exit: 'right', entry: 'left' },
    { from: 'chk_fac', to: 'd_fac_ok', exit: 'bottom', entry: 'top' },

    { from: 'd_fac_ok', to: 'show_fac_err', exit: 'left', entry: 'right', label: 'No', labelPos: [425, 200] },
    { from: 'show_fac_err', to: 'edit_fac', exit: 'left', entry: 'left', points: [[72, 210], [72, 124]] },

    { from: 'd_fac_ok', to: 'save_fac', exit: 'bottom', entry: 'top', label: 'Yes', labelPos: [584, 258] },
    { from: 'save_fac', to: 'cfg_price', exit: 'bottom', entry: 'top', points: [[564, 340], [199, 340]] },
    { from: 'cfg_price', to: 'val_price', exit: 'right', entry: 'left' },
    { from: 'val_price', to: 'd_price_ok', exit: 'bottom', entry: 'top' },

    { from: 'd_price_ok', to: 'show_price_err', exit: 'left', entry: 'right', label: 'No', labelPos: [425, 460] },
    { from: 'show_price_err', to: 'cfg_price', exit: 'left', entry: 'left', points: [[72, 470], [72, 382]] },

    { from: 'd_price_ok', to: 'd_apply_now', exit: 'bottom', entry: 'top', label: 'Yes', labelPos: [584, 514] },
    { from: 'd_apply_now', to: 'save_live', exit: 'left', entry: 'top', points: [[456, 560]], label: 'Yes', labelPos: [476, 550] },
    { from: 'd_apply_now', to: 'save_sched', exit: 'right', entry: 'top', points: [[672, 560]], label: 'No', labelPos: [652, 550] },

    { from: 'save_live', to: 'calc_kpi', exit: 'bottom', entry: 'top', points: [[456, 696], [564, 696]] },
    { from: 'save_sched', to: 'calc_kpi', exit: 'bottom', entry: 'right', points: [[672, 744]] },

    { from: 'calc_kpi', to: 'view_kpi', exit: 'left', entry: 'right' },
    { from: 'view_kpi', to: 'end_ok', exit: 'bottom', entry: 'top' }
  ]
};

generateSwimlane(sl04);
