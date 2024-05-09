import test from 'ava';
import sinon, { SinonFakeTimers } from 'sinon';
import { OneshotTimer } from '../src';

const clockCreatedAt = 1483228800000;

let timers: SinonFakeTimers[] = [];

const createClock = () => {
  const timer = sinon.useFakeTimers({
    now: clockCreatedAt,
    toFake: ['setTimeout', 'clearTimeout', 'Date'],
  });
  timers.push(timer);
  return timer;
};

test.afterEach(() => {
  for (const timer of timers) {
    timer.restore();
  }
  timers = [];
});

test.serial('OneshotTimer should throw when timeout is out of range', (t) => {
  t.throws(() => {
    new OneshotTimer(() => {
      t.fail('should not hit');
    }, 0);
  });
  t.throws(() => {
    new OneshotTimer(() => {
      t.fail('should not hit');
    }, Number.MAX_SAFE_INTEGER + 1);
  });
});

test.serial('OneshotTimer should not throw when timeout valid', (t) => {
  t.notThrows(() => {
    new OneshotTimer(() => {
      t.fail('should not hit');
    }, 1);
  });
  t.notThrows(() => {
    new OneshotTimer(() => {
      t.fail('should not hit');
    }, Number.MAX_SAFE_INTEGER);
  });
});

test.serial('OneshotTimer should trigger on timeout', async (t) => {
  t.plan(2);

  const clock = createClock();
  const timeout = 1000;
  await new Promise<void>((resolve, reject) => {
    const handler = () => {
      try {
        t.pass();
        t.deepEqual(Date.now(), clockCreatedAt + timeout);
        resolve();
      } catch (err) {
        reject(err);
      }
    };
    const timer = new OneshotTimer(handler, timeout);
    timer.start();
    clock.tick(timeout);
  });
});

test.serial('OneshotTimer should trigger on large timeout', async (t) => {
  t.plan(2);

  const clock = createClock();
  const timeout = 2147483647 * 2;
  await new Promise<void>((resolve, reject) => {
    const handler = () => {
      try {
        t.pass();
        t.deepEqual(Date.now(), clockCreatedAt + timeout);
        resolve();
      } catch (err) {
        reject(err);
      }
    };
    const timer = new OneshotTimer(handler, timeout);
    timer.start();
    clock.tick(timeout);
  });
});

test.serial('OneshotTimer should trigger only once', (t) => {
  t.plan(1);

  const clock = createClock();
  const timeout = 1000;
  const handler = () => {
    t.deepEqual(Date.now(), clockCreatedAt + timeout);
  };
  const timer = new OneshotTimer(handler, timeout);
  timer.start();
  clock.tick(timeout);
  clock.tick(timeout);
});

test.serial('OneshotTimer should be able to stop', (t) => {
  t.plan(0);

  const clock = createClock();
  const timeout = 1000;
  const handler = () => {
    t.deepEqual(Date.now(), clockCreatedAt + timeout);
  };
  const timer = new OneshotTimer(handler, timeout);
  timer.start();
  clock.tick(timeout / 2);
  timer.stop();
  clock.tick(timeout / 2);
});
