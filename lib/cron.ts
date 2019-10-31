import { TicklessScheduler } from './schedule';
import { SerialJob, ConcurrentJob } from './job';
import { Spec, IntervalSpec, CrontabSpec, CrontabAliasSpec } from './spec';

export interface CronScheduleOptions {
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
    if (options) {
      timezone = options.timezone ? options.timezone : this.timezone;
      reentrant = options.reentrant ? options.reentrant : false;
    } else {
      timezone = this.timezone;
      reentrant = false;
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
    const job = new JobConstructor(specObject, handler);
    this.scheduler.add(job);
    return job;
  }
}
