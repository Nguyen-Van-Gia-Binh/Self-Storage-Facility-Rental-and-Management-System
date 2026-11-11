const { generateStateMachine } = require('../lib/nutribot_state_machine');

const spec = {
  svgBase: 'st-waitlist',
  drawioBase: 'state-machine-waitlist',
  caption: 'State Chart 5: Waitlist Status',
  nodes: [
    { id: 'start', type: 'start', x: 265, y: 40 },
    { id: 'WAITING', type: 'state', label: 'Waiting', x: 265, y: 145, w: 195, h: 48 },
    { id: 'CANCELLED', type: 'state', label: 'Cancelled', x: 660, y: 145, w: 180, h: 48 },
    { id: 'CONTACTING', type: 'state', label: 'Contacting', x: 265, y: 345, w: 195, h: 48 },
    { id: 'CONVERTED', type: 'state', label: 'Converted', x: 660, y: 345, w: 180, h: 48 },
    { id: 'PENDING_FOLLOW_UP', type: 'state', label: 'Pending Follow Up', x: 265, y: 545, w: 195, h: 48 },
    { id: 'REJECTED', type: 'state', label: 'Rejected', x: 660, y: 545, w: 180, h: 48 },
    { id: 'end', type: 'end', x: 895, y: 345 }
  ],
  edges: [
    {
      id: 'e1_join',
      from: 'start', fromSide: 'bottom',
      to: 'WAITING', toSide: 'top',
      label: 'join waitlist',
      labelPos: [265, 92]
    },
    {
      id: 'e2_cancel_waiting',
      from: 'WAITING', fromSide: 'right',
      to: 'CANCELLED', toSide: 'left',
      label: 'cancel waitlist',
      labelPos: [465, 145]
    },
    {
      id: 'e3_start_contact',
      from: 'WAITING', fromSide: 'bottom', fromOffset: -45,
      to: 'CONTACTING', toSide: 'top', toOffset: -45,
      label: 'start contacting',
      labelPos: [200, 226]
    },
    {
      id: 'e4_unlock_2h',
      from: 'CONTACTING', fromSide: 'top', fromOffset: 45,
      to: 'WAITING', toSide: 'bottom', toOffset: 45,
      label: 'unlock 2h timeout',
      labelPos: [330, 268]
    },
    {
      id: 'e5_convert',
      from: 'CONTACTING', fromSide: 'right',
      to: 'CONVERTED', toSide: 'left',
      label: 'convert to reservation',
      labelPos: [465, 345]
    },
    {
      id: 'e6_followup',
      from: 'CONTACTING', fromSide: 'bottom', fromOffset: -45,
      to: 'PENDING_FOLLOW_UP', toSide: 'top', toOffset: -45,
      label: 'schedule follow-up',
      labelPos: [200, 426]
    },
    {
      id: 'e7_resume',
      from: 'PENDING_FOLLOW_UP', fromSide: 'top', fromOffset: 45,
      to: 'CONTACTING', toSide: 'bottom', toOffset: 45,
      label: 'resume contacting',
      labelPos: [330, 468]
    },
    {
      id: 'e8_revert_conv',
      from: 'CONVERTED', fromSide: 'bottom',
      to: 'PENDING_FOLLOW_UP', toSide: 'right', toOffset: -12,
      waypoints: [[660, 425], [465, 425], [465, 533]],
      label: 'revert on 24h hold expiry',
      labelPos: [560, 425]
    },
    {
      id: 'e9_reject_follow',
      from: 'PENDING_FOLLOW_UP', fromSide: 'right', fromOffset: 12,
      to: 'REJECTED', toSide: 'left', toOffset: 12,
      label: 'reject offer',
      labelPos: [465, 557]
    },
    {
      id: 'e10_reject_contact',
      from: 'CONTACTING', fromSide: 'left',
      to: 'REJECTED', toSide: 'bottom',
      waypoints: [[65, 345], [65, 640], [660, 640]],
      label: 'reject offer',
      labelPos: [350, 640]
    },
    {
      id: 'e11_end_cancel',
      from: 'CANCELLED', fromSide: 'right',
      to: 'end', toSide: 'top',
      waypoints: [[895, 145]]
    },
    {
      id: 'e12_end_conv',
      from: 'CONVERTED', fromSide: 'right',
      to: 'end', toSide: 'left'
    },
    {
      id: 'e13_end_rej',
      from: 'REJECTED', fromSide: 'right',
      to: 'end', toSide: 'bottom',
      waypoints: [[895, 545]]
    }
  ]
};

if (require.main === module) {
  generateStateMachine(spec);
}

module.exports = { spec };

