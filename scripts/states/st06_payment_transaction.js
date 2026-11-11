const { generateStateMachine } = require('../lib/nutribot_state_machine');

const spec = {
  svgBase: 'st-payment-transaction',
  drawioBase: 'state-machine-payment-transaction',
  caption: 'State Chart 6: Payment Transaction Status',
  nodes: [
    { id: 'start', type: 'start', x: 55, y: 295 },
    { id: 'PENDING', type: 'state', label: 'Pending', x: 355, y: 175, w: 185, h: 48 },
    { id: 'PENDING_REFUND', type: 'state', label: 'Pending Refund', x: 355, y: 455, w: 185, h: 48 },
    { id: 'EXPIRED', type: 'state', label: 'Expired', x: 760, y: 80, w: 175, h: 48 },
    { id: 'FAILED', type: 'state', label: 'Failed', x: 760, y: 175, w: 175, h: 48 },
    { id: 'SUCCESS', type: 'state', label: 'Success', x: 760, y: 315, w: 175, h: 48 },
    { id: 'end', type: 'end', x: 995, y: 175 }
  ],
  edges: [
    {
      id: 'e1_create_charge',
      from: 'start', fromSide: 'top',
      to: 'PENDING', toSide: 'left',
      waypoints: [[55, 175]],
      label: 'create payment order',
      labelPos: [152, 175]
    },
    {
      id: 'e2_create_refund',
      from: 'start', fromSide: 'bottom',
      to: 'PENDING_REFUND', toSide: 'left',
      waypoints: [[55, 455]],
      label: 'create refund order',
      labelPos: [152, 455]
    },
    {
      id: 'e3_expire',
      from: 'PENDING', fromSide: 'top',
      to: 'EXPIRED', toSide: 'left',
      waypoints: [[355, 80]],
      label: 'expire after 48h timeout',
      labelPos: [530, 80]
    },
    {
      id: 'e4_fail',
      from: 'PENDING', fromSide: 'right',
      to: 'FAILED', toSide: 'left',
      label: 'fail or supersede payment',
      labelPos: [560, 175]
    },
    {
      id: 'e5_success',
      from: 'PENDING', fromSide: 'bottom',
      to: 'SUCCESS', toSide: 'left', toOffset: -10,
      waypoints: [[355, 305]],
      label: 'confirm VNPay payment',
      labelPos: [530, 305]
    },
    {
      id: 'e6_refund_done',
      from: 'PENDING_REFUND', fromSide: 'right',
      to: 'SUCCESS', toSide: 'bottom',
      waypoints: [[760, 455]],
      label: 'confirm bank transfer',
      labelPos: [600, 455]
    },
    {
      id: 'e7_end_exp',
      from: 'EXPIRED', fromSide: 'right',
      to: 'end', toSide: 'top',
      waypoints: [[995, 80]]
    },
    {
      id: 'e8_end_fail',
      from: 'FAILED', fromSide: 'right',
      to: 'end', toSide: 'left'
    },
    {
      id: 'e9_end_succ',
      from: 'SUCCESS', fromSide: 'right',
      to: 'end', toSide: 'bottom',
      waypoints: [[995, 315]]
    }
  ]
};

if (require.main === module) {
  generateStateMachine(spec);
}

module.exports = { spec };
