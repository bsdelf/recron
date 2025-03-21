# Recron

![CI status](https://github.com/bsdelf/recron/workflows/CI/badge.svg)

Recron is a simple, intuitive and readable cron implementaiton written in TypeScript and suitable for Node.js and browser usage.

## Highlights

- Object oriented design.
- Support update schedule on the fly.
- Support both crontab and interval syntax.
- Support different time zones in a single cron instance.
- Tickless scheduler (will be optional in future).
- Compact and quite readable code base written in TypeScript.

## Usage

```typescript
import { Cron } from 'recron';

const cron = new Cron();

// Start cron scheduler.
cron.start();

// Use interval syntax.
cron.schedule('@every 1s', () => {
  console.log('every second', new Date());
});

// Use crontab syntax.
cron.schedule('*/5 * * * * *', () => {
  console.log('at 5th second', new Date());
});

// Stop cron after 10 seconds.
cron.schedule(
  '@every 10s',
  () => {
    cron.stop();
    console.log('done', new Date());
  },
  { oneshot: true }
);
```

## Time zone

The constructor of `Cron` has an optional parameter to let you set time zone.
If the `timezone` parameter is unspecified, the default time zone will be detected from [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat/resolvedOptions), it will be your local time zone in general.

Also, the last parameter of `schedule()` method `options` has an optional `timezone` property,
which can be used to override the default time zone for individual schedule.

Note: time zone only affects crontab, it does not affect the interval usage.

## Reentrant

Unlike other cron implementations,
reentrant is not allowd in `recron` by default for both safety and convenient.
Therefore, if the scheduled callback function takes a lot of time to process, it will underrun.
For example, given following piece of code:

```typescript
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

cron.schedule('@every 1s', async () => {
  console.log('overslept', new Date());
  await sleep(3000);
});
```

the output will be:

```
overslept 2019-10-31T05:05:27.251Z
overslept 2019-10-31T05:05:30.253Z
overslept 2019-10-31T05:05:34.254Z
overslept 2019-10-31T05:05:37.263Z
overslept 2019-10-31T05:05:40.275Z
```

To disable this feature, set `reentrant` to `true` in options.
But be careful, if the providered callback function keeps underrun,
due to the unresolved promises,
the memory consumption will be increasing,
and eventually you program will run out-of-memory.

## Crontab Alias

`recron` has following crontab aliases:

| Alias    | Crontab       |
| -------- | ------------- |
| @hourly  | 0 \* \* \* \* |
| @daily   | 0 0 \* \* \*  |
| @weekly  | 0 0 \* \* 1   |
| @monthly | 0 0 1 \* \*   |

Note: we regard Monday as the first day of the week according to international standard ISO 8601. So `@weekly` means "at 00:00 on Monday", not Sunday.

## Interval Syntax

Interval syntax has following specifiers:

| Order | Specifier | Unit        |
| ----- | --------- | ----------- |
| 1     | h         | hour        |
| 2     | m         | minute      |
| 3     | s         | second      |
| 4     | ms        | Millisecond |

One ore more specifiers can be used, as long as they are arranged in ascending order:

- `@every 10s`
- `@every 30m`
- `@every 1h30m`
