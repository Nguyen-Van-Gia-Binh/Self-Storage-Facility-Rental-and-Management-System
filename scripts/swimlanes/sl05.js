const { generateSwimlane } = require('../lib/nutribot_swimlane');

const sl05 = {
  svgBase: 'sl-05-facility-staff',
  drawioBase: 'activity-diagram-flow-5-facility-staff-management',
  poolTitle: 'Self-Storage Platform',
  caption: 'Swimlane 5: Flow_5_Facility_Unit_And_Staff_Management',
  lanes: [
    { id: 'fm', title: 'Facility Manager', width: 280 },
    { id: 'system', title: 'System', width: 320 },
    { id: 'staff', title: 'Facility Staff', width: 260 }
  ],
  nodes: [
    { id: 'start', lane: 'fm', type: 'start', y: 68 },
    { id: 'manage_unit', lane: 'fm', type: 'action', y: 122, w: 184, h: 46, text: 'Create unit(s) or toggle\nMAINTENANCE / OOS' },
    { id: 'chk_unit', lane: 'system', type: 'action', y: 122, w: 196, h: 46, text: 'Verify JWT facility scope,\ncode uniqueness & state' },

    { id: 'd_unit_ok', lane: 'system', type: 'decision', y: 208, w: 148, h: 68, text: 'Access, code &\nstatus valid?' },
    { id: 'show_unit_err', lane: 'fm', type: 'action', y: 208, w: 180, h: 46, text: 'Show 403/409 error &\nadjust unit action' },
    { id: 'save_unit', lane: 'system', type: 'action', y: 294, w: 196, h: 46, text: 'Persist unit state & update\nreal-time availability' },

    { id: 'assign_task', lane: 'fm', type: 'action', y: 374, w: 184, h: 46, text: 'Inspect workload & assign\nCheck-in/Return/Incident' },
    { id: 'chk_staff', lane: 'system', type: 'action', y: 374, w: 196, h: 46, text: 'Check staff ACTIVE status\n& facility membership' },

    { id: 'd_staff_ok', lane: 'system', type: 'decision', y: 460, w: 148, h: 68, text: 'Staff ACTIVE &\nin facility?' },
    { id: 'show_staff_err', lane: 'fm', type: 'action', y: 460, w: 180, h: 46, text: 'Show staff error &\npick eligible staff' },
    { id: 'save_assign', lane: 'system', type: 'action', y: 546, w: 196, h: 46, text: 'Save task assignment &\npublish daily queue' },

    { id: 'view_desk', lane: 'staff', type: 'action', y: 546, w: 188, h: 46, text: 'Open Daily Tasks Desk &\nfilter pending work' },
    { id: 'd_pending', lane: 'staff', type: 'decision', y: 634, w: 146, h: 68, text: 'Pending or late\ntasks left?' },
    { id: 'exec_task', lane: 'staff', type: 'action', y: 724, w: 188, h: 48, text: 'Complete Check-in, Return\nor Support resolution' },

    { id: 'calc_health', lane: 'system', type: 'action', y: 724, w: 196, h: 48, text: 'Aggregate daily tasks,\nUsage Rate & debt aging' },
    { id: 'review_rpt', lane: 'fm', type: 'action', y: 724, w: 184, h: 46, text: 'Review facility overview\n& expiring contracts' },
    { id: 'end_ok', lane: 'fm', type: 'end', y: 788 }
  ],
  edges: [
    { from: 'start', to: 'manage_unit', exit: 'bottom', entry: 'top' },
    { from: 'manage_unit', to: 'chk_unit', exit: 'right', entry: 'left' },
    { from: 'chk_unit', to: 'd_unit_ok', exit: 'bottom', entry: 'top' },

    { from: 'd_unit_ok', to: 'show_unit_err', exit: 'left', entry: 'right', label: 'No', labelPos: [382, 198] },
    { from: 'show_unit_err', to: 'manage_unit', exit: 'left', entry: 'left', points: [[68, 208], [68, 122]] },

    { from: 'd_unit_ok', to: 'save_unit', exit: 'bottom', entry: 'top', label: 'Yes', labelPos: [506, 256] },
    { from: 'save_unit', to: 'assign_task', exit: 'bottom', entry: 'top', points: [[484, 334], [184, 334]] },
    { from: 'assign_task', to: 'chk_staff', exit: 'right', entry: 'left' },
    { from: 'chk_staff', to: 'd_staff_ok', exit: 'bottom', entry: 'top' },

    { from: 'd_staff_ok', to: 'show_staff_err', exit: 'left', entry: 'right', label: 'No', labelPos: [382, 450] },
    { from: 'show_staff_err', to: 'assign_task', exit: 'left', entry: 'left', points: [[68, 460], [68, 374]] },

    { from: 'd_staff_ok', to: 'save_assign', exit: 'bottom', entry: 'top', label: 'Yes', labelPos: [506, 508] },
    { from: 'save_assign', to: 'view_desk', exit: 'right', entry: 'left' },
    { from: 'view_desk', to: 'd_pending', exit: 'bottom', entry: 'top' },

    { from: 'd_pending', to: 'exec_task', exit: 'bottom', entry: 'top', label: 'Yes', labelPos: [796, 684] },
    { from: 'exec_task', to: 'calc_health', exit: 'left', entry: 'right' },
    { from: 'd_pending', to: 'calc_health', exit: 'left', entry: 'top', points: [[484, 634]], label: 'No', labelPos: [656, 624] },

    { from: 'calc_health', to: 'review_rpt', exit: 'left', entry: 'right' },
    { from: 'review_rpt', to: 'end_ok', exit: 'bottom', entry: 'top' }
  ]
};

generateSwimlane(sl05);
