import { Job } from './job';
import { OneshotTimer } from './timer';

const getNow = (): number => {
  return Date.now();
};

interface Schedule {
  at: number;
  job: Job;
}

const compareSchedule = (a: Schedule, b: Schedule) => a.at - b.at;

interface Scheduler {
  start(): void;
  stop(): void;
  add(job: Job): void;
  clear(): void;
}

export class TicklessScheduler implements Scheduler {
  private timer?: OneshotTimer;
  private wakeupAt?: number;
  private schedules: Schedule[] = [];

  start() {
    if (this.schedules.length <= 0) {
      this.wakeupAt = undefined;
      return;
    }
    this.wakeupAt = this.schedules[0].at;
    const now = getNow();
    const timeout = Math.max(this.wakeupAt - now, 1);
    this.timer = new OneshotTimer(() => {
      this.fire();
      this.start();
    }, timeout);
    this.timer.start();
  }

  stop() {
    if (this.timer) {
      this.timer.stop();
      this.timer = undefined;
    }
    this.wakeupAt = undefined;
  }

  add(job: Job) {
    const at = job.next(getNow());
    this.schedules.push({ at, job });
    this.schedules.sort(compareSchedule);
    if (this.wakeupAt === undefined || at <= this.wakeupAt) {
      this.stop();
      this.start();
    }
  }

  clear() {
    this.stop();
    this.schedules = [];
  }

  private fire() {
    const dropIndexes: number[] = [];
    for (let i = 0; i < this.schedules.length; ++i) {
      const now = getNow();
      const scheduled = this.schedules[i];
      if (scheduled.at > now) {
        break;
      }
      if (scheduled.job.isCanceled()) {
        dropIndexes.unshift(i);
        continue;
      }
      scheduled.job.run();
      if (scheduled.job.isOneshot()) {
        dropIndexes.unshift(i);
        continue;
      }
      scheduled.at = scheduled.job.next(now);
    }
    for (const idx of dropIndexes) {
      this.schedules.splice(idx, 1);
    }
    this.schedules.sort(compareSchedule);
  }
}
