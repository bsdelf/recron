import it from 'ava';
import { Cron } from '../src';

it('Cron should accept timezone', t => {
  const timezone = 'UTC';
  const cron = new Cron(timezone);
  t.deepEqual(cron.timezone, timezone);
});

it('Cron should detect timezone', t => {
  const cron = new Cron();
  t.true(!!cron.timezone);
});
