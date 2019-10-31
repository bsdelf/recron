# Recron

Recron is a simple, intuitive and readable cron implementaiton written in TypeScript and suitable for Node.js and browser usage.

## Highlights

- Object oriented design.
- Support update schedule on the fly.
- Support both crontab and interval syntax.
- Support multi-timezone in a single cron object.
- Tickless scheduler (will be optional in feature).
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

## Reentrant

Unlike other cron implementations,
reentrant is not allowd in `recron` by default for both safe and convenient.
Therefore, if a handler take a lot of time to process, it will underrun.
For example, given following piece of code:

```typescript
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
But be careful, if the providered handler always underrun,
due to a lot of unresolved promises,
the memory consumption will keep increasing,
and eventually you program will run OOM.
