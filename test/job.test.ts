import it from 'ava';
import sinon from 'sinon';
import { SerialJob, ConcurrentJob, IntervalSpec } from '../src';

const createClock = () => {
  return sinon.useFakeTimers({
    toFake: ['setTimeout', 'Date'],
  });
};

const newSpec = () => new IntervalSpec('@every 1s');

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const cases = [
  {
    ctor: SerialJob,
    supplement: () => {
      it('SerialJob should run in sequential', async (t) => {
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
      it('ConcurrentJob should run in concurrent', async (t) => {
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
  it(`${ctor.name} should be able to run`, (t) => {
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

  it(`${ctor.name} should allow cancel`, (t) => {
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

  it(`${ctor.name} should allow oneshot`, (t) => {
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

  it(`${ctor.name} should bypass next`, (t) => {
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
