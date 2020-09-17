import { TicklessScheduler } from './scheduler';
import { SerialJob, ConcurrentJob } from './job';
import { Spec, IntervalSpec, CrontabSpec, CrontabAliasSpec } from './spec';

export interface CronScheduleOptions {
  oneshot?: boolean;
  reentrant?: boolean;
  timezone?: string;
}

class TimezoneDetectionError extends Error {
  constructor(reason: string) {
    super(`Failed to detect timezone: ${reason}`);
  }
}

const detectTimezone = () => {
  if (typeof Intl !== 'object') {
    throw new TimezoneDetectionError('Intl object not found');
  }
  if (typeof Intl.DateTimeFormat !== 'function') {
    throw new TimezoneDetectionError('DateTimeFormat object not found');
  }
  const resolvedOptions = Intl.DateTimeFormat().resolvedOptions;
  if (typeof resolvedOptions !== 'function') {
    throw new TimezoneDetectionError('resolvedOptions method not found');
  }
  const { timeZone } = Intl.DateTimeFormat().resolvedOptions();
  if (!timeZone) {
    throw new TimezoneDetectionError('timeZone property not found');
  }
  return timeZone;
};

export class Cron {
  private scheduler = new TicklessScheduler();

  readonly timezone: string;

  /**
   * Constructor.
   *
   * @param timezone Default timezone for schedule.
   */
  constructor(timezone?: string) {
    this.timezone = timezone || detectTimezone();
  }

  async start() {
    this.scheduler.start();
  }

  async stop() {
    this.scheduler.clear();
  }

  schedule(spec: string, handler: () => unknown | Promise<unknown>, options?: CronScheduleOptions) {
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
