const { generateSwimlane } = require('../lib/nutribot_swimlane');

const sl06_2 = {
  svgBase: 'sl-06-2-overdue',
  drawioBase: 'activity-diagram-flow-6-2-overdue-handling',
  poolTitle: 'Self-Storage Platform',
  caption: 'Swimlane 6.2: Flow_6_2_Overdue_Monitoring_Escalation_And_Termination',
  lanes: [
    { id: 'customer', title: 'Storage Customer', width: 270 },
    { id: 'system', title: 'System', width: 430 },
    { id: 'vnpay', title: 'VNPay Gateway', width: 226 }
  ],
  nodes: [
    { id: 'start', lane: 'system', type: 'start', y: 66 },
    { id: 'cron_scan', lane: 'system', type: 'action', y: 118, w: 224, h: 46, text: 'Run 00:00 OverdueCronJob\n& load policy snapshot' },
    { id: 'calc_days', lane: 'system', type: 'action', y: 194, w: 224, h: 48, text: 'Compute D+days & net fee\n(5%/d D+1..3, +10%/d cap 55%)' },
    { id: 'd_d7', lane: 'system', type: 'decision', y: 280, w: 162, h: 66, text: 'Overdue days\n>= 7 (D+7+)?' },

    { id: 'mark_ovd', lane: 'system', dx: -112, type: 'action', y: 368, w: 190, h: 48, text: 'Set OVERDUE, accrue fee\n& lock access PIN (D+1+)' },
    { id: 'view_ovd', lane: 'customer', type: 'action', y: 368, w: 184, h: 48, text: 'View OVERDUE status,\nlocked PIN & penalty fee' },
    { id: 'd_pay', lane: 'customer', type: 'decision', y: 456, w: 148, h: 66, text: 'Settle overdue\npenalty now?' },
    { id: 'stay_locked', lane: 'customer', type: 'action', y: 538, w: 180, h: 44, text: 'Remain OVERDUE locked;\nrisk D+7 termination' },
    { id: 'end_ovd', lane: 'customer', type: 'end', y: 592 },

    { id: 'terminate', lane: 'system', dx: 108, type: 'action', y: 368, w: 194, h: 48, text: 'Liquidate 100% deposit,\nTERMINATE & revoke PIN' },
    { id: 'd_d8', lane: 'system', dx: 108, type: 'decision', y: 456, w: 158, h: 64, text: 'Days >= D+8\n(sealed 1 day)?' },
    { id: 'set_maint', lane: 'system', dx: -112, type: 'action', y: 456, w: 190, h: 48, text: 'Set unit MAINTENANCE\n(1-day seal to depot)' },
    { id: 'release_unit', lane: 'system', type: 'action', y: 538, w: 184, h: 48, text: 'Release unit to\nRESERVED / AVAILABLE' },
    { id: 'end_term', lane: 'system', type: 'end', y: 592 },

    { id: 'click_pay', lane: 'customer', type: 'action', y: 670, w: 184, h: 46, text: 'Click Pay Overdue Penalty\nin Customer Portal' },
    { id: 'create_ovd_txn', lane: 'system', type: 'action', y: 670, w: 212, h: 48, text: 'Create OVERDUE_PENALTY\ntxn & VNPay URL' },
    { id: 'vnpay_ovd', lane: 'vnpay', type: 'action', y: 670, w: 184, h: 48, text: 'Process VNPay payment\n& return IPN result' },

    { id: 'd_ovd_paid', lane: 'vnpay', type: 'decision', y: 760, w: 140, h: 66, text: 'Penalty paid\nsuccessfully?' },
    { id: 'clear_debt', lane: 'system', type: 'action', y: 760, w: 212, h: 50, text: 'Clear penalty debt, reissue\nPIN & keep OVERDUE' },
    { id: 'submit_ret', lane: 'customer', type: 'action', y: 760, w: 188, h: 48, text: 'Re-enter unit to pack &\nsubmit Return Notice' },
    { id: 'end_ret', lane: 'customer', type: 'end', y: 814 },

    { id: 'keep_ovd', lane: 'system', type: 'action', y: 872, w: 212, h: 46, text: 'Keep accrued debt, PIN\nlocked & OVERDUE status' },
    { id: 'show_ovd_fail', lane: 'customer', type: 'action', y: 872, w: 188, h: 46, text: 'Show payment failure &\nretry before D+7' }
  ],
  edges: [
    { from: 'start', to: 'cron_scan', exit: 'bottom', entry: 'top' },
    { from: 'cron_scan', to: 'calc_days', exit: 'bottom', entry: 'top' },
    { from: 'calc_days', to: 'd_d7', exit: 'bottom', entry: 'top' },

    { from: 'd_d7', to: 'mark_ovd', exit: 'left', entry: 'top', points: [[417, 280]], label: 'No', labelPos: [428, 270] },
    { from: 'mark_ovd', to: 'view_ovd', exit: 'left', entry: 'right' },
    { from: 'view_ovd', to: 'd_pay', exit: 'bottom', entry: 'top' },
    { from: 'd_pay', to: 'stay_locked', exit: 'bottom', entry: 'top', label: 'No', labelPos: [198, 502] },
    { from: 'stay_locked', to: 'end_ovd', exit: 'bottom', entry: 'top' },
    { from: 'd_pay', to: 'click_pay', exit: 'left', entry: 'top', points: [[64, 456], [64, 628], [179, 628]], label: 'Yes', labelPos: [82, 446] },

    { from: 'd_d7', to: 'terminate', exit: 'right', entry: 'top', points: [[637, 280]], label: 'Yes', labelPos: [628, 270] },
    { from: 'terminate', to: 'd_d8', exit: 'bottom', entry: 'top' },
    { from: 'd_d8', to: 'set_maint', exit: 'left', entry: 'right', label: 'No', labelPos: [534, 446] },
    { from: 'set_maint', to: 'release_unit', exit: 'bottom', entry: 'top', points: [[417, 500], [529, 500]], label: 'At D+8', labelPos: [473, 498] },
    { from: 'd_d8', to: 'release_unit', exit: 'bottom', entry: 'right', points: [[637, 538]], label: 'Yes', labelPos: [656, 504] },
    { from: 'release_unit', to: 'end_term', exit: 'bottom', entry: 'top' },

    { from: 'click_pay', to: 'create_ovd_txn', exit: 'right', entry: 'left' },
    { from: 'create_ovd_txn', to: 'vnpay_ovd', exit: 'right', entry: 'left' },
    { from: 'vnpay_ovd', to: 'd_ovd_paid', exit: 'bottom', entry: 'top' },

    { from: 'd_ovd_paid', to: 'clear_debt', exit: 'left', entry: 'right', label: 'Yes', labelPos: [762, 750] },
    { from: 'clear_debt', to: 'submit_ret', exit: 'left', entry: 'right' },
    { from: 'submit_ret', to: 'end_ret', exit: 'bottom', entry: 'top' },

    { from: 'd_ovd_paid', to: 'keep_ovd', exit: 'bottom', entry: 'right', points: [[857, 872]], label: 'No', labelPos: [878, 816] },
    { from: 'keep_ovd', to: 'show_ovd_fail', exit: 'left', entry: 'right' },
    { from: 'show_ovd_fail', to: 'click_pay', exit: 'left', entry: 'left', points: [[64, 872], [64, 670]] }
  ]
};

generateSwimlane(sl06_2);
