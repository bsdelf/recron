import it from 'ava';
import { detectTimeZone } from '../src';

it('Should detect time zone', (t) => {
  const timezone = detectTimeZone();
  t.true(timezone.length >= 3, `actual timezone: ${timezone}`);
});
