import it from 'ava';
import { Cron, UnsupportedSpecError } from '../src';

it('Cron should accept time zone', (t) => {
  const timezone = 'UTC';
  const cron = new Cron(timezone);
  t.deepEqual(cron.timezone, timezone);
});

it('Cron should detect time zone', (t) => {
  const cron = new Cron();
  t.true(!!cron.timezone);
});

it('Cron should throw unsupported spec', (t) => {
  const cron = new Cron();
  const spec = '???';
  const error = t.throws(
    () => {
      cron.schedule(spec, () => {});
    },
    { instanceOf: UnsupportedSpecError }
  );
  t.true(error.message.includes(spec));
});
