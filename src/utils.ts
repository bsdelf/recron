export class TimezoneDetectionError extends Error {
  constructor(reason: string) {
    super(`Failed to detect time zone: ${reason}`);
  }
}

export function detectTimeZone() {
  if (typeof Intl !== 'object' || Intl === null) {
    throw new TimezoneDetectionError('Intl not available');
  }
  if (typeof Intl.DateTimeFormat !== 'function') {
    throw new TimezoneDetectionError('Intl.DateTimeFormat not found');
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
}
