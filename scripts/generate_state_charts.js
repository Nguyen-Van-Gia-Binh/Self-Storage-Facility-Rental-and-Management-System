const { generateStateMachine } = require('./lib/nutribot_state_machine');

const specs = [
  require('./states/st01_rental_contract').spec,
  require('./states/st02_storage_unit').spec,
  require('./states/st03_reservation').spec,
  require('./states/st04_support_request').spec,
  require('./states/st05_waitlist').spec,
  require('./states/st06_payment_transaction').spec
];

for (const spec of specs) {
  generateStateMachine(spec);
}
