const { generateStateMachine } = require('../lib/nutribot_state_machine');

const spec = {
  svgBase: 'st-storage-unit',
  drawioBase: 'state-machine-storage-unit',
  caption: 'State Chart 2: Storage Unit Status',
  nodes: [
    { id: 'start', type: 'start', x: 235, y: 40 },
    { id: 'AVAILABLE', type: 'state', label: 'Available', x: 280, y: 150, w: 185, h: 48 },
    { id: 'RESERVED', type: 'state', label: 'Reserved', x: 660, y: 150, w: 185, h: 48 },
    { id: 'MAINTENANCE', type: 'state', label: 'Maintenance', x: 280, y: 360, w: 185, h: 48 },
    { id: 'OCCUPIED', type: 'state', label: 'Occupied', x: 660, y: 360, w: 185, h: 48 },
    { id: 'OUT_OF_SERVICE', type: 'state', label: 'Out of Service', x: 280, y: 560, w: 185, h: 48 },
    { id: 'CLEANING', type: 'state', label: 'Cleaning', x: 660, y: 560, w: 185, h: 48 },
    { id: 'end', type: 'end', x: 280, y: 675 }
  ],
  edges: [
    {
      id: 'e1_create',
      from: 'start', fromSide: 'bottom',
      to: 'AVAILABLE', toSide: 'top', toOffset: -45,
      label: 'create unit',
      labelPos: [235, 90]
    },
    {
      id: 'e2_alloc',
      from: 'AVAILABLE', fromSide: 'right', fromOffset: -12,
      to: 'RESERVED', toSide: 'left', toOffset: -12,
      label: 'allocate reservation',
      labelPos: [470, 138]
    },
    {
      id: 'e3_release',
      from: 'RESERVED', fromSide: 'left', fromOffset: 12,
      to: 'AVAILABLE', toSide: 'right', toOffset: 12,
      label: 'release hold',
      labelPos: [470, 162]
    },
    {
      id: 'e4_checkin',
      from: 'RESERVED', fromSide: 'bottom',
      to: 'OCCUPIED', toSide: 'top',
      label: 'complete check-in',
      labelPos: [660, 255]
    },
    {
      id: 'e5_checkout',
      from: 'OCCUPIED', fromSide: 'bottom',
      to: 'CLEANING', toSide: 'top',
      label: 'complete return',
      labelPos: [660, 460]
    },
    {
      id: 'e6_evict_reloc',
      from: 'OCCUPIED', fromSide: 'left',
      to: 'MAINTENANCE', toSide: 'right',
      label: 'evict or relocate unit',
      labelPos: [470, 360]
    },
    {
      id: 'e7_flag_maint',
      from: 'AVAILABLE', fromSide: 'bottom', fromOffset: -45,
      to: 'MAINTENANCE', toSide: 'top', toOffset: -45,
      label: 'flag maintenance',
      labelPos: [235, 228]
    },
    {
      id: 'e8_complete_repair',
      from: 'MAINTENANCE', fromSide: 'top', fromOffset: 45,
      to: 'AVAILABLE', toSide: 'bottom', toOffset: 45,
      label: 'complete repair',
      labelPos: [325, 286]
    },
    {
      id: 'e9_clean_defect',
      from: 'CLEANING', fromSide: 'left',
      to: 'MAINTENANCE', toSide: 'bottom', toOffset: 65,
      waypoints: [[465, 560], [465, 430], [345, 430]],
      label: 'report defect',
      labelPos: [465, 430]
    },
    {
      id: 'e10_clean_res',
      from: 'CLEANING', fromSide: 'right',
      to: 'RESERVED', toSide: 'right',
      waypoints: [[880, 560], [880, 150]],
      label: 'assign next\nreservation',
      labelPos: [880, 360]
    },
    {
      id: 'e11_clean_avail',
      from: 'CLEANING', fromSide: 'bottom',
      to: 'AVAILABLE', toSide: 'top', toOffset: 45,
      waypoints: [[660, 645], [990, 645], [990, 52], [325, 52]],
      label: 'complete cleaning',
      labelPos: [660, 52]
    },
    {
      id: 'e12_avail_oos',
      from: 'AVAILABLE', fromSide: 'left',
      to: 'OUT_OF_SERVICE', toSide: 'left',
      waypoints: [[68, 150], [68, 560]],
      label: 'decommission unit',
      labelPos: [68, 360]
    },
    {
      id: 'e13_maint_oos',
      from: 'MAINTENANCE', fromSide: 'bottom', fromOffset: -60,
      to: 'OUT_OF_SERVICE', toSide: 'top', toOffset: -60,
      label: 'decommission unit',
      labelPos: [220, 442]
    },
    {
      id: 'e14_oos_reopen',
      from: 'OUT_OF_SERVICE', fromSide: 'top', fromOffset: 25,
      to: 'MAINTENANCE', toSide: 'bottom', toOffset: 25,
      label: 'reopen for repair',
      labelPos: [305, 500]
    },
    {
      id: 'e15_retire',
      from: 'OUT_OF_SERVICE', fromSide: 'bottom',
      to: 'end', toSide: 'top',
      label: 'retire unit',
      labelPos: [280, 620]
    }
  ]
};

if (require.main === module) {
  generateStateMachine(spec);
}

module.exports = { spec };
