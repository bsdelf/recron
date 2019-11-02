import { TicklessScheduler } from './scheduler';
import { SerialJob, ConcurrentJob } from './job';
import { Spec, IntervalSpec, CrontabSpec, CrontabAliasSpec } from './spec';

export interface CronScheduleOptions {
  oneshot?: boolean;
  reentrant?: boolean;
  timezone?: string;
}

export class Cron {
  private timezone: string;
  private scheduler = new TicklessScheduler();

  /**
   * Constructor.
   *
   * @param timezone Default timezone for schedule.
   */
  constructor(timezone?: string) {
    if (timezone) {
      this.timezone = timezone;
    } else if (typeof Intl === 'object') {
      this.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } else {
      this.timezone = 'UTC';
    }
  }

  async start() {
    this.scheduler.start();
  }

  async stop() {
    this.scheduler.clear();
  }

  schedule(spec: string, handler: Function, options?: CronScheduleOptions) {
    let timezone: string;
    let reentrant: boolean;
    let oneshot: boolean;
    if (options) {
      timezone = options.timezone ? options.timezone : this.timezone;
      reentrant = options.reentrant ? options.reentrant : false;
      oneshot = options.oneshot ? options.oneshot : false;
    } else {
      timezone = this.timezone;
      reentrant = false;
      oneshot = false;
    }
    const SpecConstructors = [IntervalSpec, CrontabSpec, CrontabAliasSpec];
    let specObject: Spec | undefined;
    for (const SpecConstructor of SpecConstructors) {
      if (SpecConstructor.match(spec)) {
        specObject = new SpecConstructor(spec, timezone);
        break;
      }
    }
    if (!specObject) {
      throw new Error(`Unsupported spec: ${spec}`);
    }
    const JobConstructor = reentrant ? ConcurrentJob : SerialJob;
    const job = new JobConstructor(specObject, handler, oneshot);
    this.scheduler.add(job);
    return job;
  }
}
