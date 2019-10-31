import CronParser from 'cron-parser';

export interface Spec {
  next(now: number): number;
}

export class IntervalSpec implements Spec {
  static newSpecRegExp() {
    return new RegExp(/^@every (?:(?<h>\d+)h)?(?:(?<m>\d+)m)?(?:(?<s>\d+)s)?(?:(?<ms>\d+)ms)?$/g);
  }

  static match(spec: string) {
    return this.newSpecRegExp().test(spec);
  }

  private interval: number = 0;

  constructor(spec: string) {
    // h, m, s, ms
    const match = IntervalSpec.newSpecRegExp().exec(spec);
    if (!match) {
      throw new Error(`Invalid interval: ${spec}`);
    }
    const mapping = {
      h: 60 * 60 * 1000,
      m: 60 * 1000,
      s: 1000,
      ms: 1,
    };
    const groups = match.groups || {};
    this.interval = Object.entries(mapping).reduce((acc, [key, val]) => {
      const str = groups[key];
      if (str) {
        const num = Number.parseInt(str, 10);
        if (num > 0) {
          return acc + num * val;
        }
      }
      return acc;
    }, 0);
  }

  next(now: number): number {
    return now + this.interval;
  }
}

export class CrontabSpec implements Spec {
  static match(spec: string) {
    const n = spec.trim().split(/\s+/g).length;
    return n === 5 || n === 6;
  }

  private expression: any;

  constructor(spec: string, tz?: string) {
    let options;
    if (tz) {
      options = {
        tz,
      };
    } else {
      options = {
        utc: true,
      };
    }
    this.expression = CronParser.parseExpression(spec, options);
  }

  next(now: number): number {
    this.expression.reset(now);
    return this.expression.next().getTime();
  }
}

export class CrontabAliasSpec extends CrontabSpec {
  static aliasToSpec(alias: string) {
    const mapping = new Map([
      ['@monthly', '0 0 1 * *'],
      ['@weekly', '0 0 * * 0'],
      ['@daily', '0 0 * * *'],
      ['@hourly', '0 * * * *'],
    ]);
    return mapping.get(alias);
  }

  static match(alias: string) {
    return !!this.aliasToSpec(alias);
  }

  constructor(alias: string, tz?: string) {
    const spec = CrontabAliasSpec.aliasToSpec(alias);
    if (!spec) {
      throw new Error(`Invalid crontab alias: ${alias}`);
    }
    super(spec, tz);
  }
}
