const { generateStateMachine } = require('../lib/nutribot_state_machine');

const spec = {
  svgBase: 'st-reservation',
  drawioBase: 'state-machine-reservation',
  caption: 'State Chart 3: Reservation Status',
  nodes: [
    { id: 'start', type: 'start', x: 185, y: 40 },
    { id: 'PENDING_PAYMENT', type: 'state', label: 'Pending Payment', x: 185, y: 145, w: 190, h: 48 },
    { id: 'EXPIRED', type: 'state', label: 'Expired', x: 635, y: 145, w: 175, h: 48 },
    { id: 'CONFIRMED', type: 'state', label: 'Confirmed', x: 185, y: 345, w: 190, h: 48 },
    { id: 'CANCELLED', type: 'state', label: 'Cancelled', x: 635, y: 321, w: 175, h: 48 },
    { id: 'NO_SHOW', type: 'state', label: 'No Show', x: 635, y: 455, w: 175, h: 48 },
    { id: 'FULFILLED', type: 'state', label: 'Fulfilled', x: 635, y: 585, w: 175, h: 48 },
    { id: 'end', type: 'end', x: 880, y: 365 }
  ],
  edges: [
    {
      id: 'e1_create',
      from: 'start', fromSide: 'bottom',
      to: 'PENDING_PAYMENT', toSide: 'top',
      label: 'create reservation',
      labelPos: [185, 90]
    },
    {
      id: 'e2_expire',
      from: 'PENDING_PAYMENT', fromSide: 'right', fromOffset: -10,
      to: 'EXPIRED', toSide: 'left', toOffset: -10,
      label: 'expire 48h hold',
      labelPos: [415, 135]
    },
    {
      id: 'e3_cancel_unpaid',
      from: 'PENDING_PAYMENT', fromSide: 'right', fromOffset: 12,
      to: 'CANCELLED', toSide: 'top',
      waypoints: [[355, 157], [355, 250], [635, 250]],
      label: 'cancel unpaid booking',
      labelPos: [495, 250]
    },
    {
      id: 'e4_pay',
      from: 'PENDING_PAYMENT', fromSide: 'bottom',
      to: 'CONFIRMED', toSide: 'top',
      label: 'confirm VNPay payment',
      labelPos: [185, 245]
    },
    {
      id: 'e5_cancel_conf',
      from: 'CONFIRMED', fromSide: 'right', fromOffset: -12,
      to: 'CANCELLED', toSide: 'left', toOffset: 12,
      label: 'cancel within grace period',
      labelPos: [415, 333]
    },
    {
      id: 'e6_noshow',
      from: 'CONFIRMED', fromSide: 'right', fromOffset: 12,
      to: 'NO_SHOW', toSide: 'left',
      waypoints: [[345, 357], [345, 455]],
      label: 'cancel after grace period',
      labelPos: [440, 455]
    },
    {
      id: 'e7_fulfill',
      from: 'CONFIRMED', fromSide: 'bottom',
      to: 'FULFILLED', toSide: 'left',
      waypoints: [[185, 585]],
      label: 'complete check-in or auto-activate',
      labelPos: [365, 585]
    },
    {
      id: 'e8_end_exp',
      from: 'EXPIRED', fromSide: 'right',
      to: 'end', toSide: 'top',
      waypoints: [[880, 145]]
    },
    {
      id: 'e9_end_cancel',
      from: 'CANCELLED', fromSide: 'right',
      to: 'end', toSide: 'left', toOffset: -10,
      waypoints: [[795, 321], [795, 355]]
    },
    {
      id: 'e10_end_noshow',
      from: 'NO_SHOW', fromSide: 'right',
      to: 'end', toSide: 'left', toOffset: 10,
      waypoints: [[795, 455], [795, 375]]
    },
    {
      id: 'e11_end_fulfill',
      from: 'FULFILLED', fromSide: 'right',
      to: 'end', toSide: 'bottom',
      waypoints: [[880, 585]]
    }
  ]
};

if (require.main === module) {
  generateStateMachine(spec);
}

module.exports = { spec };
