import it from 'ava';
import { combination } from 'js-combinatorics';
import { IntervalSpec, CrontabSpec, CrontabAliasSpec } from './spec';

const combToMs = (comb: string[]) => {
  const mapping: { [key: string]: number } = {
    h: 60 * 60 * 1000,
    m: 60 * 1000,
    s: 1000,
    ms: 1,
  };
  return comb.reduce((acc, val) => {
    const result = /^(?<count>\d+)(?<unit>\w+)$/g.exec(val);
    if (!result || !result.groups) {
      throw new Error(`Invalid combination: ${comb}`);
    }
    const { groups } = result;
    const unit = mapping[groups.unit];
    if (!unit) {
      throw new Error(`Invalid combination: ${comb}`);
    }
    return acc + unit * Number.parseInt(groups.count, 10);
  }, 0);
};

(() => {
  const cards = ['1h', '2m', '3s', '4ms'];
  for (let n = 1; n <= cards.length; ++n) {
    const gen = combination(cards, n);
    for (let comb = gen.next(); comb; comb = gen.next()) {
      const duration = comb.join('');
      const input = `@every ${duration}`;
      it(`IntervalSpec "${input}" should match`, t => {
        t.true(IntervalSpec.match(input));
      });
      it(`IntervalSpec "${input}" should get next`, t => {
        t.notThrows(() => {
          const spec = new IntervalSpec(input);
          t.deepEqual(spec.next(0), combToMs(comb));
        });
      });
    }
  }
})();

(() => {
  const tzs = [
    {
      tz: 'UTC',
      offset: 0,
    },
    {
      tz: 'Asia/Shanghai',
      offset: 8 * 60 * 60 * 1000,
    },
  ];

  const cases = [
    {
      ctor: CrontabSpec,
      items: [
        {
          input: '4 3 2 1 *',
          next: '1970-01-02 03:04:00 UTC',
          timezoneRelated: true,
        },
        {
          input: '5 4 3 2 1 *',
          next: '1970-01-02 03:04:05 UTC',
          timezoneRelated: true,
        },
      ],
    },
    {
      ctor: CrontabAliasSpec,
      items: [
        {
          input: '@hourly',
          next: '1970-01-01 01:00:00 UTC',
          timezoneRelated: false,
        },
        {
          input: '@daily',
          next: '1970-01-02 00:00:00 UTC',
          timezoneRelated: true,
        },
        {
          input: '@weekly',
          next: '1970-01-05 00:00:00 UTC',
          timezoneRelated: true,
        },
        {
          input: '@monthly',
          next: '1970-02-01 00:00:00 UTC',
          timezoneRelated: true,
        },
      ],
    },
  ];

  for (const { ctor, items } of cases) {
    for (const { input, next, timezoneRelated } of items) {
      it(`${ctor.name} "${input}" should match`, t => {
        t.true(ctor.match(input));
      });
      for (const { tz, offset } of tzs) {
        it(`${ctor.name} "${input}" should get next in ${tz}`, t => {
          t.notThrows(() => {
            const spec = new ctor(input, tz);
            const actual = Date.parse(next) - (timezoneRelated ? offset : 0);
            t.deepEqual(spec.next(0), actual);
          });
        });
      }
    }
  }
})();
