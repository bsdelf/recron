import it from 'ava';
import sinon, { SinonFakeTimers } from 'sinon';
import { permutation } from 'js-combinatorics';
import { TicklessScheduler, ConcurrentJob, IntervalSpec } from '../src';

const newJob = (interval: number, handler: () => void, oneshot = false) => {
  const spec = new IntervalSpec(`@every ${interval}s`);
  return new ConcurrentJob(spec, handler, oneshot);
};

let timers: SinonFakeTimers[] = [];

const createClock = () => {
  const timer = sinon.useFakeTimers({
    toFake: ['setTimeout', 'clearTimeout', 'Date'],
  });
  timers.push(timer);
  return timer;
};

it.afterEach(() => {
  for (const timer of timers) {
    timer.restore();
  }
  timers = [];
});

const oneSecond = 1000;

const buildTicks = (duration: number, interval: number) => {
  const ticks: number[] = [];
  const step = interval * oneSecond;
  for (let tick = step; tick <= duration; tick += step) {
    ticks.push(tick);
  }
  return ticks;
};

it.serial('TicklessScheduler should be able to start', (t) => {
  t.notThrows(() => {
    const scheduler = new TicklessScheduler();
    scheduler.start();
  });
});

it.serial('TicklessScheduler should be able to stop', (t) => {
  t.notThrows(() => {
    const scheduler = new TicklessScheduler();
    scheduler.stop();
  });
});

it.serial('TicklessScheduler should be able to start and stop', (t) => {
  t.notThrows(() => {
    const scheduler = new TicklessScheduler();
    scheduler.start();
    scheduler.stop();
  });
});

(() => {
  type TicksStore = { [key: string]: number[] };
  const duration = 6 * oneSecond;
  const intervals = [1, 2, 3];
  const expectedTicks: TicksStore = intervals.reduce((acc, val) => {
    return { ...acc, [val.toString()]: buildTicks(duration, val) };
  }, {});
  const gen = permutation(['start', ...intervals]);
  for (let comb = gen.next(); comb; comb = gen.next()) {
    it.serial(`TicklessScheduler should work with time series: ${comb.join(',')}`, (t) => {
      const clock = createClock();
      const actualTicks: TicksStore = {};
      const scheduler = new TicklessScheduler();
      for (const item of comb) {
        if (typeof item === 'string') {
          scheduler.start();
        } else if (typeof item === 'number') {
          const interval = item;
          const handler = () => {
            const key = interval.toString();
            if (!Array.isArray(actualTicks[key])) {
              actualTicks[key] = [];
            }
            actualTicks[key].push(clock.now);
          };
          scheduler.add(newJob(interval, handler));
        }
      }
      for (let tick = 0; tick < duration; tick += oneSecond) {
        clock.tick(oneSecond);
      }
      scheduler.clear();
      for (let tick = 0; tick < duration; tick += oneSecond) {
        clock.tick(oneSecond);
      }
      t.deepEqual(actualTicks, expectedTicks);
    });
  }
})();

it.serial('TicklessScheduler should aware job cancel', (t) => {
  const clock = createClock();
  t.plan(1);
  const scheduler = new TicklessScheduler();
  const handler = () => t.pass();
  const job = newJob(1, handler);
  scheduler.add(job);
  scheduler.start();
  clock.tick(oneSecond);
  job.cancel();
  clock.tick(oneSecond);
});

it.serial('TicklessScheduler should aware oneshot job', (t) => {
  const clock = createClock();
  t.plan(1);
  const scheduler = new TicklessScheduler();
  const handler = () => t.pass();
  const job = newJob(1, handler, true);
  scheduler.add(job);
  scheduler.start();
  clock.tick(oneSecond);
  clock.tick(oneSecond);
});
