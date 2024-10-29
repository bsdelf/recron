import it from 'ava';
import { detectTimeZone } from './utils';

it('Should detect time zone', (t) => {
  const timezone = detectTimeZone();
  t.true(timezone.length > 3);
  t.true(timezone.includes('/'));
});
