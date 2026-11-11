const { generateStateMachine } = require('../lib/nutribot_state_machine');

const spec = {
  svgBase: 'st-rental-contract',
  drawioBase: 'state-machine-rental-contract',
  caption: 'State Chart 1: Rental Contract Status',
  nodes: [
    { id: 'start', type: 'start', x: 325, y: 40 },
    { id: 'PENDING_CHECK_IN', type: 'state', label: 'Pending Check-in', x: 325, y: 145, w: 185, h: 48 },
    { id: 'CANCELLED', type: 'state', label: 'Cancelled', x: 675, y: 145, w: 175, h: 48 },
    { id: 'ACTIVE', type: 'state', label: 'Active', x: 325, y: 345, w: 185, h: 48 },
    { id: 'PENDING_RETURN', type: 'state', label: 'Pending Return', x: 675, y: 345, w: 175, h: 48 },
    { id: 'RETURNED', type: 'state', label: 'Returned', x: 995, y: 345, w: 165, h: 48 },
    { id: 'OVERDUE', type: 'state', label: 'Overdue', x: 325, y: 550, w: 185, h: 48 },
    { id: 'TERMINATED', type: 'state', label: 'Terminated', x: 675, y: 550, w: 175, h: 48 },
    { id: 'CLOSED', type: 'state', label: 'Closed', x: 995, y: 550, w: 165, h: 48 },
    { id: 'end', type: 'end', x: 1185, y: 345 }
  ],
  edges: [
    {
      id: 'e1',
      from: 'start', fromSide: 'bottom',
      to: 'PENDING_CHECK_IN', toSide: 'top',
      label: 'confirm deposit',
      labelPos: [325, 88]
    },
    {
      id: 'e2',
      from: 'PENDING_CHECK_IN', fromSide: 'right',
      to: 'CANCELLED', toSide: 'left',
      label: 'cancel contract',
      labelPos: [502, 145]
    },
    {
      id: 'e3',
      from: 'PENDING_CHECK_IN', fromSide: 'left',
      to: 'TERMINATED', toSide: 'bottom',
      waypoints: [[48, 145], [48, 645], [675, 645]],
      label: 'reject handover',
      labelPos: [350, 645]
    },
    {
      id: 'e4',
      from: 'PENDING_CHECK_IN', fromSide: 'bottom',
      to: 'ACTIVE', toSide: 'top',
      label: 'complete check-in',
      labelPos: [325, 232]
    },
    {
      id: 'e5_renew',
      from: 'ACTIVE', fromSide: 'left',
      to: 'ACTIVE', toSide: 'top', toOffset: -45,
      waypoints: [[155, 345], [155, 286], [280, 286]],
      label: 'renew lease',
      labelPos: [155, 315]
    },
    {
      id: 'e6_ret',
      from: 'ACTIVE', fromSide: 'right', fromOffset: -12,
      to: 'PENDING_RETURN', toSide: 'left', toOffset: -12,
      label: 'submit return notice',
      labelPos: [502, 333]
    },
    {
      id: 'e7_cancel_ret',
      from: 'PENDING_RETURN', fromSide: 'left', fromOffset: 12,
      to: 'ACTIVE', toSide: 'right', toOffset: 12,
      label: 'cancel return',
      labelPos: [502, 357]
    },
    {
      id: 'e8_inspect',
      from: 'PENDING_RETURN', fromSide: 'right',
      to: 'RETURNED', toSide: 'left',
      label: 'complete inspection',
      labelPos: [838, 345]
    },
    {
      id: 'e9_settle_ret',
      from: 'RETURNED', fromSide: 'bottom',
      to: 'CLOSED', toSide: 'top',
      label: 'approve settlement',
      labelPos: [995, 448]
    },
    {
      id: 'e10_overdue',
      from: 'ACTIVE', fromSide: 'bottom',
      to: 'OVERDUE', toSide: 'top',
      label: 'expire lease at D+1',
      labelPos: [325, 434]
    },
    {
      id: 'e11_pay_debt',
      from: 'OVERDUE', fromSide: 'left',
      to: 'OVERDUE', toSide: 'top', toOffset: -45,
      waypoints: [[155, 550], [155, 492], [280, 492]],
      label: 'pay overdue fee',
      labelPos: [155, 520]
    },
    {
      id: 'e12_ovd_ret',
      from: 'OVERDUE', fromSide: 'right', fromOffset: -12,
      to: 'PENDING_RETURN', toSide: 'bottom',
      waypoints: [[495, 538], [495, 448], [675, 448]],
      label: 'submit return notice',
      labelPos: [585, 448]
    },
    {
      id: 'e13_evict',
      from: 'OVERDUE', fromSide: 'right', fromOffset: 12,
      to: 'TERMINATED', toSide: 'left', toOffset: 12,
      label: 'evict at D+7',
      labelPos: [502, 562]
    },
    {
      id: 'e14_settle_term',
      from: 'TERMINATED', fromSide: 'right',
      to: 'CLOSED', toSide: 'left',
      label: 'approve settlement',
      labelPos: [838, 550]
    },
    {
      id: 'e15_end_cancel',
      from: 'CANCELLED', fromSide: 'right',
      to: 'end', toSide: 'top',
      waypoints: [[1185, 145]]
    },
    {
      id: 'e16_end_closed',
      from: 'CLOSED', fromSide: 'right',
      to: 'end', toSide: 'bottom',
      waypoints: [[1185, 550]]
    }
  ]
};

if (require.main === module) {
  generateStateMachine(spec);
}

module.exports = { spec };
