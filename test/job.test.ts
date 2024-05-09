import it from 'ava';
import sinon, { SinonFakeTimers } from 'sinon';
import { SerialJob, ConcurrentJob, IntervalSpec } from '../src';

let timers: SinonFakeTimers[] = [];

const createClock = () => {
  const timer = sinon.useFakeTimers({
    toFake: ['setTimeout', 'Date'],
  });
  timers.push(timer);
  return timer;
};

const newSpec = () => new IntervalSpec('@every 1s');

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

it.afterEach(() => {
  for (const timer of timers) {
    timer.restore();
  }
  timers = [];
});

const cases = [
  {
    ctor: SerialJob,
    supplement: () => {
      it.serial('SerialJob should run in sequential', async (t) => {
        t.plan(1);
        const handler = async () => {
          await sleep(1000);
          t.pass();
        };
        const job = new SerialJob(newSpec(), handler, false);
        const clock = createClock();
        const unresolved = Promise.all([job.run(), job.run()]);
        clock.tick(1000);
        await unresolved;
      });
    },
  },
  {
    ctor: ConcurrentJob,
    supplement: () => {
      it.serial('ConcurrentJob should run in concurrent', async (t) => {
        t.plan(2);
        const handler = async () => {
          await sleep(1000);
          t.pass();
        };
        const job = new ConcurrentJob(newSpec(), handler, false);
        const clock = createClock();
        const unresolved = Promise.all([job.run(), job.run()]);
        clock.tick(1000);
        await unresolved;
      });
    },
  },
];

for (const { ctor, supplement } of cases) {
  it.serial(`${ctor.name} should be able to run`, (t) => {
    t.plan(1);
    const job = new SerialJob(
      newSpec(),
      () => {
        t.pass();
      },
      false
    );
    job.cancel();
    job.run();
  });

  it.serial(`${ctor.name} should allow cancel`, (t) => {
    const job = new SerialJob(
      newSpec(),
      () => {
        t.fail();
      },
      false
    );
    job.cancel();
    t.true(job.isCanceled());
  });

  it.serial(`${ctor.name} should allow oneshot`, (t) => {
    t.true(
      new SerialJob(
        newSpec(),
        () => {
          t.fail();
        },
        true
      ).isOneshot()
    );
    t.false(
      new SerialJob(
        newSpec(),
        () => {
          t.fail();
        },
        false
      ).isOneshot()
    );
  });

  it.serial(`${ctor.name} should bypass next`, (t) => {
    const spec = newSpec();
    const job = new SerialJob(
      spec,
      () => {
        t.fail();
      },
      false
    );
    t.deepEqual(job.next(0), spec.next(0));
    t.deepEqual(job.next(1000000000000), spec.next(1000000000000));
  });

  supplement();
}
