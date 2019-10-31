import { Spec } from './spec';

export abstract class Job {
  private canceled = false;

  constructor(protected spec: Spec, protected handler: Function, private oneshot: boolean) {}

  cancel() {
    this.canceled = true;
  }

  isCanceled() {
    return this.canceled;
  }

  isOneshot() {
    return this.oneshot;
  }

  next(now: number): number {
    return this.spec.next(now);
  }

  abstract async run(): Promise<void>;
}

export class SerialJob extends Job {
  private running = false;
  async run() {
    if (this.running) {
      return;
    }
    this.running = true;
    try {
      await this.handler();
    } catch {}
    this.running = false;
  }
}

export class ConcurrentJob extends Job {
  async run() {
    try {
      await this.handler();
    } catch {}
  }
}
