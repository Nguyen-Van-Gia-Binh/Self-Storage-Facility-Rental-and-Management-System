const { generateStateMachine } = require('../lib/nutribot_state_machine');

const spec = {
  svgBase: 'st-support-request',
  drawioBase: 'state-machine-support-request',
  caption: 'State Chart 4: Support Request Status',
  nodes: [
    { id: 'start', type: 'start', x: 240, y: 40 },
    { id: 'NEW', type: 'state', label: 'New', x: 240, y: 135, w: 180, h: 48 },
    { id: 'ASSIGNED', type: 'state', label: 'Assigned', x: 240, y: 265, w: 180, h: 48 },
    { id: 'IN_PROGRESS', type: 'state', label: 'In Progress', x: 240, y: 415, w: 180, h: 48 },
    { id: 'RESOLVED', type: 'state', label: 'Resolved', x: 645, y: 415, w: 180, h: 48 },
    { id: 'CLOSED', type: 'state', label: 'Closed', x: 645, y: 560, w: 180, h: 48 },
    { id: 'end', type: 'end', x: 885, y: 345 }
  ],
  edges: [
    {
      id: 'e1_submit',
      from: 'start', fromSide: 'bottom',
      to: 'NEW', toSide: 'top',
      label: 'submit ticket',
      labelPos: [240, 88]
    },
    {
      id: 'e2_delete_new',
      from: 'NEW', fromSide: 'right',
      to: 'end', toSide: 'top',
      waypoints: [[885, 135]],
      label: 'cancel new ticket',
      labelPos: [560, 135]
    },
    {
      id: 'e3_assign',
      from: 'NEW', fromSide: 'bottom',
      to: 'ASSIGNED', toSide: 'top',
      label: 'assign staff',
      labelPos: [240, 200]
    },
    {
      id: 'e4_start',
      from: 'ASSIGNED', fromSide: 'bottom',
      to: 'IN_PROGRESS', toSide: 'top',
      label: 'start investigation',
      labelPos: [240, 340]
    },
    {
      id: 'e5_resolve_reloc',
      from: 'IN_PROGRESS', fromSide: 'right', fromOffset: -12,
      to: 'RESOLVED', toSide: 'left', toOffset: -12,
      label: 'resolve with relocation',
      labelPos: [442, 403]
    },
    {
      id: 'e6_reopen',
      from: 'RESOLVED', fromSide: 'left', fromOffset: 12,
      to: 'IN_PROGRESS', toSide: 'right', toOffset: 12,
      label: 'reject resolution',
      labelPos: [442, 427]
    },
    {
      id: 'e7_resolve_direct',
      from: 'IN_PROGRESS', fromSide: 'bottom',
      to: 'CLOSED', toSide: 'left',
      waypoints: [[240, 560]],
      label: 'resolve without relocation',
      labelPos: [385, 560]
    },
    {
      id: 'e8_close_resolved',
      from: 'RESOLVED', fromSide: 'bottom',
      to: 'CLOSED', toSide: 'top',
      label: 'confirm, relocate or auto-close',
      labelPos: [645, 488]
    },
    {
      id: 'e9_end',
      from: 'CLOSED', fromSide: 'right',
      to: 'end', toSide: 'bottom',
      waypoints: [[885, 560]]
    }
  ]
};

if (require.main === module) {
  generateStateMachine(spec);
}

module.exports = { spec };
