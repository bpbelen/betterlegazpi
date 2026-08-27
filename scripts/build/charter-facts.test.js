const test = require('node:test');
const assert = require('node:assert/strict');

const {
  counterTime,
  visitCount,
  windows,
  isSameVisit,
  serviceFacts,
  counterTimeUnknown,
} = require('./charter-facts.js');

/** HRMO Recruitment: two client steps, the rest of the month is the office working. */
const RECRUITMENT = [
  { client: 'Applicants submit application', agency: 'Receives', processingTime: '10 minutes' },
  { client: null, agency: 'Acknowledge receipt', processingTime: '10 minutes' },
  { client: null, agency: 'Conducts assessment', processingTime: '1 hr/applicant' },
  { client: null, agency: 'Profiling', processingTime: '1 hr/applicant; 30 min/applicant; 7 days' },
  { client: null, agency: 'Informs unqualified applicants', processingTime: null },
  { client: null, agency: 'Background investigation', processingTime: null },
  { client: null, agency: 'Behavioral event interview', processingTime: '30 min.' },
  { client: null, agency: 'HRMPSB rating', processingTime: '2 days; 15 days' },
  {
    client: 'If selected, applicant complies',
    agency: 'Prepare appointment',
    processingTime: null,
  },
  { client: null, agency: 'Send letters', processingTime: '5 days' },
];

/** CTO business tax bill: entirely over the counter. */
const OVER_THE_COUNTER = [
  {
    client: 'Verbally state the name of the business at Business Tax Division (Window 1).',
    agency: 'Input the name and search',
    processingTime: '2 minutes',
  },
  { client: 'Request a copy', agency: 'Print statement', processingTime: '3 minutes' },
  { client: 'Receive copy', agency: 'Release statement', processingTime: '2 minutes' },
];

test('separates counter time from elapsed time', () => {
  // The headline figure in the charter is 29 days. The applicant is there for ten minutes.
  assert.equal(counterTime(RECRUITMENT).text, '10 minutes');
  assert.equal(visitCount(RECRUITMENT), 2);
});

test('a service with no waiting is marked same-visit', () => {
  assert.equal(isSameVisit(OVER_THE_COUNTER), true);
  assert.equal(counterTime(OVER_THE_COUNTER).text, '7 minutes');
});

test('a service with office work behind it is not same-visit', () => {
  assert.equal(isSameVisit(RECRUITMENT), false);
});

test('one visit is not the same claim as same-visit', () => {
  // HRMO Retirement: a single trip, but eleven days before it is done.
  const retirement = [
    { client: 'Submit the requirement', agency: 'Receives', processingTime: '10 minutes' },
    { client: null, agency: 'Recomputes leave credits', processingTime: '5 days' },
    { client: null, agency: 'Prepares documents', processingTime: '1 day' },
    { client: null, agency: 'Transmits documents', processingTime: '5 days' },
  ];
  assert.equal(visitCount(retirement), 1);
  assert.equal(isSameVisit(retirement), false);
});

test('pulls window numbers out of step prose', () => {
  assert.deepEqual(windows(OVER_THE_COUNTER), [1]);
  assert.deepEqual(
    windows([
      { client: 'Submit at Land Tax Division (Window 5).', agency: 'Receive' },
      { client: 'Courtesy lane (Window 4).', agency: 'Assist' },
      { client: 'Again at window 5', agency: 'Release' },
    ]),
    [4, 5]
  );
  assert.deepEqual(windows([{ client: 'No window here', agency: 'None' }]), []);
});

test('serviceFacts bundles what a collapsed card needs', () => {
  const facts = serviceFacts({
    steps: OVER_THE_COUNTER,
    requirements: [{ item: 'Name of Business', whereToSecure: 'Business Owner' }],
  });
  assert.equal(facts.visits, 3);
  assert.equal(facts.documents, 1);
  assert.equal(facts.sameVisit, true);
  assert.deepEqual(facts.windows, [1]);
  assert.equal(facts.total.text, '7 minutes');
});

test('handles a service with no steps or requirements', () => {
  const facts = serviceFacts({});
  assert.equal(facts.visits, 0);
  assert.equal(facts.documents, 0);
  assert.equal(facts.total.text, 'None');
  assert.deepEqual(facts.windows, []);
});

test('a service with no stated durations makes no same-visit claim', () => {
  // CTO's Real Property Tax Clearance publishes no PROCESSING TIME column at all.
  // Comparing zero against zero once made it claim the citizen walks out with it.
  const untimed = [
    { client: 'Submit the requirements', agency: 'Receive and verify', processingTime: null },
    { client: 'Receive the clearance', agency: 'Release the clearance', processingTime: null },
  ];
  assert.equal(isSameVisit(untimed), false);
  assert.equal(counterTimeUnknown(untimed), true);
  assert.equal(serviceFacts({ steps: untimed }).counterUnknown, true);
});

test('a timed service is not flagged as unknown', () => {
  assert.equal(counterTimeUnknown(OVER_THE_COUNTER), false);
});
