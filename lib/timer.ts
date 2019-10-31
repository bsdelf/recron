const MAX_TIMEOUT_ALLOWED = 2147483647;

export class OneshotTimer {
  private timer?: NodeJS.Timer;

  constructor(private callback: Function, private timeout: number) {
    if (timeout < 1 || timeout > Number.MAX_SAFE_INTEGER) {
      throw new Error(`Timeout is out of range: [1, ${Number.MAX_SAFE_INTEGER}]`);
    }
  }

  start() {
    let rem = this.timeout;
    const nextTimeout = () => {
      if (rem <= 0) {
        return -1;
      }
      if (rem <= MAX_TIMEOUT_ALLOWED) {
        const timeout = rem;
        rem = 0;
        return timeout;
      }
      rem -= MAX_TIMEOUT_ALLOWED;
      return MAX_TIMEOUT_ALLOWED;
    };
    const loop = () => {
      const timeout = nextTimeout();
      if (timeout > 0) {
        this.timer = setTimeout(loop, timeout);
        return;
      }
      this.timer = undefined;
      this.callback();
    };
    loop();
  }

  stop() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }
}
